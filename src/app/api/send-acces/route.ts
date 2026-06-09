// src/app/api/send-access/route.ts
import { NextResponse } from 'next/server';
import { BrevoClient } from '@/src/lib/brevo/client';

// Strikte Typisierung für den eingehenden Request-Body
interface AccessRequestBody {
    caseCode?: string;
    contact?: string;
    type?: 'email' | 'sms';
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = (await request.json()) as AccessRequestBody;
        const { caseCode, contact, type } = body;

        // Validierung der Pflichtfelder
        if (!caseCode || !contact || !type) {
            return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
        }

        // Brevo Singleton initialisieren
        const brevo = BrevoClient.getInstance();
        const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pflegenavigatoreu.com'}/pflegegrad/start?case=${caseCode}`;

        if (type === 'email') {
            await brevo.sendEmail({
                to: [{ email: contact }],
                subject: `🏥 Ihr Zugang zum PflegeNavigator: Fall ${caseCode}`,
                htmlContent: `
                    <div style="font-family: sans-serif; color: #0f2744;">
                        <h2>Ihr persönlicher Fall-Zugang</h2>
                        <p>Bewahren Sie diesen Link gut auf, um jederzeit auf Ihr Pflegetagebuch zugreifen zu können.</p>
                        <p><strong>Fallnummer:</strong> ${caseCode}</p>
                        <p>
                            <a href="${portalLink}" style="background-color: #20b2aa; color: #0f2744; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Jetzt Fall öffnen
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #666; margin-top: 30px;">PflegeNavigator EU</p>
                    </div>
                `
            });
        } else if (type === 'sms') {
            await brevo.sendSms({
                recipient: contact,
                content: `Ihr PflegeNavigator Zugang. Fall: ${caseCode}. Link: ${portalLink} - Bitte speichern!`
            });
        } else {
            return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: unknown) {
        // Typsicheres Error-Handling
        const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
        console.error('API Send-Access Error:', errorMessage);

        return NextResponse.json({ error: 'Versand fehlgeschlagen' }, { status: 500 });
    }
}