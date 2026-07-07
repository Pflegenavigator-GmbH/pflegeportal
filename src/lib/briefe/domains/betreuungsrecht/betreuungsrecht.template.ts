// src/lib/briefe/domains/betreuungsrecht/betreuungsrecht.template.ts
import { BriefPayload } from '@/src/types/briefe';

function getDringlichkeitText(dringlichkeit?: string): string {
  switch (dringlichkeit) {
    case 'sehr_hoch':
      return '\n\n*** DRINGEND - SOFORTIGE BESTELLUNG ERFORDERLICH ***';
    case 'hoch':
      return '\n\n*Eilbedürftig*';
    default:
      return '';
  }
}

export const generateBetreuungsrechtTemplate = (data: BriefPayload, heute: string): string[] => {
  const parts: string[] = [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
  ];

  const dringlichkeitText = getDringlichkeitText(data.verfahrensart);

  switch (data.type) {
    case 'betreuungsrecht':
      parts.push(
        `Betreff: Antrag auf Bestellung eines Betreuers gemäß § 1896 BGB${dringlichkeitText}`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `hiermit beantrage ich die Bestellung eines Betreuers.`,
        '\n',
        '1. ANTRAGSBERECHTIGUNG',
        'Ich wende mich an das Betreuungsgericht.',
        '\n',
        '2. ANGABEN ZUR BETROFFENEN PERSON',
        `Name: ${data.absender.name}`,
        '\n',
        '3. BEGRÜNDUNG',
        `${data.inhalt.hauptteil}`,
        '\n'
      );
      break;

    case 'allgemein': // Fallback oder andere Unterarten
    default:
      parts.push(
        `Betreff: ${data.betreff || 'Angelegenheit zum Betreuungsrecht'}`,
        '\n\n',
        `${data.inhalt.anrede}`,
        '\n',
        `${data.inhalt.hauptteil}`,
        '\n'
      );
      break;
  }

  parts.push(
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
    '\n',
    'HINWEIS:',
    'Betreuungsverfahren sind im Betreuungsgerichtsverfahrensgesetz (Betreuungsg.-Verf.) geregelt.',
    'Bei dringenden Gesundheitsgefahren kann das Gericht sofort einen vorläufigen Betreuer bestellen.'
  );

  return parts;
};
