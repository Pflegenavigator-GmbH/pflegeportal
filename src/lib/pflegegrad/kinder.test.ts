// src/lib/pflegegrad/kinder.test.ts
// Tests zu Issue #29: Vollständige Kinder-Matrix SGB XI
// inkl. Sonderregel für Kinder < 18 Monate (§ 15 Abs. 7 SGB XI)
import { describe, it, expect } from 'vitest';

import {
  BABY_AGE_LIMIT_YEARS,
  baseCategories,
  calculateChildAssessment,
  careLevelFromScore,
  getAgeGroup,
  getAssessmentCategories,
  KinderCategory,
} from './kinder';

/** Baut ein Antwortobjekt, das für jede Frage der Kategorien den Maximalwert wählt */
function maxAnswers(categories: KinderCategory[]): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const cat of categories) {
    for (const q of cat.questions) {
      answers[q.id] = Math.max(...q.options.map((o) => o.value));
    }
  }
  return answers;
}

describe('getAgeGroup', () => {
  it('ordnet die Altersgrenzen korrekt zu', () => {
    expect(getAgeGroup(0)).toBe('baby');
    expect(getAgeGroup(1.49)).toBe('baby');
    expect(getAgeGroup(BABY_AGE_LIMIT_YEARS)).toBe('toddler');
    expect(getAgeGroup(2.99)).toBe('toddler');
    expect(getAgeGroup(3)).toBe('preschool');
    expect(getAgeGroup(5.99)).toBe('preschool');
    expect(getAgeGroup(6)).toBe('school');
    expect(getAgeGroup(17)).toBe('school');
  });
});

describe('baseCategories — Vollständigkeit (Akzeptanzkriterium)', () => {
  it('deckt alle sechs NBA-Module ab', () => {
    const moduleNumbers = baseCategories.map((c) => c.moduleNumber).sort();
    expect(moduleNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('hat eindeutige Frage-IDs über alle Kategorien', () => {
    const ids = baseCategories.flatMap((c) => c.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('bietet für jede Frage mindestens zwei unterscheidbare Optionen inkl. 0 (kein Mehraufwand)', () => {
    for (const cat of baseCategories) {
      for (const q of cat.questions) {
        const values = q.options.map((o) => o.value);
        expect(values.length).toBeGreaterThanOrEqual(2);
        expect(new Set(values).size).toBe(values.length);
        expect(Math.min(...values)).toBe(0);
      }
    }
  });
});

describe('getAssessmentCategories — Altersdifferenzierung', () => {
  it('liefert für Kinder ab 18 Monaten alle sechs Module', () => {
    for (const age of [BABY_AGE_LIMIT_YEARS, 3, 6, 12]) {
      const moduleNumbers = getAssessmentCategories(age).map((c) => c.moduleNumber);
      expect(moduleNumbers).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('bewertet bei Kindern < 18 Monaten nur die altersunabhängigen Bereiche (M3, M4-Ernährung, M5)', () => {
    const categories = getAssessmentCategories(1);
    const moduleNumbers = categories.map((c) => c.moduleNumber);
    expect(moduleNumbers).toEqual([3, 4, 5]);

    // Aus Modul 4 verbleibt nur die krankheitsspezifische Ernährung
    const m4 = categories.find((c) => c.moduleNumber === 4);
    expect(m4?.questions.map((q) => q.id)).toEqual(['k_sel_1']);
  });

  it('stellt altersabhängige Einzelfragen erst ab der passenden Gruppe', () => {
    const toddler = getAssessmentCategories(2);
    const school = getAssessmentCategories(8);

    const toddlerIds = toddler.flatMap((c) => c.questions.map((q) => q.id));
    const schoolIds = school.flatMap((c) => c.questions.map((q) => q.id));

    // Treppensteigen, Gefahrenbewusstsein, Toilettengang, Kinderkontakte erst ab Vorschulalter
    for (const id of ['k_mob_3', 'k_cog_4', 'k_sel_4', 'k_all_3']) {
      expect(toddlerIds).not.toContain(id);
      expect(schoolIds).toContain(id);
    }
  });

  it('liefert nie eine Kategorie ohne Fragen', () => {
    for (const age of [0.5, 2, 4, 10]) {
      for (const cat of getAssessmentCategories(age)) {
        expect(cat.questions.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('careLevelFromScore — Schwellenwerte § 15 Abs. 3 SGB XI (ab 18 Monaten)', () => {
  it.each([
    [0, 0],
    [12.4, 0],
    [12.5, 1],
    [26.9, 1],
    [27, 2],
    [47.4, 2],
    [47.5, 3],
    [69.9, 3],
    [70, 4],
    [89.9, 4],
    [90, 5],
    [100, 5],
  ])('%s Punkte → Pflegegrad %s', (points, expected) => {
    expect(careLevelFromScore(points, 3)).toBe(expected);
  });
});

describe('careLevelFromScore — Sonderregel § 15 Abs. 7 SGB XI (< 18 Monate)', () => {
  it.each([
    [0, 0],
    [12.4, 0],
    [12.5, 2], // eine Stufe höher als der Regelfall (PG 1)
    [26.9, 2],
    [27, 3],
    [47.4, 3],
    [47.5, 4],
    [69.9, 4],
    [70, 5],
    [100, 5],
  ])('%s Punkte → Pflegegrad %s', (points, expected) => {
    expect(careLevelFromScore(points, 1)).toBe(expected);
  });

  it('kann niemals Pflegegrad 1 ergeben', () => {
    for (let p = 0; p <= 100; p += 0.5) {
      expect(careLevelFromScore(p, 1)).not.toBe(1);
    }
  });

  it('greift exakt bis zur 18-Monats-Grenze', () => {
    expect(careLevelFromScore(12.5, 1.49)).toBe(2); // Baby-Regel
    expect(careLevelFromScore(12.5, BABY_AGE_LIMIT_YEARS)).toBe(1); // Regelfall
  });
});

describe('calculateChildAssessment — Integration', () => {
  it('ergibt ohne Beeinträchtigungen keinen Pflegegrad', () => {
    const result = calculateChildAssessment({}, 4);
    expect(result.level).toBe(0);
    expect(result.points).toBe(0);
    expect(result.babyRuleApplied).toBe(false);
  });

  it('ergibt bei maximalen Beeinträchtigungen (ab 18 Monaten) Pflegegrad 5 mit 100 Punkten', () => {
    const categories = getAssessmentCategories(8);
    const result = calculateChildAssessment(maxAnswers(categories), 8);
    expect(result.points).toBe(100);
    expect(result.level).toBe(5);
  });

  it('erreicht auch bei Babys mit maximalen Beeinträchtigungen Pflegegrad 5', () => {
    // Nur M3 (15) + M4 (40) + M5 (20) = 75 gewichtete Punkte möglich —
    // die Abs.-7-Schwelle (ab 70 → PG 5) macht PG 5 dennoch erreichbar
    const categories = getAssessmentCategories(1);
    const result = calculateChildAssessment(maxAnswers(categories), 1);
    expect(result.points).toBe(75);
    expect(result.level).toBe(5);
    expect(result.babyRuleApplied).toBe(true);
  });

  it('wendet das Höchstwertprinzip für M2/M3 an (nur der höhere Wert zählt)', () => {
    const categories = getAssessmentCategories(8);
    const m2 = categories.find((c) => c.moduleNumber === 2)!;
    const m3 = categories.find((c) => c.moduleNumber === 3)!;

    const answersM2Max = maxAnswers([m2]);
    const answersBothMax = maxAnswers([m2, m3]);

    const onlyM2 = calculateChildAssessment(answersM2Max, 8);
    const both = calculateChildAssessment(answersBothMax, 8);

    // M3 zusätzlich maximal → Gesamtpunkte unverändert (beide Module wiegen 15)
    expect(both.points).toBe(onlyM2.points);
    expect(onlyM2.points).toBe(15);
  });

  it('ignoriert verwaiste Antwort-Keys aus einer anderen Altersgruppe', () => {
    // Antworten eines Schulkindes, danach Alter auf Baby geändert
    const schoolAnswers = maxAnswers(getAssessmentCategories(8));
    const asBaby = calculateChildAssessment(schoolAnswers, 1);
    // Nur M3 + M4(Ernährung) + M5 dürfen einfließen
    expect(asBaby.points).toBe(75);
    expect(asBaby.moduleBreakdown[1]).toBe(0);
    expect(asBaby.moduleBreakdown[6]).toBe(0);
  });

  it('kennzeichnet die Baby-Sonderregel im Ergebnis und der Beschreibung', () => {
    const categories = getAssessmentCategories(0.5);
    const result = calculateChildAssessment(maxAnswers(categories), 0.5);
    expect(result.babyRuleApplied).toBe(true);
    expect(result.description).toContain('§ 15 Abs. 7 SGB XI');
  });

  it('liefert eine Modulaufschlüsselung über alle sechs Module', () => {
    const result = calculateChildAssessment({}, 5);
    expect(Object.keys(result.moduleBreakdown).map(Number).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
