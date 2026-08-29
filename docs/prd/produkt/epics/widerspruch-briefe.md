# Epic — Widerspruch & Briefe

| | |
|---|---|
| **Stufe** | In Ausarbeitung |
| **Ausgearbeitet am** | 29.08.2026 |
| **Issues** | #3, #25 |
| **Blockiert durch** | — |

> Dieses Epic hat ein ungewöhnliches Problem: **Es ist weitgehend gebaut, aber nie beschrieben
> worden.** Issue #3 nennt zwei Brieftypen, im Code stehen acht. Die Anforderung ist hier nicht
> zu klein für den Code, sondern kleiner als er.

---

## Zweck

Aus einer Einschätzung ein Schreiben machen, das bei der Pflegekasse etwas bewirkt.

Das ist die Stelle, an der das Portal aufhört, ein Rechner zu sein. Wer einen Pflegegrad
schätzt, will keine Zahl — er will einen Antrag oder einen Widerspruch. Und für Pflegedienste
ist der Widerspruch eine der vier Aufgaben der ersten Auslieferung
([pflegedienst.md](pflegedienst.md)).

---

## Was bereits steht

Geprüft am Code, 29.08.2026:

| Bereich | Stand |
|---|---|
| Acht Brieftypen mit Generator, Vorlage und Tests | gebaut |
| `BriefGeneratorFactory` als gemeinsamer Einstieg | gebaut |
| Fristenberechnung | gebaut, **sehr gut belegt** |
| Bescheiddatum-Abfrage samt Ampel | gebaut |
| PDF-Erzeugung, zwei Routen | gebaut |
| Gesetzeseinbindung über `api/gesetze/[sgb]/[paragraph]` | gebaut |
| Seiten `/briefe` und `/widerspruch` | gebaut |

**Die Fristenlogik verdient eine ausdrückliche Erwähnung.** `src/lib/widerspruch/fristen.ts`
kennt den Fristenlauf nach § 64 Abs. 2 und 3 SGG einschließlich der Verschiebung auf den
nächsten Werktag, die Untätigkeitsklage nach § 88 Abs. 1 SGG (sechs Monate ab Antrag) und
Abs. 2 (drei Monate ab Widerspruch), und darüber hinaus § 18 Abs. 3 SGB XI mit den 25
Arbeitstagen sowie den verkürzten Fristen von einer beziehungsweise zwei Wochen bei
Krankenhaus-, Hospiz- und Pflegezeit-Fällen. Jede Frist trägt ihre Fundstelle. Das ist neben
`nba.ts` der bestbelegte Fachcode im Projekt.

---

## Der Bruch: Der Widerspruch kennt die Begutachtung nicht

**Der wichtigste Befund dieses Epics.** Weder
`src/lib/briefe/domains/pflegegrad/pflegegrad.generator.ts` noch die zugehörige Vorlage greifen
auf `moduleScores`, `weightedScores`, `totalScore` oder `careLevel` zu. Der Widerspruch wird
erzeugt, ohne zu wissen, was die Einschätzung ergeben hat.

Damit bricht die Wertschöpfungskette an ihrem letzten Glied:

```
erheben  →  bewerten  →  Herleitung zeigen  →  ✗  Widerspruch begründen
```

Die Ergebnisseite weist inzwischen je Modul den Rohwert **und** die gewichteten Punkte aus, das
Höchstwertprinzip und den Abstand zur nächsten Schwelle. Genau diese Zahlen sind es, mit denen
sich ein Widerspruch begründen lässt: *„Modul 4 wurde mit 0 Punkten bewertet; nach unserer
Erhebung liegt der Rohwert bei 18, was 40 gewichteten Punkten entspricht und den Pflegegrad von
1 auf 3 hebt."*

Ohne das ist der Widerspruch ein Formbrief. Ein Formbrief an eine Pflegekasse bewirkt wenig,
und für einen Pflegedienst, der ihn im Namen seiner Patientin einreicht, ist er wertlos.

---

## Die Vorlagen sind nicht das Ziel

**Später soll eine KI die Schreiben individuell formulieren** und dabei die passenden
Gesetzestexte einarbeiten (festgehalten am 29.08.2026). Das ändert, was die acht Vorlagen
sind: nicht das Produkt, sondern das Fundament, aus dem die KI schöpft — geprüfte Bausteine,
belegte Formulierungen, gesicherte Fundstellen.

Das entschärft die Richtungsfrage unten nicht, es verschiebt sie: Eine Vorlage, die
niemand pflegt, wird zur Trainingsgrundlage für falsche Schreiben.

### Was daran das Risiko ist

Dieses Projekt hatte binnen weniger Wochen drei fachliche Fehler: eine erfundene
Pflegezulage, ein falsches Stichjahr im Erwerbsminderungsrechner, eine GdB-Rechenregel ohne
Deckung in der Verordnung. Jeder davon entstand einmal, im Code, und wurde einmal gefunden.

Ein Sprachmodell, das Gesetzestexte in Widersprüche einarbeitet, erzeugt dieselbe Fehlerklasse
**je Schreiben** — und niemand liest gegen. Das Schreiben geht an eine Pflegekasse, im Namen
einer pflegebedürftigen Person, oft eingereicht von einem Pflegedienst, der sich darauf
verlässt.

### Daraus folgende Anforderungen

- **Keine Norm aus dem Modellgedächtnis.** Gesetzestexte kommen ausschließlich aus
  `api/gesetze/[sgb]/[paragraph]` — die Schnittstelle existiert bereits und ist genau dafür
  die richtige Grundlage. Was dort nicht steht, steht nicht im Brief.
- **Jede Fundstelle im erzeugten Text ist gegen die Quelle prüfbar.** Ein Verweis, der sich
  nicht auflösen lässt, verhindert die Erzeugung, statt sie zu schmücken.
- **Belegte Rechtsprechung nur aus einer freigegebenen Liste** — #25 verlangt das bereits
  (BSG, BVerfG, LSG NRW).
- **Kenntlichmachung nach Art. 50 KI-Verordnung.** Wer den Text liest, muss wissen, dass er
  maschinell erzeugt wurde. Die Pflicht ist in `grant-docs` →
  `07_Architekturentscheidungen/Compliance/EU_AI_Act_Compliance.tex` ausgearbeitet.
- **Ein Mensch sieht den Text, bevor er hinausgeht.** Nicht als Rechtspflicht, sondern weil
  ein Widerspruch ein rechtsverbindlicher Schritt mit Frist ist.
- **Der Betriebsort des Dienstes ist eine Zulassungsfrage.** Kriterium AV_1.1 des
  BfArM-Katalogs verlangt Verarbeitung in der EU — siehe [richtung.md](../richtung.md).

**Einordnung nach der KI-Verordnung:** Die vorliegende Prüfung kommt zu *kein
Hochrisiko-System*, weil Anhang III Nr. 5 lit. a einen Einsatz durch oder im Auftrag einer
Behörde voraussetzt. Der dort festgehaltene Vorbehalt betrifft die Lizenzierung an **Kassen**
als Körperschaften des öffentlichen Rechts; der Vertrieb an Pflegedienste ist ausdrücklich
nicht betroffen. Die Entscheidung vom 29.08.2026, mit Pflegediensten zu beginnen, ändert die
Einstufung damit **nicht**.

---

## Die Richtungsfrage: acht Brieftypen

Im Code liegen: `antrag-pflegegrad`, `widerspruch-pflegegrad`, `schwerbehindertenausweis`,
`versorgungsamt`, `em-rente`, `betreuungsrecht`, `erbrecht`, `allgemein`.

Issue #3 nennt zwei davon. **Erbrecht** und **Betreuungsrecht** kommen in keinem Issue vor.

Am 29.08.2026 wurde „Vertiefung statt Verbreiterung" entschieden — und Erbrecht in einem
Pflegeportal ist ein eigenes Rechtsgebiet, keine Abrundung. Jeder Brieftyp, der bleibt, muss
gepflegt werden: Gesetzesänderungen, Formulierungen, Tests. Das ist eine Entscheidung, keine
Aufräumarbeit.

**Zu entscheiden:** Welche der acht bleiben? Naheliegend wäre, die Pflegegrad-Kette vollständig
zu machen und alles zu prüfen, was ein eigenes Rechtsgebiet aufmacht.

---

## Capability — Schreiben erzeugen

### F1.1 — Der Widerspruch begründet sich aus der Begutachtung

**Zweck** Der wichtigste Punkt dieses Epics — siehe oben.

**Umfang**
- Der Generator erhält das Ergebnis der Einschätzung, nicht nur Stammdaten
- Die Begründung nennt je strittigem Modul den Rohwert, die gewichteten Punkte und die
  Auswirkung auf den Gesamtwert
- Der Abstand zur nächsten Schwelle wird beziffert
- Erkennbar bleibt, dass es eine Selbsteinschätzung ist und keine Begutachtung

**Fertig, wenn** ein erzeugter Widerspruch die Modulwerte des zugehörigen Falls nennt und ohne
sie nicht erzeugt werden kann.

**Hängt an** F3.1 im [Pflegegrad-Epic](pflegegrad.md) — die Herleitung ist die Datenquelle ·
#112, weil eine ungeprüfte Rechnung keine Widerspruchsbegründung trägt

### F1.2 — Gesetzliche Pflichtklauseln

**Zweck** Was in jedem Widerspruch stehen muss, steht in jedem Widerspruch.

**Umfang** Issue #25. Zu klären ist dabei ein Punkt in dessen Akzeptanzkriterien: Gefordert
wird „ein Hinweis auf § 88 SGG inklusive einer **4-Wochen-Frist**". Die umgesetzte
Fristenlogik kennt eine Woche, zwei Wochen, einen Monat, drei Monate, sechs Monate und 25
Arbeitstage — **keine Vier-Wochen-Frist**. § 88 SGG selbst nennt sechs Monate (Abs. 1) und drei
Monate (Abs. 2). Vermutlich ist hier etwas verwechselt worden; zu klären, bevor es in
Briefvorlagen wandert.

Der SGB-XIV-Teil von #25 bleibt liegen, solange es keine SGB-XIV-Fälle gibt (#30).

**Fertig, wenn** die Klauseln in den Vorlagen stehen, durch Snapshot-Tests gehalten werden und
jede Fristangabe eine Fundstelle trägt.

### F1.3 — Bestandsaufnahme und Abnahme der acht Brieftypen

**Zweck** Feststellen, was von dem Gebauten tatsächlich funktioniert und bleiben soll.

**Umfang**
- Je Brieftyp einmal erzeugen und das PDF ansehen
- Entscheiden, welche bleiben (siehe Richtungsfrage)
- Die Akzeptanzkriterien von #3 nachziehen oder ersetzen, dann schließen
- Verworfene Typen ausbauen, nicht nur ausblenden

**Fertig, wenn** #3 geschlossen ist und jeder verbliebene Brieftyp einmal von Hand geprüft
wurde.

---

## Capability — Fristen im Blick behalten

### F2.1 — Fristen anzeigen und warnen

**Zweck** Eine Frist, die niemand sieht, hilft nicht.

**Umfang** Gebaut: Bescheiddatum-Abfrage, Ampel, Berechnung. Offen ist, ob und wie gewarnt
wird, wenn eine Frist zuläuft — im pseudonymen Modell gibt es keine E-Mail-Adresse.

**Der Zusammenhang mit dem BfArM-Katalog:** Für Hinweise an die betroffene Person bleibt laut
Erläuterung zu CTRL_3.2 nur die Anwendung selbst. Was für Datenschutzvorfälle gilt, gilt hier
genauso — eine Fristwarnung erreicht niemanden, der die Seite nicht öffnet. Das ist eine
Produktfrage, keine technische.

**Offen** Ob Fristwarnungen für Pflegedienste anders laufen: Dort gibt es angemeldete Konten
mit Kontaktdaten. Die Fallübersicht (F2.3 im Pflegedienst-Epic) führt anstehende Fristen bereits.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Acht Brieftypen sind gebaut, mit Generator, Vorlage und Tests | Durchsicht 29.08.2026 | geprüft |
| Der Pflegegrad-Widerspruch greift nicht auf die Modulwerte zu | `pflegegrad.generator.ts`, `pflegegrad.template.ts` | geprüft |
| Die Fristenlogik ist belegt und vollständig gegen § 64, § 88 SGG und § 18 Abs. 3 SGB XI | `fristen.ts` | geprüft |
| Erbrecht und Betreuungsrecht kommen in keinem Issue vor | Rückstand, 29.08.2026 | geprüft |
| Die Akzeptanzkriterien von #3 wurden nie abgehakt | Issue seit 2 Monaten offen | geprüft |
| Die „4-Wochen-Frist" aus #25 entspricht keiner umgesetzten Frist und keinem Absatz des § 88 SGG | Vergleich #25 gegen `fristen.ts` | **angenommen** — zu klären |
| Die erzeugten Schreiben sind fachlich brauchbar | nie geprüft, kein PDF angesehen | **angenommen** — F1.3 |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Welche der acht Brieftypen bleiben? | Produkt | F1.3, und die Pflegelast auf Dauer |
| Was ist mit der „4-Wochen-Frist" in #25 gemeint? | Recherche, ggf. fachliche Beratung | F1.2 |
| Wie erreicht eine Fristwarnung jemanden ohne Kontaktdaten? | Produkt | F2.1 |
| Erfüllen die erzeugten Schreiben ihren Zweck bei der Kasse? | Praxis — Lirio hat drei Fälle begleitet | F1.3 |
