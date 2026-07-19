// src/app/api/widerspruch/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireCaseSession } from '@/src/lib/api/case-auth';
import { handleApiError } from '@/src/lib/api/error-handler';
import { ValidationError } from '@/src/lib/api/errors';
import { escapeHtml, escapeHtmlWithBreaks } from '@/src/lib/escape';
import { sanitizeFilename } from '@/src/lib/pdf/puppeteer';
import { renderHtmlToPdf } from '@/src/lib/pdf/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface WiderspruchData {
  caseCode: string;
  antragsteller: {
    name: string;
    vorname: string;
    strasse: string;
    plz: string;
    ort: string;
    telefon?: string;
    email?: string;
  };
  pflegekasse: {
    name: string;
    strasse?: string;
    plz?: string;
    ort?: string;
  };
  versicherter?: {
    name?: string;
    vorname?: string;
    versicherungsnummer?: string;
    geburtsdatum?: string;
  };
  bescheidDaten: {
    datum: string;
    pflegegradAktuell: number | null;
    pflegegradBeantragt: number;
    begruendung?: string;
  };
  widerspruchsBegruendung: string;
  beilagen?: string[];
  datum?: string;
  ort?: string;
}

// Alle nutzergelieferten Werte werden über escapeHtml/escapeHtmlWithBreaks
// interpoliert — kein Roh-HTML aus dem Request landet im Dokument.
const WIDERSPRUCH_TEMPLATE = (data: WiderspruchData): string => {
  const a = data.antragsteller;
  const k = data.pflegekasse;
  const v = data.versicherter;
  const b = data.bescheidDaten;

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Widerspruch - Pflegegradbescheid</title>
  <style>
    @page { margin: 25mm 20mm 30mm 20mm; }
    body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #000; }
    .absender { font-size: 9pt; color: #666; margin-bottom: 20pt; }
    .empfaenger { margin-bottom: 30pt; }
    .datum-ort { text-align: right; margin-bottom: 20pt; }
    .betreff { font-weight: bold; margin-bottom: 15pt; }
    .anrede { margin-bottom: 10pt; }
    .text-block { margin-bottom: 12pt; text-align: justify; }
    .begruendung-box { border: 1px solid #333; padding: 12pt; margin: 15pt 0; background-color: #f9f9f9; }
    .begruendung-label { font-weight: bold; margin-bottom: 8pt; }
    .beilagen { margin-top: 20pt; }
    .beilagen-list { margin-left: 20pt; }
    .schluss { margin-top: 30pt; }
    .unterschrift { margin-top: 40pt; }
    .hinweis { font-size: 9pt; border-top: 1px solid #ccc; margin-top: 30pt; padding-top: 10pt; color: #444; }
    .case-code { font-size: 8pt; color: #999; text-align: right; margin-top: 5pt; }
  </style>
</head>
<body>
  <div class="case-code">Referenz: ${escapeHtml(data.caseCode)}</div>

  <div class="absender">
    ${escapeHtml(a.name)}, ${escapeHtml(a.vorname)}<br>
    ${escapeHtml(a.strasse)}<br>
    ${escapeHtml(a.plz)} ${escapeHtml(a.ort)}
    ${a.telefon ? `<br>Tel: ${escapeHtml(a.telefon)}` : ''}
    ${a.email ? `<br>E-Mail: ${escapeHtml(a.email)}` : ''}
  </div>

  <div class="empfaenger">
    ${escapeHtml(k.name)}<br>
    ${k.strasse ? `${escapeHtml(k.strasse)}<br>` : ''}
    ${k.plz && k.ort ? `${escapeHtml(k.plz)} ${escapeHtml(k.ort)}<br>` : ''}
  </div>

  <div class="datum-ort">
    ${escapeHtml(data.ort || a.ort)}, den ${escapeHtml(data.datum || new Date().toLocaleDateString('de-DE'))}
  </div>

  <div class="betreff">
    Widerspruch gegen den Bescheid vom ${escapeHtml(b.datum)}<br>
    ${v?.versicherungsnummer ? `Versicherten-Nr.: ${escapeHtml(v.versicherungsnummer)}` : ''}
  </div>

  <div class="anrede">Sehr geehrte Damen und Herren,</div>

  <div class="text-block">
    hiermit lege ich Widerspruch gegen den Bescheid vom <strong>${escapeHtml(b.datum)}</strong> ein,
    ${v?.name ? `betreffend ${escapeHtml(v.vorname)} ${escapeHtml(v.name)}` : 'betreffend meinen Pflegegrad'}.
  </div>

  <div class="text-block">
    ${
      b.pflegegradAktuell !== null
        ? `Mein aktueller Pflegegrad ${escapeHtml(b.pflegegradAktuell)} wurde nicht angehoben, obwohl ich beantragt habe, in Pflegegrad ${escapeHtml(b.pflegegradBeantragt)} eingestuft zu werden.`
        : `Ich wurde nicht in den beantragten Pflegegrad ${escapeHtml(b.pflegegradBeantragt)} eingestuft.`
    }
    Diese Entscheidung halte ich für nicht nachvollziehbar.
  </div>

  <div class="begruendung-box">
    <div class="begruendung-label">Begründung des Widerspruchs:</div>
    <div>${escapeHtmlWithBreaks(data.widerspruchsBegruendung)}</div>
  </div>

  ${
    b.begruendung
      ? `<div class="text-block"><strong>Zur Begründung des Bescheids:</strong><br>${escapeHtmlWithBreaks(b.begruendung)}</div>`
      : ''
  }

  <div class="text-block">
    Ich bitte um erneute Prüfung und eine schriftliche Mitteilung über das Ergebnis des Widerspruchsverfahrens.
    Sollten Sie meinem Widerspruch nicht abhelfen, bitte ich um Weiterleitung an die zuständige Widerspruchsstelle.
  </div>

  ${
    data.beilagen && data.beilagen.length > 0
      ? `<div class="beilagen"><strong>Anlagen:</strong><ul class="beilagen-list">${data.beilagen
          .map((beilage) => `<li>${escapeHtml(beilage)}</li>`)
          .join('')}</ul></div>`
      : ''
  }

  <div class="schluss">Mit freundlichen Grüßen</div>

  <div class="unterschrift">
    _________________________________<br>
    ${escapeHtml(a.vorname)} ${escapeHtml(a.name)}
  </div>

  <div class="hinweis">
    <strong>Hinweis:</strong> Der Widerspruch muss innerhalb eines Monats nach Zustellung des Bescheids
    schriftlich oder zur Niederschrift bei der Pflegekasse eingelegt werden (§ 44 SGB X).
    Die Einlegung des Widerspruchs hat keine aufschiebende Wirkung. Die Pflegekasse wird über
    den Widerspruch entscheiden oder diesen mit Zustimmung des Versicherten der zuständigen
    Widerspruchsstelle vorlegen (§ 88 SGB X).
  </div>
</body>
</html>
`;
};

export async function POST(request: NextRequest): Promise<Response> {
  let caseCode: string | undefined;
  try {
    const body = (await request.json()) as WiderspruchData;
    caseCode = body.caseCode;
    const { antragsteller, pflegekasse, bescheidDaten, widerspruchsBegruendung } = body;

    if (!caseCode || !antragsteller || !pflegekasse || !bescheidDaten || !widerspruchsBegruendung) {
      throw new ValidationError('Pflichtfelder fehlen.');
    }
    if (!antragsteller.name || !antragsteller.strasse || !antragsteller.plz || !antragsteller.ort) {
      throw new ValidationError('Antragsteller-Adresse unvollständig.');
    }

    // 🛡️ Session-Pflicht: kein offener, cross-origin erreichbarer PII-Endpunkt mehr
    await requireCaseSession(caseCode);

    const html = WIDERSPRUCH_TEMPLATE(body);
    const pdfBuffer = await renderHtmlToPdf(html, {
      showFooter: false,
      margin: { top: '25mm', right: '20mm', bottom: '30mm', left: '20mm' },
    });

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Widerspruch_${sanitizeFilename(antragsteller.name)}_${sanitizeFilename(caseCode)}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'api.widerspruch.pdf', caseCode);
  }
}
