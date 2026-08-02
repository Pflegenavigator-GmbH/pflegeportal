// src/lib/pflegegrad/ergebnis-storage.ts
/**
 * Fallgebundener Zugriff auf das lokal gespeicherte Pflegegrad-Ergebnis.
 *
 * Warum eine eigene Schicht statt `localStorage.getItem` an Ort und Stelle:
 * Der Eintrag trug bisher keine Fallnummer. Die Startseite prüfte nur, OB ein
 * Ergebnis existiert, und leitete auf die Ergebnisseite um — unabhängig davon,
 * zu wem es gehörte. Wer Fall B öffnete, während Fall A noch im Speicher lag,
 * sah den Pflegegrad einer fremden Person.
 *
 * Das Aufräumen beim Fallwechsel (`storeCaseCode`) verhindert das inzwischen.
 * Aber diese Zusicherung hinge allein an einer Invariante — „jeder Fallwechsel
 * geht durch storeCaseCode" —, die ein künftiger Codepfad still brechen kann.
 * Deshalb steht der Fallbezug hier IM Datum: Passt er nicht, gilt der Eintrag
 * als nicht vorhanden und wird entfernt. Ein gebrochenes Aufräumen führt dann
 * zu einem fehlenden Ergebnis statt zu einem falschen.
 */
import { ERGEBNIS_KEY, getStoredCaseCode } from '@/src/lib/case-storage';

/** Die Nutzdaten, die die Kinder-Begutachtung ablegt. */
export interface ErgebnisNutzdaten {
  careLevel: number;
  totalScore: number;
  benefits: {
    monthlyAmount: number;
    reliefBudget: number;
  };
}

/** Was tatsächlich im Speicher liegt — Nutzdaten plus Fallbezug. */
interface GespeichertesErgebnis extends ErgebnisNutzdaten {
  fallCode: string;
}

function istGueltig(wert: unknown): wert is GespeichertesErgebnis {
  if (typeof wert !== 'object' || wert === null) return false;
  const e = wert as Record<string, unknown>;
  return typeof e.fallCode === 'string' && typeof e.careLevel === 'number';
}

/**
 * Legt das Ergebnis für den aktuell geladenen Fall ab.
 *
 * Ohne aktiven Fall passiert nichts: Ein Ergebnis ohne Zuordnung wäre beim
 * Lesen ohnehin wertlos und würde nur als Altlast liegen bleiben.
 */
export function speichereErgebnis(nutzdaten: ErgebnisNutzdaten): void {
  const fallCode = getStoredCaseCode();
  if (!fallCode) return;

  const eintrag: GespeichertesErgebnis = { ...nutzdaten, fallCode };
  localStorage.setItem(ERGEBNIS_KEY, JSON.stringify(eintrag));
}

/**
 * Liest das Ergebnis — aber nur, wenn es zum aktuell geladenen Fall gehört.
 *
 * Ein Eintrag eines anderen Falls wird nicht bloß ignoriert, sondern gelöscht.
 * Selbstheilung: Sollte das Aufräumen beim Fallwechsel jemals ausfallen,
 * korrigiert der Lesepfad die Altlast, statt sie mitzuschleppen.
 */
export function ladeErgebnis(): ErgebnisNutzdaten | null {
  if (typeof window === 'undefined') return null;

  const roh = localStorage.getItem(ERGEBNIS_KEY);
  if (!roh) return null;

  let geparst: unknown;
  try {
    geparst = JSON.parse(roh);
  } catch {
    localStorage.removeItem(ERGEBNIS_KEY);
    return null;
  }

  const aktuellerFall = getStoredCaseCode();
  if (!istGueltig(geparst) || !aktuellerFall || geparst.fallCode !== aktuellerFall) {
    localStorage.removeItem(ERGEBNIS_KEY);
    return null;
  }

  return {
    careLevel: geparst.careLevel,
    totalScore: geparst.totalScore,
    benefits: geparst.benefits,
  };
}

/** Gibt es ein Ergebnis für den aktuell geladenen Fall? */
export function hatErgebnisFuerAktuellenFall(): boolean {
  return ladeErgebnis() !== null;
}

/** Entfernt das Ergebnis (z.B. beim Zurücksetzen der Begutachtung). */
export function entferneErgebnis(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ERGEBNIS_KEY);
}
