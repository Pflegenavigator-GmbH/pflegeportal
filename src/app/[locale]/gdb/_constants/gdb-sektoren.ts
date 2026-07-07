import { GdBSektor } from '@/src/types/gdb';

export const gdbSektoren: GdBSektor[] = [
  {
    id: 'bewegungsapparat',
    label: 'Bewegungsorgane & Wirbelsäule',
    beschreibung: 'Einschränkungen an Gelenken, Armen, Beinen oder chronische Rückenschmerzen',
    werte: [
      { label: 'Keine nennenswerte Einschränkung', wert: 0 },
      { label: 'Leichte funktionelle Einschränkung (z.B. ein Wirbelsäulenabschnitt)', wert: 10 },
      {
        label: 'Mittelgradige Einschränkung (z.B. zwei Wirbelsäulenabschnitte, Arthrose)',
        wert: 30,
      },
      { label: 'Schwere Einschränkung / Versteifung großer Gelenke', wert: 50 },
    ],
  },
  {
    id: 'psyche',
    label: 'Psyche & Nervensystem',
    beschreibung: 'Depressionen, Burnout, Angststörungen, Traumata oder neurologische Erkrankungen',
    werte: [
      { label: 'Keine Einschränkung im Alltag', wert: 0 },
      { label: 'Leichtere psychische Störungen (Kompensation gut möglich)', wert: 20 },
      {
        label: 'Stärker behindernde Störungen (Erhebliche familiäre/berufliche Einbußen)',
        wert: 40,
      },
      {
        label: 'Schwere Störungen (Vollständiger sozialer Rückzug / Geistige Behinderung)',
        wert: 70,
      },
    ],
  },
  {
    id: 'herz_kreislauf',
    label: 'Herz-Kreislauf-System',
    beschreibung: 'Bluthochdruck, Herzinsuffizienz, koronare Herzkrankheit (KHK)',
    werte: [
      { label: 'Normalfunktion / Keine Beschwerden', wert: 0 },
      { label: 'Leichte Belastungsdyspnoe (z.B. Treppensteigen ab 2. Stock)', wert: 10 },
      { label: 'Einschränkung bei alltäglicher Belastung (Ebene Gehen)', wert: 30 },
      { label: 'Schwere Herzinsuffizienz bereits in Ruhe', wert: 70 },
    ],
  },
  {
    id: 'sinnesorgane',
    label: 'Sehen, Hören & Sprache',
    beschreibung: 'Visuelle Einschränkungen, Tinnitus, Schwerhörigkeit oder Sprachstörungen',
    werte: [
      { label: 'Volles Sinnesvermögen / Ausgeglichen durch Hilfsmittel', wert: 0 },
      { label: 'Leichte Einbußen (z.B. einseitige Schwerhörigkeit)', wert: 10 },
      { label: 'Ausgeprägte Seh- oder Hörbeeinträchtigung (beidseitig)', wert: 40 },
      { label: 'Hochgradige Sehbehinderung / Blindheit / Gehörlosigkeit', wert: 100 },
    ],
  },
  {
    id: 'innere_organe',
    label: 'Innere Organe & Stoffwechsel',
    beschreibung: 'Diabetes mellitus, Asthma, Magen-Darm-Erkrankungen oder Niereninsuffizienz',
    werte: [
      { label: 'Keine Einschränkungen', wert: 0 },
      { label: 'Gut eingestellt (z.B. Diabetes ohne schwere Unterzuckerungen)', wert: 10 },
      { label: 'Spürbare Alltagseinschränkung (z.B. schweres Asthma mit Medikation)', wert: 30 },
      { label: 'Schwere Organschäden / Dialysepflichtigkeit', wert: 80 },
    ],
  },
];
