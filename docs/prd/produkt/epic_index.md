# Epic-Index

Dieses Dokument beantwortet genau eine Frage:

> **Welche Epics gibt es, und was deckt jedes ab?**

Der Roadmap-Charakter steckt in der Spalte *Stufe*; eine eigene Reihenfolgeliste wird nicht
gepflegt.

---

## Überblick

| Epic | Zweck | Stufe |
|---|---|---|
| [Pflegegrad-Ermittlung](epics/pflegegrad.md) | Den Pflegegrad belastbar einschätzen und die Einschätzung belegen | **In Ausarbeitung** |
| Widerspruch & Briefe | Aus dem Ergebnis ein Schreiben an die Pflegekasse machen | Geplant |
| Zugang & Abrechnung | Fallcode, Bezahlschranke, Lizenzen | Geplant |
| Pflegedienst-Zugang | Freigabe je Patient für Pflegedienste, mit Rollen | Ruhend — blockiert durch #105 |
| Weitere Rechner | GdB, Erwerbsminderungsrente, später SGB XIV | Ruhend — siehe Richtung |
| Vertrauen & Zugänglichkeit | Barrierefreiheit, Sprachen, Rechtstexte, Datenschutz | Geplant |

---

## Die Epics im Einzelnen

### Pflegegrad-Ermittlung — *in Ausarbeitung*

Das Kernprodukt. Erhebung nach dem Begutachtungsinstrument, Bewertung, Ergebnis mit
nachvollziehbarer Herleitung. Alles andere im Portal hängt daran.

Ausgearbeitet, weil hier gearbeitet wird: → [epics/pflegegrad.md](epics/pflegegrad.md)

### Widerspruch & Briefe — *geplant*

Der Schritt nach dem Bescheid: Widerspruch, Höherstufungsantrag, Fristenberechnung,
PDF-Erzeugung. **Weitgehend gebaut** (#3), aber nie abgenommen — die Akzeptanzkriterien stehen
seit zwei Monaten unangetastet.

Capabilities: Vorlagenauswahl · Fristenberechnung · Gesetzeseinbindung · Erzeugung und Ausgabe

Erste Aufgabe ist keine Umsetzung, sondern eine Bestandsaufnahme des Gebauten.

### Zugang & Abrechnung — *geplant*

Fallcode ohne Konto, Bezahlschranke, Einzelkauf, später die Lizenz für Pflegedienste.

Capabilities: Fall anlegen und wiederaufnehmen · Freischaltung · Einzelkauf · Lizenz (offen)

Die Frage, wo die Bezahlschranke steht, wird nicht hier entschieden, sondern im jeweiligen
Fachbereich — für die erweiterte Erhebung in [Pflegegrad-Ermittlung](epics/pflegegrad.md).
Dieses Epic liefert das Mittel, nicht die Grenze.

### Pflegedienst-Zugang — *ruhend*

Freigabe je Patient über den QR-Code, Rollen innerhalb der Einrichtung, getrennte
Verantwortlichkeiten in drei Zonen.

Der Entwurf liegt vor: `pflegenavigator-grant-docs` →
`07_Architekturentscheidungen/Compliance/Zugangskonzept/`. Ausgearbeitet wird erst, wenn die
acht Punkte aus #105 beantwortet sind — der ganze Schnitt ruht auf einer ungeprüften Annahme
zur Verantwortlichkeit.

### Weitere Rechner — *ruhend*

GdB (#26, #27) und Erwerbsminderungsrente sind gebaut, SGB XIV (#30) ist geplant.

Ruht bewusst. Die Begründung steht in [richtung.md](richtung.md): Die Fehler der letzten
Wochen lagen ausnahmslos in der Breite. Vor einem vierten Rechtsgebiet wird das erste
belastbar.

Offen und übernommen: die Rechenregel des GdB-Rechners hat keine Deckung in der VersMedV (#26).

### Vertrauen & Zugänglichkeit — *geplant*

Barrierefreiheit (#34), 35 Sprachen, RTL (#88), Rechtstexte, Datenschutzauskunft und -löschung,
**Einwilligungsverwaltung**.

Querschnittsbereich: einzelne Features werden dort umgesetzt, wo sie wirken. Die
Barrierefreiheit des Pflegegrad-Pfads steht deshalb im Pflegegrad-Epic, nicht hier.

**Einwilligungsverwaltung** ist neu und rückt nach vorn. Der DiPA-Kriterienkatalog des BfArM
(`grant-docs` → `05_Dipa/`) verlangt sie normativ, und heute existiert nichts davon:

- Einwilligungen mit dem Fallcode als pseudonymem Account verknüpfen (CNST_1.3 a)
- Widerruf aus der Anwendung heraus, jederzeit (CNST_1.4)
- Getrennte Einwilligungen je Zweck; die Zustimmung zu den Nutzungsbedingungen **nicht**
  mitbündeln (CNST_1.2)
- Eigene, folgenlos verweigerbare Einwilligung für Weiterentwicklungsdaten (CNST_3.1)
- Abfrage der Einwilligungsfähigkeit, sonst Einwilligung eines Erziehungsberechtigten
  (CNST_1.6 a) — betrifft den Kinder-Pfad
- Löschkonzept für den Widerrufsfall (CNST_2.5 a, CNST_3.3)

Das ist keine Nacharbeit an einem Cookie-Banner, sondern ein eigener Fachbereich. Er blockiert
F1.2 und F1.3 im Pflegegrad-Epic.

**Zeitkritisch:** Das BFSG gilt seit dem 28.06.2025 auch für Dienstleistungen im
elektronischen Geschäftsverkehr an Verbraucher. Ob die Kleinstunternehmer-Ausnahme trägt, ist
offen — siehe [richtung.md](richtung.md).

---

## Nicht in diesem Index

**LexCare AI** (Issues #35–#40 im Portal-Rückstand) ist ein eigenes Produkt mit eigenem
Repository und eigener Dokumentation: `lexcare_ai_prd`. Die sechs Issues beschreiben dessen
Architektur und gehören nicht in den Portal-Rückstand — dort verzerren sie jede
Kapazitätsschätzung.

Die Anbindung des Portals an LexCare AI wird ein eigenes Epic, sobald feststeht, welche
Aufgabe die KI in der Oberfläche übernimmt.
