// src/i18n/request.ts
import { hasLocale, type AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { isValidLocale } from './config';
import { ueberlagere, type Knoten } from './messages';
import namespaces from './namespaces.json';
import { routing } from './routing';

/**
 * Lädt eine einzelne Namespace-Datei.
 *
 * Unterscheidet zwischen „Datei existiert nicht" (Warnung, bei unvollständigen
 * Sprachen normal) und „Datei ist kaputt" (Fehler mit Details).
 *
 * Der frühere Unwrap-Trick ist bewusst entfernt: Er nahm bei
 * `{ "common": { … } }` nur den inneren Teil. Sobald eine Datei aber einen
 * gleichnamigen UNTERSCHLÜSSEL hatte, verwarf er stillschweigend alles andere
 * — in en/common.json waren das 217 von 284 Schlüsseln. Jetzt gilt ohne
 * Sonderfall: Der Inhalt einer Namespace-Datei ist ihr Inhalt.
 */
async function ladeNamespace(locale: string, ns: string): Promise<Knoten | null> {
  try {
    const mod = await import(`../../public/locales/${locale}/${ns}.json`);
    return mod.default as Knoten;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'MODULE_NOT_FOUND' || /Cannot find module/i.test(err?.message ?? '')) {
      console.warn(`[i18n] Locale-Datei fehlt: public/locales/${locale}/${ns}.json`);
    } else {
      console.error(
        `[i18n] Locale-Datei fehlerhaft (Syntaxfehler?): public/locales/${locale}/${ns}.json`,
        e
      );
    }
    return null;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const kandidat = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  // Auf den engen Locale-Typ verengen — next-intl erwartet seit der
  // AppConfig-Typisierung kein beliebiges `string` mehr.
  const locale = isValidLocale(kandidat) ? kandidat : routing.defaultLocale;
  const referenz = routing.defaultLocale;

  const teile = await Promise.all(
    namespaces.map(async (ns) => {
      // Stufe 1: Referenzsprache als Grundlage. Sie ist per Definition
      // vollständig und bestimmt, welche Schlüssel es überhaupt gibt.
      const basis = (await ladeNamespace(referenz, ns)) ?? {};

      // Stufe 2: gewünschte Sprache darüberlegen.
      const uebersetzt = locale === referenz ? null : await ladeNamespace(locale, ns);

      return { [ns]: ueberlagere(basis, uebersetzt) };
    })
  );

  return {
    locale,
    messages: Object.assign({}, ...teile) as AbstractIntlMessages,

    /**
     * Stufe 3: Greift nur, wenn ein Schlüssel auch in der Referenzsprache
     * fehlt. Das ist dann kein Übersetzungsproblem, sondern ein Fehler im Code.
     *
     * In der Entwicklung soll das auffallen; in Produktion darf eine fehlende
     * Beschriftung die Seite nicht entstellen, deshalb erscheint nur der
     * letzte Pfadabschnitt statt des vollen Schlüsselpfads.
     */
    getMessageFallback({ key, namespace }) {
      const pfad = [namespace, key].filter(Boolean).join('.');

      if (process.env.NODE_ENV === 'development') {
        console.error(`[i18n] Schlüssel fehlt auch in der Referenzsprache: ${pfad}`);
        return pfad;
      }

      return key.split('.').pop() ?? key;
    },
  };
});
