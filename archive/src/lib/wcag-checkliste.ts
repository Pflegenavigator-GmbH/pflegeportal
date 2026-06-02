// WCAG 2.1 Level AA Checkliste
// PflegeNavigator EU - Barrierefreiheit

export interface WCAGPruefung {
  kriterium: string;
  beschreibung: string;
  status: 'bestanden' | 'fehlschlag' | 'teilweise' | 'nicht-pruefbar';
  prioritaet: 'hoch' | 'mittel' | 'niedrig';
  anmerkungen?: string;
}

export const WCAG_21_AA_CHECKLISTE: WCAGPruefung[] = [
  // Wahrnehmbar (Perceivable)
  {
    kriterium: "1.1.1",
    beschreibung: "Alle Bilder haben Alternativtexte",
    status: 'teilweise',
    prioritaet: 'hoch',
    anmerkungen: "Logo hat Alt-Text, Content-Bilder prüfen"
  },
  {
    kriterium: "1.2.2",
    beschreibung: "Videos haben Untertitel",
    status: 'nicht-pruefbar',
    prioritaet: 'mittel',
    anmerkungen: "Keine Videos bisher"
  },
  {
    kriterium: "1.3.1",
    beschreibung: "Überschriften-Hierarchie korrekt (h1-h6)",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "1.4.3",
    beschreibung: "Farbkontrast mindestens 4.5:1",
    status: 'bestanden',
    prioritaet: 'hoch',
    anmerkungen: "Tailwind-Colors verwendet"
  },
  {
    kriterium: "1.4.4",
    beschreibung: "Text auf 200% zoomen ohne Verlust",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  
  // Bedienbar (Operable)
  {
    kriterium: "2.1.1",
    beschreibung: "Alles per Tastatur bedienbar",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "2.1.2",
    beschreibung: "Keine Tastaturfallen",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "2.2.2",
    beschreibung: "Kein Blinken >3x/Sekunde",
    status: 'bestanden',
    prioritaet: 'mittel'
  },
  {
    kriterium: "2.4.1",
    beschreibung: "Skip-Link 'Zum Inhalt springen'",
    status: 'fehlschlag',
    prioritaet: 'hoch',
    anmerkungen: "MUSS NOCH IMPLEMENTIERT WERDEN"
  },
  {
    kriterium: "2.4.3",
    beschreibung: "Fokusreihenfolge logisch",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "2.4.7",
    beschreibung: "Fokusrahmen sichtbar",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  
  // Verständlich (Understandable)
  {
    kriterium: "3.1.1",
    beschreibung: "Sprache im HTML angegeben",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "3.1.2",
    beschreibung: "Fremdsprachige Wörter markiert",
    status: 'teilweise',
    prioritaet: 'niedrig'
  },
  {
    kriterium: "3.2.1",
    beschreibung: "Keine unerwartete Kontextänderung",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "3.2.2",
    beschreibung: "Kein automatisches Absenden",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "3.3.1",
    beschreibung: "Fehlermeldungen identifizieren Problem",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "3.3.2",
    beschreibung: "Formularfelder haben Labels",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  {
    kriterium: "3.3.3",
    beschreibung: "Fehlermeldungen beschreiben Lösung",
    status: 'bestanden',
    prioritaet: 'hoch'
  },
  
  // Robust (Robust)
  {
    kriterium: "4.1.1",
    beschreibung: "Valides HTML",
    status: 'bestanden',
    prioritaet: 'mittel'
  },
  {
    kriterium: "4.1.2",
    beschreibung: "ARIA-Labels korrekt",
    status: 'teilweise',
    prioritaet: 'hoch',
    anmerkungen: "Buttons und Formulare prüfen"
  }
];

export function berechneWCAGScore(): { bestanden: number; fehlgeschlagen: number; prozent: number } {
  const relevante = WCAG_21_AA_CHECKLISTE.filter(p => p.status !== 'nicht-pruefbar');
  const bestanden = relevante.filter(p => p.status === 'bestanden').length;
  const fehlgeschlagen = relevante.filter(p => p.status === 'fehlschlag').length;
  const prozent = Math.round((bestanden / relevante.length) * 100);
  
  return { bestanden, fehlgeschlagen, prozent };
}

export function getKritischeFehler(): WCAGPruefung[] {
  return WCAG_21_AA_CHECKLISTE.filter(
    p => p.status === 'fehlschlag' && p.prioritaet === 'hoch'
  );
}

export const wcagReport = {
  checkliste: WCAG_21_AA_CHECKLISTE,
  score: berechneWCAGScore(),
  kritischeFehler: getKritischeFehler()
};
