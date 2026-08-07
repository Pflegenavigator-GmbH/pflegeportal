// src/lib/em-rente/berechnung.test.ts
import { describe, it, expect } from 'vitest';

import {
  RECHENGROESSEN,
  berechneEmRente,
  zurechnungszeitEndeInMonaten,
  type EmRenteEingabe,
} from './berechnung';

/** Durchschnittsverdiener, erwerbsgemindert mit 50, 25 Beitragsjahre. */
const BASIS: EmRenteEingabe = {
  geburtsdatum: '1976-03-15',
  eintrittsdatum: '2026-03-15',
  beitragsjahre: 25,
  bruttoJahresentgeltEuro: RECHENGROESSEN.durchschnittsentgeltEuro,
  art: 'voll',
};

describe('zurechnungszeitEndeInMonaten', () => {
  it('folgt der Staffel des § 253a SGB VI', () => {
    expect(zurechnungszeitEndeInMonaten(2019)).toBe(65 * 12 + 8);
    expect(zurechnungszeitEndeInMonaten(2023)).toBe(66 * 12);
    expect(zurechnungszeitEndeInMonaten(2026)).toBe(66 * 12 + 3);
    expect(zurechnungszeitEndeInMonaten(2027)).toBe(66 * 12 + 4);
  });

  it('steigt ab 2028 um zwei Monate je Jahr bis auf 67', () => {
    expect(zurechnungszeitEndeInMonaten(2028)).toBe(66 * 12 + 6);
    expect(zurechnungszeitEndeInMonaten(2030)).toBe(66 * 12 + 10);
    expect(zurechnungszeitEndeInMonaten(2031)).toBe(67 * 12);
    expect(zurechnungszeitEndeInMonaten(2040)).toBe(67 * 12);
  });
});

describe('berechneEmRente', () => {
  it('rechnet einen Durchschnittsverdiener nach der Rentenformel', () => {
    const e = berechneEmRente(BASIS);

    // Durchschnittsentgelt ⇒ genau ein Entgeltpunkt je Jahr.
    expect(e.entgeltpunkteBeitrag).toBeCloseTo(25, 2);

    // Eintritt mit exakt 50, Zurechnungszeit 2026 endet mit 66 Jahren und
    // 3 Monaten ⇒ 16 Jahre und 3 Monate = 195 Monate.
    expect(e.zurechnungsmonate).toBe(195);
    expect(e.entgeltpunkteZurechnung).toBeCloseTo(16.25, 2);
    expect(e.entgeltpunkteGesamt).toBeCloseTo(41.25, 2);

    // 15 Jahre bis 65 ⇒ Deckel greift, voller Abschlag von 10,8 %.
    expect(e.abschlagsmonate).toBe(36);
    expect(e.abschlagProzent).toBeCloseTo(10.8, 2);
    expect(e.zugangsfaktor).toBeCloseTo(0.892, 3);

    expect(e.monatsrenteEuro).toBeCloseTo(41.25 * 0.892 * 1.0 * RECHENGROESSEN.rentenwertEuro, 1);
  });

  it('halbiert die Rente bei teilweiser Erwerbsminderung', () => {
    const voll = berechneEmRente(BASIS);
    const teilweise = berechneEmRente({ ...BASIS, art: 'teilweise' });

    expect(teilweise.monatsrenteEuro).toBeCloseTo(voll.monatsrenteEuro / 2, 1);
  });

  it('zahlt keine Zulage für einen Pflegegrad — es gibt keine', () => {
    // Absicherung gegen den alten Fehler: Die Eingabe kennt gar kein Feld für
    // den Pflegegrad, das Ergebnis keinen Zulagen-Betrag. Bleibt das so,
    // kann die erfundene „Pflege-Personal-Zulage" nicht zurückkehren.
    const e = berechneEmRente(BASIS);

    expect(e).not.toHaveProperty('zulageBetrag');
    expect(Object.keys(e)).not.toContain('pflegegrad');
  });

  it('deckelt die Entgeltpunkte an der Beitragsbemessungsgrenze, nicht bei 45 Punkten', () => {
    const spitzenverdiener = berechneEmRente({
      ...BASIS,
      bruttoJahresentgeltEuro: 500_000,
      beitragsjahre: 40,
    });

    const maxProJahr =
      RECHENGROESSEN.beitragsbemessungsgrenzeEuro / RECHENGROESSEN.durchschnittsentgeltEuro;
    expect(spitzenverdiener.entgeltpunkteBeitrag).toBeCloseTo(40 * maxProJahr, 2);

    // Der alte Code kappte hart bei 45 — hier liegt die Summe darüber.
    expect(spitzenverdiener.entgeltpunkteGesamt).toBeGreaterThan(45);
  });

  it('vergibt keine Zurechnungszeit mehr, wenn die Erwerbsminderung spät eintritt', () => {
    const spaet = berechneEmRente({
      ...BASIS,
      geburtsdatum: '1958-01-10',
      eintrittsdatum: '2026-01-10', // Eintritt mit 68
    });

    expect(spaet.zurechnungsmonate).toBe(0);
    expect(spaet.entgeltpunkteZurechnung).toBe(0);
  });

  it('rechnet ohne Abschlag, wenn die Erwerbsminderung erst ab 65 eintritt', () => {
    const ohneAbschlag = berechneEmRente({
      ...BASIS,
      geburtsdatum: '1960-05-01',
      eintrittsdatum: '2026-05-01', // Eintritt mit 66
    });

    expect(ohneAbschlag.abschlagsmonate).toBe(0);
    expect(ohneAbschlag.zugangsfaktor).toBe(1);
  });

  it('erkennt die nicht erfüllte allgemeine Wartezeit', () => {
    expect(berechneEmRente({ ...BASIS, beitragsjahre: 4 }).wartezeitErfuellt).toBe(false);
    expect(berechneEmRente({ ...BASIS, beitragsjahre: 5 }).wartezeitErfuellt).toBe(true);
  });

  it('bleibt bei leeren Eingaben bei null statt bei NaN', () => {
    const leer = berechneEmRente({ ...BASIS, beitragsjahre: 0, bruttoJahresentgeltEuro: 0 });

    expect(leer.entgeltpunkteGesamt).toBe(0);
    expect(leer.monatsrenteEuro).toBe(0);
  });
});
