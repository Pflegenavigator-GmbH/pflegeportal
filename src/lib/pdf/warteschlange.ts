// src/lib/pdf/warteschlange.ts
/**
 * Begrenzt, wie viele PDF-Renderings gleichzeitig laufen (#177).
 *
 * Jedes Rendering startet eine eigene Chromium-Instanz. Auf Vercel verteilte
 * sich das über Funktionsaufrufe; auf einem einzelnen Server teilen sich alle
 * Renderings denselben Arbeitsspeicher. Zwei gleichzeitige Chromium-Instanzen
 * neben Next.js sprengen einen 2-GB-Server — und zwar nicht mit einer
 * Fehlermeldung, sondern mit dem OOM-Killer, der irgendeinen Prozess trifft.
 *
 * Deshalb: gleichzeitige Renderings begrenzen, wartende Anfragen in eine kurze
 * Schlange stellen, und ist die voll oder dauert es zu lange, sauber ablehnen.
 * Eine abgelehnte Anfrage ist ein Ergebnis; ein toter Container ist keines.
 *
 * Die Werte werden bei jedem Aufruf aus der Umgebung gelesen, nicht beim Laden
 * des Moduls: So lässt sich die Grenze am laufenden Server ändern, ohne das
 * Image neu zu bauen.
 */
import { RateLimitError } from '@/src/lib/api/errors';
import { logger } from '@/src/lib/logger';

/** Gleichzeitige Renderings. Eins ist die sichere Vorgabe für 2 GB RAM. */
const STANDARD_PARALLEL = 1;

/** Wie viele Anfragen warten dürfen, bevor abgelehnt wird. */
const STANDARD_WARTEPLAETZE = 4;

/** Wie lange eine Anfrage höchstens wartet. Die Route selbst darf 60 s. */
const STANDARD_WARTEZEIT_MS = 30_000;

function zahlAusUmgebung(name: string, standard: number): number {
  const roh = process.env[name];
  if (!roh) return standard;

  const wert = Number(roh);
  if (!Number.isFinite(wert) || wert < 1) {
    logger.warn({ name, roh }, 'Ungültiger Wert für die PDF-Warteschlange, nutze Vorgabe');
    return standard;
  }

  return Math.floor(wert);
}

interface Wartender {
  weiter: () => void;
  ablehnen: (fehler: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let laufend = 0;
const schlange: Wartender[] = [];

/** Aktueller Stand — für den Health-Endpunkt und die Diagnose. */
export function warteschlangeZustand(): { laufend: number; wartend: number; grenze: number } {
  return {
    laufend,
    wartend: schlange.length,
    grenze: zahlAusUmgebung('PDF_MAX_PARALLEL', STANDARD_PARALLEL),
  };
}

async function nimmPlatz(): Promise<void> {
  if (laufend < zahlAusUmgebung('PDF_MAX_PARALLEL', STANDARD_PARALLEL)) {
    laufend++;
    return;
  }

  if (schlange.length >= zahlAusUmgebung('PDF_MAX_WARTEPLAETZE', STANDARD_WARTEPLAETZE)) {
    logger.warn({ wartend: schlange.length }, 'PDF-Warteschlange voll, Anfrage abgelehnt');
    throw new RateLimitError('PDF-Warteschlange ausgelastet.');
  }

  return new Promise<void>((resolve, reject) => {
    const eintrag: Wartender = {
      weiter: resolve,
      ablehnen: reject,
      timer: setTimeout(
        () => {
          const platz = schlange.indexOf(eintrag);
          if (platz !== -1) schlange.splice(platz, 1);
          logger.warn('PDF-Anfrage hat zu lange auf einen Platz gewartet');
          reject(new RateLimitError('PDF-Erzeugung ist ausgelastet.'));
        },
        zahlAusUmgebung('PDF_WARTEZEIT_MS', STANDARD_WARTEZEIT_MS)
      ),
    };

    schlange.push(eintrag);
  });
}

function gibPlatzFrei(): void {
  const naechster = schlange.shift();

  if (naechster) {
    // Der Platz wird weitergereicht, `laufend` bleibt deshalb unverändert.
    clearTimeout(naechster.timer);
    naechster.weiter();
    return;
  }

  laufend = Math.max(0, laufend - 1);
}

/**
 * Führt `arbeit` aus, sobald ein Platz frei ist.
 *
 * Der Platz wird auch dann freigegeben, wenn die Arbeit mit einem Fehler
 * endet — sonst verstopft ein einziges fehlgeschlagenes Rendering die
 * Schlange dauerhaft.
 */
export async function mitPdfPlatz<T>(arbeit: () => Promise<T>): Promise<T> {
  await nimmPlatz();

  try {
    return await arbeit();
  } finally {
    gibPlatzFrei();
  }
}
