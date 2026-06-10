// src/lib/briefe/allgemein.ts
// Allgemeiner Brief-Generator für Behörden, Universitäten, Versicherungen
// PflegeNavigator EU - Universal Brief-Baukasten

import { BriefPayload } from '@/src/types/briefe';

export const BEHOERDEN_VORLAGEN = {
  uni_pruefungsamt: {
    anrede: 'Sehr geehrte Damen und Herren,',
    rechtshinweis:
      'Anträge an das Prüfungsamt unterliegen den Ausschlussfristen der jeweiligen Prüfungsordnung.',
  },
  versicherung_kranken: {
    anrede: 'Sehr geehrte Damen und Herren,',
    rechtshinweis:
      'Leistungsansprüche gegenüber gesetzlichen Krankenkassen richten sich nach dem SGB V.',
  },
  finanzamt: {
    anrede: 'Sehr geehrte Damen und Herren,',
    rechtshinweis: 'Mitteilungen an das Finanzamt sind gemäß § 122 AO formgebunden.',
  },
  amt_gericht: {
    anrede: 'Sehr geehrte Damen und Herren,',
    rechtshinweis: 'Schriftsätze an Gerichte unterliegen den strengen Vorgaben der ZPO bzw. VwGO.',
  },
};

export class AllgemeinerBriefGenerator {
  generateBrief(data: BriefPayload): string {
    const heute = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // DIN 5008 Absenderblock
    let brief = `${data.absender.name}\n`;
    brief += `${data.absender.strasse}\n`;
    brief += `${data.absender.plz} ${data.absender.ort}\n`;

    if (data.absender.telefon) brief += `Tel.: ${data.absender.telefon}\n`;
    if (data.absender.email) brief += `E-Mail: ${data.absender.email}\n`;

    brief += `\n\n\n`;

    // DIN 5008 Empfängerblock
    brief += `${data.empfaenger.name}\n`;
    if (data.empfaenger.strasse) brief += `${data.empfaenger.strasse}\n`;
    brief += `${data.empfaenger.plz} ${data.empfaenger.ort}\n`;

    if (data.aktenzeichen) {
      brief += `Aktenzeichen / Ref: ${data.aktenzeichen}\n`;
    }

    brief += `\n\n`;
    brief += `${data.absender.ort}, den ${heute}\n\n\n`;

    // Betreffzeile
    brief += `Betreff: ${data.betreff}\n\n\n`;

    // Anrede & Kern-Inhalt
    brief += `${data.inhalt.anrede}\n\n`;
    brief += `${data.inhalt.hauptteil}\n\n`;

    // Höflichkeitsfloskel & Signaturzeile
    brief += `Mit freundlichen Grüßen\n\n\n`;
    brief += `_______________________\n`;
    brief += `${data.absender.name}\n`;

    // Anlagenverzeichnis
    if (data.anlagen && data.anlagen.length > 0) {
      brief += `\n\nAnlagen:\n`;
      data.anlagen.forEach((anlage) => {
        brief += `- ${anlage}\n`;
      });
    }

    return brief;
  }
}

export const allgemeinerBriefGenerator = new AllgemeinerBriefGenerator();
