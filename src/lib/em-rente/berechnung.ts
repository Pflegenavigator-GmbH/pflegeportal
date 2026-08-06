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
  /** Aktueller Rentenwert je Entgeltpunkt und Monat, Stand 1. Juli 2025. */
  rentenwertEuro: 40.79,
  /** Vorläufiges Durchschnittsentgelt 2025 (§ 69 Abs. 2 SGB VI, Anlage 1). */
  durchschnittsentgeltEuro: 50493,
  /** Beitragsbemessungsgrenze der allgemeinen Rentenversicherung 2025. */
  beitragsbemessungsgrenzeEuro: 96600,
  /** Stichtag der obigen Werte — wird in der Oberfläche ausgewiesen. */
  stand: '2025',
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

/** Rentenartfaktor (§ 67 SGB VI). */
const RENTENARTFAKTOR = { voll: 1.0, teilweise: 0.5 } as const;

export type Erwerbsminderungsart = keyof typeof RENTENARTFAKTOR;

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

  const monatsrenteEuro =
    entgeltpunkteGesamt * zugangsfaktor * RENTENARTFAKTOR[eingabe.art] * rentenwertEuro;

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
  };
}
