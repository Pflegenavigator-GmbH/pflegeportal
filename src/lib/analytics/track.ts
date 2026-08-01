// src/lib/analytics/track.ts
/**
 * Senden von Ereignissen und Seitenaufrufen an Umami.
 *
 * Anbieterunabhängig gehalten: Der Rest der App kennt nur `verfolge()` und
 * `verfolgeSeitenaufruf()`. Ein Wechsel des Dienstes berührt nur diese Datei.
 */
import { hatAnalyticsEinwilligung } from '@/src/lib/consent';

import type { Ereignis, EreignisDaten } from './events';

/** Vom Umami-Skript bereitgestellte Schnittstelle. */
interface UmamiApi {
  track: {
    (): void;
    (ereignis: string, daten?: Record<string, unknown>): void;
    (anpassen: (eigenschaften: Record<string, unknown>) => Record<string, unknown>): void;
  };
}

declare global {
  interface Window {
    umami?: UmamiApi;
  }
}

/** Ob gerade gesendet werden darf. Wird bei JEDEM Aufruf neu geprüft. */
function darfSenden(): boolean {
  if (typeof window === 'undefined') return false;
  // Zweite Verteidigungslinie: Das Skript wird zwar nur mit Einwilligung
  // geladen, aber nach einem Widerruf bleibt es im Speicher. Ohne diese
  // Prüfung liefe ein bereits geladenes Umami einfach weiter.
  if (!hatAnalyticsEinwilligung()) return false;
  return typeof window.umami?.track === 'function';
}

/**
 * Entfernt den Query-String aus dem Pfad.
 *
 * Das ist keine Kosmetik, sondern zwingend: Unsere URLs führen
 * `?check_code=PF-XXXX-XXXX`, `?case=…` und `?session_id=cs_…` mit sich. Der
 * Fallcode ist der Zugangsschlüssel zum Pflegegutachten — er darf unter
 * keinen Umständen in einem Analyse-Dienst landen. Umamis automatische
 * Erfassung würde die vollständige URL senden, deshalb ist sie abgeschaltet
 * und wir melden Seitenaufrufe selbst (siehe Analytics-Komponente).
 */
export function pfadOhneParameter(pfad: string): string {
  const grenze = pfad.search(/[?#]/);
  return grenze === -1 ? pfad : pfad.slice(0, grenze);
}

/**
 * Meldet ein Ereignis. Ohne Einwilligung, ohne geladenes Skript oder auf dem
 * Server passiert nichts — still und ohne Fehler.
 */
export function verfolge<E extends Ereignis>(ereignis: E, daten?: EreignisDaten[E]): void {
  if (!darfSenden()) return;

  try {
    window.umami?.track(ereignis, daten);
  } catch {
    // Analytics darf die Anwendung niemals stören. Ein blockierender
    // Ad-Blocker oder eine Netzstörung ist kein Fehlerfall für den Nutzer.
  }
}

/**
 * Meldet ein Ereignis höchstens einmal je Vorgang.
 *
 * Nötig für den Kaufabschluss: Nach der Rückkehr von Stripe steht die
 * Sitzungs-ID in der URL. Ein Reload — oder React StrictMode in der
 * Entwicklung — würde denselben Kauf sonst mehrfach zählen. `kennung`
 * identifiziert den Vorgang (die Stripe-Sitzungs-ID), gespeichert wird nur
 * ein Merker im sessionStorage, der mit dem Tab endet.
 */
export function verfolgeEinmalig<E extends Ereignis>(
  ereignis: E,
  kennung: string,
  daten?: EreignisDaten[E]
): void {
  // Ohne Einwilligung wird auch kein Merker gesetzt — sonst würde eine später
  // erteilte Zustimmung das Ereignis dauerhaft verschlucken.
  if (typeof window === 'undefined' || !hatAnalyticsEinwilligung()) return;

  const schluessel = `analytics:gesendet:${ereignis}:${kennung}`;

  try {
    if (window.sessionStorage.getItem(schluessel)) return;
    window.sessionStorage.setItem(schluessel, '1');
  } catch {
    // Speicher blockiert (privater Modus): lieber einmal zu viel zählen als
    // die Conversion ganz zu verlieren.
  }

  verfolge(ereignis, daten);
}

/** Meldet einen Seitenaufruf — ohne Query-String (siehe oben). */
export function verfolgeSeitenaufruf(pfad: string): void {
  if (!darfSenden()) return;

  try {
    window.umami?.track((eigenschaften) => ({
      ...eigenschaften,
      url: pfadOhneParameter(pfad),
    }));
  } catch {
    // bewusst still — siehe verfolge()
  }
}
