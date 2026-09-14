    # Richtung

Dieses Dokument beantwortet genau eine Frage:

> **Wohin geht das Produkt, wer zahlt dafür, und was ruht solange?**

**Stand:** 06.09.2026 · ursprünglich festgehalten am 29.08.2026, überarbeitet nach dem
Rechtsgutachten vom 06.09.2026

> **Was das Gutachten hier geändert hat:** Die DiPA-Absicht trägt nicht (§ 40a Abs. 1a S. 2
> SGB XI), der BfArM-Datenschutzkatalog ist damit kein verbindlicher Maßstab mehr, die
> Refinanzierung über § 39a entfällt, und das Zugangsmodell heißt richtig „Konto ohne
> Passwort". Widerlegte Aussagen sind in der Tabelle *Geprüft und angenommen* durchgestrichen
> stehen geblieben, nicht gelöscht.

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

## Die DiPA-Absicht — **die Annahme trägt nicht**

> **Prüfergebnis vom 06.09.2026.** Die tragende Annahme dieses Abschnitts ist widerlegt. Der
> gesamte frühere Text steht unter *Was hier vorher stand* am Ende, damit nachvollziehbar
> bleibt, worauf frühere Entscheidungen aufsetzten.

Geplant war: Die erweiterte Erhebung geht hinter die Bezahlschranke, und die Schranke ist
zugleich die **Grenze des als digitale Pflegeanwendung zu listenden Produkts**.

**Das geht nicht.** § 40a Abs. 1a S. 2 SGB XI nimmt ausdrücklich aus: Anwendungen zur
Arbeitsorganisation ambulanter Pflegeeinrichtungen, zur Wissensvermittlung, Information oder
Kommunikation, **zur Beantragung oder Verwaltung von Leistungen** sowie Anwendungen, die
ausschließlich auf Auskunft oder Beratung zur Inanspruchnahme von Sozialleistungen gerichtet
sind.

Damit ist der kostenpflichtige Teil — vollständige Erhebung, Antrag, Widerspruch — genau der
Bereich, den die Vorschrift ausschließt. Die Bezahlschranke wäre die Grenze zu einem **nicht
listungsfähigen** Bereich.

| Funktion | Einordnung |
|---|---|
| Pflegegrad-Einschätzung mit Antragserzeugung | Beantragung von Leistungen — ausgeschlossen |
| Widerspruchsgenerator, Fristenlogik | Beantragung/Verwaltung — ausgeschlossen |
| GdB-Rechner | Auskunft/Beratung zu Sozialleistungen — ausgeschlossen |
| Leistungsübersicht und Beträge | Information — ausgeschlossen |
| Fallübersicht für den Pflegedienst | Arbeitsorganisation ambulanter Dienste — ausgeschlossen |
| Pflegetagebuch | offen — als Beobachtungsinstrument nicht per se ausgeschlossen |
| Anleitungen für Angehörige | erfasst, **wenn** als Intervention mit belegbarer Entlastungswirkung ausgestaltet (Abs. 1a S. 1) |

**Was daraus folgt:**

1. **Die Bezahlschranke ist wieder eine reine Preisentscheidung.** Sie kann und muss nach
   Produktlogik gezogen werden, nicht nach Listungsfähigkeit. Das vereinfacht F1.3 im
   [Pflegegrad-Epic](epics/pflegegrad.md) — die dortige Begründung „für die DiPA-Absicht die
   tragfähigere Grundlage" ist gegenstandslos.
2. **Eine Listung bleibt möglich, aber nur für ein abgetrenntes Modul.** Kandidat ist das
   Pflegetagebuch, verzahnt mit strukturierten Anleitungen für pflegende Angehörige, mit
   belegbarer Entlastungswirkung nach § 40a Abs. 1a S. 1. Der **Nutzenbeleg** nach DiPAV ist
   dabei der eigentliche Aufwand, nicht der Datenschutz.
3. **Die Refinanzierung über § 39a fällt weg.** Die 30 € sind monatlich, nicht je Patient —
   und an eine **gelistete** DiPA gebunden (§ 40b Abs. 1 Nr. 2). Ohne Listung kein Anspruch.
4. **Die Barrierefreiheit hängt nicht mehr am BFSG.** § 40a Abs. 4 verpflichtet DiPA-Hersteller
   unmittelbar; die Kleinstunternehmer-Ausnahme wäre für diesen Pfad irrelevant. Für den
   heutigen Zuschnitt bleibt die BFSG-Frage aber bestehen.
5. **Zum Stand des Verfahrens:** Bis heute ist keine einzige DiPA gelistet. Eine Beratung beim
   BfArM vor einer Antragstellung ist der wirtschaftlichere Weg.

> **Grenze dieser Feststellung.** Die Fundstelle stammt aus dem Rechtsgutachten vom 06.09.2026
> und bezieht sich auf die Fassung des Gesetzes zur Befugniserweiterung und Entbürokratisierung
> in der Pflege, in Kraft seit 01.07.2026. Sie ist dort als gegen die Primärquelle verifiziert
> gekennzeichnet. **Vor einer Umstellung des Geschäftsmodells sollte jemand den Wortlaut einmal
> selbst im Gesetzestext nachlesen** — daran hängt eine Erlösannahme.

### Was hier vorher stand

*Bis zum 06.09.2026 galt:* Die Bezahlschranke zieht die Grenze des zu listenden Produkts; ob
eine Pflegegrad-Einschätzung mit Antragshilfe § 40a SGB XI überhaupt erfüllt, war als tragende
offene Annahme geführt. Die damalige Vermutung — „ein Werkzeug, das bei einem Antrag hilft,
wirkt verwaltend; Pflegetagebuch und Anleitungen stehen der Vorschrift näher" — hat sich als
zutreffend erwiesen.

### Was der Kriterienkatalog vorgibt — **Status: Orientierung, nicht Maßstab**

Quelle: `pflegenavigator-grant-docs` → `05_Dipa/diga-dipa-datenschutzkriterien.pdf`, BfArM,
Version 1.0 vom 24.04.2024.

> **Prüfergebnis vom 06.09.2026 — und das ist der folgenreichste methodische Punkt.** Dieser
> Katalog gilt für digitale Pflegeanwendungen. Da das Produkt nach dem Abschnitt oben derzeit
> keine ist und keine werden kann, ist er **kein verbindlicher Maßstab**, sondern eine
> freiwillig herangezogene Orientierung.
>
> Die folgenden Vorgaben bleiben inhaltlich sinnvoll und werden weiter verfolgt. Sie tragen
> aber nur noch, soweit sie sich **unmittelbar aus der DSGVO** ergeben — nicht, weil ein
> Kriterium es verlangt. Wo dieses Dokument oder die Epics „CNST_x" als Begründung anführen,
> ist das ab sofort als Herkunftsangabe zu lesen, nicht als Rechtspflicht.

**Ein Argument fällt damit ganz weg.** Bisher stand hier: Der Katalog verlange den pseudonymen
Zugang ausdrücklich (CNST_1.3 a), die Architektur ohne Konto sei deshalb „kein Behelf, sondern
die vorgesehene Bauform". Ohne die DiPA-Vorgabe entfällt diese Rechtfertigung — und damit die
Begründung für ein schwaches Zugangsmittel.

**Hinzu kommt eine Richtigstellung.** Das Modell ist nicht „pseudonymer Zugang ohne Konto",
sondern **ein Konto ohne Passwort**: Der Fallcode ist Kennung und Geheimnis in einem, und seine
Kenntnis genügt für den Zugriff. Das ist datenschutzrechtlich etwas anderes und
sicherheitstechnisch schwächer. Siehe [zugang-abrechnung.md](epics/zugang-abrechnung.md).

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
| ~~Die erweiterte Erhebung ist Gegenstand der DiPA-Listung~~ | Festlegung 29.08.2026 | **widerlegt 06.09.2026** — § 40a Abs. 1a S. 2 SGB XI |
| ~~Der pseudonyme Fallcode ist die vom Katalog vorgesehene Bauform~~ | CNST_1.3 a | **hinfällig 06.09.2026** — Katalog nicht anwendbar; das Modell ist ein Konto ohne Passwort |
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
| Eine Pflegegrad-Einschätzung erfüllt § 40a SGB XI | § 40a Abs. 1a S. 2 SGB XI, Rechtsgutachten 06.09.2026 | **nein** — der Produktkern ist ausdrücklich ausgenommen |
| Eine Angehörige kann nicht wirksam in die Verarbeitung der Gesundheitsdaten einer erwachsenen Person einwilligen | Art. 9 Abs. 2 lit. a DSGVO | **angenommen** — Punkt 7 bei #105 |
| Beim Kinder-Pfad handeln Sorgeberechtigte als gesetzliche Vertreter | § 1629 BGB | **angenommen** — mit #105 zu prüfen |
| Förderung nach § 8 SGB XI könnte greifen | Erinnerung an eine befristete Regelung | **angenommen** — Fundstelle weiterhin ungeprüft |
| Die 30 € nach § 39a sind ein Betrag je Patient | frühere Annahme | **widerlegt 06.09.2026** — 30 € **monatlich**, gebunden an eine gelistete DiPA (§ 40b Abs. 1 Nr. 2) |
| Das BFSG gilt seit dem 28.06.2025 auch für dieses Portal | § 1 BFSG | **angenommen** — hängt an der Kleinstunternehmer-Ausnahme |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| ~~Erfüllt eine Pflegegrad-Einschätzung mit Antragshilfe § 40a SGB XI?~~ | **beantwortet 06.09.2026: nein** — § 40a Abs. 1a S. 2 SGB XI nimmt den Produktkern aus | — |
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? Weniger als zehn Beschäftigte **und** höchstens zwei Millionen Euro Umsatz? | Geschäftsführung | Einordnung von #34 |
| Die acht Punkte der datenschutzrechtlichen Abnahme | Datenschutzbeauftragte(r) | #6, #105, Vertretung im B2C-Betrieb |
| Welches Lizenzmodell, und wie refinanziert der Dienst es? | Geschäftsführung mit fachlicher Beratung | Pflegedienst-Zugang |
| Welche Aufgabe übernimmt LexCare AI in der Oberfläche? | Produkt | Anbindungs-Epic |
