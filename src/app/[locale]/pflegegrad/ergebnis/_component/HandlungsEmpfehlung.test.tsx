// src/app/[locale]/pflegegrad/ergebnis/_component/HandlungsEmpfehlung.test.tsx
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import type { PflegegradErgebnis } from '@/src/types/pflegegrad';

import de from '../../../../../../public/locales/de/pflegegrad.json';
import en from '../../../../../../public/locales/en/pflegegrad.json';

import { HandlungsEmpfehlungen } from './HandlungsEmpfehlung';

const ergebnis = {
  careLevel: 2,
  trafficLight: 'gelb',
  recommendations: ['schwerbehindertenausweis'],
  benefits: { monthlyAmount: 347, reliefBudget: 131, additionalBenefits: [] },
} as unknown as PflegegradErgebnis;

const rendere = (locale: 'de' | 'en') =>
  render(
    <NextIntlClientProvider locale={locale} messages={{ pflegegrad: locale === 'de' ? de : en }}>
      <HandlungsEmpfehlungen ergebnis={ergebnis} />
    </NextIntlClientProvider>
  );

describe('Handlungsempfehlungen (#107)', () => {
  it('übersetzt die Empfehlung statt sie aus dem Rechner zu übernehmen', () => {
    rendere('de');

    expect(screen.getByText(de.ergebnis.empfehlungenTitel)).toBeInTheDocument();
    expect(screen.getByText(de.ergebnis.empfehlungen.schwerbehindertenausweis)).toBeInTheDocument();
    expect(screen.getByText(de.ergebnis.grenzbereichTitel)).toBeInTheDocument();
  });

  it('zeigt auf Englisch englischen Text — vorher stand hier Deutsch', () => {
    rendere('en');

    expect(screen.getByText(en.ergebnis.empfehlungen.schwerbehindertenausweis)).toBeInTheDocument();
    expect(screen.queryByText(de.ergebnis.empfehlungen.schwerbehindertenausweis)).toBeNull();
  });

  /**
   * Quelltext-Sperre: Geldbeträge gehören in den Rechtsstand-Katalog, nicht in
   * die Rechenbibliothek. Genau so entstand „Pflegehilfsmittel (42€)" im
   * Rechner — ohne Fundstelle und in jeder Sprache auf Deutsch.
   *
   * Geprüft wird der Pflegegrad-Bereich. Außerhalb davon stehen noch Beträge
   * im Code: die EM-Renten-Berechnung und der Text zum Säumniszuschlag in
   * `widerspruch/fristen.ts`. Beide sind eigene Aufgaben — der Katalog und die
   * Sprachdateien müssen dafür erst dorthin reichen.
   */
  it('keine Euro-Beträge im Pflegegrad-Rechencode', () => {
    const lib = path.resolve(__dirname, '../../../../../lib/pflegegrad');
    const BETRAG = /\d[\d.,]*\s*(€|Euro\b)/;

    const fundstellen = readdirSync(lib, { recursive: true, encoding: 'utf8' })
      .filter((datei) => /\.(ts|tsx)$/.test(datei))
      .filter((datei) => !/\.test\.(ts|tsx)$/.test(datei))
      .flatMap((datei) =>
        readFileSync(path.join(lib, datei), 'utf8')
          .split('\n')
          .map((zeile, index) => ({ zeile, ort: `${datei}:${index + 1}` }))
          .filter(({ zeile }) => BETRAG.test(zeile))
          .map(({ ort, zeile }) => `${ort}  ${zeile.trim()}`)
      );

    expect(fundstellen).toEqual([]);
  });
});
