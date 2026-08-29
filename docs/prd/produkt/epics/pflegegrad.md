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

### F1.3 — Vollständige Erhebung hinter der Bezahlschranke

**Zweck** Die Erhebung nach dem vollständigen amtlichen Kriterienkatalog wird die
kostenpflichtige Leistung. Die heutige Kurzeinschätzung bleibt frei und führt hin.

**Der Schnitt ist damit festgelegt** — und er ist fachlich begründet, nicht willkürlich:

| | frei | kostenpflichtig |
|---|---|---|
| Kriterien | 28 (4 / 5 / 4 / 6 / 4 / 5 je Modul) | der vollständige amtliche Katalog |
| Bewertung | Näherung über den Rohpunkte-Anteil | die **amtlichen Punktschwellen** |
| Aussage | Orientierung | belastbare Einschätzung, widerspruchsfähig |

Die Zahlen der freien Fassung stehen in `MODULE_MAX_RAW` (`nba.ts:37`); der Abstand zum
amtlichen Katalog ist dort selbst vermerkt („z. B. Modul 3: 4 statt 13").

> **Was dieser Schnitt nebenbei löst.** Die Näherung `severityFraction` existiert nur, *weil*
> die App weniger Kriterien abfragt als der amtliche Katalog — mit dem vollständigen Katalog
> sind die amtlichen Punktschwellen unmittelbar anwendbar. Damit betrifft die offene Prüfung
> aus F2.2 nur noch die **freie** Fassung. Die kostenpflichtige Leistung ruht auf der Norm
> selbst, nicht auf einer Näherung. Für die DiPA-Absicht ist genau das die tragfähigere
> Grundlage — die Bezahlschranke trennt dann Orientierung von Erhebung, nicht mehr und
> weniger vom selben.

**Umfang**
- Vollständiger Kriterienkatalog je Modul erfasst und hinterlegt
- Bewertung der Vollfassung über die amtlichen Punktschwellen statt über die Näherung
- Fragen und Antworten der Vollfassung **serverseitig ausliefern und speichern**
- Serverseitige Durchsetzung der Freischaltung bei jedem Abruf und jeder Antwort
- Einstieg über die Ergebnisseite (F3.4), nicht über einen Sprung im Trichter
- Die freie Einschätzung bleibt für sich brauchbar und darf nicht als Köder wirken

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

### F3.1 — Nachvollziehbare Herleitung · *weitgehend gebaut*

> **Korrektur vom 29.08.2026.** Eine frühere Fassung dieses Features behauptete, das Ergebnis
> zeige seine Herleitung nicht. Das war falsch und aus dem Typ geschlossen, ohne die laufende
> Seite anzusehen. Die Prüfung an einem echten Fall hat das Gegenteil ergeben.

**Zweck** Zeigen, wie das Ergebnis zustande kam.

**Was bereits steht** — geprüft an Fall `PF-C1HB-FH1I` auf der Ergebnisseite:

- Punktwert und Gesamtskala („Punktwert: 50.0 von 100.")
- Alle fünf Schwellen im Klartext erklärt
- Je Modul der Rohwert **und** die gewichteten Punkte („40.0 Pkt. · Rohwert: 18")
- Das Höchstwertprinzip ausdrücklich benannt: „Höchstwertprinzip aktiv (Vergleich Modul 2:
  0 Pkt. vs Modul 3: 0 Pkt.) → Fließt nicht in die Gesamtwertung ein."
- Ein einordnender Abschnitt „Wie kommt mein Pflegegrad zustande? (Einfach erklärt)"
- Bei Unterschreiten der Schwelle ein Hinweis auf den Abstand dorthin

Das ist mehr, als das Feature verlangt hatte.

**Was offen bleibt** — ein einzelner Fehler, jetzt sichtbar statt erschlossen: Die Module 1
bis 5 weisen ihre gewichteten Punkte aus, **Modul 6 zeigt nur „Erfasst"**. Ursache ist
`PflegegradErgebnis.weightedScores` in `src/types/pflegegrad.ts:29`, das auf die Module 1 bis 5
typisiert ist. Modul 6 fließt in die Summe ein, hat aber keinen ausgebbaren Wert.

**Fertig, wenn** `weightedScores` alle sechs Module führt und Modul 6 seine gewichteten Punkte
wie die übrigen ausweist.

**Hängt an** — (klein und unabhängig; die Verlässlichkeit der gezeigten Zahlen hängt an F2.2)

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

### F3.4 — Einstieg in die vollständige Erhebung vom Ergebnis aus

**Zweck** Die Ergebnisseite ist die Stelle, an der jemand weiß, was er hat — und ob es reicht.
Genau dort gehört das Angebot hin, es genauer zu erfahren.

**Umfang**
- Schaltfläche auf der Ergebnisseite, die die vollständige Erhebung startet
- Davor die Bezahlschranke; der Kauf schaltet den Fall frei, nicht das Gerät
- Nach Freischaltung führt die Schaltfläche unmittelbar in die erste Frage der Vollfassung
- Der Nutzen wird benannt, bevor bezahlt wird: mehr Kriterien, amtliche Punktschwellen,
  belastbar für einen Widerspruch — nicht „mehr Details"
- Fortsetzbar: Wer die Vollfassung beginnt und unterbricht, findet sie über den Fallcode wieder

**Der Zeitpunkt ist der Punkt.** Am Anfang des Trichters weiß niemand, wofür er zahlen soll.
Nach dem Ergebnis schon — besonders, wenn der Wert knapp unter einer Schwelle liegt. Die
Ergebnisseite weist diesen Abstand bereits aus.

**Fertig, wenn**
- die Schaltfläche für einen nicht freigeschalteten Fall die Bezahlschranke öffnet
- ein freigeschalteter Fall unmittelbar in die Vollfassung gelangt
- der Weg auf einem zweiten Gerät mit demselben Fallcode weitergeht
- ohne Freischaltung kein Zugriff auf Fragen oder Antworten der Vollfassung möglich ist,
  auch nicht unter Umgehung der Oberfläche

**Hängt an** F1.3 · F1.4 und #99, weil hier zum ersten Mal Bezahltes verloren gehen kann

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

## Die Rollenabfrage im Trichter

Der Trichter fragt heute nur „Erwachsene oder Kind". Er müsste stattdessen die **Rolle** der
bedienenden Person kennen, und zwar in drei Ausprägungen:

| Auswahl | Was rechtlich vorliegt |
|---|---|
| Ich fülle das für mich selbst aus | Einwilligung der betroffenen Person |
| Ich helfe jemandem beim Ausfüllen — **die Person weiß davon und ist einverstanden** | weiterhin Einwilligung der betroffenen Person; die helfende Person tritt nicht als Vertreterin auf |
| Ich handle **für** jemanden, der das nicht selbst kann | Vertretung — Vollmacht oder rechtliche Betreuung erforderlich |

**Die mittlere Zeile ist der wichtige Zugewinn.** Sie deckt den häufigsten Fall ab — eine
Tochter sitzt neben ihrer Mutter und bedient das Gerät —, ohne dafür ein Vertretungsverhältnis
zu konstruieren, das gar nicht besteht. Das ist rechtlich sauberer und produktseitig einfacher
als die bisherige Annahme, jede Angehörige handle als Vertreterin.

Nur die dritte Zeile löst den Nachweisapparat aus. Die Auswahl wird mit der Einwilligung
gespeichert (`erklaerende_rolle`, siehe
[einwilligung-entwurf.md](../konzept_pflegedienst/einwilligung-entwurf.md)).

**Wichtig:** Eine Selbsterklärung im Trichter begründet keine Vertretungsmacht. Sie hält nur
fest, was behauptet wurde. Was daraus folgt, ist Gegenstand von #105.

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
