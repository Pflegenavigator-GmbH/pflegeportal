# Mehrsprachigkeit (next-intl)

Deutsch ist die **Referenzsprache**: Sie bestimmt, welche Schlüssel es gibt,
und dient allen anderen Sprachen als Rückfallebene.

## Aufbau

| Ort | Zweck |
| --- | --- |
| `public/locales/<sprache>/<namespace>.json` | Die Übersetzungen |
| `namespaces.json` | Welche Namespaces geladen werden |
| `config.ts` | Aktive Sprachen, `Locale`-Typ, `isValidLocale` |
| `languages.ts` | Katalog aller Sprachen mit Eigenname, Flagge, Schreibrichtung |
| `messages.ts` | Zusammenführen von Referenz und Übersetzung |
| `request.ts` | Lädt und verschmilzt die Dateien pro Anfrage |
| `src/types/i18n.d.ts` | Typsicherheit für Schlüssel und Locales |

**Eine Konvention, keine Ausnahmen:** Der Inhalt einer Namespace-Datei ist ihr
Inhalt. Kein umschließender Schlüssel, kein Auspacken beim Laden.

## Die drei Stufen

1. **Gewünschte Sprache** — der Wert aus `public/locales/<sprache>/…`
2. **Referenzsprache** — Deutsch, sobald ein Schlüssel fehlt oder leer ist
3. **Schlüsselpfad** — nur wenn er auch auf Deutsch fehlt; das ist dann ein
   Fehler im Code, kein Übersetzungsproblem. In der Entwicklung erscheint er
   laut in der Konsole, in Produktion nur der letzte Pfadabschnitt.

Stufe 2 wirkt **pro Schlüssel**, nicht pro Datei. Das ist der Unterschied
zwischen „Englisch ist zu 58 % übersetzt und benutzbar" und „Englisch zeigt
`common.footer.links.impressum`".

## Eine Sprache freischalten

1. Dateien unter `public/locales/<sprache>/` anlegen — dieselbe
   Schlüsselstruktur wie Deutsch.
2. In `languages.ts` `aktiv: true` setzen.

Mehr ist es nicht: Routing, Sprachumschalter und der `Locale`-Typ leiten sich
daraus ab. Die Sprache muss dafür **nicht vollständig** sein — Fehlendes
erscheint auf Deutsch. Die Prüfung verlangt lediglich mehr als 50 %, damit
niemand eine Sprache anbietet, die praktisch nur aus Fallback besteht.

⚠️ **32 der vorhandenen Sprachverzeichnisse enthalten englische Kopien**, keine
Übersetzungen — in `tr/buttons.json` steht `"weiter": "Next"`. Deshalb stehen
vorerst nur Deutsch und Englisch auf `aktiv`. Wer eine Sprache freischaltet,
muss ihren Inhalt vorher wirklich prüfen.

## Einen Schlüssel ergänzen

1. In `public/locales/de/<namespace>.json` eintragen — Deutsch zuerst, immer.
2. Im Code verwenden. Der Schlüssel wird zur Compile-Zeit geprüft; ein
   Tippfehler ist ein `tsc`-Fehler.
3. Englisch nachziehen, wenn es fertig ist. Kein Zwang — bis dahin greift der
   Fallback.

Einen ganzen Namespace ergänzen heißt zusätzlich: Eintrag in
`namespaces.json` **und** in `src/types/i18n.d.ts`.

## Typsicherheit

`src/types/i18n.d.ts` erweitert `AppConfig` von next-intl. **Achtung:** Das
globale `IntlMessages` aus next-intl 3 wird von Version 4 stillschweigend
ignoriert — die Datei sieht dann richtig aus, und die Prüfung ist trotzdem
aus. Wer daran etwas ändert, prüft es mit einem absichtlich falschen Schlüssel
gegen.

Dynamisch zusammengesetzte Schlüssel funktionieren nur mit Literal-Typen:

```ts
const IDS = ['m1_1', 'm1_2'] as const;   // ohne `as const` ist es `string`
IDS.map((id) => t(`questions.${id}.label`));
```

Für **strukturierte Teilbäume** (Modul 6: Frage × Option) versagt das, weil
TypeScript die Zuordnung verliert und das Kreuzprodukt bildet. Dort wird der
Nachrichtenbaum über `useMessages()` gelesen — siehe `modul6/page.tsx`.

## Prüfung

`vollstaendigkeit.test.ts` läuft im normalen Testlauf und **blockiert** bei:

- kaputtem JSON
- verwaisten Schlüsseln (Rest nach einer Umbenennung — sie werden nie
  ausgeliefert und täuschen Fortschritt vor)
- einer aktiven Sprache unter 50 % Abdeckung

Eine unvollständige Übersetzung ist **kein** Fehler. Ein Test, der
Vollständigkeit erzwingt, führt nur dazu, dass niemand mehr einen Schlüssel
anlegt.

Die Abdeckung wird bei jedem Lauf berichtet.

## Fachliches vs. Darstellung

Frage-IDs (`m1_1`), Optionswerte (`selbst`, `teilweise`) und Punktwerte sind
**Domänenwissen** — sie stehen in `src/lib/pflegegrad/fragen.ts` und landen so
in der Datenbank. Die Formulierungen sind **Darstellung** und gehören in die
Übersetzungen. Wer eine Frage umformuliert, ändert kein Datenmodell; wer eine
ID ändert, schon.

## Noch offen

- Der Widerspruchs-Bereich, das Pflegetagebuch, FAQ und die Rechtstexte
  laufen weiterhin auf hartkodiertem Deutsch.
- **RTL** (Arabisch, Persisch) ist bewusst ausgeklammert und eine eigene
  Story. `languages.ts` führt das `rtl`-Kennzeichen bereits mit, `rtl.ts`
  wertet es aus — CSS-seitig fehlen die logischen Properties.
- Arabisch ist als einzige der 32 nicht freigeschalteten Sprachen **echt
  übersetzt** (in der alten, nicht registrierten Namespace-Generation).
