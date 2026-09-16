// src/app/[locale]/gdb/page.test.tsx
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { act, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';

import gdb from '../../../../public/locales/de/gdb.json';

import GdBAbgeschaltetPage from './page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

/**
 * `use(params)` löst ein Promise auf: Die Seite hält beim ersten Rendern an.
 * Das Fortsetzen muss innerhalb eines awaiteten `act` passieren, sonst bleibt
 * das DOM leer und jede Abfrage läuft in eine Zeitüberschreitung.
 */
const rendereSeite = async () => {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <NextIntlClientProvider locale="de" messages={{ gdb }}>
          <GdBAbgeschaltetPage params={Promise.resolve({ locale: 'de' })} />
        </NextIntlClientProvider>
      </Suspense>
    );
  });
};

describe('GdB-Seite nach der Abschaltung (#131)', () => {
  it('erklärt die Abschaltung, statt einen Rechner anzuzeigen', async () => {
    await rendereSeite();

    expect(screen.getByRole('heading', { level: 1, name: gdb.titel })).toBeInTheDocument();
    // Kein Eingabeschritt, kein Ergebnis: Die Seite rechnet nichts mehr.
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByText(/berechnen/i)).not.toBeInTheDocument();
  });

  it('nennt die Norm und die Stellen, die verbindlich Auskunft geben', async () => {
    await rendereSeite();

    expect(screen.getByText(/VersMedV/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: gdb.amtTitel })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: gdb.verbandTitel })).toBeInTheDocument();
  });

  /**
   * Der Rechner-Code bleibt für die spätere Gesamtschau im Repository (#26).
   * Genau deshalb braucht es diese Sperre: Ein Import aus einer Seite heraus
   * würde ihn wieder erreichbar machen, ohne dass es jemandem auffällt.
   */
  it('keine Seite bindet die abgeschaltete Berechnung ein', () => {
    const appVerzeichnis = path.resolve(__dirname, '../..');

    const fundstellen = readdirSync(appVerzeichnis, { recursive: true, encoding: 'utf8' })
      .filter((datei) => /\.(ts|tsx)$/.test(datei))
      .filter((datei) => !/\.test\.(ts|tsx)$/.test(datei))
      .filter((datei) =>
        /berechneGesamtGdB|lib\/gdb\/berechne-gesamt-gdb/.test(
          readFileSync(path.join(appVerzeichnis, datei), 'utf8')
        )
      );

    expect(fundstellen).toEqual([]);
  });
});
