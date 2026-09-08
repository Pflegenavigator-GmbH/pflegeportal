import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { aktiveSprachen, defaultLocale } from './config';
import namespaces from './namespaces.json';

/**
 * Prüft die Übersetzungsdateien gegen die Referenzsprache.
 *
 * Blockierend ist nur, was ein echter Fehler ist: kaputte Dateien, verwaiste
 * Schlüssel (typischer Rest nach einer Umbenennung) und eine aktive Sprache
 * ohne jede Übersetzung. Eine unvollständige Übersetzung ist KEIN Fehler —
 * dank des schlüsselgenauen Fallbacks erscheint Fehlendes auf Deutsch. Ein
 * Test, der Vollständigkeit erzwingt, würde nur dazu führen, dass niemand mehr
 * einen Schlüssel anlegt.
 */

const WURZEL = path.join(process.cwd(), 'public', 'locales');

type Knoten = Record<string, unknown>;

/**
 * Alle Blattpfade eines Nachrichtenbaums.
 *
 * `nurGefuellte` überspringt leere Zeichenketten: `messages.ts` behandelt sie
 * als unübersetzt und greift auf die Referenzsprache zurück. Würde die Quote
 * sie mitzählen, ließe sich eine Sprache durch das Anlegen leerer Schlüssel
 * auf 100 % bringen, ohne ein einziges Wort übersetzt zu haben.
 */
function pfade(objekt: unknown, praefix = '', nurGefuellte = false): string[] {
  if (typeof objekt !== 'object' || objekt === null || Array.isArray(objekt)) {
    if (nurGefuellte && String(objekt ?? '').trim() === '') return [];
    return [praefix];
  }
  return Object.entries(objekt as Knoten).flatMap(([schluessel, wert]) =>
    pfade(wert, praefix ? `${praefix}.${schluessel}` : schluessel, nurGefuellte)
  );
}

function lies(
  locale: string,
  ns: string
): { pfade: Set<string>; gefuellt: Set<string>; fehler?: string } | null {
  const datei = path.join(WURZEL, locale, `${ns}.json`);
  if (!fs.existsSync(datei)) return null;

  try {
    const inhalt: unknown = JSON.parse(fs.readFileSync(datei, 'utf-8'));
    return { pfade: new Set(pfade(inhalt)), gefuellt: new Set(pfade(inhalt, '', true)) };
  } catch (e) {
    return { pfade: new Set(), gefuellt: new Set(), fehler: (e as Error).message };
  }
}

const referenz = new Map(
  namespaces.map((ns) => [ns, lies(defaultLocale, ns)?.pfade ?? new Set<string>()])
);

describe('Übersetzungsdateien', () => {
  it('die Referenzsprache hat jeden registrierten Namespace', () => {
    for (const ns of namespaces) {
      expect(
        lies(defaultLocale, ns),
        `public/locales/${defaultLocale}/${ns}.json fehlt`
      ).not.toBeNull();
    }
  });

  it.each([...aktiveSprachen].map((s) => s.code))(
    '%s: alle Dateien sind gültiges JSON',
    (locale) => {
      for (const ns of namespaces) {
        const datei = lies(locale, ns);
        if (datei?.fehler) {
          throw new Error(`public/locales/${locale}/${ns}.json ist kaputt: ${datei.fehler}`);
        }
      }
    }
  );

  it.each([...aktiveSprachen].map((s) => s.code))(
    '%s: enthält keine verwaisten Schlüssel',
    (locale) => {
      if (locale === defaultLocale) return;

      const waisen: string[] = [];
      for (const ns of namespaces) {
        const datei = lies(locale, ns);
        if (!datei) continue;
        const erlaubt = referenz.get(ns) ?? new Set<string>();
        for (const p of datei.pfade) {
          if (!erlaubt.has(p)) waisen.push(`${ns}.${p}`);
        }
      }

      // Waisen entstehen, wenn ein deutscher Schlüssel umbenannt oder entfernt
      // wurde. Sie werden nie ausgeliefert und täuschen Übersetzungsfortschritt
      // vor — deshalb blockierend.
      expect(
        waisen,
        `Verwaiste Schlüssel in ${locale} (in ${defaultLocale} nicht vorhanden)`
      ).toEqual([]);
    }
  );

  it('jede aktive Sprache übersetzt mindestens die Hälfte', () => {
    // Untergrenze statt Vollständigkeit: Eine Sprache freizuschalten, die
    // praktisch nur aus Fallback besteht, wäre gegenüber Nutzern unredlich.
    const bericht: string[] = [];

    for (const sprache of aktiveSprachen) {
      if (sprache.code === defaultLocale) continue;

      let referenzSumme = 0;
      let uebersetzt = 0;
      for (const ns of namespaces) {
        const erlaubt = referenz.get(ns) ?? new Set<string>();
        referenzSumme += erlaubt.size;
        const datei = lies(sprache.code, ns);
        if (datei) {
          for (const p of datei.gefuellt) if (erlaubt.has(p)) uebersetzt++;
        }
      }

      const quote = referenzSumme ? uebersetzt / referenzSumme : 1;
      bericht.push(
        `${sprache.code}: ${(quote * 100).toFixed(1)} % (${uebersetzt}/${referenzSumme})`
      );
      expect(
        quote,
        `${sprache.code} ist als aktiv markiert, aber nur zu ${(quote * 100).toFixed(1)} % übersetzt`
      ).toBeGreaterThan(0.5);
    }

    console.info(
      '[i18n] Abdeckung aktiver Sprachen —',
      bericht.join(', ') || 'nur Referenzsprache'
    );
  });
});
