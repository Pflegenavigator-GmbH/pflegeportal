// src/lib/briefe/domains/schwerbehinderung/schwerbehinderung.template.ts
import { SCHWERBEHINDERTEN_LEITLINIEN } from '@/src/lib/briefe/constants';
import { BriefPayload } from '@/src/types/briefe';

export const generateSchwerbehindertenBriefTemplate = (
  data: BriefPayload,
  heute: string
): string[] => {
  return [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    data.absender.sozialversicherungsnummer
      ? `Sozialversicherungs-Nr.: ${data.absender.sozialversicherungsnummer}`
      : '',
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
    `Betreff: ${data.betreff || 'Erstantrag auf Feststellung eines Grades der Behinderung (GdB) nach § 152 SGB IX'}`,
    '\n\n',
    `${data.inhalt.anrede}`,
    '\n',
    'hiermit beantrage ich die offizielle Feststellung des Grades der Behinderung (GdB) sowie die Zuerkennung eventueller Merkzeichen gemäß den Bestimmungen des SGB IX.',
    '\n',
    'Darstellung der dauerhaften Funktionsbeeinträchtigungen:',
    `${data.inhalt.hauptteil}`,
    '\n',
    data.verfahrensart ? `Angestrebtes Verfahren / Zusatz-Option: ${data.verfahrensart}` : '',
    '\n',
    'Gesetzliche Grundlagen:',
    `• § 2 SGB IX: ${SCHWERBEHINDERTEN_LEITLINIEN.sgb_ix_2}`,
    `• § 152 SGB IX: ${SCHWERBEHINDERTEN_LEITLINIEN.sgb_ix_152}`,
    '\n',
    'Ich bitte das Versorgungsamt, die notwendigen Befundberichte bei den behandelnden Fachärzten einzuholen.',
    '\n',
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
  ];
};
