// src/app/[locale]/tagebuch/_constants/tagebuchTemplate.ts
import { TagebuchData } from '@/src/types/tagebuch';

export function generateTagebuchHtml(entries: TagebuchData, caseCode: string): string {
  // Einträge chronologisch nach Datum sortieren
  const sortedEntries = Object.entries(entries).sort(
    (a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime()
  );

  const entriesHtml = sortedEntries
    .map(([, entry]) => {
      const highlights = [
        entry.sturz
          ? '<span style="color:#991b1b;font-weight:bold;background:#fee2e2;padding:2px 6px;border-radius:4px;margin-right:4px;">⚠ Sturz</span>'
          : '',
        entry.krankenhaus
          ? '<span style="color:#92400e;font-weight:bold;background:#fef3c7;padding:2px 6px;border-radius:4px;margin-right:4px;">Klinik</span>'
          : '',
        entry.bettlaegerig
          ? '<span style="color:#6b21a8;font-weight:bold;background:#f3e8ff;padding:2px 6px;border-radius:4px;margin-right:4px;">Bettlägerig</span>'
          : '',
        entry.medikamentenKontrolle
          ? '<span style="color:#166534;font-weight:bold;background:#dcfce7;padding:2px 6px;border-radius:4px;margin-right:4px;">Mediz. Kontrolle ✓</span>'
          : '',
      ].join('');

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-variant-numeric: tabular-nums; font-weight: bold; color: #0f2744; vertical-align: top; width: 15%;">
            ${new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </td>
          <td style="padding: 12px; color: #334155; vertical-align: top; width: 15%;">
            ${entry.helfer}
          </td>
          <td style="padding: 12px; vertical-align: top; width: 50%;">
            <div style="font-size: 14px; line-height: 1.5; margin-bottom: 6px;">${entry.content}</div>
            <div style="font-size: 11px; margin-top: 4px;">${highlights}</div>
          </td>
          <td style="padding: 12px; font-weight: bold; text-align: center; color: #1a4480; vertical-align: top; width: 10%;">
            ${entry.schmerzen}/10
          </td>
          <td style="padding: 12px; text-align: center; color: #64748b; vertical-align: top; width: 10%;">
            ${entry.schlaf}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #0f2744; padding: 20px; max-width: 800px; margin: 0 auto; background: #ffffff;">
      <div style="display: flex; justify-between: space-between; align-items: center; border-bottom: 3px solid #0f2744; padding-bottom: 15px; margin-bottom: 30px;">
        <div>
          <img src="/assets/logo-horizontal.svg" alt="PflegeNavigator EU" style="height: 40px; display: block;" />
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 18px; color: #0f2744;">Chronologisches Pflegetagebuch</h2>
          <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 13px; color: #64748b;">Akte: ${caseCode.toUpperCase()}</p>
        </div>
      </div>

      <div style="background: #f8f9fa; border-left: 4px solid #1a4480; padding: 12px; margin-bottom: 25px; font-size: 12px; color: #475569; line-height: 1.5;">
        <strong>Beweissicherung nach § 14 SGB XI:</strong> Dieses Dokument dokumentiert lückenlos den täglichen Pflege- und Betreuungsaufwand sowie medizinische Auffälligkeiten zur Vorlage beim Medizinischen Dienst (MD) oder für das Widerspruchsverfahren.
      </div>

      <table style="w-full: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
        <thead>
          <tr style="background: #0f2744; color: #ffffff;">
            <th style="padding: 12px; border-radius: 4px 0 0 0;">Datum</th>
            <th style="padding: 12px;">Unterstützung durch</th>
            <th style="padding: 12px;">Vorkommnisse & Einschränkungen</th>
            <th style="padding: 12px; text-align: center;">Schmerz</th>
            <th style="padding: 12px; text-align: center; border-radius: 0 4px 0 0;">Schlaf</th>
          </tr>
        </thead>
        <tbody>
          ${entriesHtml}
        </tbody>
      </table>

      <div style="margin-top: 50px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 10px; color: #94a3b8; line-height: 1.4;">
        <p>© 2026 PflegeNavigator EU gUG • pflegenavigatoreu.com</p>
        <p>Dieses Dokument dient als Orientierungshilfe und Beweismittel für die Begutachtung. Keine Gewährleistung für Leistungszusagen der Pflegekasse.</p>
      </div>
    </div>
  `;
}
