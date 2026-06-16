// src/lib/briefe/domains/em-rente/em-rente.template.ts
import { BriefPayload } from '@/src/types/briefe';

export const EM_VORLAGEN = {
  em_rente_antrag: {
    betreff: 'Antrag auf Erwerbsminderungsrente',
    einleitung: 'hiermit stelle ich Antrag auf Erwerbsminderungsrente gemäß § 240 SGB VI.',
  },
  berufsunfaehigkeit: {
    betreff: 'Antrag auf Berufsunfähigkeitsrente',
    einleitung: 'hiermit stelle ich Antrag auf Berufsunfähigkeitsrente gemäß § 240 SGB VI.',
  },
  vorlaeufige_em: {
    betreff: 'Antrag auf vorläufige Erwerbsminderungsrente',
    einleitung:
      'hiermit stelle ich Antrag auf vorläufige Erwerbsminderungsrente gemäß § 241 SGB VI.',
  },
};

function getVorlage(verfahrensart?: string) {
  switch (verfahrensart) {
    case 'berufsunfaehigkeit':
      return EM_VORLAGEN.berufsunfaehigkeit;
    case 'vorlaeufige':
      return EM_VORLAGEN.vorlaeufige_em;
    default:
      return EM_VORLAGEN.em_rente_antrag;
  }
}

export const generateEMRenteTemplate = (data: BriefPayload, heute: string): string[] => {
  const vorlage = getVorlage(data.verfahrensart);

  return [
    `${data.absender.name}`,
    `${data.absender.strasse}`,
    `${data.absender.plz} ${data.absender.ort}`,
    '\n\n',
    `${data.empfaenger.name}`,
    data.empfaenger.strasse ?? '',
    `${data.empfaenger.plz} ${data.empfaenger.ort}`,
    data.aktenzeichen ? `Bearbeitungs-Nr. / SV-Nummer: ${data.aktenzeichen}` : '',
    '\n\n',
    `${data.absender.ort}, den ${heute}`,
    '\n\n',
    `Betreff: ${data.betreff || vorlage.betreff}`,
    '\n\n',
    `${data.inhalt.anrede}`,
    '\n',
    vorlage.einleitung,
    '\n',
    `Persönliche Daten:`,
    `- Name: ${data.absender.name}`,
    data.absender.geburtsdatum ? `- Geboren: ${data.absender.geburtsdatum}` : '',
    data.absender.versichertennummer ? `- SV-Nummer: ${data.absender.versichertennummer}` : '',
    '\n',
    `Begründung:`,
    `Aufgrund der gesundheitlichen Einschränkungen bin ich derzeit nicht in der Lage, meinen Beruf auszuüben.`,
    '\n',
    `${data.inhalt.hauptteil}`,
    '\n',
    `Ich bitte um zügige Bearbeitung meines Antrags und Terminierung eines medizinischen Gutachtens.`,
    '\n',
    'Mit freundlichen Grüßen',
    '\n\n',
    '_______________________',
    `${data.absender.name}`,
    '\n',
    data.absender.telefon ? `Tel.: ${data.absender.telefon}` : '',
    data.absender.email ? `E-Mail: ${data.absender.email}` : '',
  ];
};
