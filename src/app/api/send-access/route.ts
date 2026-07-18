// src/app/api/send-access/route.ts
import { NextResponse } from 'next/server';

import { isValidLocale } from '@/src/i18n/config';
import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { RateLimitError, ValidationError } from '@/src/lib/api/errors';
import { checkRateLimit, getClientIp } from '@/src/lib/api/rate-limit';
import { BrevoClient } from '@/src/lib/brevo/client';
import { getBaseUrl } from '@/src/lib/env';

interface AccessRequestBody {
  caseCode?: string;
  contact?: string;
  type?: 'email' | 'sms';
  locale?: string;
}

// Konservative Limits — der Endpunkt versendet in fremdem Namen E-Mails/SMS
const SEND_LIMIT = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9 ()/-]{6,20}$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: Request): Promise<NextResponse> {
  let caseCode: string | undefined;
  try {
    const body = (await request.json()) as AccessRequestBody;
    caseCode = body.caseCode;
    const { contact, type, locale } = body;

    if (!caseCode || !contact || !type) {
      throw new ValidationError('Fehlende Parameter.');
    }

    const ip = getClientIp(request);
    if (!checkRateLimit(`send-access:${ip}`, SEND_LIMIT, SEND_WINDOW_MS)) {
      throw new RateLimitError(`Versand gedrosselt für IP ${ip}`);
    }

    // 🛡️ Bindung an die eigene Fall-Session: Der Endpunkt versendet nur Links
    // für den Fall, dessen HTTP-only-Cookie der Aufrufer besitzt. Damit ist er
    // kein offenes Mail-/SMS-Relay mehr.
    const session = await requireCaseSession(caseCode);
    const safeCode = escapeHtml(session.caseCode);

    const safeLocale = isValidLocale(locale) ? locale : 'de';
    const portalLink = `${getBaseUrl()}/${safeLocale}/pflegegrad/start?case=${encodeURIComponent(
      session.caseCode
    )}`;

    const brevo = BrevoClient.getInstance();

    if (type === 'email') {
      if (!EMAIL_PATTERN.test(contact)) {
        throw new ValidationError('Ungültige E-Mail-Adresse.');
      }
      await brevo.sendEmail({
        to: [{ email: contact }],
        subject: `🏥 Ihr Zugang zum PflegeNavigator: Fall ${session.caseCode}`,
        htmlContent: `
                    <div style="font-family: sans-serif; color: #0f2744;">
                        <h2>Ihr persönlicher Fall-Zugang</h2>
                        <p>Bewahren Sie diesen Link gut auf, um jederzeit auf Ihr Pflegetagebuch zugreifen zu können.</p>
                        <p><strong>Fallnummer:</strong> ${safeCode}</p>
                        <p>
                            <a href="${portalLink}" style="background-color: #20b2aa; color: #0f2744; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Jetzt Fall öffnen
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #666; margin-top: 30px;">PflegeNavigator EU</p>
                    </div>
                `,
      });
    } else if (type === 'sms') {
      if (!PHONE_PATTERN.test(contact)) {
        throw new ValidationError('Ungültige Telefonnummer.');
      }
      await brevo.sendSms({
        recipient: contact,
        content: `Ihr PflegeNavigator Zugang. Fall: ${session.caseCode}. Link: ${portalLink} - Bitte speichern!`,
      });
    } else {
      throw new ValidationError('Ungültiger Versandtyp.');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(error, 'api.send-access', caseCode);
  }
}
