// src/app/[locale]/pflegegrad/ergebnis/_component/ModulListe.test.tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { NBA_MODULE_METADATA } from '@/src/app/[locale]/pflegegrad/ergebnis/_constants/moduleMetadata';
import { weightedModulePoints } from '@/src/lib/pflegegrad/nba';
import type { PflegegradErgebnis } from '@/src/types/pflegegrad';

import pflegegrad from '../../../../../../public/locales/de/pflegegrad.json';

import { ModulListe } from './ModulListe';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

/**
 * Modul 3 liegt gewichtet über Modul 2 (11,25 gegen 3,75) und verdrängt es
 * damit. In Rohpunkten gemessen wäre der Vergleich 9 gegen 3 — die alte
 * Anzeige verglich genau diese Rohwerte und konnte deshalb bei anderen
 * Verteilungen das falsche Modul als zählend ausweisen.
 */
const moduleScores = { 1: 6, 2: 3, 3: 9, 4: 9, 5: 0, 6: 4 };

const ergebnis = {
  careLevel: 2,
  totalScore: 40,
  moduleScores,
  weightedScores: {
    1: weightedModulePoints(1, moduleScores[1]),
    2: weightedModulePoints(2, moduleScores[2]),
    3: weightedModulePoints(3, moduleScores[3]),
    4: weightedModulePoints(4, moduleScores[4]),
    5: weightedModulePoints(5, moduleScores[5]),
  },
  maxOf23: weightedModulePoints(3, moduleScores[3]),
  trafficLight: 'gelb',
  buffer: 13,
  missingData: false,
  benefits: { monthlyAmount: 332, reliefBudget: 125, additionalBenefits: [] },
  recommendations: [],
} as unknown as PflegegradErgebnis;

const rendereListe = () =>
  render(
    <NextIntlClientProvider locale="de" messages={{ pflegegrad }}>
      <ModulListe metadata={NBA_MODULE_METADATA} ergebnis={ergebnis} locale="de" />
    </NextIntlClientProvider>
  );

describe('ModulListe — Rohwerte als das darstellen, was sie sind (#137)', () => {
  it('nennt an jedem Modul die erhobenen und die amtlichen Kriterien', () => {
    rendereListe();

    expect(screen.getByText('4 von 5 Kriterien erhoben')).toBeInTheDocument(); // Modul 1
    expect(screen.getByText('5 von 11 Kriterien erhoben')).toBeInTheDocument(); // Modul 2
    expect(screen.getByText('4 von 13 Kriterien erhoben')).toBeInTheDocument(); // Modul 3
    expect(screen.getByText('6 von 13 Kriterien erhoben')).toBeInTheDocument(); // Modul 4
    expect(screen.getByText('4 von 16 Kriterien erhoben')).toBeInTheDocument(); // Modul 5
    expect(screen.getByText('5 von 6 Kriterien erhoben')).toBeInTheDocument(); // Modul 6
  });

  it('sagt über der Liste, dass die amtlichen Schwellen nicht angewandt werden', () => {
    rendereListe();

    expect(screen.getByText(/28 der 64 Kriterien/)).toBeInTheDocument();
    expect(screen.getByText(/amtlichen Punktschwellen .* nicht angewandt/)).toBeInTheDocument();
  });

  it('zeigt Stufen statt einer Zahl, die wie eine amtliche Punktzahl aussieht', () => {
    const { container } = rendereListe();

    // Modul 3: 9 von 12 Rohpunkten = Anteil 0,75 = Stufe 3.
    expect(screen.getAllByText('Stufe 3 von 4').length).toBeGreaterThan(0);
    // „12.0 Pkt." war genau das Format, das für eine amtliche Punktzahl gehalten wurde.
    expect(container.textContent).not.toMatch(/\d\s*Pkt\./);
  });

  it('weist die Rohwerte als Fragebogenpunkte aus', () => {
    rendereListe();

    expect(screen.getByText('Fragebogen: 9 von 12 Punkten')).toBeInTheDocument();
  });

  it('folgt beim Höchstwertprinzip der Berechnung, nicht den Rohwerten', () => {
    rendereListe();

    expect(
      screen.getByText('Von Modul 2 und 3 zählt nur der höhere Wert. Dieser hier zählt nicht.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Von Modul 2 und 3 zählt nur der höhere Wert. Dieser hier zählt.')
    ).toBeInTheDocument();
  });

  it('weist Modul 6 mit seiner Gewichtung aus — es zählt mit 15 Prozent', () => {
    rendereListe();

    // 4 von 10 Rohpunkten = Anteil 0,4 = Stufe 2 = 7,5 von 15.
    expect(screen.getByText('zählt 7,5 von 15 Gewichtungspunkten')).toBeInTheDocument();
  });
});
