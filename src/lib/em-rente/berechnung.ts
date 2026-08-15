// src/lib/em-rente/berechnung.ts
/**
 * Projektion einer Erwerbsminderungsrente nach SGB VI.
 *
 * Die frühere Fassung stand direkt in der Seite und rechnete falsch. Die drei
 * schwerwiegendsten Fehler, damit sie nicht zurückkehren:
 *
 * 1. Eine „Pflege-Personal-Zulage" von 201,06 / 302,65 / 403,53 € je nach
 *    Pflegegrad. Eine solche Leistung gibt es im SGB VI nicht. Der Pflegegrad
 *    erhöht die Erwerbsminderungsrente an keiner Stelle — er steuert
 *    Leistungen der Pflegeversicherung (SGB XI), nicht der
 *    Rentenversicherung. Die Zulage ist ersatzlos entfallen.
 * 2. Eine Deckelung auf 45 Entgeltpunkte insgesamt. Gedeckelt ist nicht die
 *    Summe, sondern der Jahreswert: über der Beitragsbemessungsgrenze werden
 *    keine Beiträge mehr erhoben (§ 159 SGB VI).
 * 3. Zurechnungszeit (§ 59 SGB VI) und Zugangsfaktor (§ 77 SGB VI) fehlten
 *    vollständig. Beide bewegen das Ergebnis um zweistellige Prozentsätze —
 *    die Zurechnungszeit nach oben, der Abschlag nach unten. Eine Rechnung
 *    ohne sie ist nicht ungenau, sondern unbrauchbar.
 *
 * Was diese Rechnung weiterhin NICHT kann: die versicherungsrechtlichen
 * Voraussetzungen prüfen (§ 43 Abs. 1 Nr. 2 SGB VI verlangt drei Jahre
 * Pflichtbeiträge in den letzten fünf Jahren — dafür braucht es den
 * Versicherungsverlauf), Grundrentenzuschlag, Höherbewertung von
 * Berufsausbildungszeiten oder Beitragszeiten in der DDR. Das Ergebnis ist
 * eine Größenordnung für die eigene Planung, kein Bescheid.
 */

/**
 * Rechengrößen der Rentenversicherung. Sie ändern sich jährlich — der
 * Rentenwert zum 1. Juli, die Entgeltwerte zum 1. Januar. Deshalb stehen sie
 * hier zusammen und mit Stichtag, statt verstreut im Code.
 *
 * WARTUNG: Diese vier Zahlen sind jedes Jahr gegen die
 * Sozialversicherungsrechengrößen-Verordnung und die
 * Rentenwertbestimmungsverordnung zu prüfen.
 */
export const RECHENGROESSEN = {
  /** Aktueller Rentenwert je Entgeltpunkt und Monat, § 1 RWBestV 2026 (ab 1. Juli 2026). */
  rentenwertEuro: 42.52,
  /** Vorläufiges Durchschnittsentgelt 2026, § 3 Abs. 2 SVBezGrV 2026 i.V.m. § 69 Abs. 2 SGB VI. */
  durchschnittsentgeltEuro: 51944,
  /** Beitragsbemessungsgrenze der allgemeinen Rentenversicherung, § 4 Abs. 1 Nr. 1 SVBezGrV 2026. */
  beitragsbemessungsgrenzeEuro: 101400,
  /**
   * Monatliche Bezugsgröße, § 1 SVBezGrV 2026 (jährlich 47.460 €).
   *
   * Geht NICHT in die Rentenformel ein — sie bemisst allein die
   * Hinzuverdienstgrenze nach § 96a SGB VI.
   */
  bezugsgroesseMonatEuro: 3955,
  /** Stichtag der obigen Werte — wird in der Oberfläche ausgewiesen. */
  stand: '2026',
} as const;

/** Abschlag je Monat vorzeitigen Rentenbeginns (§ 77 Abs. 2 SGB VI). */
const ABSCHLAG_JE_MONAT = 0.003;

/** Der Abschlag ist auf 36 Monate begrenzt — höchstens 10,8 %. */
const MAX_ABSCHLAGSMONATE = 36;

/**
 * Referenzalter für den Abschlag: das vollendete 65. Lebensjahr
 * (§ 77 Abs. 2 Satz 1 Nr. 3 SGB VI, Anhebung seit 2024 abgeschlossen).
 */
const ABSCHLAG_REFERENZALTER_JAHRE = 65;

/**
 * Rentenartfaktor (§ 67 SGB VI).
 *
 * `berufsunfaehig` ist medizinisch etwas anderes als `teilweise`, führt aber
 * zur selben Rentenart: § 240 SGB VI gewährt ausdrücklich eine „Rente wegen
 * teilweiser Erwerbsminderung". Der Faktor ist deshalb gleich, der Weg dorthin
 * nicht — siehe `hatBerufsschutz`.
 */
const RENTENARTFAKTOR = { voll: 1.0, teilweise: 0.5, berufsunfaehig: 0.5 } as const;

export type Erwerbsminderungsart = keyof typeof RENTENARTFAKTOR;

/**
 * Stichtag des Berufsschutzes: § 240 Abs. 1 SGB VI gilt für Versicherte, die
 * „vor dem 2. Januar 1961 geboren" sind.
 *
 * Bewusst als Datum und nicht als Jahreszahl: Wer am 1. Januar 1961 geboren
 * ist, hat noch Berufsschutz. Eine Prüfung `geburtsjahr < 1961` würde genau
 * diesen Tag verschlucken und den Anspruch zu Unrecht verneinen.
 */
const BERUFSSCHUTZ_STICHTAG = new Date(1961, 0, 2);

/**
 * Besteht Berufsschutz nach § 240 SGB VI?
 *
 * Berufsunfähig ist, wessen Erwerbsfähigkeit im erlernten oder gleichwertigen
 * Beruf unter sechs Stunden gesunken ist (§ 240 Abs. 2). Das ist ein milderer
 * Maßstab als § 43, der auf den allgemeinen Arbeitsmarkt abstellt — deshalb
 * kann jemand berufsunfähig sein, ohne erwerbsgemindert zu sein. Für alle ab
 * dem 2. Januar 1961 Geborenen ist dieser Weg ersatzlos entfallen.
 */
export function hatBerufsschutz(geburtsdatum: string): boolean {
  const geburt = new Date(geburtsdatum);
  if (Number.isNaN(geburt.getTime())) return false;
  return geburt < BERUFSSCHUTZ_STICHTAG;
}

/**
 * Ende der Zurechnungszeit in Monaten nach § 253a SGB VI.
 *
 * Die Zurechnungszeit stellt Erwerbsgeminderte so, als hätten sie bis zu
 * diesem Alter weitergearbeitet. Sie endete 2019 mit 65 Jahren und 8 Monaten
 * und steigt bis 2031 auf 67 Jahre: bis 2027 um einen Monat je Kalenderjahr,
 * danach um zwei.
 */
export function zurechnungszeitEndeInMonaten(jahrDesEintritts: number): number {
  if (jahrDesEintritts <= 2019) return 65 * 12 + 8;
  if (jahrDesEintritts >= 2031) return 67 * 12;

  if (jahrDesEintritts <= 2027) {
    return 65 * 12 + 8 + (jahrDesEintritts - 2019);
  }
  // Ab 2028 zwei Monate je Jahr, aufsetzend auf dem Wert für 2027.
  return 65 * 12 + 8 + (2027 - 2019) + (jahrDesEintritts - 2027) * 2;
}

/**
 * Jährliche Hinzuverdienstgrenze nach § 96a Abs. 1c SGB VI.
 *
 * Hier — und nur hier — kommt die Bezugsgröße ins Spiel; in die Rentenformel
 * des § 64 geht sie nicht ein.
 *
 * - Volle Erwerbsminderung: drei Achtel der 14fachen monatlichen Bezugsgröße.
 * - Teilweise Erwerbsminderung (auch über § 240): das 9,72fache der
 *   monatlichen Bezugsgröße, vervielfältigt mit den höchsten Entgeltpunkten
 *   der letzten 15 Kalenderjahre, mindestens aber sechs Achtel der 14fachen
 *   monatlichen Bezugsgröße.
 *
 * VEREINFACHUNG mit Ansage: Für die „höchsten Entgeltpunkte der letzten 15
 * Kalenderjahre" fehlt dem Rechner der Versicherungsverlauf. Er setzt
 * ersatzweise die Punkte des angegebenen Durchschnittsentgelts an. Wer früher
 * mehr verdient hat, hat real eine höhere Grenze — die Projektion bleibt also
 * auf der vorsichtigen Seite.
 */
export function hinzuverdienstgrenzeEuro(
  art: Erwerbsminderungsart,
  entgeltpunkteProJahr: number
): number {
  const bezug = RECHENGROESSEN.bezugsgroesseMonatEuro;

  if (art === 'voll') {
    return Math.round((3 / 8) * 14 * bezug * 100) / 100;
  }

  const individuell = 9.72 * bezug * Math.max(entgeltpunkteProJahr, 0);
  const mindestens = (6 / 8) * 14 * bezug;
  return Math.round(Math.max(individuell, mindestens) * 100) / 100;
}

/**
 * Regelaltersgrenze in Lebensmonaten.
 *
 * Die Regel steht in § 35 Satz 2 SGB VI: vollendetes 67. Lebensjahr. § 235
 * Abs. 2 mildert sie für die Übergangsjahrgänge ab — zunächst um einen Monat
 * je Jahrgang (1947 bis 1958, dort 66 Jahre), danach um zwei (1959 bis 1963,
 * dort 66 Jahre und 10 Monate). Wer vor 1947 geboren ist, bleibt bei 65.
 *
 * Sie ist hier relevant, weil Renten wegen Erwerbsminderung — auch die über
 * § 240 — längstens bis zu diesem Zeitpunkt laufen. Danach tritt die
 * Altersrente an ihre Stelle.
 */
export function regelaltersgrenzeInMonaten(geburtsjahr: number): number {
  if (geburtsjahr < 1947) return 65 * 12;
  if (geburtsjahr >= 1964) return 67 * 12;
  if (geburtsjahr <= 1958) return 65 * 12 + (geburtsjahr - 1946);
  return 66 * 12 + (geburtsjahr - 1958) * 2;
}

/** Lokales ISO-Datum ohne die UTC-Verschiebung von `toISOString()`. */
function heuteAlsIsoDatum(datum: Date): string {
  const monat = String(datum.getMonth() + 1).padStart(2, '0');
  const tag = String(datum.getDate()).padStart(2, '0');
  return `${datum.getFullYear()}-${monat}-${tag}`;
}

/** Datum, an dem eine Person die Regelaltersgrenze erreicht. */
function regelaltersgrenzeDatum(geburt: Date, monate: number): Date {
  const ziel = new Date(geburt);
  ziel.setMonth(ziel.getMonth() + monate);
  return ziel;
}

/** Vollendete Monate zwischen zwei Daten, kalendergenau. */
function monateZwischen(von: Date, bis: Date): number {
  const monate = (bis.getFullYear() - von.getFullYear()) * 12 + (bis.getMonth() - von.getMonth());
  return bis.getDate() < von.getDate() ? monate - 1 : monate;
}

export interface EmRenteEingabe {
  /** Geburtsdatum als ISO-Kalenderdatum. */
  geburtsdatum: string;
  /** Eintritt der Erwerbsminderung als ISO-Kalenderdatum. */
  eintrittsdatum: string;
  /** Jahre mit Pflichtbeiträgen. */
  beitragsjahre: number;
  /** Durchschnittliches Brutto-Jahresentgelt in Euro. */
  bruttoJahresentgeltEuro: number;
  art: Erwerbsminderungsart;
}

export interface EmRenteErgebnis {
  /** Entgeltpunkte aus tatsächlichen Beitragszeiten. */
  entgeltpunkteBeitrag: number;
  /** Zusätzliche Entgeltpunkte aus der Zurechnungszeit (§ 59 SGB VI). */
  entgeltpunkteZurechnung: number;
  entgeltpunkteGesamt: number;
  /** Angerechnete Monate Zurechnungszeit. */
  zurechnungsmonate: number;
  /** Monate mit Abschlag, höchstens 36. */
  abschlagsmonate: number;
  /** Zugangsfaktor, z.B. 0,892 bei vollem Abschlag. */
  zugangsfaktor: number;
  /** Abschlag in Prozent, z.B. 10,8. */
  abschlagProzent: number;
  /** Monatliche Bruttorente in Euro. */
  monatsrenteEuro: number;
  /** Allgemeine Wartezeit von fünf Jahren erfüllt (§ 50 Abs. 1 SGB VI)? */
  wartezeitErfuellt: boolean;
  /** Kommt der Weg über § 240 SGB VI nach dem Geburtsdatum überhaupt in Betracht? */
  berufsschutzMoeglich: boolean;
  /**
   * Gewählt wurde Berufsunfähigkeit, obwohl der Jahrgang keinen Berufsschutz
   * mehr hat. Dann besteht über § 240 kein Anspruch — die Rente ist null.
   */
  berufsschutzEntfallen: boolean;
  /** Jährliche Hinzuverdienstgrenze in Euro (§ 96a Abs. 1c SGB VI). */
  hinzuverdienstgrenzeJahrEuro: number;
  /** Regelaltersgrenze in Lebensmonaten (§ 35 Satz 2, § 235 Abs. 2 SGB VI). */
  regelaltersgrenzeMonate: number;
  /**
   * Tag, an dem die Erwerbsminderungsrente endet und die Altersrente an ihre
   * Stelle tritt — als ISO-Kalenderdatum.
   */
  renteLaeuftBis: string;
}

/**
 * Berechnet die Projektion.
 *
 * Rentenformel (§ 64 SGB VI):
 * Entgeltpunkte × Zugangsfaktor × Rentenartfaktor × aktueller Rentenwert.
 *
 * Vereinfachung mit Ansage: Als Rentenbeginn dient der Eintritt der
 * Erwerbsminderung. Tatsächlich beginnt die Rente regelmäßig später — das
 * verringert den Abschlag geringfügig, die Projektion bleibt damit auf der
 * vorsichtigen Seite.
 */
export function berechneEmRente(eingabe: EmRenteEingabe): EmRenteErgebnis {
  const geburt = new Date(eingabe.geburtsdatum);
  const eintritt = new Date(eingabe.eintrittsdatum);

  const { durchschnittsentgeltEuro, beitragsbemessungsgrenzeEuro, rentenwertEuro } = RECHENGROESSEN;

  // Entgeltpunkte je Jahr: das eigene Entgelt im Verhältnis zum Durchschnitt,
  // begrenzt durch die Beitragsbemessungsgrenze — oberhalb davon werden keine
  // Beiträge mehr erhoben und damit auch keine Punkte mehr erworben.
  const punkteProJahr = Math.min(
    Math.max(eingabe.bruttoJahresentgeltEuro, 0) / durchschnittsentgeltEuro,
    beitragsbemessungsgrenzeEuro / durchschnittsentgeltEuro
  );

  const beitragsjahre = Math.max(eingabe.beitragsjahre, 0);
  const entgeltpunkteBeitrag = beitragsjahre * punkteProJahr;

  // Zurechnungszeit: vom Eintritt der Erwerbsminderung bis zum gesetzlichen
  // Endalter, bewertet mit dem bisherigen Durchschnitt.
  const alterBeiEintrittMonate = monateZwischen(geburt, eintritt);
  const zurechnungsmonate = Math.max(
    0,
    zurechnungszeitEndeInMonaten(eintritt.getFullYear()) - alterBeiEintrittMonate
  );
  const entgeltpunkteZurechnung = (zurechnungsmonate / 12) * punkteProJahr;

  const entgeltpunkteGesamt = entgeltpunkteBeitrag + entgeltpunkteZurechnung;

  // Zugangsfaktor: 0,3 % Abschlag je Monat vor dem 65. Lebensjahr, gedeckelt
  // auf 36 Monate. Wer deutlich vor 62 erwerbsgemindert wird, trägt damit
  // immer die vollen 10,8 % — nicht mehr.
  const monateBisReferenzalter = ABSCHLAG_REFERENZALTER_JAHRE * 12 - alterBeiEintrittMonate;
  const abschlagsmonate = Math.min(MAX_ABSCHLAGSMONATE, Math.max(0, monateBisReferenzalter));
  const zugangsfaktor = 1 - ABSCHLAG_JE_MONAT * abschlagsmonate;

  // Berufsschutz: Für ab dem 2. Januar 1961 Geborene gibt es den Weg über
  // § 240 nicht mehr. Wird er trotzdem gewählt, besteht kein Anspruch — dann
  // eine Zahl auszuweisen wäre die gefährlichere Antwort als eine Null.
  const berufsschutzMoeglich = hatBerufsschutz(eingabe.geburtsdatum);
  const regelaltersgrenzeMonate = regelaltersgrenzeInMonaten(geburt.getFullYear());
  const berufsschutzEntfallen = eingabe.art === 'berufsunfaehig' && !berufsschutzMoeglich;

  const monatsrenteEuro = berufsschutzEntfallen
    ? 0
    : entgeltpunkteGesamt * zugangsfaktor * RENTENARTFAKTOR[eingabe.art] * rentenwertEuro;

  const aufZwei = (wert: number) => Math.round(wert * 100) / 100;

  return {
    entgeltpunkteBeitrag: aufZwei(entgeltpunkteBeitrag),
    entgeltpunkteZurechnung: aufZwei(entgeltpunkteZurechnung),
    entgeltpunkteGesamt: aufZwei(entgeltpunkteGesamt),
    zurechnungsmonate,
    abschlagsmonate,
    zugangsfaktor: Math.round(zugangsfaktor * 1000) / 1000,
    abschlagProzent: aufZwei(ABSCHLAG_JE_MONAT * abschlagsmonate * 100),
    monatsrenteEuro: aufZwei(monatsrenteEuro),
    wartezeitErfuellt: beitragsjahre >= 5,
    berufsschutzMoeglich,
    berufsschutzEntfallen,
    hinzuverdienstgrenzeJahrEuro: hinzuverdienstgrenzeEuro(eingabe.art, punkteProJahr),
    regelaltersgrenzeMonate,
    renteLaeuftBis: heuteAlsIsoDatum(regelaltersgrenzeDatum(geburt, regelaltersgrenzeMonate)),
  };
}
