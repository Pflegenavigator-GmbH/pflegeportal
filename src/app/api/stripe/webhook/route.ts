// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/src/lib/stripe/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';

type ErlaubtesPaket = 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly';

function isErlaubtesPaket(value: string | undefined): value is ErlaubtesPaket {
    if (!value) return false;
    return ['beta_special', 'standard_monthly', 'standard_yearly', 'profi_monthly'].includes(value);
}

export async function POST(req: NextRequest) {
    const timestamp = new Date().toISOString();
    console.log(`\n--- 💳 [STRIPE WEBHOOK] [${timestamp}] Request erhalten ---`);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // 1. Log: Prüfung der Header-Präsenz
    console.log(`[Webhook INFO] Body-Länge: ${body.length} Zeichen`);
    console.log(`[Webhook INFO] Signatur vorhanden: ${!!signature}`);

    if (!signature) {
        console.error('❌ [Webhook ERROR] Stripe-Signatur fehlt im Header.');
        return NextResponse.json({ error: 'Signatur fehlt' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // 2. Log: Abgleich des Secrets vor der Validierung
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        console.log(`[Webhook INFO] Verwende Secret: ${secret?.substring(0, 12)}...`);

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            secret!
        );
        console.log(`✅ [Webhook SUCCESS] Signatur verifiziert. Event-Typ: ${event.type}`);
    } catch (err: unknown) {
        const error = err as Error;
        console.error('❌ [Webhook ERROR] Krypto-Signaturprüfung fehlgeschlagen:', error.message);

        // Zukünftiges DB-Log-Handling vorbereiten
        try {
            const supabase = await createServerSupabaseClient();
            await supabase.from('system_logs').insert({
                level: 'error',
                source: 'stripe.webhook.signature',
                message: `Signaturprüfung fehlgeschlagen: ${error.message}`,
                metadata: { error: error.message }
            });
        } catch (logErr) {
            console.error('🚨 [Fatal] Schreiben in system_logs fehlgeschlagen:', logErr);
        }

        return NextResponse.json({ error: 'Ungültige Signatur' }, { status: 400 });
    }

    // 3. Log: Event-Verarbeitung starten
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const caseCode = session.metadata?.case_code;
        const rohesPaket = session.metadata?.paket;

        console.log(`[Webhook PROCESSING] Session ID: ${session.id}`);
        console.log(`[Webhook PROCESSING] Extrahiertes Metadata -> caseCode: ${caseCode}, paket: ${rohesPaket}`);

        const validatedPaket: ErlaubtesPaket = isErlaubtesPaket(rohesPaket) ? rohesPaket : 'beta_special';

        if (!caseCode) {
            console.error('❌ [Webhook ERROR] Keine case_code in den Stripe-Metadaten gefunden. Abbruch.');
            return NextResponse.json({ error: 'Metadaten fehlen' }, { status: 400 });
        }

        const upperCode = caseCode.toUpperCase();
        console.log(`[Webhook DB-ACTION] Starte Abgleich für Fallcode: ${upperCode}`);

        // 🚀 NEU: Mapping für die strikte 'cases' Tabelle
        let dbProductTier: 'beta' | 'standard' | 'profi' = 'beta';
        if (validatedPaket.startsWith('standard')) {
            dbProductTier = 'standard';
        } else if (validatedPaket.startsWith('profi')) {
            dbProductTier = 'profi';
        }

        try {
            const supabase = await createServerSupabaseClient();

            console.log(`[Webhook DB-ACTION] Suche Fall in Tabelle 'cases'...`);
            const { data: caseDb, error: caseError } = await supabase
                .from('cases')
                .select('id, billing_status')
                .eq('case_code', upperCode)
                .maybeSingle();

            if (caseError) throw caseError;
            if (!caseDb) throw new Error(`Fallcode ${upperCode} nicht gefunden.`);

            const isFreeAccess = session.payment_status === 'no_payment_required';
            const finalStatus = isFreeAccess ? 'free' : 'paid';

            // Update Tabelle: cases (mit dem gemappten dbProductTier!)
            console.log(`[Webhook DB-ACTION] Aktualisiere Tabelle 'cases' auf Tier: ${dbProductTier}...`);
            const { error: updateError } = await supabase
                .from('cases')
                .update({
                    billing_status: finalStatus,
                    product_tier: dbProductTier, // <-- Hier nutzen wir den gefilterten, kurzen Namen
                    access_unlocked_at: new Date().toISOString()
                })
                .eq('id', caseDb.id);

            if (updateError) throw updateError;
            console.log(`✅ [Webhook DB-ACTION] Tabelle 'cases' erfolgreich aktualisiert.`);

            // Insert Tabelle: payments (Hier nutzen wir weiterhin validatedPaket)
            console.log(`[Webhook DB-ACTION] Schreibe Datensatz in Tabelle 'payments'...`);
            const betragBerechnet = session.amount_total ? session.amount_total / 100 : 0.00;

            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    case_id: caseDb.id,
                    stripe_session_id: session.id,
                    paket: validatedPaket, // <-- Hier bleibt der exakte Name (z.B. standard_monthly)
                    betrag: betragBerechnet,
                    status: 'completed'
                });

            if (paymentError) throw paymentError;
            console.log(`✅ [Webhook DB-ACTION] Zahlungsprotokoll erfolgreich angelegt.`);

            // Erfolg ins System-Log wegschreiben
            await supabase.from('system_logs').insert({
                level: 'info',
                source: 'stripe.webhook',
                message: `Fall ${upperCode} erfolgreich freigeschaltet via Webhook (${finalStatus}).`,
                case_code: upperCode,
                metadata: { session_id: session.id, betrag: betragBerechnet }
            });

            console.log(`🎉 [Webhook END] Verarbeitung vollständig abgeschlossen.`);

        } catch (dbErr: unknown) {
            const error = dbErr as Error;
            console.error('🚨 [Webhook FATAL] Kritischer Datenbank-Rollback simuliert:', error.message);
            return NextResponse.json({ error: 'Datenbank-Synchronisation fehlgeschlagen' }, { status: 500 });
        }
    } else {
        console.log(`[Webhook INFO] Ignoriere nicht relevantes Event: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
}