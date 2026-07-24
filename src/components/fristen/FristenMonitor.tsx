// src/components/fristen/FristenMonitor.tsx
import { Info } from 'lucide-react';

import type { FristenUebersicht } from '@/src/lib/widerspruch/fristen';
import styles from '@/src/styles/fristen.module.css';

import { EilantragHinweis } from './EilantragHinweis';
import { FristKarte } from './FristKarte';

/**
 * Übersicht aller berechenbaren Verfahrensfristen, nach Dringlichkeit sortiert,
 * mit vorangestelltem Warnhinweis bei kritischer Frist.
 *
 * Rein darstellend: die Berechnung liefert `berechneFristen` aus
 * src/lib/widerspruch/fristen.ts.
 */
export function FristenMonitor({ uebersicht }: { uebersicht: FristenUebersicht }) {
  if (uebersicht.fristen.length === 0) {
    return (
      <p className={styles.leer}>
        <Info className={styles.leerIcon} size={18} aria-hidden="true" />
        <span>
          Sobald ein Datum erfasst ist, berechnet der Monitor die zugehörigen Fristen und zeigt den
          Status an.
        </span>
      </p>
    );
  }

  return (
    <div className={styles.monitor}>
      {uebersicht.kritischeFrist && <EilantragHinweis frist={uebersicht.kritischeFrist} />}

      <ol className={styles.liste}>
        {uebersicht.fristen.map((frist) => (
          <FristKarte key={frist.typ} frist={frist} />
        ))}
      </ol>
    </div>
  );
}
