// src/lib/redis/verfuegbarkeit.ts
/**
 * Verfügbarkeitsschalter für Redis (#176).
 *
 * Ausgangslage in Produktion: Die Zugangsdaten standen in der Umgebung, der
 * Host löste aber nicht mehr auf. Damit existierte der Client — und jede
 * API-Anfrage lief erneut in denselben Fehler, bevor der prozesslokale
 * Fallback griff. Der Fallback funktionierte; teuer war der Weg dorthin.
 *
 * Dieser Schalter merkt sich einen Ausfall und überspringt Redis für eine
 * Sperrzeit vollständig. Bewusst keine dauerhafte Stilllegung: Eine Störung
 * von zwei Minuten darf nicht bedeuten, dass eine Instanz bis zu ihrem Ende
 * ohne verteiltes Limit weiterläuft. Nach Ablauf der Sperre wagt genau eine
 * Anfrage einen Versuch — geht er durch, ist der Schalter wieder zu.
 *
 * Der Zustand gilt je Laufzeit-Instanz. Das ist richtig so: Erreichbarkeit ist
 * eine Eigenschaft der Instanz und ihres Netzwegs, nicht des Clusters.
 */
import { istRedisAktiv } from './client';

/** Wie lange nach einem Fehlschlag kein Aufruf mehr versucht wird. */
export const SPERRDAUER_MS = 60_000;

/**
 * Aufrufstelle, die den Ausfall gemeldet hat. Bewusst eine feste Auswahl und
 * kein freier Text: Der Wert landet im Protokoll, und dorthin darf nichts
 * fließen, was aus einer Anfrage stammt (CodeQL js/log-injection).
 */
export type RedisBereich = 'rate-limit' | 'cache-lesen' | 'cache-schreiben';

/** Unix-ms, bis wann gesperrt ist. 0 heißt: nicht gesperrt. */
let gesperrtBis = 0;

/** Seit der letzten Meldung übersprungene Aufrufe — macht das Ausmaß sichtbar. */
let uebersprungen = 0;

/** Beginn der laufenden Störung, für die Dauer in der Erholungsmeldung. */
let stoerungSeit = 0;

/**
 * Darf Redis für diesen Aufruf benutzt werden?
 *
 * Läuft die Sperre gerade ab, gibt diese Funktion genau einmal `true` zurück
 * und verlängert die Sperre sofort wieder. Sonst würden bei anhaltender
 * Störung alle gleichzeitigen Anfragen zusammen gegen den toten Host laufen.
 * `meldeRedisErfolg()` räumt die Sperre weg, wenn der Versuch geglückt ist.
 */
export function redisVerfuegbar(): boolean {
  if (!istRedisAktiv) return false;
  if (gesperrtBis === 0) return true;

  if (Date.now() >= gesperrtBis) {
    gesperrtBis = Date.now() + SPERRDAUER_MS;
    return true;
  }

  uebersprungen++;
  return false;
}

/**
 * Meldet einen fehlgeschlagenen Redis-Aufruf und sperrt für `SPERRDAUER_MS`.
 *
 * Protokolliert wird beim Öffnen der Sperre, nicht bei jedem Fehler — das ist
 * der Unterschied zu vorher, als dieselbe Zeile bei jeder Anfrage erschien und
 * echte Fehler darin untergingen. `console` statt pino: Edge-Runtime.
 */
export function meldeRedisAusfall(bereich: RedisBereich, fehler: unknown): void {
  const jetzt = Date.now();
  if (stoerungSeit === 0) stoerungSeit = jetzt;

  gesperrtBis = jetzt + SPERRDAUER_MS;

  console.error(
    `[redis][degradiert] Aufruf fehlgeschlagen (${bereich}). Redis wird für ${
      SPERRDAUER_MS / 1000
    } s übersprungen; das Rate-Limit arbeitet solange prozesslokal und begrenzt damit nur diese Instanz. Seit der letzten Meldung übersprungen: ${uebersprungen}.`,
    fehler
  );

  uebersprungen = 0;
}

/** Meldet einen geglückten Aufruf und hebt eine bestehende Sperre auf. */
export function meldeRedisErfolg(): void {
  if (gesperrtBis === 0) return;

  const dauerSekunden = Math.round((Date.now() - stoerungSeit) / 1000);

  console.warn(
    `[redis][erholt] Wieder erreichbar nach ${dauerSekunden} s. Übersprungene Aufrufe: ${uebersprungen}.`
  );

  gesperrtBis = 0;
  uebersprungen = 0;
  stoerungSeit = 0;
}

/**
 * Zustand für Diagnosezwecke.
 *
 * Bewusst nicht über eine öffentliche Route ausgeliefert: Die Auskunft „das
 * Rate-Limit ist gerade prozesslokal" ist für jemanden, der Fallcodes
 * durchprobiert, eine Einladung. Der Platz dafür ist der interne
 * Health-Endpunkt aus #177.
 */
export function redisZustand(): {
  konfiguriert: boolean;
  nutzbar: boolean;
  gesperrtBis: number | null;
  uebersprungeneAufrufe: number;
} {
  return {
    konfiguriert: istRedisAktiv,
    nutzbar: istRedisAktiv && gesperrtBis === 0,
    gesperrtBis: gesperrtBis === 0 ? null : gesperrtBis,
    uebersprungeneAufrufe: uebersprungen,
  };
}
