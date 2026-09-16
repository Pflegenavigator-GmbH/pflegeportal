// src/lib/rechtsstand/rechtswerte.test.ts
import { describe, expect, it } from 'vitest';

import { MODULE_KRITERIEN, MODULE_WEIGHTS, PFLEGEGRAD_THRESHOLDS } from '@/src/lib/pflegegrad/nba';
import { calculatePflegegrad } from '@/src/lib/pflegegrad/rechner';
import { EILANTRAG_RECHTSGRUNDLAGEN, FRIST_DEFINITIONEN } from '@/src/lib/widerspruch/fristen';

import {
  RECHTSWERTE,
  fassungen,
  leistungsbetraegeAm,
  rechtswertAm,
  ungeprüfteWerte,
} from './rechtswerte';

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** Ein Jahr — danach ist ein Prüfvermerk abgelaufen. */
const PRUEFUNG_GUELTIG_TAGE = 365;

describe('Katalog der Rechtswerte (#138)', () => {
  it('hält je Schlüssel und Stichtag genau eine Fassung', () => {
    const paare = RECHTSWERTE.map((wert) => `${wert.schluessel}@${wert.gueltigAb}`);
    expect(paare).toEqual([...new Set(paare)]);
  });

  it('verlangt von jedem Eintrag Fundstelle, Quelle und gültiges Datum', () => {
    for (const wert of RECHTSWERTE) {
      expect(wert.gueltigAb, wert.schluessel).toMatch(ISO_DATUM);
      expect(wert.fundstelle.trim(), wert.schluessel).not.toBe('');
      expect(wert.quelle, wert.schluessel).toMatch(/^https:\/\//);
      expect(wert.einheit.trim(), wert.schluessel).not.toBe('');
    }
  });

  it('verlangt von jedem ungeprüften Eintrag ein zuständiges Ticket', () => {
    // Ungeprüft sein ist erlaubt. Ungeprüft und ohne Zuständigkeit nicht —
    // so entstehen die Werte, die jahrelang niemand anfasst.
    for (const wert of ungeprüfteWerte()) {
      expect(wert.hinweis ?? '', wert.schluessel).toMatch(/#\d+/);
    }
  });

  it('nennt bei jedem Prüfvermerk Datum, Person und Art der Prüfung', () => {
    for (const wert of RECHTSWERTE) {
      if (!wert.geprueft) continue;
      expect(wert.geprueft.am, wert.schluessel).toMatch(ISO_DATUM);
      expect(wert.geprueft.durch.trim(), wert.schluessel).not.toBe('');
      expect(['normtext', 'fachlich'], wert.schluessel).toContain(wert.geprueft.art);
    }
  });
});

describe('Fassung zum Stichtag', () => {
  it('liefert die Fassung, die zum maßgeblichen Datum galt — nicht die neueste', () => {
    const alt = rechtswertAm('leistungen.entlastungsbetrag', '2024-06-30');
    const neu = rechtswertAm('leistungen.entlastungsbetrag', '2025-01-01');

    expect(alt?.wert).toBe(125);
    expect(neu?.wert).toBe(131);
  });

  it('meldet nichts, wenn zum Stichtag noch keine Fassung galt', () => {
    expect(rechtswertAm('leistungen.entlastungsbetrag', '2016-12-31')).toBeNull();
  });

  it('kennt zu jedem Schlüssel mindestens eine Fassung', () => {
    for (const wert of RECHTSWERTE) {
      expect(fassungen(wert.schluessel).length, wert.schluessel).toBeGreaterThan(0);
    }
  });
});

describe('Abgleich mit dem rechnenden Code', () => {
  const aktuell = (schluessel: string) => {
    const wert = rechtswertAm(schluessel, new Date());
    expect(wert, `Katalogeintrag fehlt: ${schluessel}`).not.toBeNull();
    return wert!;
  };

  it('Pflegegrad-Schwellen stimmen mit nba.ts überein', () => {
    const katalog = aktuell('pflegegrad.schwellen').wert as Record<string, number>;

    for (const { level, min } of PFLEGEGRAD_THRESHOLDS) {
      expect(katalog[level], `Pflegegrad ${level}`).toBe(min);
    }
  });

  it('Modulgewichte stimmen mit nba.ts überein', () => {
    expect(aktuell('pflegegrad.modulgewichte').wert).toEqual(MODULE_WEIGHTS);
  });

  it('amtliche Kriterienzahl stimmt mit nba.ts überein', () => {
    const katalog = aktuell('pflegegrad.kriterien.amtlich').wert as Record<string, number>;

    for (const [modul, zahl] of Object.entries(katalog)) {
      expect(
        MODULE_KRITERIEN[Number(modul) as 1 | 2 | 3 | 4 | 5 | 6].amtlich,
        `Modul ${modul}`
      ).toBe(zahl);
    }
  });

  it('Fristlängen und Fundstellen stimmen mit fristen.ts überein', () => {
    const paare = [
      ['fristen.widerspruch', FRIST_DEFINITIONEN.widerspruch],
      ['fristen.klage', FRIST_DEFINITIONEN.klage],
      [
        'fristen.untaetigkeitsklage.widerspruch',
        FRIST_DEFINITIONEN['untaetigkeitsklage-widerspruch'],
      ],
      ['fristen.untaetigkeitsklage.antrag', FRIST_DEFINITIONEN['untaetigkeitsklage-antrag']],
    ] as const;

    for (const [schluessel, definition] of paare) {
      const katalog = aktuell(schluessel);
      expect(katalog.wert, schluessel).toBe(definition.fristMonate);
      expect(katalog.fundstelle, schluessel).toBe(definition.gesetz);
    }
  });

  it('Bearbeitungsfristen und Fundstellen stimmen mit fristen.ts überein', () => {
    expect(aktuell('fristen.bearbeitung.entscheidung').fundstelle).toBe(
      EILANTRAG_RECHTSGRUNDLAGEN.bearbeitungsfrist.gesetz
    );
    expect(aktuell('fristen.bearbeitung.saeumniszuschlag').fundstelle).toBe(
      EILANTRAG_RECHTSGRUNDLAGEN.saeumniszuschlag.gesetz
    );
    expect(aktuell('fristen.begutachtung.verkuerzt.stationaer').wert).toBe(5);
    expect(aktuell('fristen.begutachtung.verkuerzt.pflegezeit').wert).toBe(10);
  });

  /**
   * Der Rückstand aus #107 ist behoben: Bis zum 16.09.2026 zeigte das Portal
   * die Beträge von vor 2025. Dieser Test hält fest, dass die Anzeige jetzt aus
   * dem Katalog kommt — und zwar aus der zum Stichtag geltenden Fassung.
   */
  it('Leistungsbeträge stammen aus dem Katalog, in der zum Stichtag geltenden Fassung', () => {
    const heute = calculatePflegegrad({ 4: 18 }, [], '2026-09-16');
    const damals = calculatePflegegrad({ 4: 18 }, [], '2024-06-30');

    expect(heute.careLevel).toBe(damals.careLevel);
    expect(heute.benefits.monthlyAmount).toBe(
      leistungsbetraegeAm('2026-09-16')[heute.careLevel as 1 | 2 | 3 | 4 | 5].monthly
    );
    // Dieselbe Begutachtung, anderer Stichtag: der Betrag der damaligen Fassung.
    expect(damals.benefits.monthlyAmount).toBe(
      leistungsbetraegeAm('2024-06-30')[damals.careLevel as 1 | 2 | 3 | 4 | 5].monthly
    );
    expect(heute.benefits.monthlyAmount).not.toBe(damals.benefits.monthlyAmount);
  });

  it('gibt für Pflegegrad 1 kein Pflegegeld, aber den Entlastungsbetrag', () => {
    const betraege = leistungsbetraegeAm('2026-09-16');

    expect(betraege[1]).toEqual({ monthly: 0, relief: 131 });
    expect(betraege[2]).toEqual({ monthly: 347, relief: 131 });
    expect(betraege[5]).toEqual({ monthly: 990, relief: 131 });
  });
});

describe('Ablauf der Prüfvermerke', () => {
  /**
   * Der jährliche Termin aus #138 — ohne Kalendereintrag, den niemand liest.
   * Schlägt dieser Test fehl, ist die Liste durchzugehen und `geprueft.am`
   * nachzuziehen. Das ist kein Formalismus: Genau so ist der Kommentar
   * „Gesetzlicher Satz 2026" über Werten von 2024 entstanden.
   */
  it('keine Prüfung ist älter als ein Jahr', () => {
    const grenze = new Date();
    grenze.setDate(grenze.getDate() - PRUEFUNG_GUELTIG_TAGE);
    const grenzDatum = grenze.toISOString().slice(0, 10);

    const abgelaufen = RECHTSWERTE.filter(
      (wert) => wert.geprueft !== null && wert.geprueft.am < grenzDatum
    ).map((wert) => `${wert.schluessel} (geprüft ${wert.geprueft!.am})`);

    expect(abgelaufen).toEqual([]);
  });
});
