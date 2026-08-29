# Epic — Pflegegrad-Ermittlung

| | |
|---|---|
| **Stufe** | In Ausarbeitung |
| **Ausgearbeitet am** | 29.08.2026 |
| **Issues** | noch zu schneiden |
| **Blockiert durch** | — (einzelne Features hängen an offenen Fragen) |

---

## Zweck

Eine Person soll ihren voraussichtlichen Pflegegrad einschätzen können **und verstehen, wie
die Einschätzung zustande kam**.

Der zweite Teil ist der eigentliche. Eine Zahl allein trägt den nächsten Schritt nicht: Nach
dem Ergebnis kommt der Antrag, nach dem Bescheid der Widerspruch — und wer widerspricht, muss
begründen. Ein Ergebnis, das seine eigene Herleitung nicht zeigt, ist an genau der Stelle
wertlos, an der es gebraucht wird.

Heute bekommt die Person eine Zahl, eine Ampel und einen Euro-Betrag, aber keinen Grund, das
zu glauben.

---

## Nicht-Ziele

- **Keine Nachbildung der amtlichen Begutachtung.** Ziel ist ein ehrliches
  Orientierungsinstrument, das seine Grenzen kennt und benennt.
- **Kein weiteres Rechtsgebiet.** SGB XIV (#30) bleibt liegen.
- **Keine KI.** Weder zur Erklärung des Ergebnisses noch zur Brieferzeugung.
- **Keine neue Oberfläche.** Vertiefung heißt, dem vorhandenen Weg trauen zu können — nicht,
  ihn zu ersetzen.

---

## Grundlage

Das Bewertungsmodell steht in `src/lib/pflegegrad/nba.ts` und ist dort belegt:

| Sache | Fundstelle | Im Code |
|---|---|---|
| Modulgewichte 10 / 15 / 15 / 40 / 20 / 15 | § 15 Abs. 3 SGB XI | `MODULE_WEIGHTS` |
| Höchstwertprinzip Modul 2 gegen Modul 3 | § 15 Abs. 3 SGB XI | `maxOf23` in `rechner.ts` |
| Schwellen 12,5 / 27 / 47,5 / 70 / 90 | § 15 Abs. 3 SGB XI | `PFLEGEGRAD_THRESHOLDS` |
| Fünf Schweregradstufen je Modul | Begutachtungs-Richtlinie, Anlage zu § 15 | `severityFraction` |

**Wo es unsicher wird**, ist im Code bereits vermerkt (`nba.ts`, Zeile 14–20): Die App fragt je
Modul weniger Kriterien ab als der amtliche Katalog — bei Modul 3 vier statt dreizehn. Die
amtlichen Punktschwellen sind damit nicht anwendbar. Stattdessen wird der Schweregrad aus dem
*Anteil* der erreichten Rohpunkte bestimmt. Der Kommentar schließt: „FACHLICH/JURISTISCH gegen
die aktuelle BRi zu verifizieren."

Diese Verifikation hat nie stattgefunden. Das Ergebnis geht trotzdem mit Ampel und Geldbetrag
hinaus. **Das ist die tragende Unsicherheit dieses Epics** — siehe F2.2.

---

## Capability — Erhebung

Die Fähigkeit, den Zustand einer Person strukturiert aufzunehmen.

### F1.1 — Erwachsenen-Erhebung

**Zweck** Die sechs Module des Begutachtungsinstruments für Erwachsene aufnehmen.
**Umfang** Gebaut. Modul 1 bis 6, Antworten im Browser, Rohpunkte serverseitig.
**Fertig, wenn** — erledigt, siehe F1.3 für die Fortschreibung.
**Hängt an** —

### F1.2 — Kinder-Erhebung

**Zweck** Denselben Weg für Kinder abbilden, mit eigenem Modulzuschnitt.

**Umfang** Erhebung gebaut. **Die Einwilligungsführung fehlt.**

Der DiPA-Kriterienkatalog des BfArM verlangt als MUSS (CNST_1.6 a): Vor der Einholung der
Einwilligung muss die Einwilligungsfähigkeit der betroffenen Person abgefragt werden; besteht
sie nicht, muss auf das Erfordernis der Einwilligung eines Erziehungsberechtigten verwiesen und
diese abgefragt werden. Der Kinder-Pfad fragt heute weder das eine noch das andere — er setzt
lediglich `pflege_zielgruppe = 'kind'` im `localStorage`.

Greift nur, sofern der Hersteller die Nutzung durch unter 16-Jährige nicht ausdrücklich
ausschließt. Genau das tut der Kinder-Pfad nicht — er lädt dazu ein.

**Fertig, wenn** vor der ersten Frage die Einwilligungsfähigkeit abgefragt wird und bei
fehlender Einwilligungsfähigkeit die Einwilligung eines Erziehungsberechtigten eingeholt und
mit dem Fall verknüpft ist.

**Hängt an** der Einwilligungsverwaltung (Epic *Vertrauen & Zugänglichkeit*) · der DiPA-Frage
in [richtung.md](../richtung.md)

### F1.3 — Erweiterte Erhebung hinter der Bezahlschranke

**Zweck** Die ausführliche Erhebung wird die kostenpflichtige Leistung. Die kurze Einschätzung
bleibt frei und führt hin.

**Umfang**
- Schnitt zwischen freier Kurzeinschätzung und erweiterter Erhebung festlegen (offen, siehe unten)
- Erweiterte Fragen **serverseitig ausliefern und speichern**
- Serverseitige Durchsetzung der Freischaltung bei jedem Abruf und jeder Antwort
- Bezahlschranke im Fluss, an der Grenze, nicht erst am Ergebnis
- Die freie Einschätzung muss für sich brauchbar bleiben und darf nicht als Köder wirken

**Der Punkt, der die Umsetzung bestimmt:** Die Modulseiten sind heute reine Client-Seiten, die
Antworten liegen im `localStorage`. `entitlement.ts` ist ausdrücklich nur Oberflächenlogik —
durchgesetzt wird serverseitig in den API-Routen (`requireCaseSession` + `isUnlocked`). Eine
Bezahlschranke vor Fragen, die bereits im Browser stehen, ist keine Schranke. Die erweiterten
Fragen müssen also über die API kommen, so wie die Rohpunkte seit #98–#100 serverseitig
berechnet werden.

**Was der DiPA-Kriterienkatalog dazu vorgibt:** Die Zustimmung zu den Nutzungsbedingungen darf
**nicht** mit der datenschutzrechtlichen Einwilligung in ein Häkchen gebündelt werden —
CNST_1.2 verbietet Erklärungen, die über die zulässigen Zwecke hinausgehen. Beides wird
gebraucht, aber als getrennte Handlungen. Und jede Einwilligung muss mit dem Fallcode als
pseudonymem Account verknüpft werden (CNST_1.3 a), damit sie widerrufbar bleibt.

**Fertig, wenn**
- ein nicht freigeschalteter Fall die erweiterten Fragen weder abrufen noch beantworten kann,
  auch nicht unter Umgehung der Oberfläche
- der Übergang von frei zu kostenpflichtig im Fluss erklärt ist, nicht nur versperrt
- die freie Einschätzung ohne die erweiterten Fragen ein gültiges Ergebnis liefert
- Nutzungsbedingungen und Einwilligung getrennt bestätigt und am Fall festgehalten werden

**Hängt an** dem offenen Schnitt (unten) · der Einwilligungsverwaltung (Epic *Vertrauen &
Zugänglichkeit*) · F2.2, weil eine ungeprüfte Rechnung nichts ist, wofür man Geld nehmen sollte

> **Der Schnitt ist offen und wird nicht hier entschieden.** Er ist zugleich die Grenze des
> Produkts, das als digitale Pflegeanwendung gelistet werden soll — siehe
> [richtung.md](../richtung.md). Ob eine Pflegegrad-Einschätzung mit Antragshilfe § 40a SGB XI
> überhaupt erfüllt, ist die tragende offene Frage. Sie gehört vor die Umsetzung.

### F1.4 — Fall wiederaufnehmen

**Zweck** Eine Erhebung später auf demselben oder einem anderen Gerät fortsetzen.
**Umfang** Teilweise gebaut; Wiederaufnahme über den Fallcode.
**Fertig, wenn** ein begonnener Fall auf einem anderen Gerät an derselben Stelle weitergeht.
**Hängt an** #99 · verschärft sich mit F1.3, weil dann Bezahltes verloren gehen kann

---

## Capability — Bewertung

Die Fähigkeit, aus Antworten einen Pflegegrad zu errechnen, den man belegen kann.

### F2.1 — Serverseitige Rohpunkte

**Zweck** Die Umrechnung Antwort → Punkte an einer Stelle halten, außerhalb der Reichweite des
Browsers.
**Umfang** Gebaut (#98–#100). `scoring.ts` ist die einzige Wahrheit.
**Fertig, wenn** — erledigt.
**Hängt an** —

### F2.2 — Prüfung des Rechenmodells

**Zweck** Den offenen Vermerk in `nba.ts` einlösen. Die Näherung über den Rohpunkte-Anteil
gegen die geltende Begutachtungs-Richtlinie halten.

**Umfang**
- Die Näherung fachlich prüfen lassen
- Das Ergebnis hier festhalten — auch dann, wenn es lautet: die Näherung trägt
- Den Vermerk in `nba.ts` durch eine belegte Aussage ersetzen

**Ein Fall, der dabei zu rechnen ist:** `severityFraction` liefert für jedes Verhältnis über
null mindestens die Stufe 0,25. Wer in jedem Modul genau eine leichte Beeinträchtigung angibt,
erreicht 2,5 + 3,75 + 10 + 5 + 3,75 = **25 Punkte** und damit Pflegegrad 1. Ob das fachlich
angemessen ist, muss die Prüfung sagen.

**Fertig, wenn** die Antwort in *Geprüft und angenommen* steht und `nba.ts` keinen offenen
Prüfvermerk mehr trägt.

**Hängt an** fachlicher Beratung — nicht aus der Architektur ableitbar. **Steht vor allen
anderen Features dieses Epics.**

### F2.3 — Vollständigkeit erkennen

**Zweck** Unterscheiden können, ob null Punkte volle Selbstständigkeit bedeuten oder eine
fehlende Antwort.
**Umfang** Gebaut. `bestimmeUnvollstaendigeModule`, `missingData`.
**Fertig, wenn** — erledigt.
**Hängt an** —

---

## Capability — Ergebnis

Die Fähigkeit, die Einschätzung so auszugeben, dass sie den nächsten Schritt trägt.

### F3.1 — Nachvollziehbare Herleitung

**Zweck** Zeigen, wie das Ergebnis zustande kam.

**Umfang**
- Rohpunkte je Modul, daraus die gewichteten Punkte
- Das Höchstwertprinzip zwischen Modul 2 und 3 als das, was es ist: eine Auswahl, keine Summe
- Die Schwelle, an der der Pflegegrad kippt, und der Abstand dorthin
- Ein Satz, der sagt, was der Rechner ist und was nicht

**Im Weg steht ein Fehler:** `PflegegradErgebnis.weightedScores` ist auf die Module 1 bis 5
typisiert (`src/types/pflegegrad.ts:29`). Modul 6 fließt in die Gesamtsumme ein, wird aber
nicht ausgegeben. Eine Aufschlüsselung aus diesem Feld wäre still unvollständig.

**Fertig, wenn** aus dem Ergebnis erkennbar ist, welches Modul den Ausschlag gab, und
`weightedScores` alle sechs Module führt.

**Hängt an** F2.2 — eine Herleitung zu zeigen, die auf einer ungeprüften Näherung ruht, macht
die Sache schlimmer, nicht besser.

### F3.2 — Leistungsbeträge mit Fundstelle

**Zweck** Geldbeträge nur dann anzeigen, wenn sie belegt und aktuell sind.

**Umfang**
- Beträge belegen und aktualisieren
- Alle Beträge an eine Stelle mit Fundstelle und Datum
- Anzuzeigende Zeichenketten aus `src/lib/` heraus in die Sprachdateien

**Zwei Befunde:** `NBA_CONFIG.BENEFITS` trägt den Kommentar „Gesetzlicher Satz 2026", enthält
aber Werte, die auf den Stand 2024 hindeuten (Pflegegeld 332 / 573 / 765 / 947 €,
Entlastungsbetrag 125 €); zum 01.01.2025 wurden die Beträge angehoben. Und in `rechner.ts`
stehen deutsche Zeichenketten fest im Code — `'Pflegehilfsmittel (42€)'`,
`'Wohnraumanpassung (4.180€)'`, `'Schwerbehindertenausweis prüfen'` —, die in einem Portal mit
35 Sprachen überall auf Deutsch erscheinen und deren Beträge keine Quelle haben.

**Fertig, wenn** jeder Geldbetrag eine Fundstelle mit Datum hat und keine anzuzeigende
Zeichenkette mehr in `src/lib/` liegt.

**Hängt an** — (unabhängig umsetzbar)

### F3.3 — Übergang zum Widerspruch

**Zweck** Aus dem Ergebnis heraus den nächsten Schritt anbieten, mit den Zahlen, die den
Widerspruch begründen.
**Umfang** Teilweise gebaut. Die Herleitung aus F3.1 ist das, was den Widerspruch trägt.
**Fertig, wenn** die Begründung des Widerspruchs auf die Modulwerte Bezug nimmt.
**Hängt an** F3.1 · Epic *Widerspruch & Briefe*

---

## Capability — Zugänglichkeit dieses Pfads

### F4.1 — Tastatur und Screenreader auf dem Pflegegrad-Pfad

**Zweck** Den Weg Start → Modul 1–6 → Ergebnis → Widerspruch ohne Maus und mit Screenreader
bedienbar machen. Nicht das ganze Portal — diesen Weg.

**Umfang** Tastaturbedienung, sichtbarer Fokus, Kontraste, Beschriftungen, Vorlesbarkeit der
Ergebnisseite.

**Fertig, wenn** der Pfad mit Tastatur allein vollständig bedienbar ist und die Ergebnisseite
mit einem Screenreader verständlich vorgelesen wird.

**Hängt an** #34 · Der Umfang hängt an der BFSG-Frage in [richtung.md](../richtung.md). Bis
sie geklärt ist, gilt dieser Pfad als Mindestumfang — er führt zur kostenpflichtigen Leistung.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Modulgewichte, Höchstwertprinzip und Schwellen sind amtlich | § 15 Abs. 3 SGB XI, im Code belegt | geprüft |
| Rohpunkte werden serverseitig berechnet | `scoring.ts`, seit #98–#100 | geprüft |
| `weightedScores` führt Modul 6 nicht | `src/types/pflegegrad.ts:29` | geprüft |
| Anzuzeigende deutsche Zeichenketten stehen in `rechner.ts` | Durchsicht 29.08.2026 | geprüft |
| Die Modulseiten prüfen keine Freischaltung; Antworten liegen im `localStorage` | Durchsicht 29.08.2026 | geprüft |
| `entitlement.ts` ist nur Oberflächenlogik, Durchsetzung liegt in den API-Routen | Kommentar in `entitlement.ts`, `case-auth.ts` | geprüft |
| Die Beträge in `NBA_CONFIG.BENEFITS` sind nicht auf dem Stand 2026 | Werte deuten auf 2024, Beschriftung sagt 2026 | **angenommen** — F3.2 |
| Die Näherung über den Rohpunkte-Anteil ist fachlich vertretbar | Vermerk in `nba.ts`, nie eingelöst | **angenommen** — tragend, F2.2 |
| Eine leichte Beeinträchtigung in jedem Modul soll zu Pflegegrad 1 führen | folgt aus `severityFraction`, aus keiner Quelle | **angenommen** — F2.2 |

Die beiden letzten Zeilen tragen das Epic. Fällt die Näherung, ändert sich das Ergebnis jedes
Durchlaufs — und der Zuschnitt aller anderen Features.

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Hält die Näherung über den Rohpunkte-Anteil gegen die Begutachtungs-Richtlinie? | fachliche Beratung | F2.2, und damit F1.3 und F3.1 |
| Wo verläuft der Schnitt zwischen freier und erweiterter Erhebung? | Produkt, gebunden an die DiPA-Frage | F1.3 |
| Erfüllt eine Pflegegrad-Einschätzung § 40a SGB XI? | Beratung zum BfArM-Verfahren | die Lage des Schnitts |
| Welche Leistungsbeträge gelten 2026, mit Fundstelle? | recherchierbar | F3.2 |
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? | Geschäftsführung | Umfang von F4.1 |
