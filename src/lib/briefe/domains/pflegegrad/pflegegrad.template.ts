// src/lib/briefe/pflegegrad/pflegegrad.template.ts
import { BriefPayload } from '@/src/types/briefe';

import { ANTRAG_PFLEGEGRAD_PARAGRAPHEN } from '../../constants';

export const generatePflegegradTemplate = (data: BriefPayload, heute: string): string[] => {
  return [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    data.absender.versichertennummer ? `Versicherten-Nr.: ${data.absender.versichertennummer}` : '',
    data.absender.geburtsdatum ? `Geburtsdatum: ${data.absender.geburtsdatum}` : '',
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
    `Betreff: ${data.betreff || 'Antrag auf Feststellung der Pflegebedürftigkeit nach § 14 SGB XI'}`,
    '\n\n',
    `${data.inhalt.anrede}`,
    '\n',
    `hiermit stelle ich formgerecht und fristwahrend einen Antrag auf Prüfung der Pflegebedürftigkeit und Einstufung in einen entsprechenden Pflegegrad gemäß § 14 Sozialgesetzbuch XI (SGB XI).`,
    '\n',
    `Klinische Begründung der Einschränkungen im Alltag:`,
    `${data.inhalt.hauptteil}`,
    '\n',
    `Ich bitte um zeitnahe Weiterleitung dieses Vorgangs an den Medizinischen Dienst zur Terminierung der Begutachtung.`,
    '\n',
    `Rechtliche Grundlagenhinweise:`,
    `• ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_14.paragraph}: ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_14.text}`,
    `• ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_15.paragraph}: ${ANTRAG_PFLEGEGRAD_PARAGRAPHEN.sgb_xi_15.text}`,
    '\n',
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
  ];
};
