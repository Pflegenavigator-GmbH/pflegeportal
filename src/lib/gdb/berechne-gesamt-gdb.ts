// src/lib/gdb/berechne-gesamt-gdb.ts

import { verguenstigungenKatalog } from '@/src/app/[locale]/gdb/_constants/verguenstigungen';

export function berechneGesamtGdB(selektierteWerte: Record<string, number>) {
  const werteListe = Object.values(selektierteWerte).filter((w) => w > 0);

  if (werteListe.length === 0) {
    return { gdb: 0, vorteile: [] };
  }

  werteListe.sort((a, b) => b - a);
  let gesamtGdB = werteListe[0];

  for (let i = 1; i < werteListe.length; i++) {
    const folgeGdB = werteListe[i];
    if (folgeGdB >= 20) gesamtGdB += 10;
  }

  gesamtGdB = Math.min(100, Math.round(gesamtGdB / 10) * 10);

  const vorteile = verguenstigungenKatalog.filter((v) => gesamtGdB >= v.minGdb).map((v) => v.text);

  return { gdb: gesamtGdB, vorteile };
}
