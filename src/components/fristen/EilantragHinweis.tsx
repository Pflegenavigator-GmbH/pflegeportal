// src/components/fristen/EilantragHinweis.tsx
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

import { EILANTRAG_RECHTSGRUNDLAGEN, type Frist } from '@/src/lib/widerspruch/fristen';
import styles from '@/src/styles/fristen.module.css';

import { ampelText } from './ampel';

/**
 * Prominenter Warnhinweis, sobald eine Ausschlussfrist im roten Bereich liegt.
 *
 * `role="alert"` sorgt dafür, dass Screenreader die Warnung beim Erscheinen
 * ansagen — sie taucht erst nach der Berechnung auf und würde sonst überlesen.
 */
export function EilantragHinweis({ frist }: { frist: Frist }) {
  return (
    <div className={styles.warnung} role="alert">
      <AlertTriangle className={styles.warnungIcon} size={22} aria-hidden="true" />

      <div className={styles.warnungInhalt}>
        <h4 className={styles.warnungTitel}>
          {frist.kurz}: {ampelText(frist)}
        </h4>

        <p className={styles.warnungText}>
          Die Frist für „{frist.bezeichnung}“ endet am{' '}
          <strong>{format(frist.fristEndeWerktag, 'dd.MM.yyyy')}</strong> ({frist.gesetz}).
          Maßgeblich ist der Eingang bei der Behörde, nicht das Absendedatum — senden Sie das
          Schreiben deshalb per Fax oder Einwurf-Einschreiben und bewahren Sie den Sendenachweis
          auf. Ein zunächst unbegründeter Widerspruch wahrt die Frist; die Begründung können Sie
          nachreichen.
        </p>

        <ul className={styles.rechtsgrundlagen}>
          {Object.values(EILANTRAG_RECHTSGRUNDLAGEN).map((grundlage) => (
            <li key={grundlage.gesetz} className={styles.rechtsgrundlage}>
              <span className={styles.paragraf}>{grundlage.gesetz}</span>
              {grundlage.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
