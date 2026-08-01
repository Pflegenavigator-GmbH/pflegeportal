// src/components/analytics/Analytics.tsx
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

import { useConsent } from '@/src/hooks/useConsent';
import { verfolgeSeitenaufruf } from '@/src/lib/analytics/track';

/** Ohne Website-ID bleibt Analytics vollständig aus — kein Fehler, kein Skript. */
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

/** EU-Region der Umami-Cloud. Überschreibbar für eigenes Hosting. */
const SKRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SRC ?? 'https://eu.umami.is/script.js';

/**
 * Bindet Umami ein — ausschließlich nach erteilter Einwilligung.
 *
 * Zwei Entscheidungen, die zusammengehören:
 *
 * 1. Das Skript wird erst gerendert, wenn eingewilligt wurde. Vorher wird
 *    nichts geladen und keine Verbindung aufgebaut. Nach einem Widerruf
 *    verschwindet das Element wieder; das bereits geladene Umami bleibt zwar
 *    im Speicher, wird aber nicht mehr angesprochen (siehe `darfSenden` in
 *    track.ts).
 *
 * 2. `data-auto-track="false"`: Umamis eigene Erfassung würde die
 *    VOLLSTÄNDIGE URL melden — inklusive `?check_code=PF-XXXX-XXXX` und
 *    `?session_id=…`. Der Fallcode ist der Zugangsschlüssel zum Gutachten und
 *    hat in einem Analyse-Dienst nichts zu suchen. Deshalb melden wir
 *    Seitenaufrufe selbst und übergeben nur den Pfad. Der zweite Grund: eine
 *    automatische Erfassung liefe nach einem Widerruf bis zum nächsten Reload
 *    einfach weiter.
 */
export function Analytics() {
  const { hasAnalyticsConsent } = useConsent();
  const pathname = usePathname();
  const [skriptGeladen, setSkriptGeladen] = useState(false);

  useEffect(() => {
    // Erst wenn das Skript wirklich da ist — sonst ginge der erste
    // Seitenaufruf verloren, weil `window.umami` noch nicht existiert.
    if (!skriptGeladen || !hasAnalyticsConsent) return;
    verfolgeSeitenaufruf(pathname);
  }, [pathname, skriptGeladen, hasAnalyticsConsent]);

  if (!WEBSITE_ID || !hasAnalyticsConsent) return null;

  return (
    <Script
      src={SKRIPT_URL}
      data-website-id={WEBSITE_ID}
      data-auto-track="false"
      strategy="afterInteractive"
      onLoad={() => setSkriptGeladen(true)}
    />
  );
}
