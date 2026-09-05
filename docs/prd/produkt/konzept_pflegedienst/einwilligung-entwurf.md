# Entwurf: Einwilligung und Vollmacht für Pflegedienste (Zone 1 und Zone 2)

**Projekt** PflegeNavigator EU
**Für** André Schulze, Rodrigue Lawson
**Status** Juristischer Entwurf zur Vorlage bei der Datenschutzbeauftragten / RA Tim Gruner
**Fassung** v0.3 · 29.08.2026

> **Änderungen in v0.3** — nach fachlicher Rückmeldung, fünf Korrekturen:
> **(a)** Die Zusage „die Abrechnung sieht keine Gesundheitsdaten" war unzutreffend und ist
> ersetzt — auch ein Verfahrensstand hat Gesundheitsbezug.
> **(b)** Das Schema hält jetzt fest, **wer** erklärt hat; ohne das ist der Vertretungsfall
> nicht nachweisbar.
> **(c)** `on delete cascade` entfernt: Eine Löschung nach Art. 17 hätte den Nachweis nach
> Art. 5 Abs. 2 mit vernichtet.
> **(d)** Die Bedingung, die Zone 2 ohne Papierbeleg verhinderte, ist entfernt — sie
> verdrahtete eine Formfrage, die ausdrücklich offen ist.
> **(e)** Abschnitt 7 behauptet nicht länger pauschal, der Dienst bestimme keine Zwecke. Die
> Verantwortlichkeit ist **je Verarbeitungsvorgang** zu bestimmen.
>
> **Änderungen in v0.2** — vier Punkte, die den Entwurf tragen oder brechen:
> 1. **Zweiter Weg ergänzt.** v0.1 kannte nur den Fall, dass die betroffene Person eine
>    Einladung erzeugt. Am 29.08.2026 wurde entschieden, dass **auch der Pflegedienst die Akte
>    anlegen kann**. Dieser Weg braucht ein eigenes Verfahren — Abschnitt 4.
> 2. **Rollenmodell nachgezogen** auf die am 29.08.2026 festgelegten vier Rollen. Der
>    Einwilligungstext benennt jetzt, wer lesen darf **und wer nicht**.
> 3. **Die tragende Annahme ist als solche gekennzeichnet.** v0.1 führte in Abschnitt 5 als
>    „Ergebnis", was in Wahrheit die ungeprüfte Kernthese ist. Dazu kommt eine dritte
>    Möglichkeit, die v0.1 nicht kannte (Art. 26 DSGVO).
> 4. **Der Wortlaut wurde vereinfacht.** v0.1 verlangte „leicht verständliche Sprache" und
>    schrieb dann „Ich willige ausdrücklich ein, dass der von mir autorisierte Pflegedienst…".
>    Für eine hochbetagte Zielgruppe war das ein Widerspruch in sich.
>
> Die Belegmarken der Form `[315]` aus v0.1 wurden entfernt: Sie verwiesen auf nichts, was
> ein Leser nachschlagen kann. An ihre Stelle treten Normen und Kriterien im Klartext.

---

## 1. Rechtlicher Prüfrahmen

Grundlage: **Art. 7 und 9 DSGVO**, **§ 40a SGB XI** i. V. m. DiPAV, **§ 164 BGB** sowie die
*Prüfkriterien für die von DiGA und DiPA nachzuweisenden Anforderungen an den Datenschutz*
(BfArM, V1.0 vom 24.04.2024, im Folgenden „Kriterienkatalog").

Zwingend zu erfüllen:

1. **Kein Kopplungsverbot** (Art. 7 Abs. 4 DSGVO). Die Nutzung des Portals darf nicht davon
   abhängen, dass jemand einem Pflegedienst Zugriff gewährt. Zone 1 und Zone 2 sind getrennt
   anzusteuern.
2. **Keine Bündelung** (Kriterium CNST_1.2). Erklärungen, die mit einer Einwilligung verbunden
   sind, dürfen **keine über die zulässigen Zwecke hinausgehenden Sachverhalte** enthalten. Die
   Zustimmung zu den Nutzungsbedingungen ist deshalb eine **eigene Handlung** und darf nicht in
   dieselbe Checkbox.
3. **Besondere Datenkategorien** (Art. 9 DSGVO). Mobilität, Kognition und Verhaltensweisen sind
   Gesundheitsdaten. Die Einwilligung muss diese Kategorie ausdrücklich und hervorgehoben
   benennen.
4. **Bindung an das Konto** (CNST_1.3 a). Jede Einwilligung MUSS mit dem pseudonymen Konto —
   hier dem Fallcode — verknüpft werden, damit sie widerrufbar bleibt.
5. **Widerruf aus der Anwendung heraus**, jederzeit (CNST_1.4). Auf dieses Recht ist **vor**
   der Erteilung hinzuweisen.
6. **Verständlichkeit** (Art. 12 DSGVO, CNST_1.5). Die Zielgruppe ist oft hochbetagt oder
   kognitiv eingeschränkt. Das ist keine Formulierungsfrage, sondern eine
   Wirksamkeitsvoraussetzung: Was nicht verstanden wird, ist nicht informiert eingewilligt.
7. **Vollmacht für Zone 2** (§ 164 BGB). Wer Anträge im fremden Namen stellt, braucht eine
   zivilrechtliche Vertretungsmacht. Eine Datenschutzeinwilligung ersetzt sie nicht.

---

## 2. Wortlaut: Einwilligung

*Für die Oberfläche: Dieser Text erscheint, wenn eine Freigabe für einen Pflegedienst erteilt
wird. Die beiden Kästchen sind einzeln ansteuerbar und keines ist vorausgefüllt.*

### Wer darf auf meine Daten schauen?

Sie entscheiden selbst, ob ein Pflegedienst Ihre Daten in diesem Portal sehen darf — und was
er damit tun darf.

**Sie müssen das nicht.** Das Portal funktioniert für Sie genauso, wenn Sie nichts freigeben.

<!-- Diese Zusage bindet die Technik: Sie ist nur wahr, solange die Freischaltung des Falls
     nicht an der Lizenz des Pflegedienstes hängt. Siehe Abschnitt 7, Freiwilligkeit. -->

**Sie können es jederzeit rückgängig machen.** Ein Klick in Ihrem Bereich genügt. Der
Pflegedienst kann dann sofort nichts mehr sehen. Sie müssen das niemandem begründen.

---

#### ☐ Kästchen 1 — Der Pflegedienst darf meine Daten lesen *(Zone 1)*

> Der Pflegedienst, den ich ausgewählt habe, darf sehen, was ich in diesem Portal erfasst habe.
>
> **Was er sieht:** meinen errechneten Pflegegrad, die Punkte aus den sechs Bereichen der
> Begutachtung — also Angaben zu Mobilität, Denken und Gedächtnis, Verhalten, Selbstversorgung,
> Umgang mit Krankheit und Alltagsgestaltung —, das Datum meines Bescheids und meine Einträge
> im Pflegetagebuch.
>
> **Das sind Angaben über meine Gesundheit.** Sie sind besonders geschützt. Deshalb frage ich
> Sie ausdrücklich.
>
> **Wozu:** damit der Pflegedienst mich auf die Begutachtung durch den Medizinischen Dienst
> vorbereiten und beraten kann.
>
> **Wer im Pflegedienst:** nur die Pflegedienstleitung und die Pflegekraft, die mich betreut,
> sehen meine Angaben. Die Inhaberin oder der Inhaber des Dienstes sieht sie **nicht**. Die
> Abrechnung sieht nur, dass ein Verfahren läuft und wie weit es ist — keine Werte, keine
> Tagebucheinträge, keinen Pflegegrad.

#### ☐ Kästchen 2 — Der Pflegedienst darf in meinem Namen handeln *(Zone 2)*

> Der Pflegedienst darf in meinem Namen Angaben in meinem Portal erfassen und ändern und
> Schreiben für mich vorbereiten.
>
> **Was er tun darf:** mein Pflegetagebuch weiterführen, einen Antrag auf einen Pflegegrad oder
> auf Höherstufung vorbereiten, einen Widerspruch gegen einen Bescheid entwerfen.
>
> **Wichtig:** Der Pflegedienst handelt dabei nur für mich. Alle Schreiben lauten auf meinen
> Namen und gehören mir. Was mit ihnen geschieht, entscheide ich.
>
> **Dafür brauche ich zusätzlich eine Vollmacht.** Die steht auf dem nächsten Blatt.

---

## 3. Wortlaut: Vollmacht (Zone 2)

> **Zur Form — offener Punkt.** Ob eine Bestätigung im Portal genügt oder eine Unterschrift auf
> Papier nötig ist, ist **nicht entschieden**. Der Vorschlag lautet: Papier, weil
> Sozialleistungsträger im Widerspruchsverfahren häufig eine unterschriebene Vollmacht
> verlangen. Das erzwingt ein Upload-Verfahren (vorausgefülltes PDF → Unterschrift →
> Abfotografieren → Ablage). Das ist Aufwand und eine Hürde für die Zielgruppe — deshalb muss
> die Frage beantwortet sein, bevor gebaut wird.

**Vollmachtgeberin / Vollmachtgeber**
Name, Vorname · Geburtsdatum · Anschrift

**Bevollmächtigte Organisation**
Name des Pflegedienstes · IK-Nummer · Anschrift

Hiermit bevollmächtige ich den oben genannten Pflegedienst sowie dessen vertretungsberechtigte
Mitarbeitenden, mich in pflege- und sozialversicherungsrechtlichen Angelegenheiten gegenüber
Pflegekasse, Krankenkasse und Medizinischem Dienst zu vertreten.

Die Vollmacht umfasst:

1. Anträge auf Feststellung oder Änderung des Pflegegrades nach § 15 SGB XI sowie auf
   Hilfsmittel nach § 33 SGB V zu stellen
2. Widersprüche gegen Bescheide einzulegen, zu begründen und Entwürfe über das Portal
   *PflegeNavigator EU* zu erstellen
3. Auskünfte einzuholen und Akteneinsicht zu nehmen

Diese Vollmacht gilt im Zusammenhang mit der Nutzung des Portals *PflegeNavigator EU*. Sie ist
gegenüber dem Pflegedienst jederzeit formfrei widerruflich.

Ort, Datum · Unterschrift

> **Ein Widerspruch, der aufzulösen ist.** Die Vollmacht ist außerhalb des Systems formfrei
> widerruflich. Der Kriterienkatalog stellt jedoch fest, dass im pseudonymen Modell „der
> Widerruf einer Einwilligung durch einen berechtigten Vertreter … technisch nicht umsetzbar"
> ist (Erläuterung zu CNST_1.4) — Anker ist das Konto, nicht die Person. Das Portal muss
> deshalb einen Weg vorsehen, wie ein Widerruf auf Papier im System ankommt. Vorschlag: Die
> Freigabe erhält eine Gültigkeitsdauer und muss aktiv verlängert werden.

---

## 4. Der zweite Weg: Der Pflegedienst legt die Akte an

**Neu in v0.2.** Am 29.08.2026 wurde festgelegt, dass beide Wege möglich sein sollen. Dieser
hier ist der schwierigere, und v0.1 kannte ihn nicht.

**Das Problem:** Der Erstbesuch findet in einer Wohnung statt, nicht am Bildschirm. Legt die
Pflegekraft dort eine Akte an und erfasst die Module, verarbeitet sie Gesundheitsdaten,
**bevor** im Portal irgendeine Einwilligung erteilt sein kann. Die betroffene Person hat das
Portal in diesem Moment noch nie gesehen.

**Vorschlag für das Verfahren:**

1. **Einwilligung auf Papier zuerst.** Die Pflegekraft legt beim Erstbesuch dasselbe Formular
   vor — Wortlaut aus Abschnitt 2, plus die Vollmacht aus Abschnitt 3, wenn Zone 2 gewollt ist.
   Ohne Unterschrift wird nichts erfasst.
2. **Erst danach die Akte.** Die Pflegekraft legt sie an und hinterlegt das abfotografierte
   Formular; Fassungsstand und Datum werden mitgeschrieben.
3. **Die Person erhält ihren Fallcode** — es ist ihre Akte, nicht die des Dienstes.
4. **Übernahme jederzeit möglich.** Meldet sich die Person selbst an, geht die Akte in ihre
   Hand über. Der Wechsel wird protokolliert.

**Der rechtlich heikle Punkt** ist Schritt 1 und 2: Zwischen Unterschrift auf Papier und
Erfassung im Portal liegt eine Verarbeitung, deren Grundlage außerhalb des Systems begründet
wurde. Das muss die Datenschutzbeauftragte beurteilen — es ist derselbe Kern wie die Frage nach
der Form der Vollmacht.

---

## 5. Wer darf was — die vier Rollen

Festgelegt am 29.08.2026. Die Rolle **in der Einrichtung** ist strikt getrennt von der Freigabe
**für einen Fall**: Ohne Freigabe der betroffenen Person sieht auch die Pflegedienstleitung
nichts.

| Rolle | Gesundheitsdaten lesen | In fremdem Namen handeln | Organisation verwalten | Umfang |
|---|---|---|---|---|
| **Inhaberin / Inhaber** | nein | nein | ja | Verträge und Konten |
| **Pflegedienstleitung** | ja | ja | ja | alle freigegebenen Fälle |
| **Pflegekraft** | ja | ja | nein | nur zugewiesene Fälle |
| **Abrechnung** | **nein** | nein | nein | nur Verfahrensstand |

Dass die Inhaberin keine Pflegedaten sieht, ist keine Nachlässigkeit, sondern der Kern: Wer
die Organisation verwaltet, braucht dafür keine Angaben zur Pflege. Art. 5 Abs. 1 lit. c DSGVO.

**Für die Oberfläche folgt daraus:** Die Fallübersicht zeigt **nur den Verfahrensstand**.
Werte, Tagebucheinträge und der Pflegegrad erscheinen erst nach dem Öffnen eines einzelnen
Falls und nur für Rollen, die sie sehen dürfen.

> **Genau formuliert — und das ist keine Wortklauberei.** Auch der bloße Verfahrensstand hat
> Gesundheitsbezug: Dass eine benennbare Person ein laufendes Pflegegradverfahren hat, sagt
> etwas über ihren Zustand. Die Zusage kann deshalb nicht „keine Gesundheitsdaten" lauten,
> sondern nur: **kein über das für die Arbeitssteuerung unvermeidbare Minimum hinausgehender
> Gesundheitsbezug in der Übersicht.** Eine Einwilligung, die mehr zusagt, als das System
> halten kann, ist nicht informiert erteilt — und Informiertheit ist
> Wirksamkeitsvoraussetzung.

---

## 6. Technische Umsetzung

### A. Einwilligungen protokollieren

Nachweisbarkeit nach Art. 7 Abs. 1 DSGVO:

```sql
create table einwilligungen (
    id                    uuid primary key default gen_random_uuid(),
    -- KEIN cascade: Der Nachweis muss eine Löschung des Falls überdauern, sonst
    -- vernichtet Art. 17 den Beleg für eine Verarbeitung, die stattgefunden hat.
    case_id               uuid references cases(id) on delete set null,
    case_code_hash        text not null,  -- Zuordnung ohne Fallbezug, für Art. 5 Abs. 2
    organisation_id       uuid references organisationen(id) on delete set null,

    -- WER hat erklärt? Bei den Fragen 5 bis 7 die einzige Angabe, die zählt.
    erklaerende_rolle     text not null check (erklaerende_rolle in (
                            'person_selbst',
                            'unterstuetzt_bei_eigener_eingabe',
                            'bevollmaechtigte',
                            'betreuerin')),
    -- nur bei 'betreuerin' zu füllen
    betreuung_gericht     text,
    betreuung_az          text,
    betreuung_aufgabenkreise text[],
    betreuung_befristet_bis  date,
    zone_1_einsicht       boolean not null default false,
    zone_2_vertretung     boolean not null default false,
    -- Beleg der Vollmacht; für Zone 2 zwingend, sofern Papierform gefordert wird
    vollmacht_beleg_pfad  text,
    -- Fassungsstand des angezeigten Textes, für spätere Prüfungen
    einwilligung_version  varchar(10) not null,
    vollmacht_version     varchar(10),
    -- Weg A: Person erteilt im Portal. Weg B: Papier beim Erstbesuch.
    erteilt_ueber         text not null check (erteilt_ueber in ('portal', 'papier')),
    erteilt_am            timestamptz not null default now(),
    gueltig_bis           timestamptz,
    widerrufen_am         timestamptz,
    widerrufen_durch      text check (widerrufen_durch in (
                            'person_selbst', 'bevollmaechtigte', 'betreuerin', 'system'))
);

create index on einwilligungen (case_id) where widerrufen_am is null;
```

> **Gegenüber v0.1 entfernt:** das Feld `ip_addresse_anonymisiert`. Der Kriterienkatalog baut
> ausdrücklich auf pseudonyme Nutzung ohne identifizierende Merkmale; auch eine gekürzte
> IP-Adresse arbeitet dagegen. Der Nachweis wird durch Fassungsstand, Zeitpunkt und den Beleg
> geführt — das genügt Art. 7 Abs. 1 und minimiert mehr.
>
> **Ergänzt:** `erteilt_ueber` für den zweiten Weg und `gueltig_bis` als Antwort auf das
> Widerrufsproblem aus Abschnitt 3.
>
> **Ergänzt in v0.3 — der Nachweis des Vertretungsfalls.** Die vorige Fassung hielt fest,
> *dass* eingewilligt wurde, aber nicht, **wer erklärt hat**. Bei den Fragen 5 bis 7 ist das
> die einzige Angabe, die zählt: Ohne sie ist der Nachweis nach Art. 7 Abs. 1 im
> Vertretungsfall nicht führbar, und Einwilligung, Vertretungsmacht und Portalberechtigung
> lassen sich im Schema nicht auseinanderhalten.
>
> **Geändert in v0.3 — kein `on delete cascade`.** Ein Löschverlangen nach Art. 17 hätte den
> Beleg für eine Verarbeitung vernichtet, die stattgefunden hat. Die Nachweiszeile läuft
> deshalb ohne Fallbezug weiter, gebunden nur an einen Hashwert. Der Zielkonflikt zwischen
> Art. 17 und Art. 5 Abs. 2 ist damit entschieden — er gehört so ins Löschkonzept und auf die
> Vorlage.
>
> **Entfernt in v0.3 — `zone2_braucht_beleg`.** Die Bedingung verdrahtete die Papierform,
> obwohl Abschnitt 3 die Formfrage ausdrücklich als offen führt und verlangt, sie zu
> beantworten, *bevor gebaut wird*. Sie kommt zurück, wenn die Antwort da ist.

### B. Zugriffe protokollieren

```sql
create table zugriffs_protokoll (
    id            uuid primary key default gen_random_uuid(),
    mitglied_id   uuid not null references mitglieder(id),
    case_id       uuid not null references cases(id) on delete cascade,
    handlung      text not null,   -- 'fall_gelesen', 'modul_geschrieben', 'brief_erstellt', …
    bereich       text,            -- welcher Teil der Akte; für Auskunft nach Art. 15
    zeitpunkt     timestamptz not null default now()
);
```

**Offen und für #105 vorzumerken:** Wie lange werden diese Zeilen aufbewahrt? Ein Protokoll
ohne Löschregel wächst unbegrenzt und wird selbst zum Datenbestand. Kriterium AV_2.6 verlangt,
dass das Löschkonzept auch Protokolldaten erfasst.

### C. Zugriffsregeln

Die Regel auf `cases` erlaubt Zugriff nur, wenn für die Organisation des Mitglieds eine aktive,
nicht widerrufene und nicht abgelaufene Freigabe besteht — **und** die Rolle des Mitglieds die
Handlung deckt (Abschnitt 5).

Für den Bestand dieses Projekts gilt dabei, was bereits eingeführt ist: Funktionen mit
`security definer` bekommen ein gesetztes `search_path`, und Rechte werden auf `service_role`
beschränkt. Der `SUPABASE_SERVICE_ROLE_KEY` bleibt serverseitig.

---

## 7. Was der Datenschutzbeauftragten vorgelegt wird

**Die Argumentation:**

- In **Zone 1** ist der Pflegedienst reiner Empfänger. Rechtsgrundlage: Einwilligung.
- In **Zone 2** handelt er als Stellvertreter. Rechtsgrundlage: Einwilligung und Vollmacht.
- **Zone 3** — eigene Aufzeichnungen des Dienstes — bleibt in der ersten Auslieferung
  ausgeklammert (Entscheidung vom 29.08.2026).

**Die Schlussfolgerung — und sie ist eine Annahme, keine Feststellung:**

> Da der Pflegedienst keine eigenen Aufzeichnungen führt, bleibt die betroffene Person
> Verantwortliche für die Akte.

v0.1 führte diesen Satz als „Ergebnis". Er ist die **tragende, ungeprüfte These des gesamten
Entwurfs**. Hält sie nicht, rückt Zone 2 in Zone 3, und der Vertragsapparat nach Art. 28 wird
sofort erforderlich — mit jedem Pflegedienst einzeln.

**Und die These ist zu grob geschnitten.** Eine frühere Fassung schrieb, der Dienst „bestimme
die Zwecke der Verarbeitung nicht". Das ist als Pauschalaussage nicht haltbar: Nach den
Leitlinien 07/2020 des Europäischen Datenschutzausschusses ist Verantwortlichkeit
**vorgangsbezogen** zu bestimmen — maßgeblich ist, wer Zwecke und **wesentliche** Mittel
festlegt. Wenn ein Dienst Modulwerte zur Vorbereitung einer Begutachtung liest, verfolgt er
dabei durchaus einen eigenen Zweck.

Die Zonen 1 bis 3 sind für den ersten Zugriff eine brauchbare Ordnung, aber sie sind **keine
Rollenzuweisung**. Vier Aufgaben sind nicht vier Verarbeitungsvorgänge, sondern eher zehn. Die
Vorlage an die Datenschutzbeauftragte enthält deshalb eine Matrix je Vorgang statt einer
Aussage je Zone.

**Freiwilligkeit hat eine technische Bedingung.** Der Einwilligungstext sagt zu: „Das Portal
funktioniert für Sie genauso, wenn Sie nichts freigeben." Das ist nur wahr, solange die
Freischaltung des Falls **nicht** an der Lizenz des Pflegedienstes hängt. Andernfalls kostet
ein Widerruf den Zugang zu Funktionen, und die Einwilligung ist nicht mehr freiwillig im Sinne
des Art. 7 Abs. 4 DSGVO. Das gilt für den Widerruf ebenso wie für das Auslaufen der Lizenz.

**Eine dritte Möglichkeit, die v0.1 nicht kannte:** Der Kriterienkatalog stellt fest, dass
**gemeinsame Verantwortung nach Art. 26 DSGVO für digitale Pflegeanwendungen ausdrücklich
zulässig ist** (CTRL_4.1). Damit gibt es neben „Person allein verantwortlich" und „Portal wird
Auftragsverarbeiter" einen dritten Weg. Sein Preis steht im Katalog: Jeder Verantwortliche
führt eine eigene Folgenabschätzung einschließlich der Schnittstellen zum jeweils anderen und
ein eigenes Verarbeitungsverzeichnis.

Umgekehrt gilt: Für **jede** Auftragsverarbeitung muss belegt werden, dass sie *keine*
gemeinsame Verantwortung ist (AV_2.4 a). Die Einordnung ist zu belegen, nicht zu behaupten.

**Die vier Fragen, um die es in der Vorlage geht:**

1. Trägt die These oben — bleibt die betroffene Person auch bei Zone 2 alleinige
   Verantwortliche?
2. Welche Form braucht die Vollmacht: Bestätigung im Portal oder Unterschrift auf Papier?
3. Genügt beim zweiten Weg (Abschnitt 4) eine Einwilligung auf Papier vor der Erfassung?
4. Wie lange dürfen Einwilligungs- und Zugriffsprotokolle aufbewahrt werden?

Der Nutzen einer positiven Antwort ist erheblich: Kein Auftragsverarbeitungsvertrag mit jedem
einzelnen Pflegedienst zum Start. Genau deshalb darf die Antwort nicht vorweggenommen werden.
