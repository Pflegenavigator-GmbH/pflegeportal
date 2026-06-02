// NBA PFLEGEGRAD BERECHNUNG - Komplett nach MD-Richtlinien
// 6 Module, Gewichtungen, Kinder-Modus, Ampel-System

export interface ModuleScores {
  1: number; // Mobilität (10%)
  2: number; // Kognition (15%)
  3: number; // Verhalten (15%)
  4: number; // Selbstversorgung (40%)
  5: number; // Therapie (20%)
  6: number; // Alltag (0% - nur für Widerspruch)
}

export interface PflegegradResult {
  careLevel: number | null;
  totalScore: number;
  moduleScores: ModuleScores;
  weightedScores: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  maxOf23: number; // Höherer Wert von Modul 2 oder 3
  trafficLight: 'green' | 'yellow' | 'red';
  buffer: number;
  missingData: boolean;
  benefits: {
    monthlyAmount: number;
    reliefBudget: number;
    additionalBenefits: string[];
  };
}

// GEWICHTUNGEN NBA
const WEIGHTS = {
  1: 0.10, // Mobilität
  2: 0.15, // Kognition
  3: 0.15, // Verhalten
  4: 0.40, // Selbstversorgung (WICHTIGSTE!)
  5: 0.20, // Therapie
  6: 0.00, // Alltag (nur für Widerspruch)
};

// PFLEGEGRAD-SCHWELLEN
const THRESHOLDS = {
  1: { min: 12.5, max: 27.0 },
  2: { min: 27.0, max: 47.5 },
  3: { min: 47.5, max: 70.0 },
  4: { min: 70.0, max: 90.0 },
  5: { min: 90.0, max: 100.0 },
};

// PFLEGEGELD 2026
const CARE_BENEFITS = {
  1: { monthly: 0, relief: 131 },
  2: { monthly: 347, relief: 131 },
  3: { monthly: 599, relief: 131 },
  4: { monthly: 800, relief: 131 },
  5: { monthly: 990, relief: 131 },
};

/**
 * Berechnet Pflegegrad nach NBA-Regeln
 * WICHTIG: Von Modul 2 und 3 zählt nur der HÖHERE Wert!
 */
export function calculatePflegegrad(
  scores: Partial<ModuleScores>,
  isChild: boolean = false,
  childAge?: number
): PflegegradResult {
  // Standardwerte für fehlende Module
  const fullScores: ModuleScores = {
    1: scores[1] ?? 0,
    2: scores[2] ?? 0,
    3: scores[3] ?? 0,
    4: scores[4] ?? 0,
    5: scores[5] ?? 0,
    6: scores[6] ?? 0,
  };

  // Prüfe ob Daten fehlen
  const missingData = Object.values(fullScores).some(s => s === 0 || s === undefined);

  // Gewichtete Scores berechnen
  const weightedScores = {
    1: fullScores[1] * WEIGHTS[1],
    2: fullScores[2] * WEIGHTS[2],
    3: fullScores[3] * WEIGHTS[3],
    4: fullScores[4] * WEIGHTS[4],
    5: fullScores[5] * WEIGHTS[5],
  };

  // KRITISCHE REGEL: Nur HÖHERER Wert von Modul 2 oder 3 zählt!
  const maxOf23 = Math.max(fullScores[2], fullScores[3]);
  const weightedMaxOf23 = maxOf23 * WEIGHTS[2]; // 15% Gewichtung

  // Gesamtpunktzahl
  const totalScore = 
    weightedScores[1] +           // Modul 1 (10%)
    weightedMaxOf23 +            // Max(Modul 2, Modul 3) (15%)
    weightedScores[4] +          // Modul 4 (40%)
    weightedScores[5];           // Modul 5 (20%)

  // Kinder-Modus (unter 18 Monate)
  if (isChild && childAge && childAge < 18) {
    return calculateChildCareLevel(totalScore, fullScores, weightedScores, maxOf23, missingData);
  }

  // Pflegegrad bestimmen
  let careLevel: number | null = null;
  for (let level = 5; level >= 1; level--) {
    const threshold = THRESHOLDS[level as keyof typeof THRESHOLDS];
    if (totalScore >= threshold.min) {
      careLevel = level;
      break;
    }
  }

  // Ampel-Logik
  const { trafficLight, buffer } = calculateTrafficLight(totalScore, careLevel);

  // Leistungen berechnen
  const benefits = calculateBenefits(careLevel);

  return {
    careLevel,
    totalScore: Math.round(totalScore * 10) / 10,
    moduleScores: fullScores,
    weightedScores,
    maxOf23,
    trafficLight,
    buffer,
    missingData,
    benefits,
  };
}

/**
 * Ampel-System: Grün/Gelb/Rot
 */
function calculateTrafficLight(
  totalScore: number,
  careLevel: number | null
): { trafficLight: 'green' | 'yellow' | 'red'; buffer: number } {
  if (!careLevel) {
    // Kein Pflegegrad
    const nextThreshold = THRESHOLDS[1].min;
    const buffer = nextThreshold - totalScore;
    return { trafficLight: 'red', buffer: Math.round(buffer * 10) / 10 };
  }

  const threshold = THRESHOLDS[careLevel as keyof typeof THRESHOLDS];
  const upperThreshold = careLevel < 5 ? THRESHOLDS[(careLevel + 1) as keyof typeof THRESHOLDS].min : 100;
  
  // Puffer bis zur nächsten Schwelle
  const bufferToUpper = upperThreshold - totalScore;
  const bufferFromLower = totalScore - threshold.min;

  // Grün: Deutlich über Schwelle (>5 Punkte)
  if (bufferFromLower > 5) {
    return { trafficLight: 'green', buffer: Math.round(bufferFromLower * 10) / 10 };
  }
  
  // Gelb: Knapp an Schwelle (0-5 Punkte)
  if (bufferFromLower >= 0 && bufferFromLower <= 5) {
    return { trafficLight: 'yellow', buffer: Math.round(bufferFromLower * 10) / 10 };
  }

  // Rot: Unter Schwelle (sollte nicht passieren wenn careLevel gesetzt)
  return { trafficLight: 'red', buffer: Math.round(bufferFromLower * 10) / 10 };
}

/**
 * Leistungen berechnen
 */
function calculateBenefits(careLevel: number | null): {
  monthlyAmount: number;
  reliefBudget: number;
  additionalBenefits: string[];
} {
  if (!careLevel || careLevel === 0) {
    return {
      monthlyAmount: 0,
      reliefBudget: 0,
      additionalBenefits: [],
    };
  }

  const benefits = CARE_BENEFITS[careLevel as keyof typeof CARE_BENEFITS];
  const additionalBenefits: string[] = [];

  if (careLevel >= 2) {
    additionalBenefits.push('Pflegehilfsmittel: 42 €/Monat');
    additionalBenefits.push('Wohnraumanpassung: bis 4.180 €');
  }

  if (careLevel >= 1) {
    additionalBenefits.push('Entlastungsbudget: bis 3.539 €/Jahr');
    additionalBenefits.push('Verhinderungspflege: bis 42 Tage/Jahr');
  }

  if (careLevel >= 4) {
    additionalBenefits.push('Zuschuss Verhinderungspflege: bis 1.685 €/Jahr');
  }

  return {
    monthlyAmount: benefits.monthly,
    reliefBudget: benefits.relief,
    additionalBenefits,
  };
}

/**
 * Kinder-Pflegegrad Berechnung (besondere Regeln)
 */
function calculateChildCareLevel(
  totalScore: number,
  fullScores: ModuleScores,
  weightedScores: any,
  maxOf23: number,
  missingData: boolean
): PflegegradResult {
  // Kinder haben andere Schwellen und keinen PG 1 unter 18 Monaten
  let careLevel: number | null = null;
  
  // Vereinfachte Berechnung für Kinder (würde eigentlich komplexere Logik brauchen)
  if (totalScore >= 27.0) {
    careLevel = 2;
    if (totalScore >= 47.5) careLevel = 3;
    if (totalScore >= 70.0) careLevel = 4;
    if (totalScore >= 90.0) careLevel = 5;
  }

  const { trafficLight, buffer } = calculateTrafficLight(totalScore, careLevel);
  const benefits = calculateBenefits(careLevel);

  return {
    careLevel,
    totalScore: Math.round(totalScore * 10) / 10,
    moduleScores: fullScores,
    weightedScores,
    maxOf23,
    trafficLight,
    buffer,
    missingData,
    benefits,
  };
}

/**
 * Widerspruch-Chancen berechnen
 */
export function calculateWiderspruchChance(
  currentLevel: number,
  expectedLevel: number,
  scores: ModuleScores
): { chance: 'high' | 'medium' | 'low'; reason: string } {
  const scoreDiff = expectedLevel - currentLevel;
  
  // Hohe Chance: Nur 1 Level Unterschied und gute Daten
  if (scoreDiff === 1 && scores[4] > 40) {
    return {
      chance: 'high',
      reason: 'Nur 1 Level Unterschied, starke Selbstversorgungs-Einschränkungen (40% Gewichtung)',
    };
  }

  // Mittlere Chance: 1-2 Level oder knappe Daten
  if (scoreDiff <= 2 && (scores[2] > 10 || scores[3] > 10)) {
    return {
      chance: 'medium',
      reason: 'Mögliche Verbesserung durch vollständige Begutachtung aller Module',
    };
  }

  // Geringe Chance: Große Lücke oder fehlende Daten
  return {
    chance: 'low',
    reason: 'Größerer Unterschied - erfolgreich wenn neue medizinische Entwicklungen vorliegen',
  };
}

/**
 * MD-Vorbereitung Checkliste
 */
export function getMDPreparationChecklist(): string[] {
  return [
    'Alle Medikamente bereitlegen',
    'Ärztliche Berichte parat haben',
    'Pflegeprotokoll/Tagebuch aktuell (letzte 4 Wochen)',
    'Zeitaufwand dokumentiert: Wie lange dauert was?',
    'Häufigkeiten notiert: Wie oft pro Tag?',
    'Schlechte Tage beschreiben (nicht die guten!)',
    'Fragen vorbereitet',
    'Unterlagen sortiert: Arztberichte, Rezepte, Labor',
    'Begleitung organisiert',
    'Notizblock für eigene Notizen',
  ];
}

/**
 * Frageliste für MD-Gespräch
 */
export function getMDQuestionnaire(): { module: number; question: string; tip: string }[] {
  return [
    {
      module: 1,
      question: 'Wie gut kann die pflegebedürftige Person alleine aufstehen und zu Bett gehen?',
      tip: 'Schlechte Tage beschreiben - nicht die guten!',
    },
    {
      module: 1,
      question: 'Gibt es Probleme beim Treppensteigen?',
      tip: 'Auch innere Treppen im Haus zählen!',
    },
    {
      module: 2,
      question: 'Gibt es Probleme mit dem Gedächtnis oder der Orientierung?',
      tip: 'Demenz, Alzheimer, Verwirrtheit',
    },
    {
      module: 2,
      question: 'Kann die Person alleine Entscheidungen treffen?',
      tip: 'Kognition = Verstand, nicht nur Körper',
    },
    {
      module: 3,
      question: 'Gibt es Schlafstörungen oder nächtliche Probleme?',
      tip: 'Durchschlafstörungen, Wandern, Rufen',
    },
    {
      module: 4,
      question: 'Wie lange dauert das Waschen/Körperpflege täglich?',
      tip: 'ZEIT angeben: >20 Min = wichtig!',
    },
    {
      module: 4,
      question: 'Wie lange dauert das An- und Auskleiden?',
      tip: 'Täglich 3x = wichtig!',
    },
    {
      module: 4,
      question: 'Gibt es Probleme beim Essen und Trinken?',
      tip: 'Hilfe beim Kauen, Schlucken, Zubereiten?',
    },
    {
      module: 5,
      question: 'Müssen Medikamente vorbereitet oder kontrolliert werden?',
      tip: 'Dosieren, Spritzen, Blutzucker messen',
    },
    {
      module: 5,
      question: 'Gibt es spezielle medizinische Maßnahmen?',
      tip: 'Wundversorgung, Beatmung, Sondenkost',
    },
  ];
}
