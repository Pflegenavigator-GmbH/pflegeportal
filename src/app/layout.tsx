// src/app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

type Props = {
  children: ReactNode;
};

/**
 * Hier werden keine Drittanbieter-Skripte eingebunden.
 *
 * Bis zum 15.09.2026 stand hier ein Umami-`<Script>` — auf jeder Seite, am
 * Cookie-Banner vorbei (Issue #154). Geladen wurde es nur deshalb nicht, weil
 * die CSP dessen Host nicht zulässt. Analyse läuft ausschließlich über
 * `src/components/analytics/Analytics.tsx`, die erst nach Einwilligung
 * rendert. `Analytics.test.tsx` schlägt fehl, wenn hier wieder ein Skript
 * auftaucht.
 */
export default function RootLayout({ children }: Props) {
  return children;
}
