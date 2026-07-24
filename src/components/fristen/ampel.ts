// src/components/fristen/ampel.ts
/**
 * Darstellungs-Mapping der Fristen-Ampel: Statusklasse, Symbol und Klartext.
 *
 * Bewusst getrennt von der Berechnung (src/lib/widerspruch/fristen.ts) —
 * die Engine liefert Fakten, hier entsteht ausschließlich Präsentation.
 */
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hourglass,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import type { AmpelStatus, Frist } from '@/src/lib/widerspruch/fristen';
import styles from '@/src/styles/fristen.module.css';

/** Setzt die lokalen --ampel-*-Variablen des CSS-Moduls. */
export const AMPEL_KLASSE: Record<AmpelStatus, string> = {
  gruen: styles.statusGruen,
  gelb: styles.statusGelb,
  rot: styles.statusRot,
  wartend: styles.statusWartend,
  abgelaufen: styles.statusAbgelaufen,
};

/** Zweiter, farbunabhängiger Bedeutungsträger neben dem Text (WCAG 1.4.1). */
export const AMPEL_ICON: Record<AmpelStatus, LucideIcon> = {
  gruen: CheckCircle2,
  gelb: Clock,
  rot: AlertTriangle,
  wartend: Hourglass,
  abgelaufen: XCircle,
};

/**
 * Klartext zum Status. Trägt Dringlichkeit und Restzeit auch ohne Farbe und
 * unterscheidet ablaufende Fristen von Wartezeiten, die gegenläufig wirken.
 */
export function ampelText(frist: Frist): string {
  const tage = frist.verbleibendeTage;

  if (frist.art === 'wartefrist') {
    if (frist.istVerfuegbar) return 'Jetzt möglich';
    if (tage === 0) return 'Ab morgen möglich';
    return `Noch ${tage} Tage Wartezeit`;
  }

  if (frist.istAbgelaufen) {
    const tageSeit = Math.abs(tage);
    return tageSeit === 1 ? 'Seit 1 Tag abgelaufen' : `Seit ${tageSeit} Tagen abgelaufen`;
  }

  if (tage === 0) return 'Letzter Tag — heute';
  if (frist.ampelStatus === 'rot')
    return tage === 1 ? 'Dringend — 1 Tag' : `Dringend — ${tage} Tage`;
  if (tage === 1) return 'Noch 1 Tag';
  return `Noch ${tage} Tage`;
}
