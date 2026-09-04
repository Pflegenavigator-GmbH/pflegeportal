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

**Die tragende offene Frage bleibt:** Ob eine Pflegegrad-Einschätzung mit Antragshilfe
überhaupt eine digitale Pflegeanwendung im Sinne des § 40a SGB XI ist. Die Vorschrift zielt
auf einen **pflegerischen Nutzen** — der Kriterienkatalog bestätigt diese Zweckbindung
beiläufig (CNST_3.1 spricht von „zur Erzielung positiver Versorgungseffekte oder eines
pflegerischen Nutzens erforderlichen Daten"), beantwortet die Frage aber nicht. Sie liegt in
der DiPAV und in § 40a selbst, nicht im Datenschutzkatalog.

Ein Werkzeug, das bei einem Antrag hilft, wirkt verwaltend. Pflegetagebuch und Anleitungen für
Angehörige stehen der Vorschrift näher als der Rechner. Fällt die Annahme, ist die
Bezahlschranke immer noch sinnvoll — aber sie liegt woanders, und ein anderer Teil des Portals
wird zum DiPA-Gegenstand.

### Was der Kriterienkatalog vorgibt

Quelle: `pflegenavigator-grant-docs` → `05_Dipa/diga-dipa-datenschutzkriterien.pdf`, BfArM,
Version 1.0 vom 24.04.2024. Normativ mit MUSS/SOLL-Semantik nach RFC 2119.

**Der Fallcode ist das richtige Modell.** Der Katalog geht selbst vom pseudonymen
Freischaltcode aus und verlangt ihn sogar: „Im Zusammenhang mit der Abgabe einer Einwilligung
MUSS ein pseudonymer Benutzeraccount … angelegt werden" (CNST_1.3 a). Die Architektur ohne
Konto ist damit kein Behelf, sondern die vorgesehene Bauform.

**Aber Einwilligungen müssen daran hängen.** Alle abgegebenen Einwilligungen MÜSSEN mit diesem
Account verknüpft sein, damit sie widerrufbar bleiben (CNST_1.3 a, CNST_1.4). Heute wird im
Portal keine Einwilligung erfasst — weder im Trichter noch im Checkout.

**Die Zustimmung zu den Nutzungsbedingungen darf nicht mit der Einwilligung gebündelt werden.**
CNST_1.2: „Einwilligungen DÜRFEN NICHT zu anderen als den rechtmäßigen Zwecken der digitalen
Anwendung eingefordert werden. Die mit den Einwilligungen verbundenen Erklärungen DÜRFEN KEINE
über die zulässigen Zwecke hinausgehenden Sachverhalte enthalten." Ein gemeinsames Häkchen
„AGB akzeptiert und eingewilligt" wäre danach unzulässig. Beides wird gebraucht — aber
getrennt, mit je eigener Handlung.

**Die Vertretung löst der Katalog anders, als wir angenommen hatten.** Zu CNST_1.4: Weil der
Verantwortliche die betroffene Person nicht identifizieren kann, „ist der Widerruf einer
Einwilligung durch einen berechtigten Vertreter in diesem Fall technisch nicht umsetzbar."
Anker ist der Account, nicht die Person. Das entschärft die Vertretungsfrage aus #105 für den
DiPA-Teil — für die Verarbeitung selbst bleibt sie offen.

**Für Kinder gilt ein MUSS, das heute nicht erfüllt ist.** CNST_1.6 a: Vor der Einholung der
Einwilligung MUSS die Einwilligungsfähigkeit abgefragt werden; fehlt sie, MUSS auf die
Einwilligung eines Erziehungsberechtigten verwiesen und diese abgefragt werden. Der
Kinder-Pfad des Portals fragt beides nicht.

**Weiterentwicklungsdaten brauchen eine eigene, unabhängige Einwilligung** (CNST_3.1), und ihre
Verweigerung DARF die Nutzbarkeit nicht einschränken. Betrifft die Reichweitenmessung.

**Ein Löschkonzept ist Pflicht** (CNST_2.5 a, CNST_3.3): Es muss regeln, was beim Widerruf
gelöscht oder gesperrt wird.

### Was Teil 3 für die Architektur bedeutet

**Die Verarbeitung muss im Inland, in der EU oder unter einem Angemessenheitsbeschluss
stattfinden** — ausdrücklich einschließlich Bestands-, Nutzungs- und Verkehrsdaten (AV_1.1).
Das ist keine Empfehlung, sondern ein MUSS, und es ist die folgenschwerste Vorgabe des
Katalogs.

Verschärft durch AV_1.3: Sitzt der **Mutterkonzern** eines Dienstleisters in einem nicht
zulässigen Drittland, müssen zusätzliche Maßnahmen einen Datentransfer dorthin verhindern —
Daten in Hintergrundsystemen verschlüsselt, und **die Schlüssel MÜSSEN vom Hersteller selbst
in der EU verwaltet werden** (oder von einem Treuhänder, der AV_1.1 erfüllt). Die Erläuterung
nennt den Grund beim Namen: „Töchter US-amerikanischer Unternehmen sind faktisch nicht ohne
Weiteres in der Lage, die gegebenen Zusagen … einzuhalten (siehe Begründung zu
Schrems-II-Urteil)."

Zu prüfen ist damit der gesamte Betrieb: Hosting-Plattform, Datenbank, Zahlungsdienstleister,
Reichweitenmessung, und jede Drittanbieter-Komponente in der Anwendung — samt Datenflüssen für
Support und Fehleranalyse (AV_1.4). Für jede muss eine aktuelle Dokumentation vorliegen, aus
der Anlässe und Orte der Verarbeitung hervorgehen.

> Der Eintrag `https://api.openai.com` in der `connect-src`-Richtlinie der
> Sicherheitsrichtlinie (`next.config.ts`) fällt hierunter, sobald darüber Daten fließen. Das
> betrifft auch die spätere Anbindung von LexCare AI: Der Betriebsort des Modells wird zur
> Zulassungsfrage, nicht zur Geschmacksfrage.

Die Architekturunterlage in `grant-docs` zu StackIT deutet darauf hin, dass diese Vorgabe dort
bereits verstanden wurde. Der Abgleich zwischen ihr und dem heutigen Betrieb steht aus.

**Gemeinsame Verantwortung ist ausdrücklich zulässig** (CTRL_4.1): „Eine gemeinsame
Verantwortung (Art. 26 DSGVO) ist für … digitale Pflegeanwendungen nach § 40a SGB XI
grundsätzlich zulässig." Damit gibt es für die Zonenfrage aus #105 eine dritte Antwort neben
„betroffene Person ist Verantwortliche" und „Portal wird Auftragsverarbeiter". Der Preis steht
dabei: Jeder Verantwortliche führt eine eigene Folgenabschätzung — einschließlich der
Schnittstellen zu den Verarbeitungen des anderen — und ein eigenes Verzeichnis.

Umgekehrt gilt: Für **jede** Auftragsverarbeitung muss nachgewiesen werden, dass sie *keine*
gemeinsame Verantwortung darstellt (AV_2.4 a). Die Einordnung ist also zu belegen, nicht zu
behaupten — genau das, was der Zonenentwurf offenlässt.

**Ein Datenschutzbeauftragter ist ein MUSS** (CTRL_1.2), unabhängig von der Unternehmensgröße,
und er DARF KEINE Aufgaben in Entwicklung oder Betrieb wahrnehmen. Alle Personen mit Zugang zu
personenbezogenen Daten sind auf Verschwiegenheit zu verpflichten (CTRL_1.1, für DiPA aus
§ 5 Abs. 6 DiPAV).

**Eine Folgenabschätzung ist praktisch sicher.** DSFA_1.1 verlangt die Schwellwertanalyse
gegen die aktuelle Blacklist der Datenschutzkonferenz. Gesundheitsdaten hochbetagter Personen
in großem Umfang treffen diese Liste. Das beantwortet Punkt 4 der Abnahmeliste in #105.

**Auf Vorfälle kann nur in der Anwendung selbst hingewiesen werden.** Weil keine Kontaktdaten
vorliegen, bleibt laut Erläuterung zu CTRL_3.2 „die einzige Möglichkeit der Information … über
die digitale Anwendung selbst, z. B. durch Push-Nachrichten oder Einblenden eines
Warnhinweises auf dem Start-Bildschirm". Das ist eine Produktanforderung, kein Prozess.

**Jedes Release muss der Zertifizierungsstelle gemeldet werden** (Erläuterung zu CTRL_2.2/2.3),
bei agiler Entwicklung unter Einbeziehung in Backlog-Abstimmung und Sprint-Planung. Das
verändert den Auslieferungsrhythmus.

Nicht gelesen ist Kapitel 13 (technische und organisatorische Maßnahmen). Es wird gebraucht,
sobald konkret gebaut wird.

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
| Der pseudonyme Fallcode ist die vom Katalog vorgesehene Bauform | CNST_1.3 a | geprüft |
| Einwilligungen müssen mit dem pseudonymen Account verknüpft sein | CNST_1.3 a, CNST_1.4 | geprüft |
| AGB-Zustimmung darf nicht mit der Einwilligung gebündelt werden | CNST_1.2 | geprüft |
| Der Widerruf durch einen Vertreter ist im pseudonymen Modell nicht vorgesehen | Erläuterung zu CNST_1.4 | geprüft |
| Vor der Einwilligung muss die Einwilligungsfähigkeit abgefragt werden | CNST_1.6 a | geprüft — heute nicht erfüllt |
| Weiterentwicklungsdaten brauchen eine eigene Einwilligung, deren Verweigerung folgenlos bleibt | CNST_3.1 | geprüft |
| Ein Löschkonzept für den Widerrufsfall ist Pflicht | CNST_2.5 a, CNST_3.3 | geprüft |
| Verarbeitung nur im Inland, in der EU oder unter Angemessenheitsbeschluss | AV_1.1 | geprüft |
| Bei Dienstleistern mit Mutterkonzern im Drittland müssen die Schlüssel beim Hersteller in der EU liegen | AV_1.3 a | geprüft |
| Gemeinsame Verantwortung nach Art. 26 ist für DiPA zulässig | CTRL_4.1 | geprüft |
| Für jede Auftragsverarbeitung ist zu belegen, dass sie keine gemeinsame Verantwortung ist | AV_2.4 a | geprüft |
| Ein Datenschutzbeauftragter ist Pflicht, ohne Aufgaben in Entwicklung oder Betrieb | CTRL_1.2, CTRL_1.2 b | geprüft |
| Auf Datenschutzvorfälle kann nur in der Anwendung selbst hingewiesen werden | Erläuterung zu CTRL_3.2 | geprüft |
| Jedes Release ist der Zertifizierungsstelle zu melden | Erläuterung zu CTRL_2.2/2.3 | geprüft |
| Der heutige Betrieb erfüllt AV_1.1 und AV_1.3 | nicht untersucht | **angenommen** — dringend zu prüfen |
| Eine Pflegegrad-Einschätzung erfüllt § 40a SGB XI | im Katalog nicht behandelt; liegt in DiPAV und § 40a | **angenommen** — tragend, siehe oben |
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
