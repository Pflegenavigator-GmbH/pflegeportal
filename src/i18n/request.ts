// src/i18n/request.ts
import { hasLocale, type AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import namespaces from './namespaces.json';
import { routing } from './routing';

/**
 * Lädt eine einzelne Namespace-Datei.
 * Unterscheidet sauber zwischen "Datei existiert nicht" (nur Warnung)
 * und "Datei ist kaputt / Syntaxfehler" (Error mit Details) —
 * der alte Code hat beides als "nicht gefunden" verschluckt.
 */
async function loadNamespace(locale: string, ns: string): Promise<Record<string, unknown> | null> {
  try {
    const mod = await import(`../../public/locales/${locale}/${ns}.json`);
    const data = mod.default;

    // Unwrap-Trick: Falls die Datei ein umschließendes Objekt mit dem
    // Namespace-Namen hat (z.B. { "common": { ... } }), nur den Inhalt nehmen.
    const content =
      data && typeof data === 'object' && ns in data ? (data as Record<string, unknown>)[ns] : data;

    return content as Record<string, unknown>;
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === 'MODULE_NOT_FOUND' || /Cannot find module/i.test(err?.message ?? '')) {
      console.warn(`[i18n] Locale-Datei fehlt: public/locales/${locale}/${ns}.json`);
    } else {
      // JSON-Syntaxfehler o.ä. — NICHT still schlucken!
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
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const parts = await Promise.all(
    namespaces.map(async (ns) => {
      // 1. Versuch: gewünschte Locale
      let content = await loadNamespace(locale, ns);

      // 2. Fallback: defaultLocale (verhindert MISSING_MESSAGE bei
      //    unvollständig übersetzten Sprachen)
      if (content === null && locale !== routing.defaultLocale) {
        content = await loadNamespace(routing.defaultLocale, ns);
      }

      return content !== null ? { [ns]: content } : {};
    })
  );

  return {
    locale,
    messages: Object.assign({}, ...parts) as AbstractIntlMessages,
  };
});
