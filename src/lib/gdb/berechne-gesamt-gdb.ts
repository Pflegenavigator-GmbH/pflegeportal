// src/lib/gdb/berechne-gesamt-gdb.ts

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
