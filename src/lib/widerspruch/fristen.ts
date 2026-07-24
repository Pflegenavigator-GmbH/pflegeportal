// src/lib/widerspruch/fristen.ts
/**
 * Fristen-Monitor für das sozialrechtliche Rechtsbehelfsverfahren.
 *
 * Bewusst reine Domänenlogik ohne Seiteneffekte (kein Logger, kein I/O):
 * auf Server und Client identisch nutzbar und ohne Mocks testbar.
 *
 * Fristenlauf nach § 64 SGG:
 *  - Abs. 1: Der Lauf beginnt mit dem Tag nach dem auslösenden Ereignis.
 *  - Abs. 2: Eine Monatsfrist endet mit Ablauf des Tages, der dem Ereignistag
 *    der Benennung nach entspricht (Zugang am 15.05. → Ende 15.06.).
 *  - Abs. 3: Fällt das Ende auf Samstag, Sonntag oder Feiertag, endet die
 *    Frist mit Ablauf des nächstfolgenden Werktags.
 *
 * Abgegrenzt werden zwei Fristarten, weil sie gegenläufig wirken:
 *  - Ausschlussfrist  — läuft ab, danach ist der Rechtsbehelf verfristet.
 *  - Wartefrist       — muss verstreichen, erst danach ist die Klage zulässig.
 */
import { addDays, addMonths, differenceInDays, format } from 'date-fns';

export type AmpelStatus = 'gruen' | 'gelb' | 'rot' | 'abgelaufen' | 'wartend';

export type FristArt = 'ausschlussfrist' | 'wartefrist';

export type FristTyp =
  'widerspruch' | 'klage' | 'untaetigkeitsklage-widerspruch' | 'untaetigkeitsklage-antrag';

/** Feld in {@link FristenEingaben}, an dem die jeweilige Frist hängt. */
export type FristAnker =
  'bescheidDatum' | 'widerspruchsbescheidDatum' | 'widerspruchEingelegtAm' | 'antragDatum';

export interface FristDefinition {
  bezeichnung: string;
  kurz: string;
  gesetz: string;
  art: FristArt;
  fristMonate: number;
  anker: FristAnker;
  ankerBezeichnung: string;
  hinweis: string;
}

export interface Frist extends Omit<FristDefinition, 'anker'> {
  typ: FristTyp;
  /** Auslösendes Ereignis (auf lokale Mitternacht normalisiert). */
  startDatum: Date;
  /** Kalendarisches Fristende vor Anwendung der Werktagsregel. */
  fristEnde: Date;
  /** Wirksames Fristende nach § 64 Abs. 3 SGG (nur Ausschlussfristen). */
  fristEndeWerktag: Date;
  /** Tage bis zum Fristende. Negativ = überschritten (nicht gekappt). */
  verbleibendeTage: number;
  /** Nur Ausschlussfristen: Rechtsbehelf ist verfristet. */
  istAbgelaufen: boolean;
  /** Nur Wartefristen: Wartezeit verstrichen, Klage ist zulässig. */
  istVerfuegbar: boolean;
  ampelStatus: AmpelStatus;
}

export interface FristenEingaben {
  /** Zugang des Ausgangsbescheids — löst die Widerspruchsfrist aus. */
  bescheidDatum?: Date | string | null;
  /** Zugang des Widerspruchsbescheids — löst die Klagefrist aus. */
  widerspruchsbescheidDatum?: Date | string | null;
  /** Eingang des Widerspruchs bei der Kasse — startet § 88 Abs. 2 SGG. */
  widerspruchEingelegtAm?: Date | string | null;
  /** Eingang des Leistungsantrags — startet § 88 Abs. 1 SGG. */
  antragDatum?: Date | string | null;
}

export interface FristenUebersicht {
  /** Alle berechenbaren Fristen, nach Dringlichkeit sortiert. */
  fristen: Frist[];
  /** Dringendste offene Ausschlussfrist im roten Bereich. */
  kritischeFrist: Frist | null;
  abgelaufeneFristen: Frist[];
  /** Steuert den prominenten Warnhinweis inkl. Eilantrag-Empfehlung. */
  hatEilbedarf: boolean;
}

/* ------------------------------------------------------------------ *
 * Ampel-Schwellen
 * ------------------------------------------------------------------ */

/** Oberhalb dieser Tagesgrenze ist die Ampel grün. */
export const AMPEL_SCHWELLE_GRUEN = 14;
/** Ab dieser Tagesgrenze ist die Ampel gelb, darunter rot. */
export const AMPEL_SCHWELLE_GELB = 3;

/**
 * Ampel einer ablaufenden Frist: grün > 14 Tage, gelb 3–14 Tage,
 * rot < 3 Tage, abgelaufen bei überschrittener Frist.
 */
export function ampelStatusFuerTage(verbleibendeTage: number): Exclude<AmpelStatus, 'wartend'> {
  if (verbleibendeTage < 0) return 'abgelaufen';
  if (verbleibendeTage > AMPEL_SCHWELLE_GRUEN) return 'gruen';
  if (verbleibendeTage >= AMPEL_SCHWELLE_GELB) return 'gelb';
  return 'rot';
}

/* ------------------------------------------------------------------ *
 * Datums-Normalisierung
 * ------------------------------------------------------------------ */

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normalisiert eine Datumsangabe auf lokale Mitternacht.
 *
 * Reine ISO-Datumsstrings werden bewusst komponentenweise geparst:
 * `new Date('2026-06-10')` ergibt UTC-Mitternacht und kippt in Zeitzonen
 * westlich von Greenwich auf den Vortag — bei Fristen ein Tag zu früh.
 *
 * @returns normalisiertes Datum oder `null`, wenn die Angabe unbrauchbar ist.
 */
export function zuLokalemTagesbeginn(wert: Date | string): Date | null {
  if (typeof wert === 'string') {
    const roh = wert.trim();
    if (!roh) return null;

    if (ISO_DATUM.test(roh)) {
      const [jahr, monat, tag] = roh.split('-').map(Number);
      const datum = new Date(jahr, monat - 1, tag);
      // Überläufe wie 2026-02-31 rollen still weiter — hier abfangen.
      const istGueltig =
        datum.getFullYear() === jahr && datum.getMonth() === monat - 1 && datum.getDate() === tag;
      return istGueltig ? datum : null;
    }

    const datum = new Date(roh);
    if (Number.isNaN(datum.getTime())) return null;
    datum.setHours(0, 0, 0, 0);
    return datum;
  }

  if (Number.isNaN(wert.getTime())) return null;
  const datum = new Date(wert);
  datum.setHours(0, 0, 0, 0);
  return datum;
}

/* ------------------------------------------------------------------ *
 * Werktage & Feiertage
 * ------------------------------------------------------------------ */

/**
 * Ostersonntag nach der anonymen gregorianischen Osterformel
 * (Meeus/Jones/Butcher). Berechnet statt tabelliert, damit auch die
 * 6-Monats-Frist des § 88 Abs. 1 SGG über Jahresgrenzen hinweg trägt.
 */
function ostersonntag(jahr: number): Date {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31); // 3 = März, 4 = April
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, tag);
}

/** Bundeseinheitliche Feiertage; länderspezifische bleiben außen vor. */
const FESTE_FEIERTAGE = ['01-01', '05-01', '10-03', '12-25', '12-26'];

/** Osterabstände: Karfreitag, Ostermontag, Christi Himmelfahrt, Pfingstmontag. */
const BEWEGLICHE_FEIERTAGE_VERSATZ = [-2, 1, 39, 50];

const feiertagCache = new Map<number, Set<string>>();

function feiertageFuerJahr(jahr: number): Set<string> {
  const gecached = feiertagCache.get(jahr);
  if (gecached) return gecached;

  const ostern = ostersonntag(jahr);
  const tage = new Set([
    ...FESTE_FEIERTAGE,
    ...BEWEGLICHE_FEIERTAGE_VERSATZ.map((versatz) => format(addDays(ostern, versatz), 'MM-dd')),
  ]);

  feiertagCache.set(jahr, tage);
  return tage;
}

export function istFeiertag(datum: Date): boolean {
  return feiertageFuerJahr(datum.getFullYear()).has(format(datum, 'MM-dd'));
}

export function istWochenende(datum: Date): boolean {
  const tag = datum.getDay();
  return tag === 0 || tag === 6;
}

/** Verschiebt auf den nächsten Werktag (§ 64 Abs. 3 SGG). */
export function naechsterWerktag(datum: Date): Date {
  let kandidat = new Date(datum);
  while (istWochenende(kandidat) || istFeiertag(kandidat)) {
    kandidat = addDays(kandidat, 1);
  }
  return kandidat;
}

/* ------------------------------------------------------------------ *
 * Fristen-Katalog
 * ------------------------------------------------------------------ */

export const FRIST_DEFINITIONEN: Record<FristTyp, FristDefinition> = {
  widerspruch: {
    bezeichnung: 'Widerspruch gegen den Bescheid',
    kurz: 'Widerspruch',
    gesetz: '§ 84 Abs. 1 SGG',
    art: 'ausschlussfrist',
    fristMonate: 1,
    anker: 'bescheidDatum',
    ankerBezeichnung: 'Zugang des Bescheids',
    hinweis:
      'Der Widerspruch muss innerhalb eines Monats nach Bekanntgabe des Bescheids bei der Pflegekasse eingehen. Maßgeblich ist der Eingang dort, nicht das Absendedatum.',
  },
  klage: {
    bezeichnung: 'Klage beim Sozialgericht',
    kurz: 'Klage',
    gesetz: '§ 87 Abs. 1 SGG',
    art: 'ausschlussfrist',
    fristMonate: 1,
    anker: 'widerspruchsbescheidDatum',
    ankerBezeichnung: 'Zugang des Widerspruchsbescheids',
    hinweis:
      'Nach einem ablehnenden Widerspruchsbescheid bleibt ein Monat für die Klage beim Sozialgericht. Für Versicherte ist das Verfahren gerichtskostenfrei (§ 183 SGG).',
  },
  'untaetigkeitsklage-widerspruch': {
    bezeichnung: 'Untätigkeitsklage — Widerspruch unbeschieden',
    kurz: 'Untätigkeitsklage',
    gesetz: '§ 88 Abs. 2 SGG',
    art: 'wartefrist',
    fristMonate: 3,
    anker: 'widerspruchEingelegtAm',
    ankerBezeichnung: 'Eingang des Widerspruchs',
    hinweis:
      'Entscheidet die Pflegekasse drei Monate lang ohne zureichenden Grund nicht über den Widerspruch, ist die Untätigkeitsklage zulässig. Das ist keine ablaufende Frist, sondern eine Wartezeit.',
  },
  'untaetigkeitsklage-antrag': {
    bezeichnung: 'Untätigkeitsklage — Antrag unbeschieden',
    kurz: 'Untätigkeitsklage',
    gesetz: '§ 88 Abs. 1 SGG',
    art: 'wartefrist',
    fristMonate: 6,
    anker: 'antragDatum',
    ankerBezeichnung: 'Eingang des Antrags',
    hinweis:
      'Bleibt ein Antrag sechs Monate ohne Bescheid, ist die Untätigkeitsklage zulässig. Unabhängig davon muss die Pflegekasse bereits binnen 25 Arbeitstagen entscheiden (§ 18 Abs. 3 SGB XI).',
  },
};

/**
 * Rechtsgrundlagen für den Eilhinweis bei kritischer Frist.
 * Zentral gehalten, damit Gesetzesbezüge an einer Stelle gepflegt werden.
 */
export const EILANTRAG_RECHTSGRUNDLAGEN = {
  bearbeitungsfrist: {
    gesetz: '§ 18 Abs. 3 SGB XI',
    text: 'Die Pflegekasse muss Ihnen das Begutachtungsergebnis spätestens 25 Arbeitstage nach Antragseingang mitteilen; in Krankenhaus-, Hospiz- oder Pflegezeit-Fällen gelten verkürzte Fristen von einer bzw. zwei Wochen.',
  },
  saeumniszuschlag: {
    gesetz: '§ 18 Abs. 3b SGB XI',
    text: 'Überschreitet die Pflegekasse diese Frist, hat sie 70 Euro für jede begonnene Woche der Verspätung zu zahlen.',
  },
  eilrechtsschutz: {
    gesetz: '§ 86b Abs. 2 SGG',
    text: 'Bei drohenden schweren Nachteilen kann beim Sozialgericht eine einstweilige Anordnung beantragt werden — der Eilantrag ist gerichtskostenfrei und formlos möglich.',
  },
} as const;

/* ------------------------------------------------------------------ *
 * Berechnung
 * ------------------------------------------------------------------ */

/** Reihenfolge im Monitor: Handlungsbedarf zuerst, Erledigtes zuletzt. */
const DRINGLICHKEIT: Record<AmpelStatus, number> = {
  rot: 0,
  gelb: 1,
  gruen: 2,
  wartend: 3,
  abgelaufen: 4,
};

/**
 * Berechnet eine einzelne Frist ab ihrem auslösenden Ereignis.
 *
 * @param referenzDatum Vergleichszeitpunkt — in Tests injizierbar.
 * @returns `null`, wenn das Ankerdatum ungültig ist.
 */
export function berechneFristFuerTyp(
  typ: FristTyp,
  ankerDatum: Date | string,
  referenzDatum: Date = new Date()
): Frist | null {
  const startDatum = zuLokalemTagesbeginn(ankerDatum);
  if (!startDatum) return null;

  const heute = zuLokalemTagesbeginn(referenzDatum);
  if (!heute) return null;

  const definition = FRIST_DEFINITIONEN[typ];
  const istAusschlussfrist = definition.art === 'ausschlussfrist';

  const fristEnde = addMonths(startDatum, definition.fristMonate);
  // Die Werktagsregel schützt vor verfrühtem Fristablauf und gilt daher nur
  // für Ausschlussfristen. Eine Wartefrist benennt den frühesten zulässigen
  // Zeitpunkt und darf nicht nach vorne verschoben werden.
  const fristEndeWerktag = istAusschlussfrist ? naechsterWerktag(fristEnde) : fristEnde;

  const verbleibendeTage = differenceInDays(fristEndeWerktag, heute);

  // Fristen enden mit Ablauf des Tages: am Fristtag selbst (0 Tage) ist die
  // Handlung noch fristwahrend, die Wartezeit aber noch nicht verstrichen.
  const istAbgelaufen = istAusschlussfrist && verbleibendeTage < 0;
  const istVerfuegbar = !istAusschlussfrist && verbleibendeTage < 0;

  const ampelStatus: AmpelStatus = istAusschlussfrist
    ? ampelStatusFuerTage(verbleibendeTage)
    : istVerfuegbar
      ? 'gruen'
      : 'wartend';

  // Felder bewusst einzeln übernommen: `anker` ist reine Katalog-Metadatei
  // und gehört nicht in das Ergebnisobjekt.
  return {
    typ,
    bezeichnung: definition.bezeichnung,
    kurz: definition.kurz,
    gesetz: definition.gesetz,
    art: definition.art,
    fristMonate: definition.fristMonate,
    ankerBezeichnung: definition.ankerBezeichnung,
    hinweis: definition.hinweis,
    startDatum,
    fristEnde,
    fristEndeWerktag,
    verbleibendeTage,
    istAbgelaufen,
    istVerfuegbar,
    ampelStatus,
  };
}

/**
 * Berechnet alle aus den vorliegenden Daten ableitbaren Verfahrensfristen.
 *
 * Jede Frist hat ein eigenes auslösendes Ereignis — die Klagefrist läuft ab
 * dem Widerspruchsbescheid, nicht ab dem Ausgangsbescheid. Fristen ohne
 * bekanntes Ankerdatum bleiben deshalb bewusst unberechnet, statt eine
 * scheingenaue Angabe zu erzeugen.
 */
export function berechneFristen(
  eingaben: FristenEingaben,
  referenzDatum: Date = new Date()
): FristenUebersicht {
  const typen = Object.keys(FRIST_DEFINITIONEN) as FristTyp[];

  const fristen = typen
    .map((typ) => {
      const ankerDatum = eingaben[FRIST_DEFINITIONEN[typ].anker];
      return ankerDatum ? berechneFristFuerTyp(typ, ankerDatum, referenzDatum) : null;
    })
    .filter((frist): frist is Frist => frist !== null)
    .sort(
      (a, b) =>
        DRINGLICHKEIT[a.ampelStatus] - DRINGLICHKEIT[b.ampelStatus] ||
        a.fristEndeWerktag.getTime() - b.fristEndeWerktag.getTime()
    );

  const kritischeFrist =
    fristen.find((frist) => frist.art === 'ausschlussfrist' && frist.ampelStatus === 'rot') ?? null;

  return {
    fristen,
    kritischeFrist,
    abgelaufeneFristen: fristen.filter((frist) => frist.istAbgelaufen),
    hatEilbedarf: kritischeFrist !== null,
  };
}
