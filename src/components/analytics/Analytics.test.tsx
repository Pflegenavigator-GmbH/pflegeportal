// src/components/analytics/Analytics.test.tsx
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { act, render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RootLayout from '@/src/app/layout';
import { speichereEinwilligung, widerrufeEinwilligung } from '@/src/lib/consent';

/**
 * `next/script` als sichtbarer Platzhalter. Das echte Element fügt das Skript
 * per Effekt in den Dokumentkopf ein; hier geht es nur um die Frage, OB es
 * gerendert wird. Ein <span> statt <script>, weil React 19 beim Rendern eines
 * <script> auf dem Client warnt.
 */
vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => (
    <span
      data-next-script=""
      data-src={props.src as string}
      data-website-id={props['data-website-id'] as string}
      data-auto-track={props['data-auto-track'] as string}
    />
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/de',
}));

const WEBSITE_ID = 'test-website-id';

/**
 * Die Komponente liest die Website-ID beim Laden des Moduls. Deshalb erst die
 * Umgebung setzen, dann frisch importieren.
 */
async function ladeAnalytics(websiteId: string | undefined = WEBSITE_ID): Promise<ComponentType> {
  vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', websiteId);
  vi.resetModules();
  const modul = await import('./Analytics');
  return modul.Analytics;
}

const skripte = () => document.querySelectorAll('[data-next-script]');

describe('Analytics — Einwilligung (#154)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Die Setup-Datei stubbt die Supabase-Variablen global; unstubAllEnvs
    // nimmt sie mit. Für die übrigen Tests derselben Datei wiederherstellen.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-key');
  });

  it('rendert ohne gespeicherte Entscheidung kein Skript', async () => {
    const Analytics = await ladeAnalytics();
    render(<Analytics />);

    expect(skripte()).toHaveLength(0);
  });

  it('rendert kein Skript, wenn Analyse abgelehnt wurde', async () => {
    speichereEinwilligung({ essential: true, analytics: false, marketing: true });
    const Analytics = await ladeAnalytics();
    render(<Analytics />);

    expect(skripte()).toHaveLength(0);
  });

  it('rendert bei beschädigtem Speichereintrag kein Skript', async () => {
    window.localStorage.setItem('user_consent', '{kaputt');
    const Analytics = await ladeAnalytics();
    render(<Analytics />);

    expect(skripte()).toHaveLength(0);
  });

  it('rendert ohne Website-ID auch mit Einwilligung kein Skript', async () => {
    speichereEinwilligung({ essential: true, analytics: true, marketing: false });
    const Analytics = await ladeAnalytics('');
    render(<Analytics />);

    expect(skripte()).toHaveLength(0);
  });

  it('lädt nach Einwilligung genau ein Skript aus der EU-Region, ohne automatische Erfassung', async () => {
    speichereEinwilligung({ essential: true, analytics: true, marketing: false });
    const Analytics = await ladeAnalytics();
    render(<Analytics />);

    const gefunden = skripte();
    expect(gefunden).toHaveLength(1);
    expect(gefunden[0]).toHaveAttribute('data-src', 'https://eu.umami.is/script.js');
    expect(gefunden[0]).toHaveAttribute('data-website-id', WEBSITE_ID);
    // Automatische Erfassung würde die volle URL samt Fallcode melden.
    expect(gefunden[0]).toHaveAttribute('data-auto-track', 'false');
  });

  it('entfernt das Skript sofort nach dem Widerruf', async () => {
    speichereEinwilligung({ essential: true, analytics: true, marketing: false });
    const Analytics = await ladeAnalytics();
    render(<Analytics />);
    expect(skripte()).toHaveLength(1);

    act(() => widerrufeEinwilligung());

    expect(skripte()).toHaveLength(0);
  });
});

describe('Analytics — Einbindung (#154)', () => {
  it('das Root-Layout rendert kein Skript', () => {
    render(<RootLayout>{<p>Inhalt</p>}</RootLayout>);

    expect(skripte()).toHaveLength(0);
  });

  /**
   * Quelltext-Sperre. Das Skript im Root-Layout war nicht falsch konfiguriert,
   * sondern stand an der falschen Stelle — ein Verhaltenstest der Komponente
   * hätte es nie gesehen. Deshalb: Umami-Adressen gibt es nur in der einen
   * Datei, die die Einwilligung prüft.
   */
  it('Umami-Adressen stehen im Anwendungscode nur in Analytics.tsx', () => {
    const wurzel = path.resolve(__dirname, '../..');
    const erlaubt = path.join('components', 'analytics', 'Analytics.tsx');

    const fundstellen = readdirSync(wurzel, { recursive: true, encoding: 'utf8' })
      .filter((datei) => /\.(ts|tsx|js|jsx)$/.test(datei))
      .filter((datei) => !/\.test\.(ts|tsx)$/.test(datei))
      .filter((datei) => datei !== erlaubt)
      .filter((datei) => /umami\.is/i.test(readFileSync(path.join(wurzel, datei), 'utf8')));

    expect(fundstellen).toEqual([]);
  });

  /**
   * Der naheliegende „Fix" für den CSP-Fehler in der Konsole wäre,
   * `cloud.umami.is` freizugeben. Das hätte Tracking ohne Einwilligung
   * eingeschaltet — und lädt obendrein die globale statt der EU-Instanz.
   */
  it('die CSP lässt cloud.umami.is nicht zu', () => {
    const konfiguration = readFileSync(path.resolve(__dirname, '../../../next.config.ts'), 'utf8');

    expect(konfiguration).not.toMatch(/cloud\.umami\.is/i);
    expect(konfiguration).toContain('https://eu.umami.is');
  });
});
