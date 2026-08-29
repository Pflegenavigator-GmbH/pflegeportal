# Richtung

Dieses Dokument beantwortet genau eine Frage:

> **Wohin geht das Produkt, wer zahlt dafür, und was ruht solange?**

**Stand:** 29.08.2026 · festgehalten nach der Bestandsaufnahme der 19 offenen Issues

---

## Wer zahlt

**Betroffene und Angehörige zahlen selbst**, je Fall, unabhängig davon, ob die betroffene
Person selbst bedient oder jemand für sie. Das ist der heutige Zustand: Fallcode, Stripe,
kein Konto.

**Pflegedienste zahlen eine Nutzungslizenz.** Die Abrechnungsform ist offen und wird bewusst
noch nicht festgelegt. Festgehalten werden die Möglichkeiten, damit die Entscheidung später
auf etwas Geschriebenem aufsetzt.

### Möglichkeiten der Lizenzabrechnung

Unbewertet. Die Auswahl setzt voraus, dass die Rechtsfragen aus #105 beantwortet sind — von
ihnen hängt ab, was überhaupt abrechenbar ist.

| Modell | Abgerechnet wird | Dafür | Dagegen |
|---|---|---|---|
| **Pauschale je Einrichtung** | Festbetrag je Dienst und Monat | einfachster Vertrag, planbar für beide Seiten | trifft kleine und große Dienste gleich |
| **Je Nutzerplatz** | angelegte Zugänge für Pflegekräfte | vertrautes Modell, leicht zu erklären | Fluktuation und Teilzeit machen das Zählen zur Reibung; geteilte Geräte in der ambulanten Pflege passen schlecht |
| **Je freigegebenem Fall** | aktive Freigaben je Monat | deckt sich genau mit dem Datenmodell — eine Freigabe *ist* die abrechenbare Einheit | schwankende Kosten, und der Anreiz zeigt in die falsche Richtung: Freigaben zu vermeiden spart Geld |
| **Staffel nach Einrichtungsgröße** | Zahl der versorgten Pflegebedürftigen | planbar, halbwegs gerecht, nutzt eine bekannte Zahl | Einstufung muss gepflegt und geprüft werden |
| **Keine B2B-Abrechnung** | nichts — der Kauf der betroffenen Person schaltet den Lesezugriff frei | kein neuer Abrechnungsapparat | der Dienst hat keinen Grund, die Nutzung voranzutreiben |

Wiederkehrende Zahlung ist technisch vorbereitet: die Checkout-Sitzung kennt
`mode: 'subscription'` (`src/app/api/checkout/create-session/route.ts`). Eine Beobachtung,
keine Empfehlung.

### Refinanzierung auf Seiten der Pflegedienste

Wer die Lizenz beim Dienst am Ende trägt, ist offen. Drei Wege als Prüfauftrag — **keiner
davon bestätigt**:

1. **Betriebskosten über die Vergütungsvereinbarung** nach SGB XI. Vermutlich der realistische
   Weg, aber langsam und je Kostenträger verschieden.
2. **Förderung der Digitalisierung in Pflegeeinrichtungen** nach § 8 SGB XI. Ob die Regelung
   fortbesteht und ob eine Software dieser Art darunter fällt, ist zu prüfen — sie war
   befristet.
3. **Aus eigenen Mitteln.** Dann muss sich die Lizenz aus eingesparter Zeit rechnen, und wir
   müssen sagen können, wie viel Zeit das ist.

Zu klären mit jemandem, der Pflegesatzverhandlungen kennt.

---

## Die DiPA-Absicht

Die erweiterte Erhebung zum Pflegegrad soll hinter die Bezahlschranke. Der Grund ist nicht
allein der Umsatz, sondern die angestrebte Aufnahme als **digitale Pflegeanwendung** nach
§ 40a SGB XI.

Damit ist die Bezahlschranke keine reine Preisentscheidung mehr: **Sie zieht die Grenze des
Produkts, das gelistet werden soll.** Was davor liegt, ist Einstieg; was dahinter liegt, ist
der Gegenstand des Verfahrens. Diese Grenze muss deshalb fachlich begründet sein und nicht
danach gezogen werden, was sich gut verkauft.

**Die tragende offene Frage:** Ob eine Pflegegrad-Einschätzung mit Antragshilfe überhaupt eine
digitale Pflegeanwendung im Sinne des § 40a SGB XI ist. Die Vorschrift zielt auf Anwendungen,
die Beeinträchtigungen der Selbstständigkeit **mindern** oder deren Verschlimmerung verhindern
— also auf eine pflegerische Wirkung. Ein Werkzeug, das bei einem Antrag hilft, wirkt
verwaltend, nicht pflegerisch. Das Pflegetagebuch und Anleitungen für Angehörige stehen der
Vorschrift näher als der Rechner.

Fällt diese Annahme, ist die Bezahlschranke immer noch sinnvoll — aber sie wird an einer
anderen Stelle gezogen, und ein anderer Teil des Portals wird zum DiPA-Gegenstand. Deshalb
gehört die Frage vor die Umsetzung, nicht danach.

Zu klären mit jemandem, der das Verfahren beim BfArM kennt. Die Unterlagen dazu liegen in
`pflegenavigator-grant-docs`.

---

## Worauf gearbeitet wird

**Vertiefung statt Verbreiterung.** Der Pflegegrad-Bereich wird der Teil, dem man wirklich
trauen kann. Kein viertes Rechtsgebiet, bevor das erste belastbar ist.

Die Begründung steht in den Zahlen: ein falsches Stichjahr im Erwerbsminderungsrechner, eine
erfundene Zulage, eine abstürzende Modul-6-Seite, eine GdB-Rechenregel ohne Deckung in der
Verordnung. Vier Fachdomänen, vier Fehler. Nicht Unachtsamkeit, sondern zu viele Rechtsgebiete
pro Kopf.

→ [epics/pflegegrad.md](epics/pflegegrad.md)

---

## Was ruht

**LexCare AI (#35–#40).** Eigenes Produkt, eigenes Repository, eigene Dokumentation. Die
Issues im Portal-Rückstand beschreiben dessen Architektur und gehören dort nicht hin. Die
*Anbindung* des Portals wird ein eigenes Epic, sobald feststeht, welche Aufgabe die KI in der
Oberfläche übernimmt — voraussichtlich mit der Fähigkeit, die Oberfläche zu bedienen, was ein
anderer Zuschnitt ist als eine Retrieval-Plattform.

**Weitere Rechner.** GdB und Erwerbsminderungsrente bleiben, wie sie sind; SGB XIV (#30)
wartet.

**Pflegedienst-Zugang.** Blockiert durch #105.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Betroffene und Angehörige zahlen selbst, je Fall | Festlegung 29.08.2026 | geprüft |
| Pflegedienste zahlen eine Nutzungslizenz, Form offen | Festlegung 29.08.2026 | geprüft |
| Wiederkehrende Zahlung ist technisch vorbereitet | `create-session/route.ts` | geprüft |
| Es gibt keine Zustimmung zu den Nutzungsbedingungen | Durchsicht 29.08.2026 — weder im Trichter noch im Checkout, `consent_collection` nicht gesetzt | geprüft |
| Der Trichter unterscheidet nicht, ob jemand für sich oder für eine andere Person handelt | `NewCaseCard.tsx`, `pflege_zielgruppe` nur im `localStorage` | geprüft |
| Die erweiterte Erhebung ist Gegenstand der DiPA-Listung | Festlegung 29.08.2026 | **angenommen** |
| Eine Pflegegrad-Einschätzung erfüllt § 40a SGB XI | keine | **angenommen** — tragend, siehe oben |
| Eine Angehörige kann nicht wirksam in die Verarbeitung der Gesundheitsdaten einer erwachsenen Person einwilligen | Art. 9 Abs. 2 lit. a DSGVO | **angenommen** — Punkt 7 bei #105 |
| Beim Kinder-Pfad handeln Sorgeberechtigte als gesetzliche Vertreter | § 1629 BGB | **angenommen** — mit #105 zu prüfen |
| Förderung nach § 8 SGB XI könnte greifen | Erinnerung an eine befristete Regelung | **angenommen** — Fundstelle ungeprüft |
| Das BFSG gilt seit dem 28.06.2025 auch für dieses Portal | § 1 BFSG | **angenommen** — hängt an der Kleinstunternehmer-Ausnahme |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Erfüllt eine Pflegegrad-Einschätzung mit Antragshilfe § 40a SGB XI? | Beratung zum BfArM-Verfahren | die Lage der Bezahlschranke |
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? Weniger als zehn Beschäftigte **und** höchstens zwei Millionen Euro Umsatz? | Geschäftsführung | Einordnung von #34 |
| Die acht Punkte der datenschutzrechtlichen Abnahme | Datenschutzbeauftragte(r) | #6, #105, Vertretung im B2C-Betrieb |
| Welches Lizenzmodell, und wie refinanziert der Dienst es? | Geschäftsführung mit fachlicher Beratung | Pflegedienst-Zugang |
| Welche Aufgabe übernimmt LexCare AI in der Oberfläche? | Produkt | Anbindungs-Epic |
