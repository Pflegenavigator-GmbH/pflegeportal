import { NextResponse } from 'next/server';
import { stripe } from '@/src/lib/stripe/server';
import { createServerSupabaseClient } from '@/src/lib/supabase/server';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError, NotFoundError } from '@/src/lib/api/errors';

interface CheckoutBody {
    caseCode: string;
    paket: 'beta_special' | 'standard_monthly' | 'standard_yearly' | 'profi_monthly';
}

export async function POST(req: Request) {
    const timestamp = new Date().toISOString();
    console.log(`\n--- 🛒 [CHECKOUT CREATE] [${timestamp}] Request erhalten ---`);

    try {
        const body = await req.json();
        const { caseCode, paket } = body as CheckoutBody;

        console.log(`[Checkout INFO] Eingehende Payload: Fallcode = ${caseCode}, Paket = ${paket}`);

        if (!caseCode || !paket) {
            console.error('❌ [Checkout ERROR] Validierung fehlgeschlagen: caseCode oder paket fehlen.');
            throw new ValidationError('Pflichtparameter caseCode oder paket fehlen.');
        }

        const supabase = await createServerSupabaseClient();
        console.log(`[Checkout DB] Supabase Client initialisiert.`);

        // ============================================================================
        // 🚨 KORREKTUR: 1.000er-Limitprüfung für das Beta-Special
        // ============================================================================
        if (paket === 'beta_special') {
            console.log(`[Checkout DB] Prüfe Beta-Limit (max. 1000 Plätze)...`);
            const { count, error: countError } = await supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('product_tier', 'beta_special')
                .in('billing_status', ['paid', 'free']);

            if (countError) {
                console.error('❌ [Checkout DB-ERROR] Fehler beim Zählen der Beta-Nutzer:', countError);
                throw countError;
            }

            const aktuelleBetaNutzer = count || 0;
            console.log(`[Checkout INFO] Aktuelle Beta-Nutzer: ${aktuelleBetaNutzer}/1000`);

            if (aktuelleBetaNutzer >= 1000) {
                console.log(`🚨 [Checkout LIMIT] Kontingent erschöpft! Deaktiviere Produkt in DB...`);
                await supabase
                    .from('products')
                    .update({ is_active: false })
                    .eq('id', 'beta_special');

                throw new ValidationError('Das exklusive Kontingent für das Beta-Special (1.000 Plätze) ist restlos ausverkauft.');
            }
        }

        // Überprüfung, ob der Fall existiert
        console.log(`[Checkout DB] Validiere Existenz des Falls: ${caseCode.toUpperCase()}...`);
        const { data: currentCase, error: caseError } = await supabase
            .from('cases')
            .select('id')
            .eq('case_code', caseCode.toUpperCase())
            .single();

        if (caseError || !currentCase) {
            console.error(`❌ [Checkout ERROR] Fall ${caseCode} wurde in der DB nicht gefunden.`);
            throw new NotFoundError('Fall', caseCode);
        }
        console.log(`✅ [Checkout DB] Fall existiert. ID: ${currentCase.id}`);

        // ============================================================================
        // ⚡ DYNAMISCHES PRICE-ID MAPPING
        // ============================================================================
        const isDev = process.env.NODE_ENV === 'development';
        console.log(`[Checkout INFO] Umgebung: ${process.env.NODE_ENV}. isDev = ${isDev}`);

        const intervalMapping: Record<CheckoutBody['paket'], 'one_time' | 'monthly' | 'yearly'> = {
            beta_special: 'one_time',
            standard_monthly: 'monthly',
            standard_yearly: 'yearly',
            profi_monthly: 'monthly',
        };

        const gesuchtesInterval = intervalMapping[paket];
        console.log(`[Checkout DB] Suche aktives Produkt mit Intervall: ${gesuchtesInterval}...`);

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
            console.error(`❌ [Checkout DB-ERROR] Kein passendes Produkt in DB gefunden für Paket: ${paket}, Intervall: ${gesuchtesInterval}, isDev: ${isDev}`);
            throw new ValidationError(
                `Für das Paket "${paket}" wurde kein aktiver Preis für die Umgebung (${process.env.NODE_ENV}) in der Datenbank gefunden.`
            );
        }

        const priceId = productDb.id;
        console.log(`✅ [Checkout SUCCESS] Gemapptes Produkt gefunden: "${productDb.name}" (ID: ${priceId})`);

        // Erstellung der Stripe-Checkout-Session
        console.log(`[Checkout STRIPE] Initialisiere Stripe Session (Modus: ${paket.includes('monthly') || paket.includes('yearly') ? 'subscription' : 'payment'})...`);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'sepa_debit'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: paket.includes('monthly') || paket.includes('yearly') ? 'subscription' : 'payment',
            allow_promotion_codes: true,
            success_url: `${process.env.NEXT_PUBLIC_URL}/pflegegrad/start?session_id={CHECKOUT_SESSION_ID}&check_code=${caseCode}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/pflegegrad/start?error=cancelled`,
            metadata: {
                case_code: caseCode,
                paket: paket
            },
        });

        console.log(`✅ [Checkout STRIPE] Session erfolgreich erstellt! Session ID: ${session.id}`);

        // Den Fall temporär auf 'pending' setzen
        console.log(`[Checkout DB] Setze Fall ${caseCode} auf billing_status = 'pending'...`);
        const { error: updatePendingError } = await supabase
            .from('cases')
            .update({ stripe_session_id: session.id, billing_status: 'pending' })
            .eq('case_code', caseCode);

        if (updatePendingError) {
            console.error(`❌ [Checkout DB-ERROR] Konnte Status nicht auf pending setzen:`, updatePendingError);
        } else {
            console.log(`✅ [Checkout DB] Status erfolgreich auf 'pending' gesetzt.`);
        }

        console.log(`🎉 [Checkout END] Weiterleitung an Stripe URL wird eingeleitet.`);
        return NextResponse.json({ url: session.url });

    } catch (err: unknown) {
        console.error(`🚨 [Checkout FATAL ERROR]`, err);
        return handleApiError(err, 'api.checkout.create-session');
    }
}