// AKTUELLE DATEN 2026 - PflegeNavigator EU
// Quellen: BMG, Pflegekassen, pflege.de, pflegegeld-rechner.com (27.04.2026)

// ============================================
// SGB XI Pflegegeld - Monatliche Beträge 2026
// ============================================

export const PFLEGEGELD_2026 = {
  // Pflegegeld bei häuslicher Pflege durch Angehörige
  pflegegeld: {
    pg1: 0,      // Entlastungsbetrag statt Pflegegeld
    pg2: 347,    // €/Monat
    pg3: 599,    // €/Monat
    pg4: 800,    // €/Monat
    pg5: 990,    // €/Monat
  },
  
  // Entlastungsbetrag §45b (gilt für alle PG 1-5)
  entlastungsBetrag: {
    monthly: 131,     // €/Monat
    yearly: 1572,     // €/Jahr
  },
  
  // Entlastungsbudget §45b (flexibel einsetzbar)
  entlastungsBudget: {
    yearly: 3539,     // €/Jahr für Verhinderungspflege, Tagespflege, Kurzzeitpflege
  },
  
  // Pflegesachleistungen (Pflegedienstleistungen)
  pflegesachleistungen: {
    pg1: 0,      // Keine Sachleistungen
    pg2: 125,    // €/Monat
    pg3: 761,    // €/Monat
    pg4: 770,    // €/Monat
    pg5: 770,    // €/Monat
  },
  
  // Kombinationsleistungen §38 (Pflegegeld + Sachleistungen)
  kombinationsLeistungen: {
    maxMonthly: 1848,   // €/Monat Höchstbetrag
    pg2: 1848,
    pg3: 1848,
    pg4: 1848,
    pg5: 1848,
  },
  
  // Vollstationäre Pflege (Pflegeheim)
  vollstationär: {
    pg2: 125,    // €/Monat (nur bei Kurzzeitpflege)
    pg3: 770,    // €/Monat
    pg4: 770,    // €/Monat
    pg5: 770,    // €/Monat
  },
  
  // Tagespflege
  tagespflege: {
    pg2: 125,    // €/Monat (als Teil des Entlastungsbudgets)
    pg3: 761,    // €/Monat
    pg4: 770,    // €/Monat
    pg5: 770,    // €/Monat
  },
  
  // Weitere Leistungen
  zusatzleistungen: {
    pflegehilfsmittel: 42,        // €/Monat
    wohnraumanpassung: 4180,      // € einmalig (lebenslang)
    pflegekurs: 2100,              // € für bis zu 8 Kurse (je 16 UE)
  }
};

// ============================================
// SGB V - Krankenversicherung (Wichtige Leistungen)
// ============================================

export const SGB_V_2026 = {
  // Hilfsmittel
  hilfsmittel: {
    zuzahlungBefreit: true,       // Bei Pflegegrad 3-5 oder GdB 50+
    zuzahlung: '10% oder max 10€', // Bei Pflegegrad 1-2
  },
  
  // Haushaltshilfe
  haushaltshilfe: {
    stundenProWoche: 15,          // Bei Pflegegrad 2-5
    maxDauerWochen: 26,           // Max 26 Wochen
  },
  
  // Verhinderungspflege (Wenn Angehöriger krank)
  verhinderungspflege: {
    maxTageProJahr: 42,           // Tage im Jahr
    maxBetragProTag: 42,         // €/Tag (bei PG 2-5)
  }
};

// ============================================
// SGB VI - Erwerbsminderungsrente (EM-Rente)
// ============================================

export const EM_RENTE_2026 = {
  // Wartezeit
  wartezeit: {
    jahre: 35,                    // 35 Jahre versichert
    mindestJahre: 3,              // Mindestens 3 Jahre vor Arbeitsunfähigkeit
  },
  
  // Hinzuverdienstgrenzen (bei Teilrente)
  hinzuverdienst: {
    ohneGdB: 518,                 // €/Monat
    gdB30_40: 1293,               // €/Monat
    gdB50: 1610,                  // €/Monat
    gdB60_70: 2030,               // €/Monat
    gdB80_100: 2630,              // €/Monat
  },
  
  // Fristen
  fristen: {
    antragEmpfohlen: '6 Monate vorher',
    bescheid: '6-12 Wochen',
    widerspruch: '1 Monat',
    nachzahlung: 'bis 4 Jahre rückwirkend',
  }
};

// ============================================
// SGB IX - GdB (Grad der Behinderung)
// ============================================

export const GDB_2026 = {
  // Wichtige GdB-Schwellen
  schwellen: {
    erheblich: 30,        // Ab 30: Steuerfreibeträge
    behinderung: 50,      // Ab 50: Frühpensionierung
    schwerbehindert: 80,  // Ab 80: Schwerbehindertenausweis automatisch
  },
  
  // Vergünstigungen je GdB
  verguenstigungen: {
    30: ['Steuerfreibetrag', 'Mehr-Pauschbetrag'],
    50: ['Frühpensionierung +1 Jahr', 'Steuervorteile'],
    80: ['Schwerbehindertenausweis', 'Schwerbehindertenparkplatz', 'Befreiung Rundfunkbeitrag'],
  },
  
  // Fristen
  fristen: {
    erstantrag: '6 Monate vor Rentenbeginn',
    widerspruch: '1 Monat nach Bescheid',
    gueltigkeit: '5 Jahre (meist)',  // Nachprüfung
  }
};

// ============================================
// SGB XIV - Opferentschädigung
// ============================================

export const SGB_XIV_2026 = {
  // Anspruchsgruppen
  anspruch: [
    'Gewaltopfer (Körperverletzung)',
    'Hinterbliebene (Ehepartner, Kinder)',
    'Zeugen psychisch belasteter Straftaten',
  ],
  
  // Fristen
  fristen: {
    antrag: '3 Jahre nach Tat',
    widerspruch: '1 Monat nach Bescheid',
    nachweis: 'ärztliches/psychologisches Gutachten nötig',
  },
  
  // Beträge (Pauschal - variiert je Fall)
  betraege: {
    schmerzensgeldMin: 500,
    schmerzensgeldMax: 50000,
    haerteausgleichMax: 25000,
    renteMonatlichMin: 300,
    renteMonatlichMax: 800,
    behandlung: '100% Kostenübernahme',
  }
};

// ============================================
// BEEP Gesetz 2026 (Befugniserweiterung in der Pflege)
// ============================================

export const BEEP_2026 = {
  name: 'BEEP - Befugniserweiterung und Entbürokratisierung in der Pflege',
  gueltigAb: '2026-01-01',
  
  wichtigeAenderungen: [
    'Kürzere Abrechnungsfristen für Pflegedienste',
    'Weniger Bürokratie bei Verhinderungspflege',
    'Präventionsangebote erweitert',
    'Heilkundliche Aufgaben in Pflege verankert',
    'Pflegekräfte dürfen bestimmte Medikamente verabreichen',
    'Digitale Pflegeanträge werden beschleunigt',
  ]
};

// ============================================
// Fristen-Übersicht (Alle wichtigen Fristen)
// ============================================

export const FRISTEN_2026 = {
  pflegegrad: {
    antrag: 'Jederzeit möglich',
    widerspruch: '1 Monat nach MD-Bescheid',
    nachpruefung: 'Alle 6 Monate (bei PG 1-2) oder 1 Jahr (PG 3-5)',
  },
  
  gdb: {
    erstantrag: '6 Monate vor Rentenbeginn (empfohlen)',
    widerspruch: '1 Monat nach Bescheid',
  },
  
  emRente: {
    antrag: '6 Monate vorher (empfohlen)',
    bescheid: '6-12 Wochen Bearbeitung',
    widerspruch: '1 Monat',
    nachzahlung: 'Bis zu 4 Jahre rückwirkend',
  },
  
  sgbXiv: {
    antrag: '3 Jahre nach Tat',
    widerspruch: '1 Monat',
  },
  
  widerspruchAllgemein: {
    frist: '1 Monat nach Bescheid',
    form: 'Schriftlich oder elektronisch',
    begruendung: 'Nicht nötig, aber empfohlen',
  }
};

// ============================================
// Hilfsfunktionen
// ============================================

export function getPflegegeld(pg: 1 | 2 | 3 | 4 | 5): number {
  return PFLEGEGELD_2026.pflegegeld[`pg${pg}` as keyof typeof PFLEGEGELD_2026.pflegegeld] || 0;
}

export function getGesamtleistung(pg: 1 | 2 | 3 | 4 | 5, mitEntlastungsbudget: boolean = false): number {
  const pflegegeld = getPflegegeld(pg);
  const entlastung = PFLEGEGELD_2026.entlastungsBetrag.monthly;
  const budget = mitEntlastungsbudget ? PFLEGEGELD_2026.entlastungsBudget.yearly / 12 : 0;
  
  return pflegegeld + entlastung + budget;
}

export function formatEuro(betrag: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(betrag);
}

// ============================================
// Export aller Daten
// ============================================

export const ALLE_DATEN_2026 = {
  pflegegeld: PFLEGEGELD_2026,
  sgbV: SGB_V_2026,
  emRente: EM_RENTE_2026,
  gdb: GDB_2026,
  sgbXiv: SGB_XIV_2026,
  beep: BEEP_2026,
  fristen: FRISTEN_2026,
  
  // Hilfsfunktionen
  getPflegegeld,
  getGesamtleistung,
  formatEuro,
};

export default ALLE_DATEN_2026;
