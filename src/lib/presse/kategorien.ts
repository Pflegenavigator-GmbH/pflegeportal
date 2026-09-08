// src/lib/presse/kategorien.ts
/**
 * Presse-Kategorien: stabile Schlüssel (wie in der DB und im CHECK-Constraint)
 * getrennt von der Anzeige. Die sichtbaren Labels kommen über i18n
 * (Namespace `presse`, Key `kategorie.<key>`), damit sie übersetzbar bleiben.
 */
export const PRESSE_KATEGORIEN = ['produktlaunch', 'recht', 'statistik', 'migration'] as const;

export type PresseKategorie = (typeof PRESSE_KATEGORIEN)[number];

/** Sentinel für „alle Kategorien" im Filter (kein DB-Wert). */
export const KATEGORIE_ALLE = 'alle';

export type KategorieFilter = PresseKategorie | typeof KATEGORIE_ALLE;

export function istPresseKategorie(wert: unknown): wert is PresseKategorie {
  return typeof wert === 'string' && (PRESSE_KATEGORIEN as readonly string[]).includes(wert);
}

/** Normalisiert einen Filterwert; Unbekanntes wird zu „alle". */
export function normalisiereKategorie(wert: unknown): KategorieFilter {
  if (wert === KATEGORIE_ALLE) return KATEGORIE_ALLE;
  return istPresseKategorie(wert) ? wert : KATEGORIE_ALLE;
}
