# Epic — Vertrauen & Zugänglichkeit

| | |
|---|---|
| **Stufe** | In Ausarbeitung |
| **Ausgearbeitet am** | 29.08.2026 |
| **Issues** | #34, #88, #108, #109, #111 |
| **Blockiert durch** | — (einzelne Features hängen an #105) |

> Querschnittsbereich. Features werden dort umgesetzt, wo sie wirken — die Lesbarkeit des
> Pflegegrad-Pfads steht als #111 in der Beta, nicht hier. Was hier steht, wirkt überall.

---

## Zweck

Die zwei Bedingungen, unter denen das Portal überhaupt benutzt werden darf: Menschen müssen es
**bedienen können**, und sie müssen über ihre Daten **bestimmen können**.

Für diese Zielgruppe ist beides keine Kür. Wer 12-Pixel-Text nicht liest, benutzt das Produkt
nicht. Wer nie gefragt wurde, hat nicht eingewilligt.

---

## Capability — Einwilligungsverwaltung

**Der größte Einzelposten dieses Epics, und heute existiert davon nichts.**

Was es gibt, ist ein Cookie-Banner: `src/lib/consent.ts` verwaltet die Kategorien
`essenziell` und `analytics` unter dem Schlüssel `user_consent` im `localStorage`. Das ist
sauber gebaut und erfüllt seinen Zweck — aber es ist eine **andere Sache** als die
Einwilligung in die Verarbeitung von Gesundheitsdaten.

> **Status des BfArM-Kriterienkatalogs seit dem 06.09.2026.** Der Katalog gilt für digitale
> Pflegeanwendungen. Da das Produkt nach § 40a Abs. 1a S. 2 SGB XI derzeit keine ist und keine
> werden kann, ist er **kein verbindlicher Maßstab**, sondern freiwillige Orientierung. Die
> Vorgaben bleiben inhaltlich sinnvoll, tragen aber nur, soweit sie sich unmittelbar aus der
> DSGVO ergeben. „CNST_x" ist ab sofort Herkunftsangabe, nicht Rechtspflicht. Siehe
> [richtung.md](../richtung.md).

Der BfArM-Kriterienkatalog verlangt Einwilligungen, die am pseudonymen Konto hängen, je Zweck
getrennt sind und aus der Anwendung heraus widerrufen werden können. Ein Wert im `localStorage`
leistet keines davon: Er ist an das Gerät gebunden, nicht an den Fall, und beim nächsten
Browser weg.

### F1.1 — Einwilligungen am Fall führen

**Zweck** Jede Einwilligung hängt am Fallcode, nicht am Gerät — und bleibt dadurch widerrufbar.

**Umfang**
- Einwilligungen serverseitig am Fall speichern, mit Fassungsstand und Zeitpunkt (CNST_1.3 a)
- Widerruf aus der Anwendung heraus, jederzeit, ohne Begründung (CNST_1.4)
- Vor der Erteilung ausdrücklich auf das Widerrufsrecht hinweisen
- Je Zweck eine eigene Erklärung — keine Sammelzustimmung (CNST_1.2)
- Eigene, folgenlos verweigerbare Einwilligung für Daten zur Weiterentwicklung (CNST_3.1);
  betrifft die Reichweitenmessung
- Was beim Widerruf geschieht, ist im Löschkonzept geregelt (CNST_2.5 a)

**Fertig, wenn** eine Einwilligung auf einem zweiten Gerät mit demselben Fallcode sichtbar und
widerrufbar ist.

**Hängt an** — · blockiert F1.2 und F1.3 im [Pflegegrad-Epic](pflegegrad.md)

### F1.2 — Einwilligungsfähigkeit abfragen

**Zweck** Vor jeder Einwilligung klären, ob die Person sie erteilen kann.

**Umfang** CNST_1.6 a verlangt das als MUSS. Fehlt die Einwilligungsfähigkeit, ist auf die
Einwilligung eines Erziehungsberechtigten zu verweisen und diese einzuholen. Betrifft
unmittelbar den Kinder-Pfad (#109), aber nicht nur ihn: Bei einer hochbetagten Zielgruppe ist
auch die **rechtliche Betreuung** ein Regelfall — siehe #105.

**Hängt an** F1.1 · #105 für den Betreuungsfall

### F1.3 — Zustimmung zu den Nutzungsbedingungen

**Zweck** Vertrag und Datenschutz sauber trennen.

**Umfang** #108. **Getrennt** von der Einwilligung zu halten, weil CNST_1.2 Erklärungen
verbietet, die über die zulässigen Zwecke hinausgehen.

---

## Capability — Rechte der betroffenen Person

### F2.1 — Die vier Rechte vollständig anbieten

**Zweck** Was die Verordnung zusagt, muss im Portal auch gehen.

**Stand** Es existieren `/datenschutz/auskunft` (Art. 15) und `/datenschutz/loeschen`
(Art. 17). Der Kriterienkatalog führt in ITV_1 bis ITV_5 darüber hinaus:

| Recht | Norm | Stand |
|---|---|---|
| Auskunft | Art. 15 DSGVO | Seite vorhanden |
| Löschung | Art. 17 DSGVO | Seite vorhanden |
| **Berichtigung** | Art. 16 DSGVO | **fehlt** |
| **Einschränkung der Verarbeitung** | Art. 18 DSGVO | **fehlt** |
| **Datenübertragbarkeit** | Art. 20 DSGVO | **fehlt** |

Die Berichtigung ist dabei die praktisch wichtigste: Wer eine Modulantwort falsch gesetzt hat,
korrigiert sie heute durch erneutes Ausfüllen — nicht durch ein Recht, sondern durch eine
Funktion. Ob das genügt, gehört geprüft.

**Fertig, wenn** jedes der fünf Rechte einen benannten Weg im Portal hat und dieser ohne
E-Mail-Adresse funktioniert.

**Hängt an** dem pseudonymen Modell: Alle fünf Wege müssen ohne Identifizierung auskommen.

---

## Capability — Barrierefreiheit

### F3.1 — Der Pflegegrad-Pfad *(Beta)*

Ausgelagert nach #111. Gemessen wurden auf Modul 1 **27 von 34** Textelementen unter 16 px und
Antwortoptionen ohne echte Radiogruppen (leeres `name`-Attribut). Die Klickflächen sind mit
562 × 58 px in Ordnung.

### F3.2 — Das übrige Portal

**Zweck** Was für den Trichter gilt, gilt auch für Ergebnis, Briefe, Tagebuch und Rechtstexte.

**Umfang** #34. Dessen Akzeptanzkriterien sind bemerkenswert konkret und
zielgruppengerecht — Mindesthöhe 56 px, Eingaben ≥ 18 px, Fokuszustände, Abkürzungsparser.
Sie stammen erkennbar von jemandem, der die Zielgruppe kennt.

**Offen** Ob die Kleinstunternehmer-Ausnahme des BFSG trägt. Das entscheidet über die
Rechtsfolge, nicht über die Notwendigkeit — siehe [releases.md](../releases.md).

---

## Capability — Sprachen

### F4.1 — Deutsch und Englisch tragfähig, der Rest ehrlich

**Zweck** Klarheit darüber, welche Sprachen das Portal wirklich bedient.

> **Korrektur vom 08.09.2026 — der Befund war falsch, und zwar zu unseren Gunsten.**
> Hier stand: „32 Sprachfassungen stehen ausgeliefert im Netz, ohne dass jemand sie
> gegenliest." Das trifft nicht zu. Der Schluss war vom **Bestand** der Ordner unter
> `public/locales` auf den **Auslieferungszustand** gezogen — beides ist nicht dasselbe.
>
> `src/i18n/languages.ts` trägt genau zwei Einträge mit `aktiv: true` (`de`, `en`);
> `src/i18n/config.ts` leitet `locales` aus diesem Filter ab und erzeugt für jede nicht
> aktive Sprache bewusst einen 404. Am 08.09.2026 gegen die Live-Seite geprüft: `/de` und
> `/en` antworten mit 200, `/fr`, `/tr`, `/ar` und `/pl` mit 404.
>
> Derselbe Fehlschluss steht als B-07 im Rechtsgutachten vom 06.09.2026, mit Risiko HOCH und
> der Empfehlung „ausblenden". Das Gutachten sagt an anderer Stelle ausdrücklich, dass ihm
> der Quellcode nicht vorlag — es konnte den Unterschied nicht sehen. **Der Punkt ist
> erledigt, bevor er begonnen wurde.**
>
> Was bleibt, ist kleiner und anderer Art: 33 Ordner mit 6 bis 40 % Füllstand liegen im Repo,
> ohne dass eine Regel sagt, wann eine Sprache freigeschaltet werden darf. Genau diese Regel
> ist der eigentliche Inhalt von F4.1.

**Der Befund:** In `public/locales` liegen **35 Sprachordner** von `ar` bis `uk`; gemessen an
Deutsch mit 985 Schlüsseln erreicht allein Englisch die Vollständigkeit, Französisch kommt auf
40 %, 32 weitere auf 21 % oder darunter, Arabisch auf 6 %. **Ausgeliefert werden zwei.**

Die Gefahr liegt damit nicht im Bestand, sondern im Freischalten: Ein Wort — `aktiv: true` —
stellt eine unfertige Fassung ins Netz. Der Code beschreibt das im Kommentar selbst als
„Ein-Wort-Änderung, sobald echte Übersetzungen vorliegen". Was fehlt, ist die Festlegung, was
*echt* heißt.

**Und das ist nicht nur eine Frage der Fachrichtigkeit, sondern der Wirksamkeit.** Art. 12
Abs. 1 DSGVO verlangt Informationen in präziser, transparenter, verständlicher und leicht
zugänglicher Form; der Kriterienkatalog wiederholt das in CNST_1.5. Eine maschinell übersetzte,
von niemandem geprüfte Einwilligungs- oder Informationsfassung erfüllt das nicht. **Wer auf
Arabisch einwilligt, willigt dann nicht informiert ein** — und eine nicht informierte
Einwilligung ist keine.

Derselbe Maßstab trifft die Lesbarkeit: Verständlichkeit ist Wirksamkeitsvoraussetzung, und 27
von 34 Textelementen unter 16 px stehen dem entgegen. Beides gehört zusammen.

**Der saubere Schnitt ist eng:** Erklärungspflichtige Strecken — Einwilligung,
Nutzungsbedingungen, Datenschutzhinweise, Betroffenenrechte — nur in geprüften Sprachen
anbieten. Der übrige Inhalt kann breiter stehen.

**Fertig, wenn** eine schriftliche Freischaltregel gilt, die mindestens verlangt:
vollständige Schlüsselabdeckung, gegengelesene erklärungspflichtige Texte mit Name und Datum
der prüfenden Person, und bei RTL-Sprachen die Durchsicht aus F4.2. Ohne erfüllte Regel bleibt
`aktiv: false` — der heutige Zustand ist damit nicht Zufall, sondern Vorgabe.

### F4.2 — Rechts-nach-links

**Stand** Fundament liegt (#88): `i18n/rtl.ts` mit Spracherkennung, Textrichtung im Layout,
Symbolspiegelung, Schriftstack. Offen ist die Durchsicht der einzelnen Seiten. Betrifft
Arabisch und Persisch und damit F4.1.

---

## Geprüft und angenommen

| Aussage | Herkunft | Stand |
|---|---|---|
| Es gibt keine Einwilligungsverwaltung; `consent.ts` ist ein Cookie-Banner im `localStorage` | Durchsicht 29.08.2026 | geprüft |
| Auskunft und Löschung haben Seiten; Berichtigung, Einschränkung und Übertragbarkeit nicht | `[locale]/datenschutz/` | geprüft |
| ~~34 Sprachfassungen liegen ausgeliefert vor~~ | `public/locales` | **widerlegt 08.09.2026** — zwei sind aktiv, 33 antworten mit 404 |
| Ausgeliefert werden ausschließlich `de` und `en` | `i18n/languages.ts`, Live-Prüfung 08.09.2026 | geprüft |
| Das RTL-Fundament ist gebaut | `i18n/rtl.ts`, `rtl.test.ts`, `layout.tsx:62` | geprüft |
| Die Akzeptanzkriterien von #34 sind fachlich brauchbar | Durchsicht des Issues | **angenommen** — nicht gegen die Norm geprüft |
| Die 33 nicht ausgelieferten Sprachfassungen sind fachlich korrekt | keine | **unbekannt** — niemand hat sie geprüft, und niemand liest sie |
| Erklärungspflichtige Texte in ungeprüfter Übersetzung erfüllen Art. 12 Abs. 1 nicht | Art. 12 Abs. 1 DSGVO, CNST_1.5 | **angenommen** — mit #105 zu bestätigen |

---

## Offene Fragen

| Frage | Wer beantwortet sie | Blockiert |
|---|---|---|
| Trägt die Kleinstunternehmer-Ausnahme des BFSG? | Geschäftsführung | Umfang von F3.2 |
| ~~Bleiben die 32 ungeprüften Sprachfassungen sichtbar?~~ | **beantwortet 08.09.2026: sie sind es nie gewesen** | — |
| Woran erkennen wir, dass eine Sprache freigeschaltet werden darf? | Produkt | F4.1 |
| Genügt das erneute Ausfüllen als Recht auf Berichtigung? | Datenschutzbeauftragte(r) | F2.1 |
| Wie lange werden Einwilligungen nach Widerruf aufbewahrt? | Datenschutzbeauftragte(r) — Teil von #105 | Löschkonzept |
