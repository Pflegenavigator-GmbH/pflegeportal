// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { logger } from '@/src/lib/logger';
import { stripe } from '@/src/lib/stripe/server';
import { createAdminSupabaseClient } from '@/src/lib/supabase/admin';

type ErlaubtesPaket = 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly';

function isErlaubtesPaket(value: string | undefined): value is ErlaubtesPaket {
  if (!value) return false;
  return ['beta_special', 'standard_monthly', 'standard_yearly', 'profi_monthly'].includes(value);
}

function paketToTier(paket: ErlaubtesPaket): 'beta' | 'standard' | 'profi' {
  if (paket.startsWith('standard')) return 'standard';
  if (paket.startsWith('profi')) return 'profi';
  return 'beta';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    logger.error('Stripe-Signatur fehlt im Header');
    return NextResponse.json({ error: 'Signatur fehlt' }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('STRIPE_WEBHOOK_SECRET ist nicht konfiguriert');
    return NextResponse.json({ error: 'Webhook nicht konfiguriert' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
    logger.info({ eventType: event.type }, 'Stripe Webhook Signatur verifiziert');
  } catch (err: unknown) {
    const error = err as Error;
    logger.error({ error: error.message }, 'Krypto-Signaturprüfung fehlgeschlagen');

    try {
      const supabase = createAdminSupabaseClient();
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'stripe.webhook.signature',
        message: `Signaturprüfung fehlgeschlagen: ${error.message}`,
        metadata: { error: error.message },
      });
    } catch (logErr) {
      logger.error({ logErr }, 'Fatal: Schreiben in system_logs fehlgeschlagen');
    }

    return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const caseCode = session.metadata?.case_code;
    const rohesPaket = session.metadata?.paket;

    logger.info(
      { sessionId: session.id, caseCode, paket: rohesPaket },
      'Verarbeite checkout.session.completed'
    );

    if (!caseCode) {
      logger.error({ sessionId: session.id }, 'Kein case_code in den Stripe-Metadaten gefunden');
      return NextResponse.json({ error: 'Metadaten fehlen' }, { status: 400 });
    }

    // Unbekannte Pakete NICHT still auf beta_special zurückfallen lassen —
    // das würde ein falsches Produkt freischalten. Event quittieren (kein
    // Stripe-Retry, die Metadaten ändern sich nicht) und laut loggen.
    if (!isErlaubtesPaket(rohesPaket)) {
      logger.error(
        { sessionId: session.id, paket: rohesPaket },
        'Unbekanntes Paket in Stripe-Metadaten — Event wird ignoriert'
      );
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'stripe.webhook.paket',
        message: `Unbekanntes Paket "${rohesPaket}" für Session ${session.id}`,
        case_code: caseCode.toUpperCase(),
        metadata: { session_id: session.id, paket: rohesPaket ?? null },
      });
      return NextResponse.json({ received: true, ignored: 'unknown_paket' }, { status: 200 });
    }

    const validatedPaket = rohesPaket;
    const upperCode = caseCode.toUpperCase();
    const dbProductTier = paketToTier(validatedPaket);

    try {
      // 🔁 Idempotenz: Stripe stellt Events bei jedem Nicht-2xx erneut zu.
      // Bereits verarbeitete Sessions nicht doppelt verbuchen.
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existingPayment) {
        logger.info({ sessionId: session.id }, 'Session bereits verarbeitet — Retry ignoriert');
        return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
      }

      const { data: caseDb, error: caseError } = await supabase
        .from('cases')
        .select('id, billing_status')
        .eq('case_code', upperCode)
        .maybeSingle();

      if (caseError) throw caseError;
      if (!caseDb) throw new Error(`Fallcode ${upperCode} nicht gefunden.`);

      const isFreeAccess = session.payment_status === 'no_payment_required';
      const finalStatus = isFreeAccess ? 'free' : 'paid';

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          billing_status: finalStatus,
          product_tier: dbProductTier,
          access_unlocked_at: new Date().toISOString(),
        })
        .eq('id', caseDb.id);

      if (updateError) throw updateError;

      const betragBerechnet = session.amount_total ? session.amount_total / 100 : 0.0;

      const { error: paymentError } = await supabase.from('payments').insert({
        case_id: caseDb.id,
        stripe_session_id: session.id,
        paket: validatedPaket,
        betrag: betragBerechnet,
        status: 'completed',
      });

      if (paymentError) throw paymentError;

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'stripe.webhook',
        message: `Fall ${upperCode} erfolgreich freigeschaltet via Webhook (${finalStatus}).`,
        case_code: upperCode,
        metadata: { session_id: session.id, betrag: betragBerechnet },
      });

      logger.info({ caseCode: upperCode }, 'Webhook-Verarbeitung erfolgreich abgeschlossen');
    } catch (dbErr: unknown) {
      const error = dbErr as Error;
      logger.error(
        { error: error.message, caseCode: upperCode },
        'Kritischer Fehler bei DB-Synchronisation'
      );
      return NextResponse.json(
        { error: 'Datenbank-Synchronisation fehlgeschlagen' },
        { status: 500 }
      );
    }
  } else if (event.type === 'customer.subscription.deleted') {
    // Abo gekündigt oder nach fehlgeschlagenen Zahlungen beendet:
    // Zugang schließen, sonst bleibt der Fall dauerhaft 'paid'.
    const subscription = event.data.object as Stripe.Subscription;
    const caseCode = subscription.metadata?.case_code;

    if (!caseCode) {
      logger.warn(
        { subscriptionId: subscription.id },
        'subscription.deleted ohne case_code-Metadaten — ignoriert'
      );
      return NextResponse.json({ received: true, ignored: 'no_case_code' }, { status: 200 });
    }

    const upperCode = caseCode.toUpperCase();

    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({ billing_status: 'expired' })
        .eq('case_code', upperCode);

      if (updateError) throw updateError;

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'stripe.webhook.subscription',
        message: `Abo für Fall ${upperCode} beendet — Zugang geschlossen.`,
        case_code: upperCode,
        metadata: { subscription_id: subscription.id },
      });

      logger.info({ caseCode: upperCode }, 'Abo-Kündigung verarbeitet');
    } catch (dbErr: unknown) {
      const error = dbErr as Error;
      logger.error({ error: error.message, caseCode: upperCode }, 'Fehler bei Abo-Kündigung');
      return NextResponse.json({ error: 'DB-Fehler' }, { status: 500 });
    }
  } else {
    logger.debug({ eventType: event.type }, 'Ignoriere nicht relevantes Event');
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
