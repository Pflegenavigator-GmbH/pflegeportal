// src/lib/pflegegrad/kinder.ts
// Fachlogik des Kinder-Assessments nach SGB XI (Issue #29).
//
// Rechtlicher Rahmen:
// - § 14/15 SGB XI: Pflegebedürftigkeit wird bei Kindern durch den Vergleich
//   mit altersentsprechend entwickelten Kindern ermittelt (§ 15 Abs. 6).
// - § 15 Abs. 7 SGB XI (Sonderregel < 18 Monate): Kinder bis 18 Monate werden
//   pauschal einen Pflegegrad höher eingestuft (12,5–<27 → PG 2, 27–<47,5 →
//   PG 3, 47,5–<70 → PG 4, ab 70 → PG 5). Pflegegrad 1 ist ausgeschlossen.
//   Bewertet werden bei ihnen nur die altersunabhängigen Bereiche:
//   Verhaltensweisen (Modul 3), krankheits-/therapiebedingte Anforderungen
//   (Modul 5) sowie krankheitsspezifische Ernährungsprobleme (aus Modul 4).
//
// Dieses Assessment ist eine Orientierungshilfe: Die Modulgewichte (10/15/15/
// 40/20/15) und das Höchstwertprinzip M2/M3 entsprechen dem NBA; die
// Schweregrad-Einstufung je Modul wird aus dem Rohpunkte-Anteil abgeleitet.

import {
  careLevelFromScore as careLevelRegular,
  MODULE_WEIGHTS,
  severityFraction,
} from '@/src/lib/pflegegrad/nba';

export type AgeGroup = 'baby' | 'toddler' | 'preschool' | 'school';

/** § 15 Abs. 7 SGB XI: Grenze der Baby-Sonderregel (18 Monate) */
export const BABY_AGE_LIMIT_YEARS = 1.5;

export interface KinderQuestionOption {
  value: number;
  label: string;
  simpleLabel: string;
}

export interface KinderQuestion {
  id: string;
  text: string;
  simpleText: string;
  options: KinderQuestionOption[];
  /** Altersgruppen, in denen die Frage gestellt wird (Default: alle der Kategorie) */
  ageGroups?: AgeGroup[];
}

export interface KinderCategory {
  id: string;
  /** NBA-Modul, dem die Kategorie fachlich entspricht */
  moduleNumber: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  questions: KinderQuestion[];
  /** Altersgruppen, in denen die Kategorie überhaupt bewertet wird */
  ageGroups: AgeGroup[];
}

export interface KinderAssessmentResult {
  level: number;
  /** Gewichtete Gesamtpunkte (0–100, NBA-Skala) */
  points: number;
  maxPoints: number;
  description: string;
  /** Wurde die Sonderregel § 15 Abs. 7 SGB XI angewendet? */
  babyRuleApplied: boolean;
  /** Gewichtete Punkte je NBA-Modul (nach Höchstwertprinzip M2/M3) */
  moduleBreakdown: Record<number, number>;
}

export function getAgeGroup(age: number): AgeGroup {
  if (age < BABY_AGE_LIMIT_YEARS) return 'baby';
  if (age < 3) return 'toddler';
  if (age < 6) return 'preschool';
  return 'school';
}

const ALL_GROUPS: AgeGroup[] = ['baby', 'toddler', 'preschool', 'school'];
const AB_KLEINKIND: AgeGroup[] = ['toddler', 'preschool', 'school'];

// Wiederkehrende Antwortskalen (Werte = Rohpunkte)
const SKALA_SELBSTSTAENDIGKEIT: KinderQuestionOption[] = [
  {
    value: 0,
    label: 'Altersgerecht selbstständig',
    simpleLabel: '😊 Altersgerecht — keine zusätzliche Hilfe',
  },
  {
    value: 1,
    label: 'Überwiegend selbstständig (leichter Mehraufwand)',
    simpleLabel: '😐 Etwas mehr Hilfe als Gleichaltrige',
  },
  {
    value: 2,
    label: 'Überwiegend unselbstständig (deutlicher Mehraufwand)',
    simpleLabel: '😕 Deutlich mehr Hilfe als Gleichaltrige',
  },
  {
    value: 3,
    label: 'Unselbstständig (vollständige Übernahme)',
    simpleLabel: '😟 Vollständige Übernahme nötig',
  },
];

const SKALA_HAEUFIGKEIT: KinderQuestionOption[] = [
  { value: 0, label: 'Nie oder sehr selten', simpleLabel: '😊 Kommt (fast) nie vor' },
  {
    value: 1,
    label: 'Selten (ein- bis mehrmals wöchentlich)',
    simpleLabel: '😐 Mehrmals pro Woche',
  },
  {
    value: 3,
    label: 'Häufig (täglich oder mehrfach täglich)',
    simpleLabel: '😟 Täglich oder mehrfach täglich',
  },
];

/**
 * Vollständige Kategorien-Matrix entlang der 6 NBA-Module (§ 14 Abs. 2 SGB XI).
 * Maßstab jeder Frage ist der MEHRaufwand gegenüber einem gesunden,
 * gleichaltrigen Kind (§ 15 Abs. 6 SGB XI).
 */
export const baseCategories: KinderCategory[] = [
  {
    id: 'mobilitaet',
    moduleNumber: 1,
    name: 'Bewegung & Motorik',
    ageGroups: AB_KLEINKIND,
    questions: [
      {
        id: 'k_mob_1',
        text: 'Kann das Kind sich im Raum altersentsprechend fortbewegen (Kriechen, Laufen, Drehen)?',
        simpleText: 'Wie klappt die Fortbewegung im Haus?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_mob_2',
        text: 'Kann das Kind eine stabile Sitzposition altersentsprechend halten?',
        simpleText: 'Kann Ihr Kind sicher sitzen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_mob_3',
        text: 'Kann das Kind Treppen altersentsprechend überwinden?',
        simpleText: 'Wie klappt das Treppensteigen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: ['preschool', 'school'],
      },
    ],
  },
  {
    id: 'kognition',
    moduleNumber: 2,
    name: 'Denken & Verstehen',
    ageGroups: AB_KLEINKIND,
    questions: [
      {
        id: 'k_cog_1',
        text: 'Erkennt das Kind vertraute Personen aus dem näheren Umfeld altersentsprechend?',
        simpleText: 'Erkennt Ihr Kind vertraute Personen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_cog_2',
        text: 'Versteht das Kind altersentsprechende Aufforderungen und Sachverhalte?',
        simpleText: 'Versteht Ihr Kind einfache Aufforderungen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_cog_3',
        text: 'Kann das Kind elementare Bedürfnisse altersentsprechend mitteilen (Sprache, Laute, Gesten)?',
        simpleText: 'Kann Ihr Kind sagen oder zeigen, was es braucht?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_cog_4',
        text: 'Erkennt das Kind altersentsprechend Gefahren (z.B. Straße, heiße Herdplatte)?',
        simpleText: 'Wie gut erkennt Ihr Kind Gefahren?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: ['preschool', 'school'],
      },
    ],
  },
  {
    id: 'verhalten',
    moduleNumber: 3,
    name: 'Verhalten & psychische Problemlagen',
    // Altersunabhängig — auch bei Kindern unter 18 Monaten zu bewerten
    ageGroups: ALL_GROUPS,
    questions: [
      {
        id: 'k_ver_1',
        text: 'Kommt es zu ausgeprägter nächtlicher Unruhe (über das altersübliche Maß hinaus)?',
        simpleText: 'Gibt es außergewöhnliche nächtliche Unruhe?',
        options: SKALA_HAEUFIGKEIT,
      },
      {
        id: 'k_ver_2',
        text: 'Zeigt das Kind selbstschädigendes oder autoaggressives Verhalten?',
        simpleText: 'Verletzt sich Ihr Kind selbst (z.B. Kopf schlagen, Kratzen)?',
        options: SKALA_HAEUFIGKEIT,
      },
      {
        id: 'k_ver_3',
        text: 'Wehrt das Kind pflegerische oder medizinische Maßnahmen massiv ab?',
        simpleText: 'Wehrt sich Ihr Kind stark gegen Pflege oder Medizin?',
        options: SKALA_HAEUFIGKEIT,
      },
    ],
  },
  {
    id: 'selbstversorgung',
    moduleNumber: 4,
    name: 'Ernährung & Selbstversorgung',
    ageGroups: ALL_GROUPS,
    questions: [
      {
        // Krankheitsspezifische Ernährungsprobleme — als einziges M4-Kriterium
        // auch bei Kindern unter 18 Monaten relevant (§ 15 Abs. 7 SGB XI)
        id: 'k_sel_1',
        text: 'Bestehen krankheitsbedingte Probleme bei der Nahrungsaufnahme (Schluckstörungen, Sonde, parenterale Ernährung)?',
        simpleText: 'Wie klappt das Essen und Trinken?',
        options: [
          {
            value: 0,
            label: 'Altersentsprechend, keine medizinischen Besonderheiten',
            simpleLabel: '😊 Ohne medizinische Besonderheiten',
          },
          {
            value: 2,
            label: 'Deutlich erhöhter Zeitaufwand oder Hilfsmittel',
            simpleLabel: '😐 Essen dauert sehr lange / Hilfsmittel nötig',
          },
          {
            value: 3,
            label: 'Sondenernährung / parenterale Ernährung / schwere Störung',
            simpleLabel: '😟 Aufwendige Unterstützung bei jeder Mahlzeit',
          },
        ],
      },
      {
        id: 'k_sel_2',
        text: 'Besteht bei der Körperpflege (Waschen, Baden, Zähne) ein Mehraufwand gegenüber Gleichaltrigen?',
        simpleText: 'Braucht Ihr Kind beim Waschen mehr Hilfe als Gleichaltrige?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: AB_KLEINKIND,
      },
      {
        id: 'k_sel_3',
        text: 'Besteht beim An- und Auskleiden ein Mehraufwand gegenüber Gleichaltrigen?',
        simpleText: 'Wie klappt das An- und Ausziehen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: AB_KLEINKIND,
      },
      {
        id: 'k_sel_4',
        text: 'Bestehen beim Toilettengang bzw. bei den Ausscheidungen Einschränkungen über das altersübliche Maß hinaus?',
        simpleText: 'Wie klappt der Toilettengang im Vergleich zu Gleichaltrigen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: ['preschool', 'school'],
      },
    ],
  },
  {
    id: 'krankheitsbewaeltigung',
    moduleNumber: 5,
    name: 'Umgang mit Krankheit & Therapie',
    // Altersunabhängig — auch bei Kindern unter 18 Monaten zu bewerten
    ageGroups: ALL_GROUPS,
    questions: [
      {
        id: 'k_kra_1',
        text: 'Ist eine regelmäßige Medikamentengabe erforderlich?',
        simpleText: 'Wie oft müssen Medikamente gegeben werden?',
        options: SKALA_HAEUFIGKEIT,
      },
      {
        id: 'k_kra_2',
        text: 'Sind medizinische Maßnahmen erforderlich (Injektionen, Inhalation, Absaugen, Messungen)?',
        simpleText: 'Sind Spritzen, Inhalationen oder Messungen nötig?',
        options: SKALA_HAEUFIGKEIT,
      },
      {
        id: 'k_kra_3',
        text: 'Sind zeit- und aufwandsintensive Arzt- oder Therapiebesuche erforderlich?',
        simpleText: 'Wie häufig sind Arzt- oder Therapietermine?',
        options: SKALA_HAEUFIGKEIT,
      },
      {
        id: 'k_kra_4',
        text: 'Sind Verbandswechsel oder die Versorgung mit körpernahen Hilfsmitteln (Orthesen, Stoma) erforderlich?',
        simpleText: 'Sind Verbände oder Hilfsmittel zu versorgen?',
        options: SKALA_HAEUFIGKEIT,
      },
    ],
  },
  {
    id: 'alltag',
    moduleNumber: 6,
    name: 'Alltag & soziale Kontakte',
    ageGroups: AB_KLEINKIND,
    questions: [
      {
        id: 'k_all_1',
        text: 'Kann das Kind seinen Tagesablauf altersentsprechend mitgestalten (Rituale, Übergänge)?',
        simpleText: 'Wie klappt der Tagesablauf (Aufstehen, Essen, Schlafen)?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_all_2',
        text: 'Kann sich das Kind altersentsprechend allein beschäftigen (Spielen)?',
        simpleText: 'Kann sich Ihr Kind eine Zeit lang allein beschäftigen?',
        options: SKALA_SELBSTSTAENDIGKEIT,
      },
      {
        id: 'k_all_3',
        text: 'Kann das Kind altersentsprechend Kontakt zu anderen Kindern aufnehmen und halten?',
        simpleText: 'Wie klappt der Kontakt zu anderen Kindern?',
        options: SKALA_SELBSTSTAENDIGKEIT,
        ageGroups: ['preschool', 'school'],
      },
    ],
  },
];

/**
 * Liefert die für das Alter relevanten Kategorien und Fragen.
 * Kinder < 18 Monate: nur die altersunabhängigen Bereiche (M3, M5 sowie
 * Ernährung aus M4) — alles andere ist in diesem Alter naturgemäß
 * unselbstständig und darf nicht gewertet werden (§ 15 Abs. 6/7 SGB XI).
 */
export function getAssessmentCategories(age: number): KinderCategory[] {
  const ageGroup = getAgeGroup(age);

  return baseCategories
    .filter((cat) => cat.ageGroups.includes(ageGroup))
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter((q) => !q.ageGroups || q.ageGroups.includes(ageGroup)),
    }))
    .filter((cat) => cat.questions.length > 0);
}

/** Schwellen § 15 Abs. 7 SGB XI (< 18 Monate): ein Grad höher, kein PG 1 */
const THRESHOLDS_BABY = [
  { level: 5, min: 70 },
  { level: 4, min: 47.5 },
  { level: 3, min: 27 },
  { level: 2, min: 12.5 },
];

/** Reine Schwellenwert-Einstufung — separat exportiert für Tests und Wiederverwendung */
export function careLevelFromScore(points: number, age: number): number {
  if (age < BABY_AGE_LIMIT_YEARS) {
    return THRESHOLDS_BABY.find((t) => points >= t.min)?.level ?? 0;
  }
  // Regelfall: gemeinsame amtliche Schwellen aus dem NBA-Kernmodell
  return careLevelRegular(points);
}

function describeResult(level: number, babyRuleApplied: boolean): string {
  if (level === 0) {
    return babyRuleApplied
      ? 'Kein Pflegegrad nachweisbar. Entwicklungsstand engmaschig dokumentieren und bei Verschlechterung neu bewerten.'
      : 'Kein Pflegegrad erreicht. Bei Verschlechterung die Einschätzung wiederholen.';
  }

  const base: Record<number, string> = {
    1: 'Pflegegrad 1 — Geringe Beeinträchtigungen der Selbstständigkeit.',
    2: 'Pflegegrad 2 — Erhebliche Beeinträchtigungen der Selbstständigkeit.',
    3: 'Pflegegrad 3 — Schwere Beeinträchtigungen der Selbstständigkeit.',
    4: 'Pflegegrad 4 — Schwerste Beeinträchtigungen der Selbstständigkeit.',
    5: 'Pflegegrad 5 — Schwerste Beeinträchtigungen mit besonderen Anforderungen an die Versorgung.',
  };

  return babyRuleApplied
    ? `${base[level]} Enthält bereits die gesetzliche Höherstufung für Kinder unter 18 Monaten (§ 15 Abs. 7 SGB XI).`
    : base[level];
}

/**
 * Wertet die Antworten (frageId → Rohpunkte) nach dem NBA-Schema aus:
 * je Modul Rohpunkte-Anteil → Schweregrad → gewichtete Punkte, dann
 * Höchstwertprinzip für M2/M3, Summe (max. 100) und Schwellenwerte —
 * für Kinder < 18 Monate die verschobenen Schwellen des § 15 Abs. 7 SGB XI.
 */
export function calculateChildAssessment(
  answers: Record<string, number>,
  age: number
): KinderAssessmentResult {
  const categories = getAssessmentCategories(age);
  const babyRuleApplied = age < BABY_AGE_LIMIT_YEARS;

  // Gewichtete Punkte je Modul aus dem Rohpunkte-Anteil ableiten
  const weighted: Record<number, number> = {};
  for (const cat of categories) {
    const raw = cat.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const maxRaw = cat.questions.reduce(
      (sum, q) => sum + Math.max(...q.options.map((o) => o.value)),
      0
    );
    weighted[cat.moduleNumber] = MODULE_WEIGHTS[cat.moduleNumber] * severityFraction(raw, maxRaw);
  }

  // Höchstwertprinzip: Von M2 (Kognition) und M3 (Verhalten) zählt nur der höhere Wert
  const maxOf23 = Math.max(weighted[2] ?? 0, weighted[3] ?? 0);
  const moduleBreakdown: Record<number, number> = {
    1: weighted[1] ?? 0,
    2: weighted[2] ?? 0,
    3: weighted[3] ?? 0,
    4: weighted[4] ?? 0,
    5: weighted[5] ?? 0,
    6: weighted[6] ?? 0,
  };

  const total =
    Math.round(
      (moduleBreakdown[1] +
        maxOf23 +
        moduleBreakdown[4] +
        moduleBreakdown[5] +
        moduleBreakdown[6]) *
        10
    ) / 10;

  const level = careLevelFromScore(total, age);

  return {
    level,
    points: total,
    maxPoints: 100,
    description: describeResult(level, babyRuleApplied),
    babyRuleApplied,
    moduleBreakdown,
  };
}
