// src/i18n/config.ts
import { supportedLanguages, type LanguageInfo } from './languages';

export const defaultLocale = 'de' as const;
export const localePrefix = 'always' as const;

/**
 * Sprachen, die tatsächlich zur Wahl stehen.
 *
 * `supportedLanguages` bleibt bewusst die vollständige Liste — sie ist der
 * Katalog dessen, was einmal unterstützt werden soll, samt Eigenname, Flagge
 * und Schreibrichtung. Allein `aktiv` entscheidet, was ausgeliefert wird.
 * Eine Sprache freizuschalten ist damit eine Ein-Wort-Änderung, sobald echte
 * Übersetzungen vorliegen.
 */
export const aktiveSprachen: readonly LanguageInfo[] = supportedLanguages.filter(
  (sprache) => sprache.aktiv
);

/**
 * Gültige Locale-Präfixe im Routing. Eine nicht aktive Sprache erzeugt bewusst
 * einen 404 statt einer Seite in einer anderen Sprache als angekündigt.
 */
export const locales = aktiveSprachen.map((sprache) => sprache.code) as readonly Locale[];

/**
 * Die tatsächlich ausgelieferten Sprachen als Typ — aus `aktiv: true`
 * abgeleitet, nicht doppelt gepflegt. Eine Sprache freizuschalten ändert damit
 * automatisch auch den Typ.
 */
export type Locale = Extract<(typeof supportedLanguages)[number], { aktiv: true }>['code'];

/**
 * Verengt auf `Locale`, nicht auf `string`. Erst dadurch akzeptieren
 * next-intl-Aufrufe wie `getTranslations({ locale })` den Wert ohne Umweg.
 */
export function isValidLocale(locale: unknown): locale is Locale {
  return typeof locale === 'string' && (locales as readonly string[]).includes(locale);
}
