// src/lib/consent.ts
/**
 * Einwilligung nach DSGVO/TTDSG — die eine Stelle, die den Zustand kennt.
 *
 * Zuvor lagen Speicher-Schlüssel und Event-Namen doppelt vor (CookieBanner
 * sendete `consent_changed`, useConsent lauschte auf `consentChange`). Die
 * Namen liefen auseinander, ohne dass etwas fehlschlug: Einwilligungen kamen
 * beim Hook schlicht nie an. Genau deshalb stehen sie jetzt hier als
 * Konstanten — wer sie nutzt, kann sich nicht mehr vertippen.
 *
 * Bewusst ohne pino: dieses Modul läuft im Browser, und ein Logger gehört
 * nicht in den Bundle jeder Seite.
 */

/** Kategorien des Cookie-Banners. `essenziell` ist nicht abwählbar. */
export interface Einwilligung {
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

/** Schlüssel im localStorage. */
export const EINWILLIGUNG_KEY = 'user_consent';

/** Feuert, wenn sich die Einwilligung geändert hat. */
export const EINWILLIGUNG_EVENT = 'consent_changed';

/** Feuert, wenn die Auswahl erneut geöffnet werden soll (Widerruf). */
export const EINWILLIGUNG_OEFFNEN_EVENT = 'consent_dialog_open';

/** Voreinstellung: nur technisch Notwendiges. Gilt auch ohne Entscheidung. */
export const NUR_ESSENZIELL: Einwilligung = {
  essential: true,
  analytics: false,
  marketing: false,
};

/**
 * Liest den Rohwert aus dem Speicher.
 *
 * Absichtlich der String und nicht das geparste Objekt: `useSyncExternalStore`
 * vergleicht Snapshots per `Object.is`. Ein bei jedem Aufruf frisch geparstes
 * Objekt wäre immer „neu" und würde React in eine Endlosschleife schicken.
 */
export function leseRohwert(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(EINWILLIGUNG_KEY);
  } catch {
    // Privater Modus oder blockierter Speicher — wie „nicht entschieden".
    return null;
  }
}

/**
 * Wandelt den gespeicherten Rohwert in eine Einwilligung um.
 * `null` bedeutet: noch keine Entscheidung getroffen.
 */
export function parseEinwilligung(roh: string | null): Einwilligung | null {
  if (!roh) return null;

  try {
    const geparst: unknown = JSON.parse(roh);
    if (typeof geparst !== 'object' || geparst === null) return null;

    const daten = geparst as Record<string, unknown>;
    return {
      essential: true,
      analytics: daten.analytics === true,
      marketing: daten.marketing === true,
    };
  } catch {
    // Beschädigter Eintrag: als „nicht entschieden" behandeln statt zu raten.
    // Der Banner fragt dann erneut — das ist die datenschutzfreundliche Wahl.
    return null;
  }
}

/** Aktuelle Einwilligung oder `null`, wenn noch nicht entschieden wurde. */
export function leseEinwilligung(): Einwilligung | null {
  return parseEinwilligung(leseRohwert());
}

/** Gibt an, ob für Analyse & Statistik eingewilligt wurde. */
export function hatAnalyticsEinwilligung(roh: string | null = leseRohwert()): boolean {
  return parseEinwilligung(roh)?.analytics === true;
}

/** Speichert die Auswahl und benachrichtigt alle Zuhörer im selben Tab. */
export function speichereEinwilligung(auswahl: Einwilligung): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(EINWILLIGUNG_KEY, JSON.stringify(auswahl));
  } catch {
    // Schreiben fehlgeschlagen (privater Modus): das Event trotzdem senden,
    // damit die laufende Sitzung die Wahl respektiert.
  }

  // `storage` feuert nur in ANDEREN Tabs — für den eigenen brauchen wir ein
  // eigenes Event.
  window.dispatchEvent(new Event(EINWILLIGUNG_EVENT));
}

/** Setzt alles Optionale zurück — Wirkung sofort, nicht erst beim Reload. */
export function widerrufeEinwilligung(): void {
  speichereEinwilligung(NUR_ESSENZIELL);
}

/** Öffnet die Auswahl erneut (Einstiegspunkt für den Widerruf). */
export function oeffneEinwilligungsAuswahl(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EINWILLIGUNG_OEFFNEN_EVENT));
}

/**
 * Abonniert Änderungen — im eigenen Tab über `EINWILLIGUNG_EVENT`, in
 * anderen Tabs über `storage`. Ohne Letzteres liefe das Tracking in einem
 * zweiten Tab weiter, obwohl der Nutzer im ersten widerrufen hat.
 */
export function abonniereEinwilligung(beiAenderung: () => void): () => void {
  window.addEventListener(EINWILLIGUNG_EVENT, beiAenderung);
  window.addEventListener('storage', beiAenderung);

  return () => {
    window.removeEventListener(EINWILLIGUNG_EVENT, beiAenderung);
    window.removeEventListener('storage', beiAenderung);
  };
}
