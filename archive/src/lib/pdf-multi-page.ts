// MULTI-PAGE PDF GENERATOR - Alle Portal-Seiten kombiniert
// Für: Ergebnis + Tagebuch + Widerspruch als ein PDF

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export interface MultiPagePDFOptions {
  pages: {
    title: string;
    content: string;
    footer?: string;
  }[];
  mainTitle: string;
  caseCode: string;
  generatedAt: string;
}

export async function generateMultiPagePDF({
  pages,
  mainTitle,
  caseCode,
  generatedAt
}: MultiPagePDFOptions): Promise<Buffer> {
  // Chromium für Serverless
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const pdfPage = await browser.newPage();

  // Alle Seiten zusammenbauen
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 20mm;
          @bottom-center {
            content: "Seite " counter(page) " von " counter(pages);
            font-size: 10pt;
            color: #666;
          }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
        }
        
        .cover {
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
          background: linear-gradient(135deg, #0f2744 0%, #1a365d 100%);
          color: white;
          padding: 40px;
          margin: -20mm;
        }
        
        .cover-logo {
          width: 100px;
          height: 100px;
          background: #20b2aa;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          font-size: 48pt;
        }
        
        .cover h1 {
          font-size: 28pt;
          margin-bottom: 20px;
          font-weight: bold;
        }
        
        .cover .subtitle {
          font-size: 14pt;
          opacity: 0.9;
          margin-bottom: 40px;
        }
        
        .cover .meta {
          font-size: 11pt;
          opacity: 0.8;
          margin-top: 60px;
        }
        
        .cover .meta-item {
          margin: 10px 0;
        }
        
        .page {
          page-break-after: always;
          padding: 20px 0;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .page-header {
          border-bottom: 3px solid #20b2aa;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        
        .page-header h2 {
          color: #0f2744;
          font-size: 18pt;
          font-weight: bold;
        }
        
        .page-content {
          padding: 15px 0;
        }
        
        .page-content h3 {
          color: #0f2744;
          font-size: 14pt;
          margin: 20px 0 10px 0;
          font-weight: bold;
        }
        
        .page-content p {
          margin: 10px 0;
          text-align: justify;
        }
        
        .page-content ul, .page-content ol {
          margin: 10px 0 10px 30px;
        }
        
        .page-content li {
          margin: 5px 0;
        }
        
        .highlight-box {
          background: #f0f9ff;
          border-left: 4px solid #20b2aa;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .warning-box {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .data-table th {
          background: #0f2744;
          color: white;
          padding: 12px 15px;
          text-align: left;
          font-weight: bold;
        }
        
        .data-table td {
          padding: 10px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 10pt;
          font-weight: bold;
          margin: 3px;
        }
        
        .badge-green {
          background: #d1fae5;
          color: #065f46;
        }
        
        .badge-yellow {
          background: #fef3c7;
          color: #92400e;
        }
        
        .badge-red {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .disclaimer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          font-size: 9pt;
          color: #6b7280;
          font-style: italic;
        }
        
        .footer-info {
          position: running(footer);
          font-size: 9pt;
          color: #9ca3af;
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover">
        <div class="cover-logo">🏥</div>
        <h1>${mainTitle}</h1>
        <div class="subtitle">Ihre Unterlagen aus dem PflegeNavigator</div>
        
        <div class="meta">
          <div class="meta-item"><strong>Fallnummer:</strong> ${caseCode}</div>
          <div class="meta-item"><strong>Erstellt am:</strong> ${generatedAt}</div>
          <div class="meta-item"><strong>Seiten:</strong> ${pages.length + 1}</div>
        </div>
      </div>
      
      <!-- Content Pages -->
      ${pages.map((page, index) => `
        <div class="page">
          <div class="page-header">
            <h2>${index + 1}. ${page.title}</h2>
          </div>
          <div class="page-content">
            ${page.content}
          </div>
          ${page.footer ? `<div class="disclaimer">${page.footer}</div>` : ''}
        </div>
      `).join('')}
      
      <!-- Final Disclaimer Page -->
      <div class="page">
        <div class="page-header">
          <h2>Wichtige Hinweise</h2>
        </div>
        <div class="page-content">
          <div class="warning-box">
            <strong>Keine Rechts- oder Medizinberatung</strong><br>
            Diese Unterlagen dienen nur als Orientierungshilfe. Verbindliche Entscheidungen 
            treffen ausschließlich die zuständigen Stellen (MDK, Pflegekassen, Versorgungsämter, etc.).
          </div>
          
          <div class="highlight-box">
            <strong>Was jetzt tun?</strong>
            <ul>
              <li>Prüfen Sie alle Angaben auf Vollständigkeit</li>
              <li>Fügen Sie fehlende Unterlagen bei (z.B. Arztberichte)</li>
              <li>Reichen Sie den Antrag bei der zuständigen Stelle ein</li>
              <li>Bewahren Sie eine Kopie auf</li>
            </ul>
          </div>
          
          <h3>Kontakt</h3>
          <p>
            Bei Fragen erreichen Sie uns:<br>
            E-Mail: info@pflegenavigatoreu.com<br>
            Web: https://pflegenavigatoreu.com
          </p>
          
          <div class="disclaimer" style="margin-top: 60px;">
            © 2026 PflegeNavigator EU gUG<br>
            Alle Rechte vorbehalten. Keine Weitergabe ohne Genehmigung.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await pdfPage.setContent(htmlContent);

  const pdfBuffer = await pdfPage.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}

// Hilfsfunktion: Einzelne Portal-Daten zu PDF-Format konvertieren
export function formatPflegegradForPDF(
  pflegegrad: number,
  punkte: number,
  module: { name: string; score: number; gewichtung: string }[]
): string {
  const ampel = punkte >= 90 ? '🟢' : punkte >= 70 ? '🟡' : '🔴';
  
  return `
    <div class="highlight-box">
      <h3>Pflegegrad-Einschätzung: ${ampel} ${pflegegrad > 0 ? 'Pflegegrad ' + pflegegrad : 'Kein Pflegegrad'}</h3>
      <p>Geschätzte Punktezahl: <strong>${punkte.toFixed(1)}</strong></p>
    </div>
    
    <h3>Module im Detail</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>Modul</th>
          <th>Rohpunkte</th>
          <th>Gewichtung</th>
          <th>Gewichtet</th>
        </tr>
      </thead>
      <tbody>
        ${module.map(m => `
          <tr>
            <td>${m.name}</td>
            <td>${m.score}</td>
            <td>${m.gewichtung}</td>
            <td>${(m.score * parseFloat(m.gewichtung) / 100).toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h3>Leistungen bei Pflegegrad ${pflegegrad}</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th>Leistung</th>
          <th>Betrag</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pflegegeld (monatlich)</td>
          <td>${pflegegrad === 1 ? '0 €' : pflegegrad === 2 ? '347 €' : pflegegrad === 3 ? '599 €' : pflegegrad === 4 ? '800 €' : pflegegrad === 5 ? '990 €' : '-'}</td>
        </tr>
        <tr>
          <td>Entlastungsbetrag §45b</td>
          <td>131 €/Monat</td>
        </tr>
        <tr>
          <td>Entlastungsbudget §45b (jährlich)</td>
          <td>3.539 €/Jahr</td>
        </tr>
      </tbody>
    </table>
  `;
}

// Hilfsfunktion: Tagebucheinträge formatieren
export function formatTagebuchForPDF(eintraege: { datum: string; uhrzeit: string; text: string; kategorie: string }[]): string {
  const kategorien: Record<string, string> = {
    pflege: '💚 Pflege',
    medikament: '💊 Medikament',
    arzt: '🏥 Arztbesuch',
    sonstiges: '📝 Sonstiges'
  };
  
  return `
    <h3>Pflegetagebuch</h3>
    <p>Übersicht Ihrer dokumentierten Pflegetätigkeiten:</p>
    
    <table class="data-table">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Uhrzeit</th>
          <th>Kategorie</th>
          <th>Eintrag</th>
        </tr>
      </thead>
      <tbody>
        ${eintraege.map(e => `
          <tr>
            <td>${e.datum}</td>
            <td>${e.uhrzeit}</td>
            <td>${kategorien[e.kategorie] || e.kategorie}</td>
            <td>${e.text}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="highlight-box">
      <strong>Tipp:</strong> Dieses Tagebuch dient als Nachweis für den Pflegegrad-Antrag 
      oder Widerspruch. Je detaillierter, desto besser!
    </div>
  `;
}

export default generateMultiPagePDF;
