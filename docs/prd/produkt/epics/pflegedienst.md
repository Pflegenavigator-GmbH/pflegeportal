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

**Umfang** Vier Rollen aus dem Zugangskonzept — Leitung, Fachkraft, Verwaltung, Lesezugriff.
Die Rolle *in der Einrichtung* bleibt strikt getrennt von der Freigabe *für einen Fall*.

**Offen** Welche Rolle welche der fünf Aufgaben ausführen darf. Nicht aus der Architektur
ableitbar — gehört in ein Gespräch mit einem Pflegedienst.

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

**Umfang** Liste der freigegebenen Fälle mit Stand, Pflegegrad und anstehenden Fristen. Nur
Fälle mit gültiger Freigabe.

**Offen** Ob die Übersicht Gesundheitsdaten zeigen darf oder nur Verfahrensstände. Gehört zu
#105.

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

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Welche Form braucht die Einwilligung, wenn der Dienst die Akte anlegt? | Datenschutzbeauftragte(r) | F1.1, und damit den Start |
| Kommt Zone 3 in die erste Auslieferung, mit allem, was daran hängt? | Geschäftsführung | den Zuschnitt und den Termin |
| Welche Rolle darf welche Aufgabe? | Gespräch mit einem Pflegedienst | F1.3 |
| Darf die Fallübersicht Gesundheitsdaten zeigen? | Datenschutzbeauftragte(r) | F2.3 |
| Wie viele Patienten hat ein Dienst typischerweise im Portal? | Gespräch mit einem Pflegedienst | Zuschnitt von F2.3 und das Lizenzmodell |
