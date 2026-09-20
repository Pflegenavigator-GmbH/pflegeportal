# Rechtsstände

Jeder Wert, der aus einem Gesetz stammt, steht in [`rechtswerte.ts`](./rechtswerte.ts) —
mit Fundstelle, Fassung und Prüfdatum. Umsetzung von Issue #138.

## Warum

Drei P0-Befunde des Rechtsgutachtens vom 06.09.2026 waren derselbe Fehler:

| Befund | Was passierte |
| --- | --- |
| Leistungsbeträge (#107) | Kommentar „Gesetzlicher Satz 2026" über Werten von vor 2025 |
| Vier-Wochen-Frist (#132) | eine Norm zitiert, die etwas anderes sagt |
| Fristentabelle (#133) | Paragrafen, die inzwischen neu gegliedert sind |

Alle drei fand jemand von außen. Der Katalog macht daraus eine Liste, die man
in zehn Minuten durchgeht, statt einer Suche durch den Quelltext.

## Die vier Regeln

1. **Ohne Fundstelle kein Eintrag.** Die Norm, nicht nur der Link.
2. **Geprüft ist nur, was einen Prüfvermerk trägt.** `geprueft: null` heißt
   ungeprüft und muss ein Ticket nennen. `art: 'normtext'` heißt: Zahl und
   Fundstelle nachgeschlagen. `art: 'fachlich'` heißt: jemand mit
   sozialrechtlicher Qualifikation steht dafür ein. Das ist ein Unterschied.
3. **Alte Fassungen bleiben stehen.** Ändert sich ein Wert, kommt eine Zeile
   mit späterem `gueltigAb` dazu. Gerechnet wird mit der Fassung, die zum
   maßgeblichen Datum galt — für einen Bescheid vom März gilt das Recht vom
   März.
4. **Prüfvermerke veralten nach einem Jahr.** Dann schlägt
   `rechtswerte.test.ts` fehl. Das ist der jährliche Termin.

## Einen Wert ändern

1. Neue Zeile in `RECHTSWERTE` mit dem neuen Wert und `gueltigAb`. Die alte
   Zeile bleibt.
2. Prüfvermerk setzen: Datum, Person, Art.
3. Den rechnenden Code anpassen (`nba.ts`, `fristen.ts`, `constants.ts`).
4. `rechtswerte.test.ts` gleicht beide Seiten ab. Läuft der Test, stimmen
   Katalog und Code überein.

## Was hier nicht hingehört

- **Rechenregeln.** Der Fristenlauf nach § 64 SGG und die NBA-Berechnung sind
  Logik, kein Wert. Sie stehen im Code und sind dort getestet.
- **Kassenabhängige Stammdaten.** Adressen und Satzungsleistungen gehören in
  die Datenbank. Der Katalog führt Bundesrecht.
- **Ein Cron-Job, der Werte schreibt.** Für die Leistungsbeträge gibt es keine
  amtliche maschinenlesbare Quelle. Ein automatischer Eintrag stellte
  ungeprüfte Beträge vor die Nutzer — genau das Fehlerbild, das der Katalog
  verhindern soll. Als Erinnerung ist ein Job willkommen, als Schreiber nicht.

## Warum „aktuell" nicht „dieses Jahr" heißt

Ein Betrag gilt, bis ihn eine Änderung ablöst — nicht bis zum Jahreswechsel.
Die Leistungsbeträge sind zum 01.01.2025 um 4,5 Prozent gestiegen und gelten
2026 unverändert fort; die nächste Dynamisierung folgt nach § 30 SGB XI zum
01.01.2028, danach alle drei Jahre. Deshalb trägt der Katalog `gueltigAb` und
keine Jahresangabe: Die Frage „Ist das noch aktuell?" beantwortet der
Prüfvermerk, nicht die Jahreszahl im Wert.

## Leistungsbeträge

Sie kommen ausschließlich von hier: `leistungsbetraegeAm(stichtag)` liefert
Pflegegeld und Entlastungsbetrag in der zum Stichtag geltenden Fassung, und
`calculatePflegegrad` nimmt den Stichtag entgegen. Eine zweite Tabelle im Code
gibt es seit **#107** nicht mehr — `pflegegrad/constants.ts` ist entfallen.

Der Rückstand, den dieses Verzeichnis zuerst nur dokumentiert hat, ist damit
behoben: Bis zum 16.09.2026 zeigte das Portal 332/573/765/947 Euro Pflegegeld
und 125 Euro Entlastungsbetrag, also den Stand vor dem 01.01.2025.
