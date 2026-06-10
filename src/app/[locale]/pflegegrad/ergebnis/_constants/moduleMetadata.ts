// src/app/[locale]/pflegegrad/_constants/moduleMetadata.ts

export interface NbaModuleMeta {
  id: number;
  name: string;
  beschreibung: string;
}

export const NBA_MODULE_METADATA: NbaModuleMeta[] = [
  {
    id: 1,
    name: 'Mobilität',
    beschreibung: 'Fähigkeit, sich im Raum selbstständig zu bewegen und zu positionieren.',
  },
  {
    id: 2,
    name: 'Kognition & Kommunikation',
    beschreibung: 'Zeitliche und örtliche Orientierung, Erinnerungsvermögen und Alltagssteuerung.',
  },
  {
    id: 3,
    name: 'Verhaltensweisen & Psyche',
    beschreibung: 'Umgang mit psychischen Problemlagen, nächtlicher Unruhe oder Abwehrverhalten.',
  },
  {
    id: 4,
    name: 'Selbstversorgung',
    beschreibung: 'Eigenständigkeit bei der Körperpflege, dem Essen, Trinken und Toilettengang.',
  },
  {
    id: 5,
    name: 'Krankheitsbewältigung',
    beschreibung: 'Umgang mit ärztlichen Verordnungen, Medikation und therapeutischen Maßnahmen.',
  },
  {
    id: 6,
    name: 'Alltagsgestaltung',
    beschreibung: 'Haushaltsführung und soziale Kontakte (Relevant für Widerspruchsverfahren).',
  },
];
