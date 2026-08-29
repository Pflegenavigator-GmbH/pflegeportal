# Produktdokumentation — PflegeNavigator EU

Anforderungen für das Portal: Richtung, Epics, Features. Aus diesen Dokumenten werden
Issues geschnitten — nicht umgekehrt.

Neu hier? `produktstruktur.md` erklärt das Ebenenmodell.

---

## Einstiegspunkte

| Frage | Dokument |
|---|---|
| Wohin geht das Produkt, und wer zahlt? | `produkt/richtung.md` |
| Wie ist die Dokumentation gegliedert? | `produktstruktur.md` |
| Welche Epics gibt es? | `produkt/epic_index.md` |
| Woran wird gerade gearbeitet? | `produkt/epics/pflegegrad.md` |

---

## Abgrenzung zu den anderen Repositorys

| Repository | Inhalt | Warum getrennt |
|---|---|---|
| **dieses** (`docs/prd/`) | Anforderungen an das Portal | liegt neben dem Code, den sie beschreiben |
| `lexcare_ai_prd` | Produktdokumentation für LexCare AI | **eigenes Produkt** mit eigenem Lebenszyklus |
| `pflegenavigator-grant-docs` | Förder-, Compliance- und Architekturunterlagen | anderes Publikum (Fördergeber, Prüfstellen), anderer Rhythmus |

Die Portal-Anforderungen liegen bewusst **hier** und nicht daneben: Derselbe Pull Request
ändert dann Verhalten und Anforderung, und eine veraltete Anforderung steht im Diff, wo sie
jemand sieht. Was in den anderen beiden Repositorys steht, wird verlinkt, nicht kopiert.

---

## Prinzipien

**Eine Frage, ein Dokument.** Beantworten zwei Dokumente dieselbe Frage, ist eines davon
falsch — und niemand weiß, welches.

**Detailtiefe folgt der Umsetzung.** Nur das Epic, das als Nächstes gebaut wird, ist bis auf
Feature-Ebene ausgearbeitet. Alles andere steht als Absichtserklärung im Epic-Index. Features,
die ein Jahr im Voraus geschrieben werden, sind falsch, bevor sie jemand liest.

**Geprüft und angenommen werden getrennt.** Jede tragende Aussage bekommt eine Herkunft.
Das ist der Teil, den ein Akzeptanzkriterium nicht leisten kann — und der Grund, warum es
diese Dokumente überhaupt gibt.

---

## Warum es diese Dokumente gibt

Aus der Bestandsaufnahme des Rückstands vom 29.08.2026:

| Issue | Was passierte |
|---|---|
| #26 | Der GdB-Rechner addiert nach einer Regel, die so nicht in der VersMedV steht. |
| #33 | Gefordert war lokale Kokoro-Sprachausgabe, gebaut wurde die des Browsers. |
| #6 | „Kommentare zu Tagebucheinträgen" — ein Nachmittag Arbeit, der das Portal zum Auftragsverarbeiter nach Art. 28 DSGVO macht. |

In allen drei Fällen hat die Umsetzung sauber geliefert, was dastand. Die Anforderung war
falsch, nicht der Code. Ausführlichere Akzeptanzkriterien hätten keinen dieser Fälle
verhindert — eine Fundstelle und eine Herkunftsangabe schon.

---

## Zusammenhang mit den Issues

Das Feature trägt das Warum und die Grundlage, das Issue den Zuschnitt und den Fortschritt.
Ein Issue verweist auf sein Feature; ein Feature nennt seine Issues. Widersprechen sich beide,
gilt das Feature — und das Issue wird nachgezogen.
