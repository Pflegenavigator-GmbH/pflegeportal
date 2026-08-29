# Releases und Reifegrade

Dieses Dokument beantwortet genau eine Frage:

> **Was muss wahr sein, damit wir eine Stufe erreicht haben?**

**Stand:** 29.08.2026

---

## Zwei Stränge, nicht eine Leiter

Am 29.08.2026 wurde festgelegt, dass **Pflegedienste voraussichtlich die ersten Nutzer sind**
und dass beide Stränge **parallel** laufen.

```
B2C   Stufe 0 (live) ──▶ Beta ──▶ Release 1.0 ──▶ DiPA-Listung
B2B   #105 ───────────▶ Stufe A (Zone 1+2) ──▶ Stufe B (Zone 3)
```

Der B2B-Strang hat **keine eigene Vorstufe** — er beginnt mit der Antwort auf #105 und ist bis
dahin vollständig gesperrt. Genau deshalb ist die Parallelität tragfähig: Solange die
Datenschutzbeauftragte prüft, lässt sich dort nichts ausliefern, und die Zeit fällt auf den
B2C-Strang.

**Nichts davon ist verloren.** Lesbarkeit (#111), Leistungsbeträge (#107) und die Zustimmung zu
den Nutzungsbedingungen (#108) braucht der Pflegedienst-Zugang genauso — eine Pflegekraft
erfasst dieselben Fragen und zeigt dieselben Beträge.

**Was sich verschiebt:** #106 (Auffindbarkeit) verliert an Dringlichkeit. Ein Pflegedienst
kommt über Vertrieb, Empfehlung oder Verband — nicht über eine Suchmaschine. Die
Auffindbarkeit sperrt die B2C-Beta, nicht den Start mit Pflegediensten.

→ [epics/pflegedienst.md](epics/pflegedienst.md)

---

## Die Zielgruppe bestimmt alles Weitere

**Das Portal richtet sich an Seniorinnen und Senioren** — und sehr oft an Angehörige, die für
sie handeln. Das ist keine Randbedingung, sondern der Maßstab, an dem jede Entscheidung in
diesem Dokument zu messen ist.

Daraus folgt fünferlei, das andernorts als Nebensache durchginge:

1. **Barrierefreiheit ist keine Auflage, sondern die Funktionsfähigkeit selbst.** Ob das BFSG
   greift oder die Kleinstunternehmer-Ausnahme trägt, ändert daran nichts. Für diese Zielgruppe
   ist ein zu kleiner Text kein Rechtsverstoß, sondern ein Produkt, das nicht benutzbar ist.
2. **Der Fallcode ist eine Gedächtnisaufgabe.** Man erhält einen Code, muss ihn notieren und
   später erneut eingeben — und er ist der einzige Weg zurück zu den eigenen Daten. Eine
   E-Mail-Rückfallebene gibt es aus gutem Grund nicht (Pseudonymität). Für Menschen mit
   nachlassendem Gedächtnis oder in einer Ausnahmesituation ist das die wahrscheinlichste
   Abbruchstelle des ganzen Produkts. Damit ist die Wiederaufnahme (#99) keine Bequemlichkeit,
   sondern der Unterschied zwischen fertig werden und alles verlieren.
3. **Angehörige sind vermutlich der Regelfall, nicht die Ausnahme.** Das rückt die
   Vertretungsfrage aus #105 von der Rechtsabteilung ins Produkt: Der Trichter sollte wissen,
   für wen er ausgefüllt wird, und seine Ansprache danach richten.
4. **Vorlesen ist eine Zugangsart, keine Spielerei.** #33 war als „überholt" eingeordnet, weil
   das Akzeptanzkriterium eine andere Lösung beschreibt als die gebaute. Für diese Zielgruppe
   ist die Frage aber nicht, *welche* Sprachausgabe — sondern dass es eine gibt.
5. **Die Länge des Trichters ist ein Risiko.** Sechs Module hintereinander verlangen
   Ausdauer, die nicht vorausgesetzt werden kann.

---

## Stufe 0 — heute

**Die Anwendung ist öffentlich erreichbar,** seit dem 28.08.2026 wieder online.
`pflegenavigatoreu.com` leitet auf `/de` und liefert den vollständigen Trichter aus.

Technisch ist der Zustand gut: 400 Tests in 56 Dateien laufen durch, `tsc --noEmit` ist
fehlerfrei, ESLint meldet zwei Warnungen und keinen Fehler.

**Zwei Hinweise sind vorhanden und richtig formuliert:** ein Beta-Banner („BETA-VERSION …
befindet sich aktuell in der optimierten Testphase. Alle Auswertungen dienen als
Orientierungshilfe.") und der Rechtshinweis im Trichter („mathematische Orientierungshilfe …
ersetzt keine medizinische Begutachtung"). Zusammen decken sie das ungeprüfte Rechenmodell für
diese Stufe ausreichend ab. Was sie nicht decken, sind konkrete Geldbeträge, die seit zwei
Jahren überholt sind — siehe B2.

### Gemessen am 29.08.2026 auf `/de/pflegegrad/start`

| Messung | Ergebnis |
|---|---|
| Textelemente unter 16 px | **7 von 8** |
| Verteilung der Schriftgrößen | 4 × 12 px · 3 × 14 px · 1 × 18 px |
| Eingabefeld für den Fallcode | 40 px hoch |
| Eigene Vorgabe aus #34 | ≥ 18 px für Eingaben, ≥ 56 px für Schaltflächen |

Vier von acht Textstellen stehen auf 12 px — darunter der rechtliche Hinweis, also genau der
Text, der die Nutzenden schützen soll. Für die Zielgruppe ist das die schwerwiegendste
Feststellung dieses Dokuments.

Der Kontrast ließ sich nicht verlässlich messen; die Farbwerte liegen in einem Format vor, das
die Messung nicht sauber auflöst. **Ungeprüft, nicht unauffällig.**

---

## Beta — Traffic gezielt aufbauen

**Zweck der Stufe:** Menschen aktiv auf die Anwendung führen, ohne ihnen falsche Angaben zu
machen und ohne rechtliche Blöße.

Der Abstand hierher ist **klein und konkret**. Er hat nichts mit der DiPA-Listung zu tun — das
ist eine ganz andere Größenordnung und kommt später.

### B1 — Auffindbarkeit herstellen · *blockiert die Stufe vollständig*

Keine Seite liefert einen `<title>`, eine `meta description`, ein `canonical` oder ein
`hreflang`. Metadaten sind nur in drei Seiten definiert (`impressum`, `agb`,
`presse/[slug]`); `[locale]/layout.tsx` exportiert keine. `robots.ts` und `sitemap.ts`
existieren.

Ohne Titel erscheinen Suchergebnisse und geteilte Links mit der nackten URL. Traffic
aufzubauen, bevor das steht, verbrennt genau den Traffic, den man aufbaut.

**Umfang nur Deutsch und Englisch.** Die übrigen Sprachen werden später nachgezogen; damit
beschränkt sich `hreflang` auf zwei Fassungen plus `x-default`. Das macht diesen Punkt
erheblich kleiner, als er zunächst aussah — er bleibt trotzdem die Sperre.

**Fertig, wenn** jede Route in `de` und `en` Titel, Beschreibung, `canonical` und
`hreflang` führt, gespeist aus den Sprachdateien.

### B2 — Leistungsbeträge korrigieren

`NBA_CONFIG.BENEFITS` trägt den Kommentar „Gesetzlicher Satz 2026" bei Werten, die auf 2024
hindeuten. Diese Beträge stehen heute öffentlich auf der Ergebnisseite. Ein Rechtshinweis
deckt „das ist nur eine Orientierung" ab — er deckt nicht ab, dass eine konkrete Geldsumme
seit zwei Jahren überholt ist.

Dazu die fest im Code stehenden deutschen Zeichenketten in `rechner.ts`, die in allen 35
Sprachen auf Deutsch erscheinen.

**Fertig, wenn** jeder angezeigte Betrag eine Fundstelle mit Datum hat.

### B3 — Zustimmung zu den Nutzungsbedingungen einholen

Heute wird sie nirgends eingeholt — weder im Trichter noch im Checkout
(`consent_collection` ist in der Stripe-Sitzung nicht gesetzt).

**Getrennt** von der datenschutzrechtlichen Einwilligung halten (CNST_1.2 verbietet die
Bündelung). Für die Beta genügt die Zustimmung; die vollständige Einwilligungsverwaltung
gehört zur DiPA-Stufe.

### B4 — Kinder-Pfad absichern

Der Pfad lädt zur Erfassung von Kinderdaten ein und fragt weder Einwilligungsfähigkeit noch
die Einwilligung eines Erziehungsberechtigten (CNST_1.6 a). Solange das offen ist, ist die
Mindestmaßnahme ein Hinweis, dass die Erfassung durch einen Sorgeberechtigten erfolgen muss.

### B5 — Aussage und Wirklichkeit in Deckung bringen

Der Trichter wirbt mit „vollkommen anonymes und kostenfreies Verfahren" und „DSGVO-konform
gesichert". Die erste Aussage stimmt. Die zweite ist eine Zusicherung, während keine
Einwilligung erfasst wird. Entweder B3 kommt zuerst, oder die Formulierung wird zurückgenommen.

### B6 — Lesbarkeit für die Zielgruppe · *gleichrangig mit B1*

Ursprünglich als „Barrierefreiheit einordnen" geführt, abhängig von der
Kleinstunternehmer-Frage zum BFSG. **Diese Abhängigkeit entfällt.** Ob das Gesetz greift,
entscheidet über die Rechtsfolge, nicht über die Notwendigkeit: Ein Portal für Senioren, dessen
Trichtereinstieg zu vier Achteln auf 12 px steht, funktioniert für seine Zielgruppe nicht.

**Umfang für die Beta** — der Pfad Start → Modul 1–6 → Ergebnis, mehr nicht:

- Grundschrift im Trichter auf mindestens 16 px, Eingaben und rechtliche Hinweise auf 18 px
- Bedienelemente auf mindestens 44 px Höhe, besser die 56 px aus der eigenen Vorgabe in #34
- Kontraste messen — bisher ungeprüft — und auf den Zielwert bringen
- Der rechtliche Hinweis in einer Sprache, die man ohne juristische Vorbildung versteht

**Fertig, wenn** der Trichter mit Tastatur bedienbar ist, kein anzuzeigender Text unter 16 px
liegt und die Kontraste gemessen und belegt sind.

Die vollständige BFSG-Prüfung (#34) bleibt davon unberührt und gehört zu Release 1.0.

### Nicht in der Beta

Bezahlschranke vor der erweiterten Erhebung, Herleitung des Ergebnisses, Pflegedienst-Zugang,
KI. Die Beta prüft, ob Menschen den freien Trichter **finden** und **zu Ende gehen** — das
Erste ist B1, das Zweite B6.

---

## Release 1.0 — die kostenpflichtige Leistung

**Zweck der Stufe:** Geld nehmen für etwas, das nachweislich trägt.

| Punkt | Woher |
|---|---|
| **Rechenmodell geprüft** — der offene Vermerk in `nba.ts` eingelöst | F2.2 · **steht vor allem anderen** |
| **Erweiterte Erhebung serverseitig hinter der Schranke** | F1.3 |
| **Ergebnis zeigt seine Herleitung** | F3.1 |
| **Brief-Zentrum abgenommen** — gebaut, nie geprüft, Haken nie gesetzt | #3 |
| **Wiederaufnahme über Geräte hinweg** — für diese Zielgruppe die wahrscheinlichste Abbruchstelle, und sobald bezahlt wird, geht Bezahltes verloren | F1.4, #99 |
| **Der Trichter weiß, für wen er ausgefüllt wird** — Angehörige sind vermutlich der Regelfall; die Ansprache muss sich danach richten | neu, aus der Zielgruppe |
| **Sprachausgabe entschieden und gebaut** — für Menschen mit Sehschwierigkeiten eine Zugangsart, keine Zugabe | #33 |
| **Barrierefreiheit vollständig** — über den Trichter hinaus | #34 |
| **Admin-Zugang für Support** — heute gibt es keinen Weg, einem Nutzer zu helfen | #2 |
| **Betriebsüberwachung und ein Weg für Störungen** | offen |

Ohne die erste Zeile ist der Rest gegenstandslos: Für eine ungeprüfte Rechnung sollte man kein
Geld nehmen.

---

## DiPA-Listung — eigene Größenordnung

**Zweck der Stufe:** Aufnahme in das Verzeichnis nach § 40a SGB XI.

Das ist kein weiterer Meilenstein auf derselben Linie, sondern ein Verfahren mit
Zertifizierungsstelle, laufender Meldepflicht je Release und einem Kriterienkatalog von 14
Kapiteln.

| Punkt | Woher |
|---|---|
| **Erfüllt das Produkt überhaupt § 40a SGB XI?** | tragende offene Frage — vor allem anderen |
| **Betrieb gegen AV_1.1 und AV_1.3 prüfen** — Verarbeitung in der EU, Schlüssel beim Hersteller | Kap. 11 · siehe unten |
| **Kontomodell umbauen** — Zugriff über einen eigenen Authentisierungsfaktor, Freischaltcode nach Einlösung gelöscht | DMN_4.1 b, c |
| **Einwilligungsverwaltung vollständig** — je Zweck getrennt, widerrufbar, am Konto | CNST_1.2–1.6, CNST_3.1 |
| **Löschkonzept** | CNST_2.5 a, AV_2.6 |
| **Folgenabschätzung und Verarbeitungsverzeichnis** | DSFA_1, DSFA_2 |
| **Datenschutzbeauftragte(r) förmlich benannt**, ohne Aufgaben in Entwicklung oder Betrieb | CTRL_1.2 |
| **Hinweisweg für Vorfälle in der Anwendung** — mangels Kontaktdaten der einzige Weg | CTRL_3.2 |
| **Meldeweg für Releases an die Zertifizierungsstelle** | CTRL_2.2, CTRL_2.3 |

### Der Betriebsort ist der größte Einzelposten

AV_1.1 verlangt Verarbeitung im Inland, in der EU oder unter einem Angemessenheitsbeschluss —
einschließlich Bestands-, Nutzungs- und Verkehrsdaten. AV_1.3 verlangt bei Dienstleistern mit
Mutterkonzern im Drittland, dass die Schlüssel beim Hersteller in der EU liegen.

Im Repository gibt es **keine `vercel.json` und in keiner Route ein `preferredRegion`**.
Mehrere Routen laufen auf `runtime = 'edge'`. Die Hosting-Plattform und die Datenbank haben
US-Muttergesellschaften. `OPENCLAW_URL` in `api/avatar/chat` sendet an einen Dienst, dessen
Betriebsort hier nicht sichtbar ist.

Das ist zu prüfen und möglicherweise ein Umzug. Die StackIT-Unterlage in `grant-docs` deutet
darauf hin, dass das bereits bedacht wurde — der Abgleich mit dem laufenden Betrieb steht aus.

---

## B2B Stufe A — Pflegedienste, Zone 1 und 2

**Zweck der Stufe:** Der erste zahlende Pflegedienst kann arbeiten.

Vier der fünf gewünschten Aufgaben: Einstufung neuer Patienten, Höherstufung, Vorbereitung der
MDK-Begutachtung, Widerspruch. Alle liegen in Zone 1 oder 2 und kommen mit Einwilligung und
Vollmacht aus — ohne Vertragswerk nach Art. 28.

| Punkt | Herkunft |
|---|---|
| **#105 beantwortet** | Sperrt die Stufe vollständig |
| Beide Wege zur Akte, mit protokolliertem Übergang | F1.1 |
| Freigabe je Patient statt geteiltem Fallcode | F1.2 |
| Rollen innerhalb der Einrichtung | F1.3 |
| Erfassung unterwegs, ohne Netz | F2.1 — eigenes Vorhaben, siehe unten |
| Übersicht über die freigegebenen Fälle | F2.3 |
| Lizenzmodell entschieden | [richtung.md](richtung.md) |

**Der Katalog schafft eine dritte Möglichkeit**, die der Zonenentwurf nicht kannte: Gemeinsame
Verantwortung nach Art. 26 DSGVO ist für DiPA ausdrücklich zulässig (CTRL_4.1).

**Erfassung ohne Netz ist der unterschätzte Posten.** Der Trichter speichert heute je Schritt
serverseitig — der Hinweis „Fortschritt online gespeichert" belegt das. Ein Erstbesuch findet
in einer Wohnung statt, oft ohne Empfang. Ohne lokale Erfassung mit späterem Abgleich bricht
die Erhebung genau dort ab, wo sie stattfinden soll.

## B2B Stufe B — laufende Dokumentation (Zone 3)

Was eine Pflegekraft selbst aufschreibt, ist die eigene fachliche Aufzeichnung des Dienstes.
Damit wird der Dienst Verantwortlicher und das Portal Auftragsverarbeiter: Vertrag nach
Art. 28 **je Kunde**, Verarbeitungsverzeichnis, Löschkonzept, Nachweise über technische und
organisatorische Maßnahmen, Transparenz über Unterauftragnehmer.

Bewusst nach Stufe A gelegt (Entscheidung vom 29.08.2026). Ein Kommentarfeld ist zwei Tage
Arbeit; der Apparat dahinter ist es nicht.

---

## Was hier noch nicht beurteilt ist

Damit dieses Dokument nicht mehr behauptet, als es weiß:

- **Kapitel 3 bis 9 und 13 des Kriterienkatalogs** sind ungelesen: Treu und Glauben,
  Transparenz, Nichtverkettbarkeit, Datenminimierung (nur DMN_4 gesichtet), Intervenierbarkeit
  (Betroffenenrechte), Integrität, Rechenschaftspflicht, technische Maßnahmen. Das sind
  ungefähr 30 weitere Kriteriengruppen. Sie betreffen die DiPA-Stufe, nicht die Beta.
- **Der Trichter wurde nicht bis zum Ende durchgespielt** — nur die Startseite wurde live
  geprüft.
- **Ladezeiten, Fehlerraten und Sicherheitsprüfung** wurden nicht erhoben.
- **Die Rechtstexte** (AGB, Datenschutzerklärung, Impressum) existieren, sind aber nicht auf
  Aktualität geprüft.
