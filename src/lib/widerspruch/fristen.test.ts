import { describe, expect, it } from 'vitest';

import {
  AMPEL_SCHWELLE_GELB,
  AMPEL_SCHWELLE_GRUEN,
  ampelStatusFuerTage,
  berechneFristFuerTyp,
  berechneFristen,
  istFeiertag,
  naechsterWerktag,
  zuLokalemTagesbeginn,
  type Frist,
} from './fristen';

/** Lokales ISO-Datum — vermeidet die UTC-Verschiebung von toISOString(). */
const iso = (datum: Date) =>
  `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}-${String(
    datum.getDate()
  ).padStart(2, '0')}`;

/** Referenzzeitpunkt als lokales Datum, damit Tests zeitzonenunabhängig sind. */
const am = (jahr: number, monat: number, tag: number) => new Date(jahr, monat - 1, tag);

/** Erwartet eine berechnete Frist — schlägt fehl statt `null` durchzureichen. */
const erwarteFrist = (frist: Frist | null): Frist => {
  expect(frist).not.toBeNull();
  return frist as Frist;
};

describe('Ampel-Schwellen', () => {
  it('bildet die Vorgabe grün > 14, gelb 3–14, rot < 3 ab', () => {
    expect(ampelStatusFuerTage(30)).toBe('gruen');
    expect(ampelStatusFuerTage(15)).toBe('gruen');
    expect(ampelStatusFuerTage(14)).toBe('gelb');
    expect(ampelStatusFuerTage(4)).toBe('gelb');
    expect(ampelStatusFuerTage(3)).toBe('gelb');
    expect(ampelStatusFuerTage(2)).toBe('rot');
    expect(ampelStatusFuerTage(1)).toBe('rot');
  });

  it('behandelt den Fristtag selbst noch als handlungsfähig, nicht als abgelaufen', () => {
    // Fristen enden mit Ablauf des Tages — am Fristtag ist die Handlung
    // noch fristwahrend (§ 64 Abs. 2 SGG).
    expect(ampelStatusFuerTage(0)).toBe('rot');
    expect(ampelStatusFuerTage(-1)).toBe('abgelaufen');
  });

  it('hält die Schwellenkonstanten konsistent zu den Statusübergängen', () => {
    expect(ampelStatusFuerTage(AMPEL_SCHWELLE_GRUEN + 1)).toBe('gruen');
    expect(ampelStatusFuerTage(AMPEL_SCHWELLE_GRUEN)).toBe('gelb');
    expect(ampelStatusFuerTage(AMPEL_SCHWELLE_GELB)).toBe('gelb');
    expect(ampelStatusFuerTage(AMPEL_SCHWELLE_GELB - 1)).toBe('rot');
  });
});

describe('Datums-Normalisierung', () => {
  it('parst ISO-Datumsstrings als lokalen Tag (keine UTC-Verschiebung)', () => {
    const datum = erwarteDatum(zuLokalemTagesbeginn('2026-06-10'));
    expect(datum.getFullYear()).toBe(2026);
    expect(datum.getMonth()).toBe(5);
    expect(datum.getDate()).toBe(10);
    expect(datum.getHours()).toBe(0);
  });

  it('weist unmögliche und leere Datumsangaben zurück', () => {
    expect(zuLokalemTagesbeginn('2026-02-31')).toBeNull();
    expect(zuLokalemTagesbeginn('2026-13-01')).toBeNull();
    expect(zuLokalemTagesbeginn('')).toBeNull();
    expect(zuLokalemTagesbeginn('   ')).toBeNull();
    expect(zuLokalemTagesbeginn('kein Datum')).toBeNull();
    expect(zuLokalemTagesbeginn(new Date('ungültig'))).toBeNull();
  });

  function erwarteDatum(datum: Date | null): Date {
    expect(datum).not.toBeNull();
    return datum as Date;
  }
});

describe('Werktags- und Feiertagsregel (§ 64 Abs. 3 SGG)', () => {
  it('überspringt Wochenenden', () => {
    // 06.06.2026 ist ein Samstag → nächster Werktag ist Montag, der 08.06.
    expect(iso(naechsterWerktag(am(2026, 6, 6)))).toBe('2026-06-08');
  });

  it('überspringt Feiertag und anschließendes Wochenende zusammen', () => {
    // 03.10.2026 ist Tag der Deutschen Einheit UND ein Samstag.
    expect(iso(naechsterWerktag(am(2026, 10, 3)))).toBe('2026-10-05');
  });

  it('lässt Werktage unverändert', () => {
    expect(iso(naechsterWerktag(am(2026, 6, 15)))).toBe('2026-06-15');
  });

  it('berechnet bewegliche Feiertage auch jenseits fest hinterlegter Jahre', () => {
    // Ostern 2028 fällt auf den 16.04. → Karfreitag 14.04., Pfingstmontag 05.06.
    expect(istFeiertag(am(2028, 4, 14))).toBe(true);
    expect(istFeiertag(am(2028, 6, 5))).toBe(true);
    expect(istFeiertag(am(2028, 4, 12))).toBe(false);
  });
});

describe('Widerspruchsfrist (§ 84 Abs. 1 SGG)', () => {
  it('endet einen Monat nach Zugang des Bescheids', () => {
    const frist = erwarteFrist(berechneFristFuerTyp('widerspruch', '2026-05-15', am(2026, 5, 20)));

    expect(frist.gesetz).toBe('§ 84 Abs. 1 SGG');
    expect(frist.art).toBe('ausschlussfrist');
    expect(iso(frist.fristEndeWerktag)).toBe('2026-06-15');
    expect(frist.verbleibendeTage).toBe(26);
    expect(frist.ampelStatus).toBe('gruen');
  });

  it('schaltet gemäß Restlaufzeit auf gelb und rot', () => {
    const gelb = erwarteFrist(berechneFristFuerTyp('widerspruch', '2026-05-15', am(2026, 6, 12)));
    expect(gelb.verbleibendeTage).toBe(3);
    expect(gelb.ampelStatus).toBe('gelb');

    const rot = erwarteFrist(berechneFristFuerTyp('widerspruch', '2026-05-15', am(2026, 6, 13)));
    expect(rot.verbleibendeTage).toBe(2);
    expect(rot.ampelStatus).toBe('rot');
  });

  it('meldet den Fristtag als letzten Handlungstag, erst danach abgelaufen', () => {
    const letzterTag = erwarteFrist(
      berechneFristFuerTyp('widerspruch', '2026-05-15', am(2026, 6, 15))
    );
    expect(letzterTag.verbleibendeTage).toBe(0);
    expect(letzterTag.istAbgelaufen).toBe(false);
    expect(letzterTag.ampelStatus).toBe('rot');

    const abgelaufen = erwarteFrist(
      berechneFristFuerTyp('widerspruch', '2026-05-15', am(2026, 6, 16))
    );
    expect(abgelaufen.istAbgelaufen).toBe(true);
    expect(abgelaufen.ampelStatus).toBe('abgelaufen');
    expect(abgelaufen.verbleibendeTage).toBe(-1);
  });

  it('kappt auf den letzten Monatstag, wenn der Zieltag fehlt', () => {
    // Zugang 31.01. → Fristende 28.02. (§ 26 SGB X i.V.m. § 188 Abs. 3 BGB),
    // das 2026 auf einen Samstag fällt und daher auf Montag rutscht.
    const frist = erwarteFrist(berechneFristFuerTyp('widerspruch', '2026-01-31', am(2026, 2, 1)));
    expect(iso(frist.fristEnde)).toBe('2026-02-28');
    expect(iso(frist.fristEndeWerktag)).toBe('2026-03-02');
  });
});

describe('Klagefrist (§ 87 Abs. 1 SGG)', () => {
  it('läuft ab dem Widerspruchsbescheid, nicht ab dem Ausgangsbescheid', () => {
    const uebersicht = berechneFristen(
      { bescheidDatum: '2026-01-10', widerspruchsbescheidDatum: '2026-06-15' },
      am(2026, 6, 20)
    );

    const klage = erwarteFrist(uebersicht.fristen.find((f) => f.typ === 'klage') ?? null);
    expect(klage.gesetz).toBe('§ 87 Abs. 1 SGG');
    expect(iso(klage.startDatum)).toBe('2026-06-15');
    expect(iso(klage.fristEndeWerktag)).toBe('2026-07-15');
  });
});

describe('Untätigkeitsklage (§ 88 SGG) als Wartefrist', () => {
  it('wird nach drei Monaten ohne Widerspruchsbescheid zulässig', () => {
    const wartend = erwarteFrist(
      berechneFristFuerTyp('untaetigkeitsklage-widerspruch', '2026-03-10', am(2026, 5, 10))
    );
    expect(wartend.gesetz).toBe('§ 88 Abs. 2 SGG');
    expect(wartend.art).toBe('wartefrist');
    expect(wartend.ampelStatus).toBe('wartend');
    expect(wartend.istVerfuegbar).toBe(false);

    const verfuegbar = erwarteFrist(
      berechneFristFuerTyp('untaetigkeitsklage-widerspruch', '2026-03-10', am(2026, 6, 11))
    );
    expect(verfuegbar.istVerfuegbar).toBe(true);
    expect(verfuegbar.ampelStatus).toBe('gruen');
  });

  it('gilt am Stichtag selbst noch als laufend', () => {
    // Die Wartezeit muss verstrichen sein; eine zu früh erhobene Klage wäre
    // unzulässig. Deshalb bewusst konservativ.
    const stichtag = erwarteFrist(
      berechneFristFuerTyp('untaetigkeitsklage-widerspruch', '2026-03-10', am(2026, 6, 10))
    );
    expect(stichtag.verbleibendeTage).toBe(0);
    expect(stichtag.istVerfuegbar).toBe(false);
    expect(stichtag.ampelStatus).toBe('wartend');
  });

  it('wird nach sechs Monaten ohne Bescheid auf den Antrag zulässig', () => {
    const frist = erwarteFrist(
      berechneFristFuerTyp('untaetigkeitsklage-antrag', '2026-04-01', am(2026, 6, 13))
    );
    expect(frist.gesetz).toBe('§ 88 Abs. 1 SGG');
    expect(frist.fristMonate).toBe(6);
    expect(iso(frist.fristEndeWerktag)).toBe('2026-10-01');
  });

  it('verschiebt die Wartezeit nicht auf den nächsten Werktag', () => {
    // Anders als eine Ausschlussfrist darf eine Wartezeit nicht nach vorne
    // wandern — 06.06.2026 ist ein Samstag und bleibt stehen.
    const frist = erwarteFrist(
      berechneFristFuerTyp('untaetigkeitsklage-widerspruch', '2026-03-06', am(2026, 4, 1))
    );
    expect(iso(frist.fristEndeWerktag)).toBe('2026-06-06');
    expect(frist.fristEndeWerktag.getDay()).toBe(6);
  });
});

describe('Fristen-Übersicht', () => {
  it('berechnet nur Fristen, deren auslösendes Ereignis bekannt ist', () => {
    expect(berechneFristen({}, am(2026, 6, 13)).fristen).toHaveLength(0);

    const nurBescheid = berechneFristen({ bescheidDatum: '2026-06-01' }, am(2026, 6, 13));
    expect(nurBescheid.fristen).toHaveLength(1);
    expect(nurBescheid.fristen[0].typ).toBe('widerspruch');
  });

  it('ignoriert unbrauchbare Datumsangaben, statt zu werfen', () => {
    const uebersicht = berechneFristen(
      { bescheidDatum: '2026-06-01', antragDatum: 'kaputt' },
      am(2026, 6, 13)
    );
    expect(uebersicht.fristen.map((f) => f.typ)).toEqual(['widerspruch']);
  });

  it('sortiert Handlungsbedarf nach oben', () => {
    const uebersicht = berechneFristen(
      { bescheidDatum: '2026-05-15', antragDatum: '2026-04-01' },
      am(2026, 6, 13)
    );

    expect(uebersicht.fristen.map((f) => f.ampelStatus)).toEqual(['rot', 'wartend']);
    expect(uebersicht.fristen[0].typ).toBe('widerspruch');
  });

  it('meldet Eilbedarf samt kritischer Frist im roten Bereich', () => {
    const kritisch = berechneFristen({ bescheidDatum: '2026-05-15' }, am(2026, 6, 13));
    expect(kritisch.hatEilbedarf).toBe(true);
    expect(kritisch.kritischeFrist?.typ).toBe('widerspruch');
  });

  it('meldet keinen Eilbedarf bei komfortabler Restlaufzeit', () => {
    const entspannt = berechneFristen({ bescheidDatum: '2026-05-15' }, am(2026, 5, 20));
    expect(entspannt.hatEilbedarf).toBe(false);
    expect(entspannt.kritischeFrist).toBeNull();
  });

  it('löst keinen Eilbedarf durch eine reine Wartefrist aus', () => {
    // Eine Wartezeit kann nicht versäumt werden — sie darf den Eilhinweis
    // nicht auslösen.
    const uebersicht = berechneFristen({ widerspruchEingelegtAm: '2026-06-12' }, am(2026, 6, 13));
    expect(uebersicht.fristen[0].art).toBe('wartefrist');
    expect(uebersicht.hatEilbedarf).toBe(false);
  });

  it('weist abgelaufene Fristen gesondert aus und sortiert sie ans Ende', () => {
    const uebersicht = berechneFristen(
      { bescheidDatum: '2026-05-15', widerspruchsbescheidDatum: '2026-06-25' },
      am(2026, 7, 1)
    );

    expect(uebersicht.abgelaufeneFristen.map((f) => f.typ)).toEqual(['widerspruch']);
    expect(uebersicht.fristen.at(-1)?.typ).toBe('widerspruch');
  });
});
