# Epic-Index

Dieses Dokument beantwortet genau eine Frage:

> **Welche Epics gibt es, und was deckt jedes ab?**

Der Roadmap-Charakter steckt in der Spalte *Stufe*; eine eigene Reihenfolgeliste wird nicht
gepflegt.

---

## Überblick

| Epic | Zweck | Stufe |
|---|---|---|
| [Pflegedienst-Zugang](epics/pflegedienst.md) | Freigabe je Patient, Rollen, Arbeiten am Patienten | **In Ausarbeitung — kritischer Pfad** |
| [Pflegegrad-Ermittlung](epics/pflegegrad.md) | Den Pflegegrad belastbar einschätzen und die Einschätzung belegen | **In Ausarbeitung** |
| [Widerspruch & Briefe](epics/widerspruch-briefe.md) | Aus dem Ergebnis ein Schreiben an die Pflegekasse machen | **In Ausarbeitung** |
| [Zugang & Abrechnung](epics/zugang-abrechnung.md) | Konten, Rollen, Freischaltung, Lizenz | **In Ausarbeitung** |
| Weitere Rechner | GdB, Erwerbsminderungsrente, später SGB XIV | Ruhend — siehe Richtung |
| [Vertrauen & Zugänglichkeit](epics/vertrauen-zugaenglichkeit.md) | Einwilligung, Betroffenenrechte, Barrierefreiheit, Sprachen | **In Ausarbeitung** |

---

## Die Epics im Einzelnen

### Pflegegrad-Ermittlung — *in Ausarbeitung*

Das Kernprodukt. Erhebung nach dem Begutachtungsinstrument, Bewertung, Ergebnis mit
nachvollziehbarer Herleitung. Alles andere im Portal hängt daran.

Ausgearbeitet, weil hier gearbeitet wird: → [epics/pflegegrad.md](epics/pflegegrad.md)

### Widerspruch & Briefe — *in Ausarbeitung*

Der Schritt nach dem Bescheid. **Weitgehend gebaut** (#3), aber nie beschrieben: Das Issue
nennt zwei Brieftypen, im Code stehen acht — darunter Erbrecht und Betreuungsrecht, die in
keinem Issue vorkommen.

Der zentrale Befund: **Der Widerspruch greift nicht auf die Modulwerte zu.** Damit bricht die
Kette erheben → bewerten → herleiten → begründen an ihrem letzten Glied, und der Widerspruch
bleibt ein Formbrief.

→ [epics/widerspruch-briefe.md](epics/widerspruch-briefe.md)

### Zugang & Abrechnung — *in Ausarbeitung*

Fallcode ohne Konto, Bezahlschranke, Einzelkauf, später die Lizenz für Pflegedienste.

Capabilities: Fall anlegen und wiederaufnehmen · Freischaltung · Einzelkauf · Lizenz (offen)

Die Frage, wo die Bezahlschranke steht, wird nicht hier entschieden, sondern im jeweiligen
Fachbereich. Dieses Epic liefert das Mittel, nicht die Grenze.

**Der Kern: Heute gibt es keine Authentifizierung.** Mit dem Pflegedienst-Zugang entstehen zwei
Anmeldemodelle nebeneinander — anonymer Fallcode für Patientinnen, benannte Konten für
Einrichtungen. Beides ist vorgegeben, nicht gewählt.

→ [epics/zugang-abrechnung.md](epics/zugang-abrechnung.md)

### Pflegedienst-Zugang — *in Ausarbeitung, kritischer Pfad*

Freigabe je Patient, Rollen innerhalb der Einrichtung, getrennte Verantwortlichkeiten in drei
Zonen, Erfassung unterwegs.

**Neu eingeordnet am 29.08.2026:** Pflegedienste sind voraussichtlich die **ersten Nutzer**.
Damit rückt dieses Epic von der letzten auf die erste Position, und #105 ist keine
Nebenfrage mehr, sondern die Sperre, die als Erstes fallen muss.

→ [epics/pflegedienst.md](epics/pflegedienst.md)

### Weitere Rechner — *ruhend*

GdB (#26, #27) und Erwerbsminderungsrente sind gebaut, SGB XIV (#30) ist geplant.

Ruht bewusst. Die Begründung steht in [richtung.md](richtung.md): Die Fehler der letzten
Wochen lagen ausnahmslos in der Breite. Vor einem vierten Rechtsgebiet wird das erste
belastbar.

Offen und übernommen: die Rechenregel des GdB-Rechners hat keine Deckung in der VersMedV (#26).

### Vertrauen & Zugänglichkeit — *in Ausarbeitung*

Einwilligungsverwaltung, Betroffenenrechte, Barrierefreiheit (#34), Sprachen, RTL (#88).

Querschnittsbereich: Features werden dort umgesetzt, wo sie wirken — die Lesbarkeit des
Pflegegrad-Pfads steht als #111 in der Beta.

**Der größte Posten ist die Einwilligungsverwaltung, und heute existiert davon nichts.** Was
es gibt, ist ein Cookie-Banner im `localStorage`; der Kriterienkatalog verlangt Einwilligungen
am pseudonymen Konto, je Zweck getrennt und widerruflich. Das blockiert F1.2 und F1.3 im
Pflegegrad-Epic.

→ [epics/vertrauen-zugaenglichkeit.md](epics/vertrauen-zugaenglichkeit.md)

---

## Nicht in diesem Index

**LexCare AI** (Issues #35–#40 im Portal-Rückstand) ist ein eigenes Produkt mit eigenem
Repository und eigener Dokumentation: `lexcare_ai_prd`. Die sechs Issues beschreiben dessen
Architektur und gehören nicht in den Portal-Rückstand — dort verzerren sie jede
Kapazitätsschätzung.

Die Anbindung des Portals an LexCare AI wird ein eigenes Epic, sobald feststeht, welche
Aufgabe die KI in der Oberfläche übernimmt.
