// src/lib/pflegegrad/scoring.ts
// Serverseitige Rohpunkte-Berechnung aus den gespeicherten Antworten.
//
// Bisher wurden die Rohpunkte im Browser aus localStorage rekonstruiert
// (gerätegebunden, manipulierbar, und Modul 6 nur als 0/1 gewertet). Diese
// Datei ist die EINZIGE Wahrheit für die Umrechnung Antwort → Rohpunkte und
// arbeitet ausschließlich auf den in der DB gespeicherten Antworten.
import { ERWARTETE_FRAGEN } from '@/src/lib/pflegegrad/fragen';
import { ModuleScores } from '@/src/types/pflegegrad';

type ScoreMap = Record<string, number>;

// Standard-NBA-Schweregradskala (Modul 1, 2, 4, 5)
const SCALE_0_3: ScoreMap = { '0': 0, '1': 1, '2': 2, '3': 3 };

// Modul 3 (Verhalten) kennt nur drei Häufigkeitsstufen: nie / selten / häufig
const SCALE_VERHALTEN: ScoreMap = { '0': 0, '1': 1, '3': 3 };

// Modul 6 (Alltagsgestaltung): qualitative Antworten → 0 (selbstständig),
// 1 (teilweise), 2 (unselbstständig). Die Fragebögen bieten je Frage genau
// drei Stufen; die Schlüssel sind über alle fünf Fragen eindeutig.
// ⚠️ FACHLICH ZU PRÜFEN: Best-Practice-Näherung an die NBA-Systematik —
// bisher wurde Modul 6 nur binär (0/1) gewertet, obwohl die Matrix Rohwerte
// bis 15 Punkte abbildet.
const SCALE_ALLTAG: ScoreMap = {
  selbst: 0,
  ja: 0,
  voll: 0,
  teilweise: 1,
  online_begleitung: 1,
  beratung: 1,
  nicht: 2,
};

const MODULE_SCORE_MAPS: Record<number, ScoreMap> = {
  1: SCALE_0_3,
  2: SCALE_0_3,
  3: SCALE_VERHALTEN,
  4: SCALE_0_3,
  5: SCALE_0_3,
  6: SCALE_ALLTAG,
};

/**
 * Summiert die Rohpunkte eines Moduls — ausschließlich aus den fachlich
 * erwarteten Fragen.
 *
 * Früher lief die Summe über `Object.values(answers)`, also über alles, was im
 * gespeicherten Objekt stand. Die API prüft Schlüssel nur auf Form (Zeichen,
 * Länge, Anzahl), nicht auf Zugehörigkeit zum Modul. Wer eine gültige
 * Fallsitzung hatte, konnte deshalb zusätzliche Schlüssel mitsenden und seine
 * Punkte beliebig hochschreiben:
 *
 *     { m1_1: '0', …, extra_1: '3', extra_2: '3', extra_3: '3' }  → 9 statt 0
 *
 * Das unterlief genau die Integrität, für die `/scores` entfernt wurde. Jetzt
 * ist `ERWARTETE_FRAGEN` maßgeblich: Was dort nicht steht, zählt nicht — egal
 * wie es in die Zeile gekommen ist. Damit sind auch beigemischte Felder
 * unschädlich, etwa die `meta_`-Stammdaten des Kinder-Assessments.
 *
 * Unbekannte Antwortwerte zählen weiterhin 0 (defensive Auswertung).
 */
export function computeModuleRawScore(
  moduleNumber: number,
  answers: Record<string, unknown>
): number {
  const map = MODULE_SCORE_MAPS[moduleNumber];
  if (!map) return 0;

  const erwartet = ERWARTETE_FRAGEN[moduleNumber];
  if (!erwartet) return 0;

  let sum = 0;
  for (const frageId of erwartet) {
    const value = answers[frageId];
    if (typeof value === 'string' && value in map) {
      sum += map[value];
    } else if (typeof value === 'number' && String(value) in map) {
      sum += map[String(value)];
    }
  }
  return sum;
}

interface StoredAnswerRow {
  module_number: number;
  answers: Record<string, unknown> | null;
}

/**
 * Baut aus den DB-Antwortzeilen die Rohpunkte je Modul (1–6).
 * Fehlende Module ergeben 0.
 */
export function computeModuleScores(rows: StoredAnswerRow[]): ModuleScores {
  const scores: ModuleScores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const row of rows) {
    if (row.module_number >= 1 && row.module_number <= 6 && row.answers) {
      scores[row.module_number as keyof ModuleScores] = computeModuleRawScore(
        row.module_number,
        row.answers
      );
    }
  }

  return scores;
}

/**
 * Ermittelt, welche der Module 1–6 noch unvollständig beantwortet sind.
 *
 * Vollständigkeit lässt sich NICHT am Punktwert ablesen: Null Punkte sind ein
 * gültiges Ergebnis — sie bedeuten volle Selbstständigkeit in allen Fragen des
 * Moduls. Die frühere Prüfung `score === 0` hat genau diese Menschen als
 * „unvollständig" geführt.
 *
 * Maßgeblich ist stattdessen, ob zu jeder erwarteten Frage eine Antwort
 * vorliegt, die die Punktetabelle des Moduls überhaupt kennt. Eine Antwort mit
 * unbekanntem Wert zählt nicht als beantwortet — sie würde sonst still mit
 * null Punkten einfließen.
 */
export function bestimmeUnvollstaendigeModule(rows: StoredAnswerRow[]): number[] {
  const antwortenJeModul = new Map<number, Record<string, unknown>>();

  for (const row of rows) {
    if (row.module_number >= 1 && row.module_number <= 6 && row.answers) {
      antwortenJeModul.set(row.module_number, row.answers);
    }
  }

  const unvollstaendig: number[] = [];

  for (const modul of [1, 2, 3, 4, 5, 6]) {
    const erwartet = ERWARTETE_FRAGEN[modul] ?? [];
    const antworten = antwortenJeModul.get(modul);

    if (!antworten) {
      unvollstaendig.push(modul);
      continue;
    }

    const map = MODULE_SCORE_MAPS[modul];
    const alleBeantwortet = erwartet.every((frageId) => {
      const wert = antworten[frageId];
      if (typeof wert === 'string') return wert in map;
      if (typeof wert === 'number') return String(wert) in map;
      return false;
    });

    if (!alleBeantwortet) unvollstaendig.push(modul);
  }

  return unvollstaendig;
}
