// src/app/api/checkout/create-session/route.ts
import { NextResponse } from 'next/server';

import { isValidLocale } from '@/src/i18n/config';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';
import { getBaseUrl } from '@/src/lib/env';
import { logger } from '@/src/lib/logger';
import { stripe } from '@/src/lib/stripe/server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

const ERLAUBTE_PAKETE = [
  'beta_special',
  'standard_monthly',
  'standard_yearly',
  'profi_monthly',
] as const;
type ErlaubtesPaket = (typeof ERLAUBTE_PAKETE)[number];

interface CheckoutBody {
  caseCode?: unknown;
  paket?: unknown;
  locale?: unknown;
}

function isErlaubtesPaket(value: unknown): value is ErlaubtesPaket {
  return typeof value === 'string' && (ERLAUBTE_PAKETE as readonly string[]).includes(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;
    const { caseCode, paket } = body;

    logger.info({ caseCode, paket }, 'Starte Checkout Session Erstellung');

    if (typeof caseCode !== 'string' || caseCode.trim() === '' || !isErlaubtesPaket(paket)) {
      logger.warn({ caseCode, paket }, 'Validierung fehlgeschlagen: Pflichtparameter fehlen');
      throw new ValidationError('Pflichtparameter caseCode oder paket fehlen oder sind ungültig.');
    }

    const upperCode = caseCode.trim().toUpperCase();
    const locale = isValidLocale(body.locale) ? body.locale : 'de';

    const supabase = createAdminSupabaseClient();

    // ============================================================================
    // 🚨 1.000er-Limitprüfung für das Beta-Special
    // Achtung: Der Webhook schreibt product_tier 'beta' (nicht 'beta_special') —
    // die Zählung muss denselben Wert verwenden, sonst greift das Limit nie.
    // ============================================================================
    if (paket === 'beta_special') {
      logger.debug('Prüfe Beta-Limit (max. 1000 Plätze)');
      const { count, error: countError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('product_tier', 'beta')
        .in('billing_status', ['paid', 'free']);

      if (countError) {
        logger.error({ error: countError }, 'Fehler beim Zählen der Beta-Nutzer');
        throw countError;
      }

      const aktuelleBetaNutzer = count || 0;
      logger.info({ aktuelleBetaNutzer }, 'Aktueller Beta-Stand');

      if (aktuelleBetaNutzer >= 1000) {
        logger.warn('Beta-Kontingent erschöpft, deaktiviere Produkt');
        await supabase.from('products').update({ is_active: false }).eq('id', 'beta_special');
        throw new ValidationError('Das exklusive Kontingent für das Beta-Special ist erschöpft.');
      }
    }

    // Überprüfung, ob der Fall existiert
    const { data: currentCase, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('case_code', upperCode)
      .single();

    if (caseError || !currentCase) {
      logger.error({ caseCode: upperCode }, 'Fall wurde in der DB nicht gefunden');
      throw new NotFoundError('Fall', upperCode);
    }

    // ============================================================================
    // ⚡ DYNAMISCHES PRICE-ID MAPPING
    // ============================================================================
    const isDev = process.env.NODE_ENV === 'development';
    const intervalMapping: Record<ErlaubtesPaket, 'one_time' | 'monthly' | 'yearly'> = {
      beta_special: 'one_time',
      standard_monthly: 'monthly',
      standard_yearly: 'yearly',
      profi_monthly: 'monthly',
    };

    const gesuchtesInterval = intervalMapping[paket];
    let query = supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .eq('interval', gesuchtesInterval);

    if (isDev) {
      query = query.ilike('name', 'Test%');
    } else {
      query = query.not('name', 'ilike', 'Test%');
    }

    if (paket.startsWith('standard')) {
      query = query.ilike('name', '%Standard%');
    } else if (paket.startsWith('profi')) {
      query = query.ilike('name', '%Profi%');
    } else if (paket === 'beta_special') {
      query = query.ilike('name', '%Beta%');
    }

    const { data: productDb, error: productError } = await query.maybeSingle();

    if (productError || !productDb) {
      logger.error({ paket, gesuchtesInterval, isDev }, 'Kein passendes Produkt in DB gefunden');
      throw new ValidationError(`Kein aktiver Preis für das Paket "${paket}" gefunden.`);
    }

    const priceId = productDb.id;
    const isSubscription = paket.includes('monthly') || paket.includes('yearly');
    const baseUrl = getBaseUrl();
    const metadata = { case_code: upperCode, paket };

    // Erstellung der Stripe-Checkout-Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      allow_promotion_codes: true,
      success_url: `${baseUrl}/${locale}/pflegegrad/start?session_id={CHECKOUT_SESSION_ID}&check_code=${encodeURIComponent(upperCode)}`,
      cancel_url: `${baseUrl}/${locale}/pflegegrad/start?error=cancelled`,
      metadata,
      // Metadaten auch auf dem Abo selbst — nur so kann der Webhook bei
      // customer.subscription.deleted den Fall wiederfinden und schließen.
      ...(isSubscription ? { subscription_data: { metadata } } : {}),
    });

    logger.info({ sessionId: session.id }, 'Stripe Checkout Session erstellt');

    // Den Fall temporär auf 'pending' setzen
    const { error: updatePendingError } = await supabase
      .from('cases')
      .update({ stripe_session_id: session.id, billing_status: 'pending' })
      .eq('id', currentCase.id);

    if (updatePendingError) {
      logger.error(
        { error: updatePendingError, caseCode: upperCode },
        'Konnte Status nicht auf pending setzen'
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    logger.error({ err }, 'Fataler Checkout-Fehler');
    return handleApiError(err, 'api.checkout.create-session');
  }
}
