# Produktstruktur

Dieses Dokument beantwortet genau eine Frage:

> **Wie ist die Produktdokumentation des Portals gegliedert?**

---

## Ebenen

```text
Produkt
│
└── Epic            Welcher Produktbereich?
        │
        └── Capability   Welche Fähigkeit braucht dieser Bereich?
                │
                └── Feature   Welche Funktion trägt diese Fähigkeit?
```

| Ebene | Beantwortet | Typische Größe | Liegt in |
|---|---|---|---|
| Produkt | Wohin geht es, wer zahlt? | — | `produkt/richtung.md` |
| Epic | Welcher Produktbereich wird gebaut? | Monate | `produkt/epics/<epic>.md` |
| Capability | Welche Fähigkeit braucht der Bereich? | Wochen | Abschnitt im Epic-Dokument |
| Feature | Welche Funktion trägt die Fähigkeit? | Tage bis Wochen | Abschnitt im Epic-Dokument |

**Unterhalb von Feature wird hier nichts geschrieben.** Stories und Tasks leben als GitHub
Issues. Das Portal ist eine Oberfläche mit überschaubarem Zuschnitt — eine eigene Story-Ebene
in Dateiform würde nur eine zweite Wahrheit neben den Issues erzeugen.

Deshalb liegt auch ein ganzes Epic in **einer** Datei, mit Capabilities und Features als
Abschnitte. Ein Ordner je Feature lohnt sich erst, wenn ein Feature mehr trägt, als ein
Abschnitt fasst.

> Das Schwesterrepository `lexcare_ai_prd` geht bis auf Story- und Task-Ebene und legt je
> Knoten eine Datei an. Das ist dort richtig: LexCare AI ist ein eigenständiges Produkt mit
> deutlich größerem Zuschnitt. Für die Oberfläche des Portals wäre dieselbe Tiefe Ballast.

---

## Fortschreitende Ausarbeitung

Nicht jedes Epic wird gleichzeitig ausgearbeitet.

| Stufe | Was existiert |
|---|---|
| Geplant | Eintrag im Epic-Index: Zweck und Capabilities |
| In Ausarbeitung | Epic-Dokument mit Capabilities und Features |
| In Umsetzung | Issues, geschnitten aus den Features |
| Ruhend | Eintrag im Index mit Begründung, warum es liegt |

Derzeit ist nur **Pflegegrad-Ermittlung** ausgearbeitet. Alle anderen Epics stehen absichtlich
nur im Index.

---

## Aufbau eines Epic-Dokuments

```markdown
# Epic — Name
Status · Ausgearbeitet am · Issues · Blockiert durch

## Zweck               Wofür dieser Bereich da ist
## Nicht-Ziele         Was ausdrücklich wegbleibt, mit Begründung
## Grundlage           Normen und Fundstellen, auf denen der Bereich ruht
## Capabilities        Je Fähigkeit ein Abschnitt mit ihren Features
## Geprüft & angenommen  Tabelle: jede tragende Aussage mit Herkunft
## Offene Fragen       Was beantwortet sein muss, und von wem
```

Ein Feature besteht aus vier Zeilen: **Zweck**, **Umfang**, **Fertig, wenn**, **Hängt an**.
Mehr braucht ein Frontend-Feature nicht — was darüber hinausgeht, gehört ins Issue.

---

## Produkt und Technik

Anforderungen, die keinen Nutzen für Nutzende haben, stehen nicht in diesen Dokumenten.
Abhängigkeiten, Bibliotheksstände, Bauprozess und Betrieb leben in den Issues und in
`AGENTS.md`.

Die Trennung hält die Produktseite priorisierbar. Ein Rückstand, in dem „ESLint aktualisieren"
gegen „Widerspruch erzeugen" antritt, lässt sich nicht sinnvoll ordnen.

**Getrennt heißt nicht unverbunden.** Technische Arbeit, die ein Feature blockiert, wird im
Feature unter *Hängt an* genannt.
