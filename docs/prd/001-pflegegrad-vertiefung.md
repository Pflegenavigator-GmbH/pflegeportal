# 001 — Pflegegrad-Vertiefung

| | |
|---|---|
| **Status** | Entwurf |
| **Stand** | 29.08.2026 |
| **Issues** | noch zu schneiden |
| **Blockiert durch** | — |

Siehe [000 — Richtung](000-richtung.md): Vertiefung statt Verbreiterung.

---

## Problem

Wer heute den Pflegegrad-Rechner durchläuft, bekommt am Ende eine Zahl, eine Ampel und einen
Euro-Betrag. Was die Person nicht bekommt, ist ein Grund, das zu glauben.

Sie sieht nicht, wie sich das Ergebnis zusammensetzt. Sie kann nicht erkennen, welches Modul
den Ausschlag gab und wo eine andere Antwort etwas geändert hätte. Und sie kann nicht wissen,
dass der Rechner ein reduziertes Orientierungsinstrument ist und keine Begutachtung — das
steht im Code, aber nicht auf dem Bildschirm.

Das ist nicht nur eine Frage der Höflichkeit. Der nächste Schritt nach dem Ergebnis ist ein
Widerspruch gegen einen Bescheid der Pflegekasse. Wer widerspricht, muss begründen. Ein
Ergebnis, das seine eigene Herleitung nicht zeigt, trägt diesen Schritt nicht.

---

## Grundlage

Das Bewertungsmodell steht in `src/lib/pflegegrad/nba.ts` und ist dort sauber belegt:

| Sache | Fundstelle | Im Code |
|---|---|---|
| Modulgewichte 10 / 15 / 15 / 40 / 20 / 15 | § 15 Abs. 3 SGB XI | `MODULE_WEIGHTS` |
| Höchstwertprinzip Modul 2 gegen Modul 3 | § 15 Abs. 3 SGB XI | `maxOf23` in `rechner.ts` |
| Schwellen 12,5 / 27 / 47,5 / 70 / 90 | § 15 Abs. 3 SGB XI | `PFLEGEGRAD_THRESHOLDS` |
| Fünf Schweregradstufen je Modul | Begutachtungs-Richtlinie, Anlage zu § 15 | `severityFraction` |

**Der Punkt, an dem es unsicher wird**, ist im Code bereits vermerkt (`nba.ts`, Zeile 14–20):
Die App fragt je Modul weniger Kriterien ab als der amtliche Katalog — bei Modul 3 vier statt
dreizehn. Die amtlichen Punktschwellen sind damit nicht anwendbar. Stattdessen wird der
Schweregrad aus dem *Anteil* der erreichten Rohpunkte bestimmt und auf die fünf Stufen
abgebildet. Der Kommentar schließt mit: „FACHLICH/JURISTISCH gegen die aktuelle BRi zu
verifizieren."

Diese Verifikation hat nie stattgefunden. Das Ergebnis wird trotzdem mit Ampel und Geldbetrag
ausgegeben.

---

## Nicht-Ziele

- **Kein weiteres Rechtsgebiet.** SGB XIV (#30) bleibt liegen, bis dieses PRD abgearbeitet ist.
- **Kein B2B.** Der Pflegedienst-Zugang läuft getrennt und ist durch #105 blockiert.
- **Keine KI.** Weder zur Erklärung des Ergebnisses noch zur Brieferzeugung.
- **Keine neue Oberfläche.** Vertiefung heißt: dem vorhandenen Weg trauen können, nicht ihn ersetzen.
- **Keine Nachbildung der amtlichen Begutachtung.** Das Ziel ist ein ehrliches Orientierungs­instrument, das seine Grenzen kennt und benennt — nicht ein Gutachten.

---

## Umfang

Die vier Teile sind einzeln auslieferbar und stehen in dieser Reihenfolge, weil jeder den
nächsten trägt.

### 1. Das Rechenmodell prüfen und die Prüfung festhalten

Der offene Vermerk in `nba.ts` wird beantwortet. Die Näherung über den Rohpunkte-Anteil wird
gegen die geltende Begutachtungs-Richtlinie gehalten. Das Ergebnis wird in diesem PRD
festgehalten — auch dann, wenn es lautet: die Näherung trägt.

Ein konkreter Fall, der dabei zu rechnen ist: `severityFraction` liefert für jedes Verhältnis
über null mindestens die Stufe 0,25. Wer in jedem Modul genau eine leichte Beeinträchtigung
angibt, erreicht 2,5 + 3,75 + 10 + 5 + 3,75 = **25 Punkte** und damit Pflegegrad 1. Ob das
fachlich angemessen ist, muss die Prüfung sagen — hier wird es nur als Frage vermerkt.

**Fertig, wenn:** die Antwort im Abschnitt *Geprüft und angenommen* steht und der Vermerk in
`nba.ts` durch eine belegte Aussage ersetzt ist.

### 2. Die Rechnung sichtbar machen

Das Ergebnis zeigt seine Herleitung: Rohpunkte je Modul, daraus die gewichteten Punkte, das
Höchstwertprinzip zwischen Modul 2 und 3 als das, was es ist — eine Auswahl, keine Summe —
und die Schwelle, an der der Pflegegrad kippt. Dazu ein Satz, der sagt, was der Rechner ist
und was nicht.

Dem steht heute ein Fehler im Weg: `PflegegradErgebnis.weightedScores` ist auf die Module 1
bis 5 typisiert (`src/types/pflegegrad.ts:29`). Modul 6 fließt in die Gesamtsumme ein, wird
aber nicht mit ausgegeben. Eine Aufschlüsselung aus diesem Feld wäre still unvollständig.

**Fertig, wenn:** aus dem Ergebnis nachvollziehbar ist, welches Modul den Ausschlag gab, und
`weightedScores` alle sechs Module führt.

### 3. Beträge belegen und übersetzbar machen

`NBA_CONFIG.BENEFITS` trägt den Kommentar „Gesetzlicher Satz 2026", enthält aber
Werte, die auf den Stand 2024 hindeuten (Pflegegeld 332 / 573 / 765 / 947 €, Entlastungsbetrag
125 €). Zum 01.01.2025 wurden die Leistungsbeträge angehoben. **Zu prüfen und zu belegen —
aber schon die Abweichung zwischen Beschriftung und Werten macht die Angabe unbrauchbar.**

Dazu stehen in `rechner.ts` deutsche Zeichenketten fest im Code: `'Pflegehilfsmittel (42€)'`,
`'Wohnraumanpassung (4.180€)'`, `'Schwerbehindertenausweis prüfen'`. In einem Portal mit 35
Sprachen erscheinen sie in jeder Sprache auf Deutsch, und die Beträge haben keine Quelle.

**Fertig, wenn:** jeder Geldbetrag eine Fundstelle mit Datum hat, die Beträge an einer Stelle
stehen, und keine anzuzeigende Zeichenkette mehr in `src/lib/` liegt.

### 4. Den Pfad barrierefrei machen

Nicht das ganze Portal — dieser Weg: Start, Module 1 bis 6, Ergebnis, Widerspruch. Tastatur,
Fokus, Kontrast, Beschriftungen, Screenreader.

Der Umfang hängt an #34 und damit an der Frage, ob die Kleinstunternehmer-Ausnahme des BFSG
trägt. Bis das geklärt ist, gilt der Pflegegrad-Pfad als Mindestumfang, weil er der Weg zur
kostenpflichtigen Leistung ist.

**Fertig, wenn:** der Pfad mit Tastatur allein vollständig bedienbar ist und die
Ergebnisseite mit einem Screenreader verständlich vorgelesen wird.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Modulgewichte, Höchstwertprinzip und Schwellen sind amtlich | § 15 Abs. 3 SGB XI, im Code belegt | geprüft |
| `weightedScores` führt Modul 6 nicht | `src/types/pflegegrad.ts:29` | geprüft |
| Anzuzeigende deutsche Zeichenketten stehen in `src/lib/pflegegrad/rechner.ts` | Durchsicht 29.08.2026 | geprüft |
| Die Rohpunkte werden serverseitig berechnet | `scoring.ts`, seit #98–#100 | geprüft |
| Die Beträge in `NBA_CONFIG.BENEFITS` sind nicht auf dem Stand 2026 | Werte deuten auf 2024, Beschriftung sagt 2026 | **angenommen** — Teil 3 |
| Die Näherung über den Rohpunkte-Anteil ist fachlich vertretbar | Vermerk in `nba.ts`, nie geprüft | **angenommen** — Teil 1, tragend |
| Eine leichte Beeinträchtigung in jedem Modul soll zu Pflegegrad 1 führen | ergibt sich aus `severityFraction`, nicht aus einer Quelle | **angenommen** — Teil 1 |

Die beiden letzten Zeilen sind die tragenden. Fällt die Näherung, ändert sich das Ergebnis
jedes Durchlaufs — und damit der Umfang dieses PRD.

---

## Offene Fragen

| Frage | Wer beantwortet sie |
|---|---|
| Hält die Näherung über den Rohpunkte-Anteil gegen die geltende Begutachtungs-Richtlinie? | fachliche Beratung; nicht aus der Architektur ableitbar |
| Welche Leistungsbeträge gelten 2026, mit Fundstelle? | recherchierbar, gehört anschließend hierher |
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? | Geschäftsführung — siehe 000 |
