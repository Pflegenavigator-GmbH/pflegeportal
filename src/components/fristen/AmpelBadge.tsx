// src/components/fristen/AmpelBadge.tsx
import type { Frist } from '@/src/lib/widerspruch/fristen';
import styles from '@/src/styles/fristen.module.css';

import { AMPEL_ICON, AMPEL_KLASSE, ampelText } from './ampel';

/**
 * Statusplakette einer Frist: Farbe, Symbol und Klartext zugleich, damit die
 * Bedeutung auch ohne Farbwahrnehmung ankommt.
 */
export function AmpelBadge({ frist }: { frist: Frist }) {
  const Icon = AMPEL_ICON[frist.ampelStatus];

  return (
    <span className={`${styles.badge} ${AMPEL_KLASSE[frist.ampelStatus]}`}>
      <Icon className={styles.badgeIcon} size={14} aria-hidden="true" />
      {ampelText(frist)}
    </span>
  );
}
