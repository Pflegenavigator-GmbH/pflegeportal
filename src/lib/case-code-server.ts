// src/lib/case-code-server.ts
import 'server-only';

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { normalizeCaseCode } from '@/src/lib/case-code';

/**
 * Zeichenvorrat für NEUE Codes — ohne `I`, `O`, `0` und `1`.
 *
 * Geprüft wird weiterhin gegen das vollständige Alphabet, denn der Bestand
 * enthält solche Zeichen (der Testfall heißt `PF-C1HB-FH1I`). Neue Codes
 * verzichten darauf: Am Telefon vorgelesen oder von Papier abgetippt sind
 * `1`/`I` und `0`/`O` die häufigste Verwechslung — und ein Fallcode wird genau
 * so weitergegeben.
 */
const ERZEUGUNGS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Länge je Block; zwei Blöcke ergeben den Code. */
const BLOCK_LAENGE = 4;

/**
 * Erzeugt einen neuen Fallcode mit kryptografischem Zufall.
 *
 * Bis zum 17.09.2026 entstand der Code in der Datenbank (`create_case`) über
 * `random()`. Das ist laut PostgreSQL-Dokumentation ein deterministischer
 * Pseudozufallsgenerator und ausdrücklich nicht für kryptografische Zwecke
 * geeignet: Codes aus derselben Sitzung stammen aus demselben
 * Generatorzustand, sind also nicht nur zu raten, sondern vorherzusagen. Gegen
 * Vorhersage hilft auch eine Ratenbegrenzung nicht (#136).
 *
 * `randomInt` zieht ohne Modulo-Verzerrung aus dem Systemzufall.
 */
export function erzeugeFallcode(): string {
  const block = () =>
    Array.from(
      { length: BLOCK_LAENGE },
      () => ERZEUGUNGS_ALPHABET[randomInt(ERZEUGUNGS_ALPHABET.length)]
    ).join('');

  return `PF-${block()}-${block()}`;
}

/**
 * Suchschlüssel für den Legacy-Fallcode (#153, Phase B von #145).
 *
 * `case_code_hash = HMAC-SHA-256(CASE_CODE_PEPPER, normalizeCaseCode(code))`
 *
 * **Was das leistet:** Der Fallcode steht serverseitig nicht mehr im Klartext.
 * Ein isolierter Abfluss der Datenbank gibt niemandem Zugang, solange der
 * Pepper nicht mit abfließt — er liegt im Secret-Management der Infrastruktur,
 * nicht in PostgreSQL.
 *
 * **Was das nicht leistet:** Es ersetzt kein Passwort-Hashing. Wer Datenbank
 * UND Pepper hat, rechnet rund 41 Bit in kurzer Zeit durch. Robuster wäre ein
 * Zwei-Stufen-Modell (HMAC als Index, Argon2id als Verifikation) mit getrennten
 * Secrets — für ein Credential, das mit ADR-0002 ohnehin abgelöst wird, ist der
 * Aufwand je Anmeldung nicht gerechtfertigt. Das ist ein weiterer Grund, die
 * Übergangszeit kurz zu halten.
 *
 * Der Pepper ist bewusst NICHT derselbe wie das Secret der Ratenbegrenzung aus
 * #136: Ein Leck des einen darf das andere nicht mitreißen.
 */
const PEPPER_VARIABLE = 'CASE_CODE_PEPPER';

/** Kürzer wäre kein Secret, sondern ein Passwort. */
const MIN_PEPPER_LAENGE = 32;

function lesePepper(): string {
  const pepper = process.env[PEPPER_VARIABLE];

  // Fail closed: Ohne Pepper ist jede Ableitung falsch, und eine falsche
  // Ableitung sperrt alle Fälle aus. Lieber ein klarer Fehler beim ersten
  // Zugriff als eine Anwendung, die stillschweigend niemanden mehr findet.
  if (!pepper || pepper.length < MIN_PEPPER_LAENGE) {
    throw new Error(
      `${PEPPER_VARIABLE} fehlt oder ist zu kurz (mindestens ${MIN_PEPPER_LAENGE} Zeichen). ` +
        'Ohne dieses Secret lässt sich kein Fall finden.'
    );
  }

  return pepper;
}

/**
 * Leitet den Suchschlüssel ab.
 *
 * @throws wenn der Code nicht dem kanonischen Format entspricht. Ein
 *   unnormalisierbarer Code darf keinen Hash bekommen — sonst entstünde ein
 *   Eintrag, den niemand mehr trifft.
 */
export function berechneCaseCodeHash(fallcode: string): string {
  const normalisiert = normalizeCaseCode(fallcode);
  if (!normalisiert) {
    throw new Error('Fallcode entspricht nicht dem kanonischen Format.');
  }

  return createHmac('sha256', lesePepper()).update(normalisiert, 'utf8').digest('hex');
}

/**
 * Vergleicht zwei Fallcodes in konstanter Zeit.
 *
 * Für die Suche in der Datenbank spielt das keine Rolle — dort trifft der
 * Index. Gebraucht wird es dort, wo zwei Werte im Speicher verglichen werden,
 * etwa Sitzungscookie gegen angefragten Fall: Ein Vergleich mit `===` bricht
 * beim ersten abweichenden Zeichen ab und verrät über die Laufzeit, wie weit
 * ein geratener Code stimmte.
 */
export function gleicherFallcode(links: string | null, rechts: string | null): boolean {
  if (!links || !rechts) return false;

  const a = Buffer.from(links, 'utf8');
  const b = Buffer.from(rechts, 'utf8');

  // timingSafeEqual verlangt gleiche Länge; die Länge selbst ist kein Geheimnis.
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
