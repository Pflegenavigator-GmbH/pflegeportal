// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { logger } from '@/src/lib/logger';
import { stripe } from '@/src/lib/stripe/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

type ErlaubtesPaket = 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly';

function isErlaubtesPaket(value: string | undefined): value is ErlaubtesPaket {
  if (!value) return false;
  return ['beta_special', 'standard_monthly', 'standard_yearly', 'profi_monthly'].includes(value);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    logger.error('Stripe-Signatur fehlt im Header');
    return NextResponse.json({ error: 'Signatur fehlt' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    event = stripe.webhooks.constructEvent(body, signature, secret!);
    logger.info({ eventType: event.type }, 'Stripe Webhook Signatur verifiziert');
  } catch (err: unknown) {
    const error = err as Error;
    logger.error({ error: error.message }, 'Krypto-Signaturprüfung fehlgeschlagen');

    try {
      const supabase = await createServerSupabaseClient();
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const caseCode = session.metadata?.case_code;
    const rohesPaket = session.metadata?.paket;

    logger.info(
      { sessionId: session.id, caseCode, paket: rohesPaket },
      'Verarbeite checkout.session.completed'
    );

    const validatedPaket: ErlaubtesPaket = isErlaubtesPaket(rohesPaket)
      ? rohesPaket
      : 'beta_special';

    if (!caseCode) {
      logger.error({ sessionId: session.id }, 'Kein case_code in den Stripe-Metadaten gefunden');
      return NextResponse.json({ error: 'Metadaten fehlen' }, { status: 400 });
    }

    const upperCode = caseCode.toUpperCase();
    let dbProductTier: 'beta' | 'standard' | 'profi' = 'beta';

    if (validatedPaket.startsWith('standard')) {
      dbProductTier = 'standard';
    } else if (validatedPaket.startsWith('profi')) {
      dbProductTier = 'profi';
    }

    try {
      const supabase = await createServerSupabaseClient();

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
  } else {
    logger.debug({ eventType: event.type }, 'Ignoriere nicht relevantes Event');
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
