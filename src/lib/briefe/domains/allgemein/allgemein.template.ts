// src/lib/briefe/domains/allgemein/allgemein.template.ts
import { BriefPayload } from '@/src/types/briefe';

export const generateAllgemeinBriefTemplate = (data: BriefPayload, heute: string): string[] => {
  return [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    data.absender.email ? `E-Mail: ${data.absender.email}` : '',
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    data.aktenzeichen ? `Aktenzeichen / Ref: ${data.aktenzeichen}` : '',
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
    `Betreff: ${data.betreff}`,
    '\n\n',
    `${data.inhalt.anrede}`,
    '\n',
    `${data.inhalt.hauptteil}`,
    '\n',
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
  ];
};
