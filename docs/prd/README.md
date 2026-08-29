# Produktanforderungen

Hier liegen die Anforderungen, aus denen Issues geschnitten werden — nicht umgekehrt.

## Warum diese Dateien hier liegen und nicht in einem eigenen Repository

Anforderungen veralten, wenn sie weit vom Code entfernt liegen. Liegen sie hier, ändert
derselbe Pull Request das Verhalten **und** die Anforderung, und eine veraltete Anforderung
steht im Diff, wo sie jemand sieht.

Das Repository `pflegenavigator-grant-docs` bleibt davon unberührt. Es hat ein anderes
Publikum (Fördergeber, Prüfstellen) und einen anderen Rhythmus. Was dort liegt, wird hier
verlinkt, nicht kopiert.

## Warum überhaupt PRDs — und wann sie nichts nützen

Der Anlass war eine Bestandsaufnahme im August 2026. Drei Beispiele aus dem eigenen Rückstand:

| Issue | Was passierte |
|---|---|
| #26 | Der GdB-Rechner addiert Werte nach einer Regel, die so nicht in der VersMedV steht. Die Umsetzung folgte dem Akzeptanzkriterium — das Kriterium war falsch. |
| #33 | Gefordert war eine lokale Kokoro-Sprachausgabe, gebaut wurde die Sprachausgabe des Browsers. Keines von beidem ist falsch, aber das Issue beschreibt nicht, was existiert. |
| #6  | „Kommentare zu Tagebucheinträgen" ist ein Nachmittag Arbeit — und macht das Portal zum Auftragsverarbeiter nach Art. 28 DSGVO. |

In allen drei Fällen hat die Umsetzung sauber geliefert, was dastand. Ausführlichere
Akzeptanzkriterien hätten keinen dieser Fälle verhindert.

**Ein PRD lohnt sich deshalb nur, wenn es drei Dinge trägt, die ein Akzeptanzkriterium nicht kann:**

1. **Die fachliche Grundlage mit Norm.** Nicht „nach VersMedV", sondern die Fundstelle und
   der Wortlaut, auf den gerechnet wird.
2. **Die ausdrücklichen Nicht-Ziele.** Was bewusst wegbleibt und warum — sonst wächst es
   während der Umsetzung wieder hinein.
3. **Die Trennung zwischen geprüft und angenommen.** Jede tragende Aussage bekommt eine
   Herkunft. Das ist der Teil, der die drei Fälle oben abgefangen hätte.

Ein PRD, das nur längere Akzeptanzkriterien enthält, ist verlorene Zeit. Dann reicht das Issue.

## Aufbau

```
000-richtung.md            Der Rahmen: wer zahlt, wohin es geht, was offen ist
001-….md                   Ein PRD je Vorhaben, fortlaufend nummeriert
```

Nummern werden nicht neu vergeben. Ein verworfenes PRD bleibt liegen und bekommt oben
den Status `Verworfen` mit einem Satz zur Begründung — die Ablage ist auch ein Protokoll
der Entscheidungen.

## Vorlage

Jedes PRD beginnt mit diesem Kopf:

```markdown
# NNN — Titel

| | |
|---|---|
| **Status** | Entwurf · In Umsetzung · Umgesetzt · Verworfen |
| **Stand** | TT.MM.JJJJ |
| **Issues** | #… |
| **Blockiert durch** | #… oder — |
```

Danach in dieser Reihenfolge:

**Problem** — Was jemand heute nicht kann. Aus Sicht der Person, nicht des Systems.
Wenn sich dieser Abschnitt nicht ohne technische Begriffe schreiben lässt, ist das Problem
noch nicht verstanden.

**Grundlage** — Normen, Fundstellen, Wortlaute. Jede Zahl und jede Regel im Produkt braucht
hier eine Quelle. Fehlt sie, gehört das in *Offene Fragen*, nicht in die Umsetzung.

**Nicht-Ziele** — Was ausdrücklich wegbleibt, mit Begründung.

**Umfang** — Was gebaut wird, gegliedert und in einer Reihenfolge, die einzeln auslieferbar ist.

**Geprüft und angenommen** — Eine Tabelle. Jede tragende Aussage mit Herkunft:

| Aussage | Herkunft | Stand |
|---|---|---|
| … | § … / Belegstelle / Gespräch vom … | geprüft |
| … | Vermutung der Architektur | **angenommen** |

Alles, was `angenommen` ist, ist ein Risiko. Trägt eine Annahme nicht, ändert sich der Umfang.

**Offene Fragen** — Was beantwortet sein muss, bevor gebaut wird, und von wem.

## Zusammenhang mit den Issues

Das PRD trägt das Warum und die Grundlage, das Issue den Zuschnitt und den Fortschritt.
Ein Issue verweist auf sein PRD; ein PRD listet seine Issues. Widersprechen sich beide,
gilt das PRD — und das Issue wird nachgezogen, nicht andersherum.
