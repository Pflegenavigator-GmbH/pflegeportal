// src/components/legal/CookieEinstellungenButton.tsx
'use client';

import { oeffneEinwilligungsAuswahl } from '@/src/lib/consent';

interface Props {
  className?: string;
  children: React.ReactNode;
}

/**
 * Öffnet die Cookie-Auswahl erneut.
 *
 * Art. 7 Abs. 3 DSGVO verlangt, dass der Widerruf einer Einwilligung so
 * einfach ist wie ihre Erteilung. Ohne diesen Einstiegspunkt verschwände der
 * Banner nach der ersten Entscheidung für immer — die Zustimmung wäre dann
 * praktisch unwiderruflich.
 *
 * Bewusst eine schlanke Client-Hülle: So bleiben Footer und Datenschutzseite
 * Server-Komponenten und ziehen keinen unnötigen JavaScript-Ballast nach.
 */
export function CookieEinstellungenButton({ className, children }: Props) {
  return (
    <button type="button" className={className} onClick={oeffneEinwilligungsAuswahl}>
      {children}
    </button>
  );
}
