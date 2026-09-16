// src/lib/gdb/berechne-gesamt-gdb.ts
/**
 * ABGESCHALTET am 16.09.2026 — diese Funktion wird nicht mehr aufgerufen
 * (Issue #131, Befund B-01 des Rechtsgutachtens vom 06.09.2026).
 *
 * Die Berechnung addiert auf den höchsten Einzelwert für jeden weiteren Wert
 * ab 20 pauschal zehn Punkte und rundet auf Zehner. Die Versorgungsmedizinischen
 * Grundsätze schließen Addition und Mittelwertbildung ausdrücklich aus (Anlage
 * zu § 2 VersMedV, Teil A Nr. 3.2): Maßgeblich ist, wie sich die
 * Beeinträchtigungen zueinander verhalten — ob sie sich verstärken, unabhängig
 * nebeneinanderstehen oder sich überschneiden. Das Ergebnis wurde zudem mit
 * einer Vergünstigungsliste ausgespielt und trug damit eine Erwartung an
 * konkrete Nachteilsausgleiche.
 *
 * Code und Tests bleiben als Ausgangspunkt für die Gesamtschau erhalten (#26).
 * Wer sie wieder anschließt, braucht vorher die fachliche Abnahme aus Teil B
 * des Gutachtenauftrags. `src/app/[locale]/gdb/page.tsx` erklärt stattdessen
 * die Abschaltung.
 */

import { verguenstigungenKatalog } from '@/src/app/[locale]/gdb/_constants/verguenstigungen';
import { logger } from '@/src/lib/logger';

export function berechneGesamtGdB(selektierteWerte: Record<string, number>) {
  const werteListe = Object.values(selektierteWerte).filter((w) => w > 0);

  logger.debug(
    { eingabeWerte: selektierteWerte, gefilterteWerte: werteListe },
    'Starte GdB-Gesamtberechnung'
  );

  if (werteListe.length === 0) {
    logger.debug('Keine Werte zur Berechnung vorhanden, GdB 0 zurückgegeben');
    return { gdb: 0, vorteile: [] };
  }

  werteListe.sort((a, b) => b - a);
  let gesamtGdB = werteListe[0];

  logger.debug({ basisGdB: gesamtGdB }, 'Basis-GdB nach Sortierung gesetzt');

  for (let i = 1; i < werteListe.length; i++) {
    const folgeGdB = werteListe[i];
    if (folgeGdB >= 20) {
      gesamtGdB += 10;
      logger.debug({ folgeGdB, neuerGesamtGdB: gesamtGdB }, 'GdB-Wert addiert');
    } else {
      logger.debug({ folgeGdB }, 'Folge-GdB unter 20, wird ignoriert');
    }
  }

  gesamtGdB = Math.min(100, Math.round(gesamtGdB / 10) * 10);

  const vorteile = verguenstigungenKatalog.filter((v) => gesamtGdB >= v.minGdb).map((v) => v.text);

  logger.info(
    { finalerGdB: gesamtGdB, anzahlVorteile: vorteile.length },
    'GdB-Berechnung erfolgreich abgeschlossen'
  );

  return { gdb: gesamtGdB, vorteile };
}
