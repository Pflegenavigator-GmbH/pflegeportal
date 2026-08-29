# Epic — Zugang & Abrechnung

| | |
|---|---|
| **Stufe** | In Ausarbeitung |
| **Ausgearbeitet am** | 29.08.2026 |
| **Issues** | #2, #6, #105, #113 |
| **Blockiert durch** | — (die Lizenzmechanik hängt an der Modellwahl) |

---

## Zweck

Wer darf hinein, wer hat bezahlt, und was passiert, wenn nicht mehr bezahlt wird.

Klingt nach Verwaltung, ist aber die Stelle, an der das Produkt zwei Welten verbinden muss:
anonyme Patientinnen und angemeldete Einrichtungen.

---

## Der Kern: Zwei Anmeldemodelle nebeneinander

**Heute gibt es keine Authentifizierung.** Im gesamten Quellcode findet sich kein Aufruf von
Supabase Auth. `src/lib/api/case-auth.ts` prüft ein Cookie, das den Fallcode trägt — das ist
eine Sitzung, keine Anmeldung. Der Fallcode *ist* die Berechtigung.

Mit dem Pflegedienst-Zugang kommt ein zweites Modell hinzu, und die beiden bleiben dauerhaft
nebeneinander bestehen:

| | Patientin | Mitglied einer Einrichtung |
|---|---|---|
| Identität | keine, pseudonymer Fallcode | benanntes Konto mit Anmeldung |
| Berechtigung | Kenntnis des Codes | Rolle **und** Freigabe für den Fall |
| Nachvollziehbarkeit | keine, gewollt | personengenau, verpflichtend |
| Grundlage | Art. 9 Abs. 2 lit. a DSGVO — **heute nicht eingeholt** | dieselbe Einwilligung, mittelbar |

**Das ist kein Übergangszustand.** Die Anonymität der betroffenen Person ist keine Bequemlichkeit,
sondern Vorgabe: Der BfArM-Kriterienkatalog verlangt in CNST_1.3 a ausdrücklich einen
pseudonymen Zugang. Die Nachvollziehbarkeit auf Seiten der Einrichtung ist ebenso verpflichtend
— Art. 5 Abs. 2 DSGVO. Beides zugleich zu bauen ist die eigentliche Aufgabe dieses Epics.

**Die Brücke ist die Freigabe**, nichts sonst. Ein Mitglied bekommt niemals den Fallcode zu
sehen.

> **Ein offener Widerspruch zur DiPA-Stufe.** Kriterium DMN_4.1 b verlangt, dass der Zugriff
> auf ein Konto über einen **bei der Kontoanlage erfassten Authentisierungsfaktor** erfolgt,
> und DMN_4.1 c, dass der Freischaltcode nach Einlösung gelöscht wird. Der Fallcode ist beides
> in einem. Für die DiPA-Listung müsste auch die Patientenseite ein echtes Konto bekommen —
> pseudonym, aber mit eigenem Faktor. Das steht in [releases.md](../releases.md) und ist hier
> nur zu vermerken, damit das Datenmodell es später aufnehmen kann.

---

## Capability — Organisationen und Konten

### F1.1 — Organisation anlegen und prüfen

**Zweck** Eine Einrichtung registriert sich selbst und wird anschließend freigeschaltet.

**Umfang**
- Selbstregistrierung, danach Freischaltung durch uns (so im Zugangskonzept festgelegt)
- Geprüft wird Nachweisbares: Institutionskennzeichen, Versorgungsvertrag nach § 72 SGB XI,
  Handelsregister- oder Gewerbenachweis, benannte verantwortliche Pflegefachkraft
- Vor der Freischaltung kann die Organisation keine Einladung einlösen
- Die Art der Einrichtung ist ein Feld, kein fest verdrahteter Typ — siehe
  [pflegedienst.md](pflegedienst.md)

> **Namensfalle.** Im Schema existiert bereits eine Tabelle **`pflegedienste`** — sie ist ein
> **öffentliches Verzeichnis** mit Name, Anschrift, Telefon und Bewertung, damit Nutzende einen
> Dienst *finden*. Sie hat mit dem Mandantenmodell nichts zu tun. Die neue Tabelle heißt
> deshalb `organisationen`. Wer beim Bauen nach `pflegedienste` greift, vermischt ein
> Branchenverzeichnis mit Zugriffsrechten.

**Fertig, wenn** eine nicht freigeschaltete Organisation keinerlei Patientendaten erreicht.

### F1.2 — Mitglieder, Rollen und Ausscheiden

**Zweck** Personen kommen und gehen; Zugriff darf nicht bleiben.

**Umfang**
- Erstes Mitglied entsteht mit der Organisation und trägt die Rolle Inhaberin
- Mitglieder werden eingeladen, nicht selbst angelegt
- Rollen nach dem Modell in [pflegedienst.md](pflegedienst.md) — die Inhaberin sieht **keine**
  Gesundheitsdaten
- Ausscheiden entzieht den Zugriff sofort; das Zugriffsprotokoll bleibt erhalten
- Zuweisung einzelner Fälle an Pflegekräfte

**Der Grund für dieses Feature steht in der Ausgangslage des Zugangskonzepts:** Beim geteilten
Fallcode kann einer ausgeschiedenen Pflegekraft nichts entzogen werden, weil sie nie etwas
erhalten hat, das der Organisation gehörte. Genau das behebt dieses Feature.

**Fertig, wenn** der Entzug für ein ausgeschiedenes Mitglied sofort wirkt und im Protokoll
sichtbar bleibt, was es zuvor getan hat.

### F1.3 — Anmeldung einführen

**Zweck** Das erste echte Anmeldeverfahren im Portal.

**Umfang** Supabase Auth für Mitglieder von Organisationen. Die Fallcode-Sitzung der
Patientinnen bleibt unangetastet und daneben bestehen.

**Fertig, wenn** beide Wege nebeneinander funktionieren und eine Route nie beide zugleich
akzeptiert.

**Hängt an** #101 — die serverseitige Sitzung wird gerade ohnehin überarbeitet

---

## Capability — Berechtigung

### F2.1 — Freischaltung heute: am Fall

**Stand** Gebaut. `cases` trägt `billing_status`, `product_tier`, `stripe_session_id`,
`access_unlocked_at`, `access_activated_at`; `payments` hält die Zahlungen. Durchgesetzt wird
serverseitig über `requireCaseSession` und `isUnlocked`; `entitlement.ts` ist ausdrücklich nur
Oberflächenlogik.

**Das ist das B2C-Modell**, und es funktioniert: Ein Fall ist bezahlt oder nicht.

### F2.2 — Freischaltung mit einer Lizenz im Rücken

**Zweck** Klären, was gilt, wenn nicht die Patientin bezahlt hat, sondern ihr Pflegedienst.

**Die Frage, die beantwortet werden muss:** Ist ein Fall freigeschaltet, weil die Organisation
mit gültiger Freigabe eine Lizenz hat? Oder bleibt die Freischaltung am Fall und die Lizenz
regelt nur den Zugang der Einrichtung?

> **Korrektur vom 29.08.2026: Das ist keine reine Produktfrage.** Schaltet die Lizenz des
> Dienstes den Fall frei, hängt die Nutzbarkeit der eigenen Akte an einer Freigabe zugunsten
> genau dieses Dienstes. Ein Widerruf kostet dann den Zugang zu Funktionen — und damit ist die
> Einwilligung nicht mehr freiwillig im Sinne des **Art. 7 Abs. 4 DSGVO**. Der
> Einwilligungstext sagt zu: „Das Portal funktioniert für Sie genauso, wenn Sie nichts
> freigeben." Diese Zusage bindet die Technik.
>
> F2.3 zieht die Linie bereits für das **Ende** einer Lizenz („was bezahlt wurde, bleibt
> bezahlt"), aber nicht für den **Widerruf**. Beides muss gleich behandelt werden.

Zwei nebeneinander laufende Quellen für „ist freigeschaltet" erzeugen zudem genau die Art von
Fehler, die niemand bemerkt, bis jemand umsonst arbeitet oder umsonst bezahlt.

**Umfang**
- Eine einzige serverseitige Antwort auf die Frage, ob ein Fall freigeschaltet ist
- Diese Antwort berücksichtigt Kauf **und** Lizenz, ohne dass die Oberfläche das unterscheiden
  muss

**Hängt an** der Wahl des Lizenzmodells — siehe [richtung.md](../richtung.md)

### F2.3 — Was beim Ende einer Lizenz geschieht

**Zweck** Verhindern, dass jemand seine Daten verliert, weil ein Dritter aufgehört hat zu
zahlen.

**Die Falle:** Legt ein Pflegedienst die Akte an (Weg B in
[pflegedienst.md](pflegedienst.md)) und läuft später seine Lizenz aus, darf die Patientin nicht
den Zugang zu ihren eigenen Daten verlieren. Es ist ihre Akte — das ist die tragende Aussage
des ganzen Zonenmodells. Eine Freischaltung, die mit der Lizenz endet, würde sie zur Akte des
Dienstes machen und die rechtliche Konstruktion im Nachhinein widerlegen.

**Umfang**
- Endet eine Lizenz, endet der Zugriff der **Organisation** — nicht der Bestand der Akte
- Die betroffene Person behält ihren Fallcode und ihre Daten
- Was bezahlt wurde, bleibt bezahlt: Eine bereits freigeschaltete erweiterte Erhebung wird
  nicht wieder gesperrt
- Die betroffene Person wird darüber unterrichtet, dass die Freigabe endet — soweit ohne
  Kontaktdaten möglich, also in der Anwendung (Erläuterung zu CTRL_3.2)

**Fertig, wenn** nach dem Ende einer Lizenz die Organisation nichts mehr sieht und die
betroffene Person alles.

---

## Capability — Lizenz

### F3.1 — Abrechnungsmodell wählen und umsetzen

**Zweck** Aus einer der fünf Möglichkeiten eine wird.

**Stand** Fünf Modelle sind in [richtung.md](../richtung.md) festgehalten und unbewertet. Die
Wahl setzt die Antwort auf #105 voraus — von ihr hängt ab, was überhaupt abrechenbar ist.

**Technisch bereits vorhanden:** Die Checkout-Sitzung kennt `mode: 'subscription'`
(`src/app/api/checkout/create-session/route.ts`). Wiederkehrende Zahlung muss also nicht neu
gebaut werden.

**Größenordnung:** Der Businessplan rechnet für den ersten Partner mit 150 Nutzenden im Monat
im zweiten Jahr und 900 im dritten. Ein Festbetrag trifft Kleinstbetrieb und Kette nicht
gleichermaßen.

### F3.2 — Verwaltungszugang

**Zweck** Wenn etwas schiefgeht, muss jemand helfen können.

**Stand** Es gibt keine `/admin`-Route. Heute existiert kein Weg, einer Nutzerin zu helfen,
die bezahlt hat und nicht freigeschaltet ist.

**Umfang** #2, mit zwei Schärfungen gegenüber dessen Akzeptanzkriterien:

- „Zugriff über Passwort" ist keine Authentifizierung — es gilt dasselbe Verfahren wie in F1.3
- „Premium manuell freischalten" verändert einen Zahlungsstatus per Knopfdruck. Das braucht ein
  Protokoll: wer, wann, für welchen Fall, aus welchem Grund

**Zusätzlich zu bedenken:** Ein Verwaltungszugang, der Fälle einsehen kann, sieht
Gesundheitsdaten. Dieselbe Überlegung wie bei der Inhaberin einer Organisation gilt hier für
uns selbst — Datenminimierung nach Art. 5 Abs. 1 lit. c DSGVO endet nicht am eigenen Haus.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Es gibt heute keine Authentifizierung im Portal | Durchsicht 29.08.2026, kein Supabase-Auth-Aufruf | geprüft |
| `case-auth.ts` prüft ein Cookie mit dem Fallcode | `src/lib/api/case-auth.ts:34` | geprüft |
| `pflegedienste` ist ein öffentliches Verzeichnis, keine Mandantentabelle | `types/supabase.ts` — Name, Anschrift, Telefon, Bewertung | geprüft |
| Die Freischaltung hängt heute am Fall | `cases.billing_status`, `product_tier`, `access_unlocked_at` | geprüft |
| Wiederkehrende Zahlung ist vorbereitet | `create-session/route.ts`, `mode: 'subscription'` | geprüft |
| Der Fallcode erfüllt DMN_4.1 b und c nicht | Kriterienkatalog gegen `case-auth.ts` | **angenommen** — betrifft die DiPA-Stufe |
| Zwei Anmeldemodelle lassen sich sauber nebeneinander betreiben | Architekturvorschlag | **angenommen** — tragend für F1.3 |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Welches Lizenzmodell? | Geschäftsführung, nach #105 | F3.1, und damit F2.2 |
| Schaltet eine Lizenz den Fall frei, oder nur den Zugang der Einrichtung? | **Datenschutzbeauftragte(r)** — vorentschieden durch Art. 7 Abs. 4 | F2.2 |
| Darf ein Verwaltungszugang Gesundheitsdaten sehen? | Datenschutzbeauftragte(r) | F3.2 |
| Wie erfährt die betroffene Person, dass eine Freigabe endet? | Produkt | F2.3 |
