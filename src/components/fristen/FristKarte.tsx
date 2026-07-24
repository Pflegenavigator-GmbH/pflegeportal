// src/components/fristen/FristKarte.tsx
import { format } from 'date-fns';

import type { Frist } from '@/src/lib/widerspruch/fristen';
import styles from '@/src/styles/fristen.module.css';

import { AMPEL_KLASSE } from './ampel';
import { AmpelBadge } from './AmpelBadge';

/** Eine Frist mit Rechtsgrundlage, Anker- und Enddatum sowie Ampelstatus. */
export function FristKarte({ frist }: { frist: Frist }) {
  const istWartefrist = frist.art === 'wartefrist';

  return (
    <li className={`${styles.karte} ${AMPEL_KLASSE[frist.ampelStatus]}`}>
      <div className={styles.kartenKopf}>
        <span className={styles.kartenTitel}>
          <span className={styles.bezeichnung}>{frist.bezeichnung}</span>
          <span className={styles.gesetz}>{frist.gesetz}</span>
        </span>
        <AmpelBadge frist={frist} />
      </div>

      <dl className={styles.daten}>
        <div className={styles.datenPaar}>
          <dt className={styles.datenLabel}>{frist.ankerBezeichnung}</dt>
          <dd className={styles.datenWert}>{format(frist.startDatum, 'dd.MM.yyyy')}</dd>
        </div>
        <div className={styles.datenPaar}>
          <dt className={styles.datenLabel}>
            {istWartefrist ? 'Wartezeit endet am' : 'Wirksames Fristende'}
          </dt>
          <dd className={`${styles.datenWert} ${styles.datenWertBetont}`}>
            {format(frist.fristEndeWerktag, 'dd.MM.yyyy')}
          </dd>
        </div>
      </dl>

      <p className={styles.hinweis}>{frist.hinweis}</p>
    </li>
  );
}
