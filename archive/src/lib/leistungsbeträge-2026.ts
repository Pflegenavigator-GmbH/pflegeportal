/**
 * Leistungsbeträge SGB XI Pflege - 2026
 * 
 * Alle Beträge für Pflegeleistungen nach SGB XI (2025/2026 identisch)
 * Quelle: §§36-45b SGB XI, Stand 2026
 */

// ============================================================================
// TYPEN & INTERFACES
// ============================================================================

export type Pflegegrad = 1 | 2 | 3 | 4 | 5;

export interface PflegegeldBeträge {
  monatlich: Record<Pflegegrad, number>;
}

export interface SachleistungBeträge {
  monatlich: Record<Pflegegrad, number>;
}

export interface TagesNachtpflegeBeträge {
  monatlich: {
    'PG1-2': number;
    'PG3': number;
    'PG4-5': number;
  };
}

export interface VerhinderungspflegeBeträge {
  maxJährlich: number;
  maxWochen: number;
}

export interface EntlastungsbetragBeträge {
  monatlich: number;
}

export interface PflegehilfsmittelBeträge {
  maxMonatlich: number;
}

export interface WohnraumanpassungBeträge {
  maxEinmalig: number;
}

export interface TechnischeHilfenBeträge {
  maxJeHilfsmittel: number;
}

export interface PflegekursBeträge {
  // Kostenübernahme durch Pflegekasse
  type: 'kostenübernahme';
}

export interface KombinationsleistungBeträge {
  /** Maximaler Anteil der Sachleistung, der in Geld umgewandelt werden kann */
  maxUmwandlungsAnteil: number; // 40% = 0.4
}

export interface AlleLeistungsBeträge {
  pflegegeld: PflegegeldBeträge;
  sachleistungAmbulant: SachleistungBeträge;
  tagesNachtpflege: TagesNachtpflegeBeträge;
  verhinderungspflege: VerhinderungspflegeBeträge;
  entlastungsbetrag: EntlastungsbetragBeträge;
  zuschussPflegehilfsmittel: PflegehilfsmittelBeträge;
  zuschussWohnraumanpassung: WohnraumanpassungBeträge;
  zuschussTechnischeHilfen: TechnischeHilfenBeträge;
  zuschussPflegekurs: PflegekursBeträge;
  kombinationsleistung: KombinationsleistungBeträge;
}

export interface KombinationsleistungResult {
  /** Ursprüngliche Sachleistung */
  ursprünglicheSachleistung: number;
  /** Betrag der in Geld umgewandelt wird */
  umgewandeltInGeld: number;
  /** Verbleibende Sachleistung */
  verbleibendeSachleistung: number;
  /** Zusätzliches Pflegegeld */
  zusätzlichesPflegegeld: number;
  /** Gesamtmonatlicher Betrag */
  gesamtBetrag: number;
}

// ============================================================================
// LEISTUNGSBETRÄGE 2026
// ============================================================================

/**
 * Alle Leistungsbeträge nach SGB XI (2026)
 * Stand: 2026 (identisch zu 2025)
 */
export const LEISTUNGSBETRÄGE_2026: AlleLeistungsBeträge = {
  // §37 SGB XI - Pflegegeld (monatlich)
  pflegegeld: {
    monatlich: {
      1: 332,   // PG 1
      2: 573,   // PG 2
      3: 765,   // PG 3
      4: 1095,  // PG 4
      5: 1427,  // PG 5
    },
  },

  // §36 SGB XI - Sachleistungen ambulant (monatlich)
  sachleistungAmbulant: {
    monatlich: {
      1: 742,   // PG 1
      2: 1262,  // PG 2
      3: 1684,  // PG 3
      4: 2095,  // PG 4
      5: 2642,  // PG 5
    },
  },

  // §41 SGB XI - Tages- und Nachtpflege (monatlich)
  tagesNachtpflege: {
    monatlich: {
      'PG1-2': 1262,  // PG 1-2
      'PG3': 1684,    // PG 3
      'PG4-5': 2095,  // PG 4-5
    },
  },

  // Verhinderungspflege (Ersatzpflege)
  verhinderungspflege: {
    maxJährlich: 1926,
    maxWochen: 6,
  },

  // §45b SGB XI - Entlastungsbetrag (monatlich)
  entlastungsbetrag: {
    monatlich: 295,  // Ab 2026
  },

  // Zuschuss Pflegehilfsmittel
  zuschussPflegehilfsmittel: {
    maxMonatlich: 40,
  },

  // Zuschuss Wohnraumanpassung
  zuschussWohnraumanpassung: {
    maxEinmalig: 4000,
  },

  // Zuschuss technische Hilfen
  zuschussTechnischeHilfen: {
    maxJeHilfsmittel: 2500,
  },

  // Zuschuss Pflegekurs für Angehörige
  zuschussPflegekurs: {
    type: 'kostenübernahme',
  },

  // §38 SGB XI - Kombinationsleistung
  kombinationsleistung: {
    maxUmwandlungsAnteil: 0.4, // 40%
  },
};

// ============================================================================
// BERECHNUNGSFUNKTIONEN
// ============================================================================

/**
 * Gibt den monatlichen Pflegegeld-Betrag für einen Pflegegrad zurück
 * @param pflegegrad - Pflegegrad 1-5
 * @returns Monatlicher Betrag in Euro
 */
export function getPflegegeld(pflegegrad: Pflegegrad): number {
  return LEISTUNGSBETRÄGE_2026.pflegegeld.monatlich[pflegegrad];
}

/**
 * Gibt den monatlichen Sachleistungs-Betrag für einen Pflegegrad zurück
 * @param pflegegrad - Pflegegrad 1-5
 * @returns Monatlicher Betrag in Euro
 */
export function getSachleistungAmbulant(pflegegrad: Pflegegrad): number {
  return LEISTUNGSBETRÄGE_2026.sachleistungAmbulant.monatlich[pflegegrad];
}

/**
 * Gibt den monatlichen Tages-/Nachtpflege-Betrag zurück
 * @param pflegegrad - Pflegegrad 1-5
 * @returns Monatlicher Betrag in Euro
 */
export function getTagesNachtpflege(pflegegrad: Pflegegrad): number {
  if (pflegegrad <= 2) {
    return LEISTUNGSBETRÄGE_2026.tagesNachtpflege.monatlich['PG1-2'];
  } else if (pflegegrad === 3) {
    return LEISTUNGSBETRÄGE_2026.tagesNachtpflege.monatlich['PG3'];
  } else {
    return LEISTUNGSBETRÄGE_2026.tagesNachtpflege.monatlich['PG4-5'];
  }
}

/**
 * Berechnet die Kombinationsleistung nach §38 SGB XI
 * Bis zu 40% der Sachleistung können in Geld umgewandelt werden
 * 
 * @param pflegegrad - Pflegegrad 1-5
 * @param umwandlungsAnteil - Anteil der umgewandelt werden soll (0-0.4)
 * @returns Detaillierte Berechnungsergebnisse
 */
export function berechneKombinationsleistung(
  pflegegrad: Pflegegrad,
  umwandlungsAnteil: number = 0.4
): KombinationsleistungResult {
  // Validierung
  const maxAnteil = LEISTUNGSBETRÄGE_2026.kombinationsleistung.maxUmwandlungsAnteil;
  const tatsächlicherAnteil = Math.min(Math.max(umwandlungsAnteil, 0), maxAnteil);

  const sachleistung = getSachleistungAmbulant(pflegegrad);
  const pflegegeld = getPflegegeld(pflegegrad);

  // Berechnung
  const umgewandeltInGeld = Math.round(sachleistung * tatsächlicherAnteil);
  const verbleibendeSachleistung = sachleistung - umgewandeltInGeld;
  
  // Zusätzliches Pflegegeld (anteilig)
  const zusätzlichesPflegegeld = Math.round(pflegegeld * tatsächlicherAnteil);

  return {
    ursprünglicheSachleistung: sachleistung,
    umgewandeltInGeld,
    verbleibendeSachleistung,
    zusätzlichesPflegegeld,
    gesamtBetrag: verbleibendeSachleistung + zusätzlichesPflegegeld,
  };
}

/**
 * Gibt alle verfügbaren Leistungen für einen Pflegegrad zurück
 * @param pflegegrad - Pflegegrad 1-5
 * @returns Übersicht aller Leistungsbeträge
 */
export function getAlleLeistungenFürPflegegrad(pflegegrad: Pflegegrad): {
  pflegegeld: number;
  sachleistungAmbulant: number;
  tagesNachtpflege: number;
  kombinationsleistungMax: KombinationsleistungResult;
} {
  return {
    pflegegeld: getPflegegeld(pflegegrad),
    sachleistungAmbulant: getSachleistungAmbulant(pflegegrad),
    tagesNachtpflege: getTagesNachtpflege(pflegegrad),
    kombinationsleistungMax: berechneKombinationsleistung(pflegegrad, 0.4),
  };
}

/**
 * Gibt die Entlastungsleistungen zurück
 * @returns Übersicht Entlastungsbetrag, Verhinderungspflege, Pflegehilfsmittel
 */
export function getEntlastungsleistungen(): {
  entlastungsbetragMonatlich: number;
  verhinderungspflegeMaxJährlich: number;
  verhinderungspflegeMaxWochen: number;
  pflegehilfsmittelMaxMonatlich: number;
  wohnraumanpassungMaxEinmalig: number;
  technischeHilfenMaxJeHilfsmittel: number;
  pflegekurs: 'kostenübernahme';
} {
  return {
    entlastungsbetragMonatlich: LEISTUNGSBETRÄGE_2026.entlastungsbetrag.monatlich,
    verhinderungspflegeMaxJährlich: LEISTUNGSBETRÄGE_2026.verhinderungspflege.maxJährlich,
    verhinderungspflegeMaxWochen: LEISTUNGSBETRÄGE_2026.verhinderungspflege.maxWochen,
    pflegehilfsmittelMaxMonatlich: LEISTUNGSBETRÄGE_2026.zuschussPflegehilfsmittel.maxMonatlich,
    wohnraumanpassungMaxEinmalig: LEISTUNGSBETRÄGE_2026.zuschussWohnraumanpassung.maxEinmalig,
    technischeHilfenMaxJeHilfsmittel: LEISTUNGSBETRÄGE_2026.zuschussTechnischeHilfen.maxJeHilfsmittel,
    pflegekurs: 'kostenübernahme',
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default LEISTUNGSBETRÄGE_2026;
