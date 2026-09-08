// src/lib/analytics/events.ts
/**
 * Katalog der erfassten Ereignisse.
 *
 * Bewusst klein und abschließend: Jedes Ereignis muss hier stehen, bevor es
 * gesendet werden kann. Das ist keine Formalie, sondern die technische
 * Umsetzung der Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO) — es lässt sich
 * an einer Stelle prüfen und in der Datenschutzerklärung belegen, was erhoben
 * wird.
 *
 * ⚠️ In die Eigenschaften gehören NIEMALS: Fallcodes, Stripe-Session-IDs,
 * Namen, E-Mail-Adressen, Postleitzahlen, Antworten aus den Modulen oder
 * sonstige Gesundheitsdaten. Die Typen unten lassen genau das nicht zu — wer
 * ein Feld ergänzt, muss diese Zeile bewusst überschreiben.
 */

export const EREIGNISSE = {
  /** Ein Fall wurde angelegt oder geladen — der Rechner läuft los. */
  rechnerGestartet: 'rechner_gestartet',
  /** Der Nutzer wurde zu Stripe weitergeleitet. */
  checkoutAufgerufen: 'checkout_aufgerufen',
  /** Rückkehr von Stripe mit gültiger Sitzung. */
  kaufErfolgreich: 'kauf_erfolgreich',
} as const;

export type Ereignis = (typeof EREIGNISSE)[keyof typeof EREIGNISSE];

/**
 * Erlaubte Eigenschaften je Ereignis. Alles hier ist kategorial, nie
 * individuell — aus keinem Wert lässt sich auf eine Person zurückschließen.
 */
export interface EreignisDaten {
  rechner_gestartet: {
    /** Wie der Fall in die Sitzung kam. */
    einstieg: 'neu' | 'geladen' | 'geteilt';
  };
  checkout_aufgerufen: {
    /** Produktschlüssel aus der products-Tabelle, z.B. „premium". */
    paket: string;
  };
  kauf_erfolgreich: {
    /** Ob die Freischaltung bei der Rückkehr schon griff (Webhook-Latenz). */
    freigeschaltet: boolean;
  };
}
