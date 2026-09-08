// src/lib/pflegegrad/modul6-optionen.test.ts
import { describe, it, expect } from 'vitest';

import de from '../../../public/locales/de/pflegegrad.json';
import en from '../../../public/locales/en/pflegegrad.json';

/**
 * Modul 6 verbindet drei Stellen, die nichts voneinander wissen:
 *
 *  1. `ALLTAGS_STRUKTUR` in der Seite legt die Optionswerte fest,
 *  2. `pflegegrad.json` liefert die Beschriftungen dazu,
 *  3. `SCALE_ALLTAG` in `scoring.ts` rechnet die Werte in Punkte um.
 *
 * Die Seite greift mit `optionen[wert].titel` direkt zu — ohne Fallback. Fehlt
 * ein Schlüssel, wirft das Rendern einen TypeError und die Seite ist tot.
 *
 * Genau das war zwischen #82 und heute der Fall: Die Seite bot bei Frage 4
 * `selbst` und bei Frage 5 `betreuung` an, die Übersetzung kannte `voll` und
 * `nicht`. Modul 6 — das letzte des Trichters — stürzte in beiden Sprachen ab.
 *
 * Die Übersetzungs-Vollständigkeitsprüfung konnte das nicht sehen: Sie
 * vergleicht Sprachen miteinander, nie den Code gegen die Sprachdateien. Und
 * der `as unknown as`-Cast in der Seite nimmt TypeScript die Möglichkeit, es
 * zu bemerken. Dieser Test schließt die Lücke.
 *
 * Die Struktur ist hier bewusst dupliziert statt importiert: Die Seite ist
 * eine Client-Komponente mit Hooks und lässt sich nicht ohne Weiteres in einen
 * reinen Modultest ziehen. Weicht sie von dieser Liste ab, muss beides
 * bewusst angefasst werden — genau das ist der Zweck.
 */
const ALLTAGS_STRUKTUR = [
  { id: 'm6_q1', optionen: ['selbst', 'teilweise', 'nicht'] },
  { id: 'm6_q2', optionen: ['ja', 'online_begleitung', 'nicht'] },
  { id: 'm6_q3', optionen: ['selbst', 'teilweise', 'nicht'] },
  { id: 'm6_q4', optionen: ['voll', 'teilweise', 'nicht'] },
  { id: 'm6_q5', optionen: ['selbst', 'beratung', 'nicht'] },
] as const;

/** Muss zu `SCALE_ALLTAG` in `scoring.ts` passen. */
const BEWERTBARE_WERTE = new Set([
  'selbst',
  'ja',
  'voll',
  'teilweise',
  'online_begleitung',
  'beratung',
  'nicht',
]);

type Fragen = Record<string, { label: string; optionen: Record<string, { titel: string }> }>;

describe('Modul 6: Optionswerte, Beschriftungen und Punktwertung', () => {
  it.each([
    ['de', de],
    ['en', en],
  ])('hat in %s zu jeder Option eine Beschriftung', (_sprache, datei) => {
    const fragen = datei.modules.modul6.questions as unknown as Fragen;

    for (const { id, optionen } of ALLTAGS_STRUKTUR) {
      expect(fragen[id], `Frage ${id} fehlt`).toBeDefined();

      for (const wert of optionen) {
        // Genau dieser Zugriff steht in der Seite — ohne Fallback.
        expect(fragen[id].optionen[wert]?.titel, `${id}.optionen.${wert} fehlt`).toBeTruthy();
      }
    }
  });

  it('bewertet jede angebotene Option mit Punkten', () => {
    for (const { id, optionen } of ALLTAGS_STRUKTUR) {
      for (const wert of optionen) {
        // Unbekannte Werte zählt `computeModuleRawScore` still als 0 — die
        // schwerste Antwort ergäbe dann null Punkte statt zwei.
        expect(BEWERTBARE_WERTE.has(wert), `${id}: „${wert}" fehlt in SCALE_ALLTAG`).toBe(true);
      }
    }
  });
});
