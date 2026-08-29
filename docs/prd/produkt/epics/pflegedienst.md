# Epic — Pflegedienst-Zugang

| | |
|---|---|
| **Stufe** | In Ausarbeitung |
| **Ausgearbeitet am** | 29.08.2026 |
| **Issues** | #6, #105 |
| **Blockiert durch** | #105 — die datenschutzrechtliche Abnahme |

> **Neu eingeordnet am 29.08.2026.** Dieses Epic stand zuvor als „ruhend" am Ende der Reihe.
> Nach der Festlegung, dass **Pflegedienste voraussichtlich die ersten Nutzer sind**, liegt es
> auf dem kritischen Pfad. #105 ist damit kein Nebengleis mehr, sondern die Sperre, die als
> Erstes fallen muss.

---

## Zweck

Ein Pflegedienst soll mit den Akten seiner Patientinnen und Patienten arbeiten können, ohne
dass Einwilligung, Widerruf und Zurechenbarkeit verloren gehen.

Der Entwurf der Verantwortlichkeiten liegt in `pflegenavigator-grant-docs` →
`07_Architekturentscheidungen/Compliance/Zugangskonzept/`. Dieses Dokument beschreibt, was das
für das Produkt bedeutet.

---

## Was ein Pflegedienst damit tut

Festgelegt am 29.08.2026. Die Zoneneinordnung stammt aus dem Zugangskonzept.

| Aufgabe | Zone | Verantwortlich | Auslöser |
|---|---|---|---|
| Einstufung neuer Patienten | 1 | betroffene Person | Einwilligung |
| Höherstufung betreiben | 2 | betroffene Person | Vollmacht |
| MDK-Begutachtung vorbereiten | 1–2 | betroffene Person | Einwilligung, ggf. Vollmacht |
| Widerspruch führen | 2 | betroffene Person | Vollmacht |
| **Laufend dokumentieren** | **3** | **der Pflegedienst** | **Auftragsverarbeitung nach Art. 28** |

**Vier von fünf Aufgaben liegen in Zone 1 und 2.** Sie brauchen Einwilligung und Vollmacht,
aber keinen Vertragsapparat. Die fünfte allein löst ihn aus — je Kunde ein
Auftragsverarbeitungsvertrag, ein Verzeichnis, ein Löschkonzept, Nachweise über technische und
organisatorische Maßnahmen, Transparenz über Unterauftragnehmer.

**Entschieden am 29.08.2026: Zone 1 und 2 zuerst, Zone 3 danach.** Das liefert vier der fünf
genannten Aufgaben, ohne dass vor dem ersten Kunden ein Vertragswerk stehen muss. Die laufende
Dokumentation kommt nach, sobald der Apparat steht.

Ebenfalls entschieden: **B2C-Beta und Pflegedienst-Zugang laufen parallel.** Das ist tragfähig,
weil #105 fremdbestimmt ist — solange die Antwort der Datenschutzbeauftragten aussteht, lässt
sich hier ohnehin nichts ausliefern. Und nichts aus der B2C-Beta ist verloren: Lesbarkeit
(#111), Beträge (#107) und Zustimmung (#108) braucht der Pflegedienst-Zugang genauso.

---

## Einrichtungsarten: offen im Datenmodell, geschlossen in der Rechtskonstruktion

Absehbar sollen neben ambulanten Diensten auch **stationäre Einrichtungen** und später
**Krankenhäuser** Zugang bekommen. Die drei sind nicht dasselbe Problem mit anderem Etikett.

Das Zonenmodell trägt, *weil* die Einrichtung im Portal keine eigenen Aufzeichnungen führt.
Genau daran unterscheiden sie sich:

| Art | Zulassung | Eigene Dokumentation | Zone 3 vermeidbar |
|---|---|---|---|
| Ambulanter Dienst | § 72 SGB XI | eigene Pflicht, im eigenen System | ja |
| Stationäre Einrichtung | § 72 SGB XI | gesetzlich verlangt, Qualitätsprüfung nach § 113 SGB XI | schwieriger |
| Krankenhaus | § 108 SGB V | § 630f BGB, zehn Jahre, nicht abdingbar | **nein** |

**Die tragende Grenze ist der Gegenstand, nicht die Einrichtungsart.** Solange das Portal
ausschließlich das Pflegegrad-Verfahren führt und nie die eigene Dokumentation der Einrichtung,
trägt das Zonenmodell für alle drei. Für ein Krankenhaus wäre der Anwendungsfall das
**Entlassmanagement nach § 39 Abs. 1a SGB V** — beim Übergang nach Hause einen Antrag
vorbereiten. Das ist Zone 2, sauber.

**Was daraus für die Umsetzung folgt:**

- **Datenmodell jetzt offen halten.** Die Tabelle heißt `organisationen` und trägt eine *Art*
  plus ein Feld für das jeweilige Zulassungsmerkmal — nicht `pflegedienste` mit fest
  verdrahtetem § 72 SGB XI. Kostet heute nichts, später eine Migration.
- **Rechtskonstruktion jetzt geschlossen halten.** Zonen, Einwilligungswortlaut und
  Rollenmodell gelten für den zugelassenen ambulanten Dienst. Sie vorab für drei
  Einrichtungsarten zu verallgemeinern, ergäbe ein Modell, das auf keine zutrifft.
- **Vertretung hat dort einen anderen Rechtsgrund.** In stationärer Pflege und im Krankenhaus
  ist die **rechtliche Betreuung** der Regelfall, nicht die Vollmacht — eine Betreuerin handelt
  kraft gerichtlicher Bestellung, nicht kraft Erklärung der betroffenen Person. Der Ablauf in
  F1.1 bildet das nicht ab.
- **Rollen sind je Art andere.** Wohnbereichsleitung, Sozialdienst, Entlassmanagement haben im
  hier beschriebenen Modell keine Entsprechung.

---

## Nicht-Ziele der ersten Auslieferung

- **Keine laufende Dokumentation durch den Dienst** (Zone 3) — siehe oben
- **Keine Anbindung an vorhandene Pflegesoftware.** Sinnvoll und später vorgesehen, aber ein
  eigenes Vorhaben; steht hinten im Rückstand
- **Keine Abrechnung der Lizenz** — das Modell ist offen, siehe [richtung.md](../richtung.md)

---

## Capability — Akte und Zugang

### F1.1 — Beide Wege zur Akte

**Zweck** Eine Akte kann von der betroffenen Person **oder** vom Pflegedienst angelegt werden,
je nach Lage.

**Warum das nicht trivial ist:** Das Zugangskonzept ruht auf dem zweiten Weg — die Person hat
eine Akte und erteilt eine widerrufliche Freigabe. Legt der Dienst die Akte an, verarbeitet er
Gesundheitsdaten, **bevor** eine Einwilligung im Portal vorliegen kann. Der Erstbesuch findet
in einer Wohnung statt, nicht am Bildschirm.

**Umfang**
- Weg A: Die Person legt an, der Dienst erhält eine Freigabe (Zugangskonzept, unverändert)
- Weg B: Der Dienst legt an — mit einem Verfahren, das die Einwilligung außerhalb des Portals
  einholt und im Portal belegt
- **Der Übergang von B nach A**: Die Person übernimmt ihre Akte. Der Wechsel der
  Verantwortlichkeit ist der rechtlich heikle Moment und muss protokolliert werden
- Ein Widerruf der Freigabe beendet den Zugriff des Dienstes, ohne die Akte zu löschen

**Fertig, wenn** beide Wege bestehen, der Übergang protokolliert ist und zu jedem Zeitpunkt
belegbar ist, auf welcher Grundlage der Dienst gerade zugreift.

**Hängt an** #105 — insbesondere an der Frage, welche Form die Einwilligung bei Weg B braucht

### F1.2 — Freigabe je Patient statt geteiltem Fallcode

**Zweck** Der Zugang hängt am Fall, nicht am Arbeitsverhältnis. Ohne Freigabe sieht auch die
Leitung nichts.

**Umfang** Widerrufliche Freigabe zugunsten einer geprüften Organisation, an die Stelle des
heute geteilten Fallcodes. Zugriffsprotokoll je Freigabe.

**Hängt an** #105

### F1.3 — Rollen innerhalb der Einrichtung

**Zweck** Nicht jede Person im Dienst darf dasselbe.

**Festgelegt am 29.08.2026.** Die Rolle *in der Einrichtung* bleibt strikt getrennt von der
Freigabe *für einen Fall*: Ohne Freigabe der betroffenen Person sieht auch die
Pflegedienstleitung nichts.

| Rolle | Gesundheitsdaten lesen | In fremdem Namen handeln | Organisation verwalten | Umfang |
|---|---|---|---|---|
| Inhaberin / Inhaber | **nein** | nein | ja | Verträge und Konten |
| Pflegedienstleitung | ja | ja | ja | alle freigegebenen Fälle |
| Pflegekraft | ja | ja | nein | nur zugewiesene Fälle |
| Abrechnung | **nein** | nein | nein | nur Verfahrensstand |

Bemerkenswert ist die erste Zeile: **Wer die Organisation verwaltet, sieht keine Pflegedaten.**
Das ist keine Lücke, sondern Art. 5 Abs. 1 lit. c DSGVO — für Verträge und Konten braucht es
keine Gesundheitsdaten. Für die Umsetzung heißt das, dass „Admin" hier gerade **nicht**
allmächtig ist; ein Rollenmodell, das aus Bequemlichkeit alles an die Inhaberin gibt, wäre ein
Verstoß.

**Umfang**
- Vier Rollen mit den Rechten aus der Tabelle
- Zuweisung einzelner Fälle an Pflegekräfte
- Jede Rolle wird serverseitig durchgesetzt, nicht in der Oberfläche

**Fertig, wenn** eine Inhaberin auch bei direktem Zugriff auf die Schnittstelle keine
Gesundheitsdaten erhält und eine Pflegekraft keinen Fall sieht, der ihr nicht zugewiesen ist.

---

## Capability — Arbeiten am Patienten

### F2.1 — Erfassung unterwegs

**Zweck** Eine Pflegekraft erfasst beim Erstbesuch in der Wohnung, nicht am Schreibtisch.

**Der Befund, der das zum eigenen Vorhaben macht:** Der Trichter speichert heute je Schritt
serverseitig — der Hinweis „Fortschritt online gespeichert" bestätigt das im laufenden
Betrieb. In einer Altbauwohnung im Erdgeschoss gibt es oft kein Netz. Ohne lokale Erfassung
mit späterem Abgleich bricht die Erhebung genau dort ab, wo sie stattfindet.

Dazu kommt die Oberfläche: gemessen wurden 27 von 34 Textelementen unter 16 px und ein
sechsteiliger Fragebogen, gebaut für Ruhe am Bildschirm. Mobil, in Eile, mit Handschuhen ist
das etwas anderes.

**Umfang**
- Lokale Erfassung mit Abgleich, sobald wieder Netz besteht
- Auf das Telefon zugeschnittene Fassung des Fragebogens
- Erkennbar, welche Angaben noch nicht übertragen sind

**Fertig, wenn** eine vollständige Erhebung ohne Netzverbindung möglich ist und nach
Wiederverbindung vollständig ankommt.

**Hängt an** #111 — die Lesbarkeitsarbeit am Trichter ist die Grundlage

### F2.2 — Auswertung und Schreiben im Büro

**Zweck** Nachbereitung: Ergebnis prüfen, Höherstufung oder Widerspruch vorbereiten, für den
MDK-Termin aufbereiten.

**Umfang** Nutzt Ergebnisseite und Brief-Zentrum (#3), erweitert um die Sicht über mehrere
Patienten hinweg.

### F2.3 — Übersicht über die eigenen Fälle

**Zweck** Eine Leitung muss sehen, welche Fälle anstehen — ohne in jede Akte zu schauen.

**Festgelegt am 29.08.2026: Die Übersicht zeigt grundsätzlich nur den Verfahrensstand.**
Gesundheitsdaten — Modulwerte, Tagebucheinträge, der Pflegegrad selbst — erscheinen erst nach
dem Öffnen eines einzelnen Falls, und nur für Rollen, die sie sehen dürfen.

Das folgt aus Art. 5 Abs. 1 lit. c DSGVO: Eine Liste, die nebenbei die Pflegegrade aller
Patienten zeigt, verarbeitet mehr, als für den Zweck „sehen, was ansteht" nötig ist.

**Umfang**
- Liste der Fälle mit gültiger Freigabe: Verfahrensstand, anstehende Fristen, zugewiesene
  Pflegekraft
- Kein Pflegegrad, keine Modulwerte, keine Tagebuchinhalte in der Liste
- Für die Rolle Abrechnung ist die Liste die **einzige** Ansicht; das Öffnen eines Falls ist
  ihr verwehrt

**Fertig, wenn** die Übersicht auch über die Schnittstelle keine Gesundheitsdaten liefert.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Pflegedienste sind voraussichtlich die ersten Nutzer | Festlegung 29.08.2026 | geprüft |
| Alle fünf genannten Aufgaben sind gewollt | Festlegung 29.08.2026 | geprüft |
| Mobil und im Büro, beide Wege zur Akte | Festlegung 29.08.2026 | geprüft |
| Anbindung an Pflegesoftware später, nicht jetzt | Festlegung 29.08.2026 | geprüft |
| Laufende Dokumentation liegt in Zone 3 und löst Art. 28 aus | Zugangskonzept, Art. 28 DSGVO | **angenommen** — mit #105 zu bestätigen |
| Vier der fünf Aufgaben kommen ohne Vertragsapparat aus | Zugangskonzept | **angenommen** — tragend für den Schnitt |
| Gemeinsame Verantwortung nach Art. 26 ist zulässig | CTRL_4.1 des BfArM-Katalogs | geprüft |
| Beim Anlegen durch den Dienst verarbeitet dieser Daten vor jeder Einwilligung im Portal | Folgerung aus Weg B | **angenommen** — dringend, siehe F1.1 |
| Ohne Netz bricht die Erhebung heute ab | „Fortschritt online gespeichert", serverseitige Speicherung je Schritt | **angenommen** — nicht im Feld geprüft |

---

## Größenordnung

Erster Kooperationspartner ist die **Pflegedienst Lirio GmbH, Bielefeld** — damit gibt es ein
reales Testfeld statt einer Annahme.

Der Drei-Jahres-Plan rechnet mit durchschnittlich **150 DiPA-berechtigten Nutzenden im Monat im
zweiten Jahr** und **900 im dritten**. Eine typische Patientenzahl je Dienst ist damit nicht
bestimmt — sie schwankt vom Kleinstbetrieb bis zur Kette.

**Für das Lizenzmodell folgt daraus:** kein Festbetrag, der beide Enden trifft. Der Vorschlag
aus dem Konzept ist eine Institutionslizenz je Haus oder Fachabteilung, deren Preis sich am
tatsächlichen Fallaufkommen orientiert. Als Alternative wird die Einbindung über einen
Einweisungsbetrag nach § 39a SGB XI genannt (bis zu 30 € je Patient) — **Fundstelle und Höhe
sind zu prüfen**, bevor damit gerechnet wird.

Für F2.3 heißt eine dreistellige Fallzahl je Dienst: Die Übersicht braucht Filter, Sortierung
und Seitenaufteilung, nicht nur eine Liste.

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Bleibt die betroffene Person auch bei Zone 2 alleinige Verantwortliche? | Datenschutzbeauftragte(r) | den gesamten Zuschnitt |
| Welche Form braucht die Vollmacht — Portal oder Unterschrift auf Papier? | Datenschutzbeauftragte(r) | F1.1; Papier erzwingt ein Upload-Verfahren |
| Genügt beim Anlegen durch den Dienst eine Einwilligung auf Papier vor der Erfassung? | Datenschutzbeauftragte(r) | F1.1, und damit den Start |
| Wie lange dürfen Einwilligungs- und Zugriffsprotokolle aufbewahrt werden? | Datenschutzbeauftragte(r) | das Löschkonzept |
| Fundstelle und Höhe des Einweisungsbetrags nach § 39a SGB XI | Recherche | das Lizenzmodell |

**Beantwortet am 29.08.2026:** Rollenmodell (F1.3), Inhalt der Fallübersicht (F2.3),
Zone 3 später, beide Wege zur Akte.

Der ausgearbeitete Wortlaut für Einwilligung und Vollmacht liegt in
[konzept_pflegedienst/einwilligung-entwurf.md](../konzept_pflegedienst/einwilligung-entwurf.md).
