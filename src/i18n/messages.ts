// src/i18n/messages.ts
/**
 * Zusammenführen von Übersetzungen — bewusst getrennt von `request.ts`, damit
 * die Logik ohne next-intl-Serverumgebung prüfbar ist.
 */

export type Knoten = Record<string, unknown>;

export function istKnoten(wert: unknown): wert is Knoten {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

/**
 * Legt die Übersetzung über die Referenzsprache — Schlüssel für Schlüssel.
 *
 * Das ist die zweite Stufe der Übersetzungslogik und der Kern der Änderung:
 * Zuvor fiel nur eine FEHLENDE DATEI auf Deutsch zurück. Eine vorhandene, aber
 * halb gefüllte Datei tat es nicht — der Nutzer sah dann
 * `common.footer.links.impressum` statt „Impressum". Damit war jede
 * unvollständig übersetzte Sprache praktisch unbrauchbar, und genau daran
 * scheiterte der englische Footer.
 *
 * Leere Zeichenketten gelten als nicht übersetzt: Übersetzungswerkzeuge legen
 * Schlüssel gern leer an, und eine leere Beschriftung ist schlechter als eine
 * deutsche.
 */
export function ueberlagere(basis: Knoten, uebersetzung: Knoten | null | undefined): Knoten {
  if (!uebersetzung) return basis;

  const ergebnis: Knoten = { ...basis };

  for (const [schluessel, wert] of Object.entries(uebersetzung)) {
    const vorhanden = ergebnis[schluessel];

    if (istKnoten(wert) && istKnoten(vorhanden)) {
      ergebnis[schluessel] = ueberlagere(vorhanden, wert);
    } else if (typeof wert === 'string' && wert.trim() === '') {
      // nicht übersetzt — Referenzsprache behalten
    } else if (wert !== undefined && wert !== null) {
      ergebnis[schluessel] = wert;
    }
  }

  return ergebnis;
}
