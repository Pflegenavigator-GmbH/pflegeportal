# 000 — Richtung

| | |
|---|---|
| **Status** | Entwurf |
| **Stand** | 29.08.2026 |
| **Issues** | übergreifend |
| **Blockiert durch** | — |

Der Rahmen, in dem die einzelnen PRDs stehen. Festgehalten nach der Bestandsaufnahme des
Rückstands am 29.08.2026 (19 offene Issues, gegen den Code geprüft).

---

## Wer zahlt

**Betroffene und Angehörige zahlen selbst.** Einzelkauf je Fall, unabhängig davon, ob die
betroffene Person selbst bedient oder jemand für sie. Das ist der heutige Zustand: Fallcode,
Stripe, kein Konto.

**Pflegedienste zahlen eine Lizenz für die Nutzung.** Die Abrechnungsform ist offen. Sie
wird bewusst jetzt noch nicht festgelegt — festgehalten werden die Möglichkeiten, damit die
Entscheidung später auf etwas Geschriebenem aufsetzt.

### Möglichkeiten der Lizenzabrechnung

Alle fünf sind unbewertet. Die Auswahl setzt voraus, dass die Rechtsfragen aus #105
beantwortet sind — von ihnen hängt ab, was überhaupt abrechenbar ist.

| Modell | Abgerechnet wird | Spricht dafür | Spricht dagegen |
|---|---|---|---|
| **Pauschale je Einrichtung** | ein Festbetrag je Dienst und Monat | einfachster Vertrag, planbar für beide Seiten | trifft kleine und große Dienste gleich hart |
| **Je Nutzerplatz** | angelegte Zugänge für Pflegekräfte | vertrautes Modell, leicht zu erklären | Fluktuation und Teilzeit machen das Zählen zur Reibung; geteilte Geräte in der ambulanten Pflege passen schlecht dazu |
| **Je freigegebenem Fall** | aktive Freigaben je Monat | deckt sich genau mit dem Nutzen und mit dem Datenmodell — eine Freigabe *ist* die abrechenbare Einheit | schwankende Kosten; setzt einen Anreiz, Freigaben zu vermeiden, also genau das Gegenteil des Gewollten |
| **Staffel nach Einrichtungsgröße** | Zahl der versorgten Pflegebedürftigen | planbar, halbwegs gerecht, nutzt eine Zahl, die der Dienst ohnehin kennt | Einstufung muss gepflegt und geprüft werden |
| **Keine B2B-Abrechnung** | nichts — der Kauf der betroffenen Person schaltet den Lesezugriff frei | kein neuer Abrechnungsapparat nötig | der Dienst hat keinen Grund, die Nutzung voranzutreiben |

Technisch ist der Unterbau für wiederkehrende Zahlung bereits vorhanden: die Checkout-Sitzung
kennt `mode: 'subscription'` (`src/app/api/checkout/create-session/route.ts`). Das ist eine
Beobachtung, keine Empfehlung für ein Modell.

### Refinanzierung auf Seiten der Pflegedienste

Die Frage „wer zahlt das am Ende beim Pflegedienst" ist offen. Drei Wege, die geprüft werden
sollten — **keiner davon ist bestätigt**, alle drei sind hier nur als Prüfauftrag notiert:

1. **Betriebskosten über die Vergütungsvereinbarung.** Verwaltungs- und Sachkosten fließen in
   die Verhandlungen nach SGB XI ein. Vermutlich der realistische Weg, aber langsam und je
   Kostenträger verschieden.
2. **Förderung der Digitalisierung in Pflegeeinrichtungen.** Es gab eine solche Förderung nach
   § 8 SGB XI. Ob sie fortbesteht und ob eine Software dieser Art darunter fällt, ist zu
   prüfen — die Regelung war zeitlich befristet.
3. **Der Dienst zahlt aus eigenen Mitteln.** Dann muss sich die Lizenz aus eingesparter Zeit
   rechnen, und wir müssen sagen können, wie viel Zeit das ist.

Zu klären mit jemandem, der Pflegesatzverhandlungen kennt. Nicht aus der Architektur ableitbar.

---

## Worauf gearbeitet wird

**Vertiefung statt Verbreiterung.** Der Pflegegrad-Bereich wird der Teil, dem man wirklich
trauen kann. Kein fünftes Rechtsgebiet, bevor das erste belastbar ist.

Der Grund steht in der Bestandsaufnahme: Die Fehler der letzten Wochen lagen ausnahmslos in
der Breite. Ein falsches Stichjahr im EM-Renten-Rechner, eine erfundene Zulage, eine
abstürzende Modul-6-Seite, eine GdB-Rechenregel ohne Deckung in der Verordnung — vier
Fachdomänen, vier Fehler. Nicht Unachtsamkeit, sondern zu viele Rechtsgebiete pro Kopf.

Siehe [001 — Pflegegrad-Vertiefung](001-pflegegrad-vertiefung.md).

---

## Was ruht

**#35–#40, die KI-Plattform.** Eine KI soll angebunden werden, voraussichtlich über eine
Schnittstelle und voraussichtlich mit der Fähigkeit, die Oberfläche zu bedienen. Das ist ein
anderer Zuschnitt als die dort beschriebene Retrieval- und Agentenplattform. Die Issues
bleiben offen, zählen aber nicht zum Rückstand, bis die Aufgabe fachlich beschrieben ist.

Der erste Schritt ist keine Architektur, sondern ein Satz: welche Aufgabe die KI übernimmt,
die heute niemand übernimmt.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Betroffene und Angehörige zahlen selbst, je Fall | Festlegung vom 29.08.2026 | geprüft |
| Pflegedienste zahlen eine Nutzungslizenz | Festlegung vom 29.08.2026 | geprüft |
| Die Abrechnungsform ist offen | Festlegung vom 29.08.2026 | geprüft |
| Wiederkehrende Zahlung ist technisch vorbereitet | `create-session/route.ts`, `mode: 'subscription'` | geprüft |
| Es gibt keine Zustimmung zu den Nutzungsbedingungen | Durchsicht des Codes, 29.08.2026 — weder im Trichter noch im Checkout, `consent_collection` ist nicht gesetzt | geprüft |
| Der Trichter unterscheidet nicht, ob jemand für sich oder für eine andere Person handelt | `NewCaseCard.tsx`; `pflege_zielgruppe` liegt nur im `localStorage` | geprüft |
| Eine Angehörige kann nicht wirksam in die Verarbeitung der Gesundheitsdaten einer erwachsenen Person einwilligen | Art. 9 Abs. 2 lit. a DSGVO | **angenommen** — liegt als Punkt 7 bei #105 |
| Beim Kinder-Pfad handeln Sorgeberechtigte als gesetzliche Vertreter | § 1629 BGB | **angenommen** — mit #105 zu prüfen |
| Digitalisierungsförderung nach § 8 SGB XI könnte greifen | Erinnerung an eine befristete Regelung | **angenommen** — Fundstelle und Geltung ungeprüft |
| Das BFSG gilt seit dem 28.06.2025 auch für dieses Portal | § 1 BFSG, elektronischer Geschäftsverkehr an Verbraucher | **angenommen** — hängt an der Kleinstunternehmer-Ausnahme |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? Weniger als zehn Beschäftigte **und** höchstens zwei Millionen Euro Jahresumsatz? | Geschäftsführung | Einordnung von #34 |
| Die acht Punkte der datenschutzrechtlichen Abnahme | Datenschutzbeauftragte(r) | #6, #105, und die Vertretungsfrage im laufenden B2C-Betrieb |
| Welches Lizenzmodell, und wie refinanziert der Dienst es? | Geschäftsführung, mit fachlicher Beratung | B2B-Umsetzung |
| Welche Aufgabe übernimmt die KI? | Produkt | #35–#40 |
