// src/lib/em-rente/berechnung.test.ts
import { describe, it, expect } from 'vitest';

import {
  RECHENGROESSEN,
  berechneEmRente,
  hatBerufsschutz,
  hinzuverdienstgrenzeEuro,
  regelaltersgrenzeInMonaten,
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

describe('hatBerufsschutz (§ 240 Abs. 1 SGB VI)', () => {
  it('trennt taggenau am 2. Januar 1961, nicht am Jahreswechsel', () => {
    // Der wunde Punkt: Das Gesetz sagt „vor dem 2. Januar 1961". Eine Prüfung
    // auf `geburtsjahr < 1961` würde den 1. Januar 1961 verschlucken und den
    // Anspruch zu Unrecht verneinen.
    expect(hatBerufsschutz('1960-12-31')).toBe(true);
    expect(hatBerufsschutz('1961-01-01')).toBe(true);
    expect(hatBerufsschutz('1961-01-02')).toBe(false);
    expect(hatBerufsschutz('1961-01-03')).toBe(false);
  });

  it('verneint ihn für spätere Jahrgänge', () => {
    expect(hatBerufsschutz('1970-06-15')).toBe(false);
    expect(hatBerufsschutz('1990-01-01')).toBe(false);
  });

  it('bleibt bei unbrauchbarer Eingabe bei false statt zu werfen', () => {
    expect(hatBerufsschutz('')).toBe(false);
    expect(hatBerufsschutz('kein-datum')).toBe(false);
  });
});

describe('Berufsschutz in der Berechnung', () => {
  const MIT_SCHUTZ = { ...BASIS, geburtsdatum: '1960-05-01', eintrittsdatum: '2026-05-01' };
  const OHNE_SCHUTZ = { ...BASIS, geburtsdatum: '1976-03-15', eintrittsdatum: '2026-03-15' };

  it('weist den Berufsschutz nach dem Geburtsdatum aus', () => {
    expect(berechneEmRente(MIT_SCHUTZ).berufsschutzMoeglich).toBe(true);
    expect(berechneEmRente(OHNE_SCHUTZ).berufsschutzMoeglich).toBe(false);
  });

  it('rechnet Berufsunfähigkeit wie die teilweise Rente (§ 240 gewährt genau die)', () => {
    const teilweise = berechneEmRente({ ...MIT_SCHUTZ, art: 'teilweise' });
    const berufsunfaehig = berechneEmRente({ ...MIT_SCHUTZ, art: 'berufsunfaehig' });

    expect(berufsunfaehig.monatsrenteEuro).toBeCloseTo(teilweise.monatsrenteEuro, 2);
    expect(berufsunfaehig.berufsschutzEntfallen).toBe(false);
  });

  it('gibt für jüngere Jahrgänge über § 240 keinen Betrag aus', () => {
    const e = berechneEmRente({ ...OHNE_SCHUTZ, art: 'berufsunfaehig' });

    expect(e.berufsschutzEntfallen).toBe(true);
    expect(e.monatsrenteEuro).toBe(0);
  });
});

describe('hinzuverdienstgrenzeEuro (§ 96a Abs. 1c SGB VI)', () => {
  const bezug = RECHENGROESSEN.bezugsgroesseMonatEuro;

  it('rechnet bei voller Erwerbsminderung drei Achtel der 14fachen Bezugsgröße', () => {
    expect(hinzuverdienstgrenzeEuro('voll', 1)).toBeCloseTo((3 / 8) * 14 * bezug, 2);
  });

  it('ignoriert bei voller Erwerbsminderung die Entgeltpunkte', () => {
    expect(hinzuverdienstgrenzeEuro('voll', 2)).toBe(hinzuverdienstgrenzeEuro('voll', 0.5));
  });

  it('greift bei teilweiser Erwerbsminderung auf den Mindestwert zurück', () => {
    // 9,72 × 3955 × 1,0 = 38.442,60 — das liegt unter sechs Achteln der
    // 14fachen Bezugsgröße, also gilt der Mindestwert.
    expect(hinzuverdienstgrenzeEuro('teilweise', 1)).toBeCloseTo((6 / 8) * 14 * bezug, 2);
  });

  it('rechnet oberhalb des Mindestwerts individuell', () => {
    expect(hinzuverdienstgrenzeEuro('teilweise', 2)).toBeCloseTo(9.72 * bezug * 2, 2);
  });

  it('behandelt Berufsunfähigkeit wie die teilweise Rente', () => {
    expect(hinzuverdienstgrenzeEuro('berufsunfaehig', 1.5)).toBe(
      hinzuverdienstgrenzeEuro('teilweise', 1.5)
    );
  });
});

describe('regelaltersgrenzeInMonaten (§ 35 Satz 2, § 235 Abs. 2 SGB VI)', () => {
  it('bleibt für Jahrgänge vor 1947 bei 65 Jahren', () => {
    expect(regelaltersgrenzeInMonaten(1946)).toBe(65 * 12);
    expect(regelaltersgrenzeInMonaten(1930)).toBe(65 * 12);
  });

  it('steigt von 1947 bis 1958 um einen Monat je Jahrgang', () => {
    expect(regelaltersgrenzeInMonaten(1947)).toBe(65 * 12 + 1);
    expect(regelaltersgrenzeInMonaten(1952)).toBe(65 * 12 + 6);
    expect(regelaltersgrenzeInMonaten(1958)).toBe(66 * 12); // 65 J + 12 M
  });

  it('steigt ab 1959 um zwei Monate je Jahrgang bis 66 Jahre und 10 Monate', () => {
    expect(regelaltersgrenzeInMonaten(1959)).toBe(66 * 12 + 2);
    expect(regelaltersgrenzeInMonaten(1960)).toBe(66 * 12 + 4);
    expect(regelaltersgrenzeInMonaten(1961)).toBe(66 * 12 + 6);
    expect(regelaltersgrenzeInMonaten(1963)).toBe(66 * 12 + 10);
  });

  it('erreicht ab Jahrgang 1964 die volle Regel des § 35', () => {
    expect(regelaltersgrenzeInMonaten(1964)).toBe(67 * 12);
    expect(regelaltersgrenzeInMonaten(1990)).toBe(67 * 12);
  });
});

describe('Ende der Erwerbsminderungsrente', () => {
  it('rechnet den Tag der Regelaltersgrenze aus dem Geburtsdatum', () => {
    // Jahrgang 1960: 66 Jahre und 4 Monate nach dem 1. Mai 1960.
    const e = berechneEmRente({
      ...BASIS,
      geburtsdatum: '1960-05-01',
      eintrittsdatum: '2026-05-01',
    });

    expect(e.regelaltersgrenzeMonate).toBe(66 * 12 + 4);
    expect(e.renteLaeuftBis).toBe('2026-09-01');
  });

  it('gilt für alle Rentenarten, nicht nur für den Berufsschutz', () => {
    const jung = { ...BASIS, geburtsdatum: '1976-03-15', eintrittsdatum: '2026-03-15' };

    expect(berechneEmRente({ ...jung, art: 'voll' }).renteLaeuftBis).toBe('2043-03-15');
    expect(berechneEmRente({ ...jung, art: 'teilweise' }).renteLaeuftBis).toBe('2043-03-15');
  });
});
