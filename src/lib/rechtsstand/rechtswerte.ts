// src/lib/rechtsstand/rechtswerte.ts
/**
 * Der Katalog aller rechtsabhängigen Werte — Fundstelle, Fassung, Prüfdatum.
 *
 * Warum es ihn gibt (Issue #138): Drei P0-Befunde des Rechtsgutachtens waren
 * derselbe Fehler. Ein Rechtsstand stand im Code, ohne dass jemand sehen
 * konnte, wann er zuletzt geprüft wurde — ein Kommentar „Gesetzlicher Satz
 * 2026" über Werten von 2024 behauptet einen Stand, statt ihn zu belegen.
 * Gefunden wurde das von außen, nicht von uns.
 *
 * Die Regeln:
 *
 *  1. **Jeder Eintrag nennt seine Fundstelle und seine Fassung.** Ohne
 *     Fundstelle kein Eintrag.
 *  2. **Geprüft ist nur, was einen Prüfvermerk trägt.** `geprueft: null`
 *     bedeutet ungeprüft und muss ein Ticket nennen. Das ist keine Schande,
 *     sondern der ehrliche Zustand.
 *  3. **Ändert sich ein Wert, wird die alte Zeile nicht überschrieben.** Es
 *     kommt eine neue Zeile mit späterem `gueltigAb` dazu. Gerechnet wird mit
 *     der Fassung, die zum maßgeblichen Datum galt — etwa dem Bescheiddatum,
 *     nicht dem heutigen Tag.
 *  4. **Prüfvermerke veralten.** `rechtswerte.test.ts` schlägt fehl, sobald
 *     eine Prüfung älter als ein Jahr ist. Das ist der jährliche Termin aus
 *     #138, nur ohne Kalendereintrag, den niemand liest.
 *
 * Die Werte stehen weiterhin dort, wo gerechnet wird (`nba.ts`, `fristen.ts`,
 * `constants.ts`); der Katalog ist die Stelle, an der man sie ohne Suche
 * durchgeht. `rechtswerte.test.ts` gleicht beide Seiten ab, damit sie nicht
 * auseinanderlaufen.
 */

/** Art der Prüfung — der Unterschied entscheidet, worauf man sich berufen kann. */
export type Pruefart =
  /** Normtext nachgeschlagen: Stimmt Zahl und Fundstelle? Keine Auslegung. */
  | 'normtext'
  /** Sozialrechtlich beurteilt, mit Qualifikation und Verantwortung. */
  | 'fachlich';

export interface Pruefvermerk {
  /** ISO-Datum der Prüfung. */
  am: string;
  /** Wer geprüft hat. „Team, hausintern" ist zulässig — und sagt genau das. */
  durch: string;
  art: Pruefart;
}

export interface Rechtswert {
  /** Stabiler Schlüssel. Wird nie umbenannt, sonst reißt die Historie ab. */
  schluessel: string;
  bezeichnung: string;
  /** Einzelwert oder Wertegruppe (z. B. Beträge je Pflegegrad). */
  wert: number | Record<string, number>;
  einheit: string;
  /** Ab wann diese Fassung gilt (ISO-Datum). */
  gueltigAb: string;
  /** Die Norm, nicht die Quelle: „§ 15 Abs. 3 SGB XI". */
  fundstelle: string;
  /** Woher der Wert stammt — Gesetzestext, Richtlinie, amtliche Bekanntmachung. */
  quelle: string;
  /** `null` heißt ungeprüft. Dann muss `hinweis` das zuständige Ticket nennen. */
  geprueft: Pruefvermerk | null;
  hinweis?: string;
}

const GESETZE_IM_INTERNET = 'https://www.gesetze-im-internet.de';

/** Prüfung der Normbezeichnungen vom 16.09.2026 (#133, #137). */
const NORMTEXT_16_09_2026: Pruefvermerk = {
  am: '2026-09-16',
  durch: 'Team, hausintern',
  art: 'normtext',
};

/**
 * Alle rechtsabhängigen Werte. Nach Schlüssel und innerhalb eines Schlüssels
 * nach `gueltigAb` aufsteigend.
 */
export const RECHTSWERTE: readonly Rechtswert[] = [
  {
    schluessel: 'pflegegrad.schwellen',
    bezeichnung: 'Gesamtpunkte-Schwellen der Pflegegrade 1 bis 5',
    wert: { 1: 12.5, 2: 27, 3: 47.5, 4: 70, 5: 90 },
    einheit: 'Gesamtpunkte',
    gueltigAb: '2017-01-01',
    fundstelle: '§ 15 Abs. 3 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__15.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'pflegegrad.modulgewichte',
    bezeichnung: 'Gewichtung der Module 1 bis 6 in Prozent',
    wert: { 1: 10, 2: 15, 3: 15, 4: 40, 5: 20, 6: 15 },
    einheit: 'Prozent',
    gueltigAb: '2017-01-01',
    fundstelle: '§ 15 Abs. 3 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__15.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis:
      'Von Modul 2 und 3 zählt nur der höhere Wert; die Summe der wirksamen Gewichte ergibt 100.',
  },
  {
    schluessel: 'pflegegrad.kriterien.amtlich',
    bezeichnung: 'Zahl der Kriterien je Modul im amtlichen Begutachtungsinstrument',
    wert: { 1: 5, 2: 11, 3: 13, 4: 13, 5: 16, 6: 6 },
    einheit: 'Kriterien',
    gueltigAb: '2017-01-01',
    fundstelle: 'Anlage 1 zu § 15 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/anlage_1.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis: 'Unser Fragebogen erhebt 28 davon — siehe MODULE_KRITERIEN in nba.ts (#137).',
  },
  {
    schluessel: 'fristen.widerspruch',
    bezeichnung: 'Widerspruchsfrist ab Bekanntgabe des Bescheids',
    wert: 1,
    einheit: 'Monate',
    gueltigAb: '1975-01-01',
    fundstelle: '§ 84 Abs. 1 SGG',
    quelle: `${GESETZE_IM_INTERNET}/sgg/__84.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'fristen.klage',
    bezeichnung: 'Klagefrist ab Bekanntgabe des Widerspruchsbescheids',
    wert: 1,
    einheit: 'Monate',
    gueltigAb: '1975-01-01',
    fundstelle: '§ 87 Abs. 1 SGG',
    quelle: `${GESETZE_IM_INTERNET}/sgg/__87.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'fristen.untaetigkeitsklage.widerspruch',
    bezeichnung: 'Wartezeit bis zur Untätigkeitsklage bei unbeschiedenem Widerspruch',
    wert: 3,
    einheit: 'Monate',
    gueltigAb: '1975-01-01',
    fundstelle: '§ 88 Abs. 2 SGG',
    quelle: `${GESETZE_IM_INTERNET}/sgg/__88.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'fristen.untaetigkeitsklage.antrag',
    bezeichnung: 'Wartezeit bis zur Untätigkeitsklage bei unbeschiedenem Antrag',
    wert: 6,
    einheit: 'Monate',
    gueltigAb: '1975-01-01',
    fundstelle: '§ 88 Abs. 1 SGG',
    quelle: `${GESETZE_IM_INTERNET}/sgg/__88.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'fristen.bearbeitung.entscheidung',
    bezeichnung: 'Frist der Pflegekasse für die schriftliche Entscheidung',
    wert: 25,
    einheit: 'Arbeitstage',
    gueltigAb: '2023-07-01',
    fundstelle: '§ 18c Abs. 1 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__18c.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis:
      'Vor der Neugliederung durch das PUEG stand die Frist in § 18; deshalb zitierte der Code eine Vorschrift, die heute die Beauftragung der Gutachter regelt (#133).',
  },
  {
    schluessel: 'fristen.bearbeitung.saeumniszuschlag',
    bezeichnung: 'Zahlung je begonnener Woche der Fristüberschreitung',
    wert: 70,
    einheit: 'Euro je begonnener Woche',
    gueltigAb: '2023-07-01',
    fundstelle: '§ 18c Abs. 5 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__18c.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis: 'Entfällt, wenn die Pflegekasse die Verzögerung nicht zu vertreten hat.',
  },
  {
    schluessel: 'fristen.begutachtung.verkuerzt.stationaer',
    bezeichnung:
      'Begutachtung im Krankenhaus, in stationärer Reha, im Hospiz oder bei ambulanter Palliativversorgung',
    wert: 5,
    einheit: 'Arbeitstage',
    gueltigAb: '2023-07-01',
    fundstelle: '§ 18a Abs. 5 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__18a.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis:
      'Im Code stand dafür „eine Woche". Eine Woche ist nicht dasselbe wie fünf Arbeitstage.',
  },
  {
    schluessel: 'fristen.begutachtung.verkuerzt.pflegezeit',
    bezeichnung: 'Begutachtung bei angekündigter Pflegezeit oder vereinbarter Familienpflegezeit',
    wert: 10,
    einheit: 'Arbeitstage',
    gueltigAb: '2023-07-01',
    fundstelle: '§ 18a Abs. 6 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__18a.html`,
    geprueft: NORMTEXT_16_09_2026,
  },
  {
    schluessel: 'leistungen.pflegegeld',
    bezeichnung: 'Pflegegeld je Pflegegrad, monatlich',
    wert: { 1: 0, 2: 332, 3: 573, 4: 765, 5: 947 },
    einheit: 'Euro je Monat',
    gueltigAb: '2022-01-01',
    fundstelle: '§ 37 Abs. 1 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__37.html`,
    geprueft: null,
    hinweis:
      'Diese Fassung setzt der Code ein (`NBA_CONFIG.BENEFITS`), mit dem Kommentar „Gesetzlicher Satz 2026". Sie ist seit dem 01.01.2025 überholt — siehe nächste Fassung. `gueltigAb` ist hier eine Annahme, kein Beleg; die Aktualisierung ist #107.',
  },
  {
    schluessel: 'leistungen.pflegegeld',
    bezeichnung: 'Pflegegeld je Pflegegrad, monatlich',
    wert: { 1: 0, 2: 347, 3: 599, 4: 800, 5: 990 },
    einheit: 'Euro je Monat',
    gueltigAb: '2025-01-01',
    fundstelle: '§ 37 Abs. 1 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__37.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis:
      'GELTENDES RECHT, vom Code noch nicht übernommen. Bekanntmachung vom 14.11.2024; gilt im Jahr 2026 unverändert fort — die Erhöhung um 4,5 Prozent zum 01.01.2025 war die erste Dynamisierung, die nächste folgt nach § 30 SGB XI zum 01.01.2028 und danach im Dreijahresrhythmus. Die Umstellung ist #107 — erst danach zeigt das Portal die richtigen Beträge.',
  },
  {
    schluessel: 'leistungen.entlastungsbetrag',
    bezeichnung: 'Entlastungsbetrag, monatlich',
    wert: 125,
    einheit: 'Euro je Monat',
    gueltigAb: '2017-01-01',
    fundstelle: '§ 45b Abs. 1 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__45b.html`,
    geprueft: null,
    hinweis:
      'Diese Fassung setzt der Code ein. Seit dem 01.01.2025 überholt, siehe nächste Zeile; Umstellung ist #107.',
  },
  {
    schluessel: 'leistungen.entlastungsbetrag',
    bezeichnung: 'Entlastungsbetrag, monatlich',
    wert: 131,
    einheit: 'Euro je Monat',
    gueltigAb: '2025-01-01',
    fundstelle: '§ 45b Abs. 1 SGB XI',
    quelle: `${GESETZE_IM_INTERNET}/sgb_11/__45b.html`,
    geprueft: NORMTEXT_16_09_2026,
    hinweis:
      'GELTENDES RECHT, vom Code noch nicht übernommen — #107. Gilt im Jahr 2026 unverändert fort; nächste Dynamisierung zum 01.01.2028 (§ 30 SGB XI).',
  },
  {
    schluessel: 'gdb.verguenstigungen.schwellen',
    bezeichnung: 'GdB-Schwellen, ab denen Nachteilsausgleiche in Betracht kommen',
    wert: { steuerfreibetrag: 20, gleichstellung: 30, schwerbehinderung: 50, merkzeichen: 80 },
    einheit: 'Grad der Behinderung',
    gueltigAb: '2017-01-01',
    fundstelle: '§ 2 Abs. 2, § 151 Abs. 2 SGB IX (Schwerbehinderung, Gleichstellung)',
    quelle: `${GESETZE_IM_INTERNET}/sgb_9_2018/__2.html`,
    geprueft: null,
    hinweis:
      'UNGEPRÜFT. Der Katalog in `gdb/_constants/verguenstigungen.ts` ordnet den Schwellen konkrete Vergünstigungen zu; diese Zuordnung ist nicht belegt. Wird derzeit nicht angezeigt, weil der GdB-Rechner abgeschaltet ist (#131). Zu klären mit #26 und #27.',
  },
  {
    schluessel: 'gdb.gesamtschau',
    bezeichnung: 'Bildung des Gesamt-GdB',
    wert: 0,
    einheit: 'keine Zahl — wertende Gesamtschau',
    gueltigAb: '2025-10-03',
    fundstelle: 'Anlage zu § 2 VersMedV, Teil A Nr. 3.2',
    quelle: `${GESETZE_IM_INTERNET}/versmedv/anlage.html`,
    geprueft: null,
    hinweis:
      'Kein Zahlenwert, sondern der Grund für eine Abschaltung: Addition und Mittelwertbildung sind ausgeschlossen. Der Rechner ist deshalb abgeschaltet (#131); eine tragfähige Gesamtschau ist #26.',
  },
];

/** Alle Fassungen eines Schlüssels, älteste zuerst. */
export function fassungen(schluessel: string): Rechtswert[] {
  return RECHTSWERTE.filter((wert) => wert.schluessel === schluessel).sort((a, b) =>
    a.gueltigAb.localeCompare(b.gueltigAb)
  );
}

/**
 * Die Fassung, die zum Stichtag galt — nicht „der aktuelle Wert".
 *
 * Für einen Bescheid vom März gilt das Recht vom März, auch wenn im Juli etwas
 * anderes gilt. Deshalb nimmt jede Auswertung ein Datum entgegen.
 *
 * @returns `null`, wenn zum Stichtag noch keine Fassung galt.
 */
export function rechtswertAm(schluessel: string, stichtag: Date | string): Rechtswert | null {
  const tag = typeof stichtag === 'string' ? stichtag : stichtag.toISOString().slice(0, 10);

  return (
    fassungen(schluessel)
      .filter((wert) => wert.gueltigAb <= tag)
      .at(-1) ?? null
  );
}

/** Einträge ohne Prüfvermerk — der ehrliche Rest, den jemand angehen muss. */
export function ungeprüfteWerte(): Rechtswert[] {
  return RECHTSWERTE.filter((wert) => wert.geprueft === null);
}
