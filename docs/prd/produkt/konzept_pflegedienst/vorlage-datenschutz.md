# Vorlage an die Datenschutzbeauftragte

**PflegeNavigator EU** · Fassung v0.3 · 29.08.2026 · zur Übergabe

> **v0.3** — Verweise auf das Zugangskonzept nachgezogen (dort steht die Rollenmatrix jetzt
> ebenfalls, als Abschnitt 3).
>
> **v0.2** — nach fachlicher Rückmeldung:
> Frage 1 ist neu gefasst (vorgangsbezogen statt zonenbezogen) und um eine Matrix ergänzt;
> vier Fragen sind hinzugekommen (14 bis 17); die Aufbewahrungsfristen kommen jetzt als
> **ausgefüllter Vorschlag** statt als offene Bitte; § 203 StGB ist als eigener Punkt
> aufgenommen.

Zwanzig Fragen. Die erste trägt alle anderen; die Punkte 18 und 19 kommen zeitlich zuerst.

**Mitzugeben:**

| Unterlage | Wo |
|---|---|
| Zugangskonzept für Pflegedienste, v0.3 (11 Seiten) | `grant-docs` → `07_Architekturentscheidungen/Compliance/Zugangskonzept/` |
| Entwurf Einwilligung und Vollmacht, v0.3 | `pflegeportal` → `docs/prd/produkt/konzept_pflegedienst/einwilligung-entwurf.md` |
| Laufendes Ticket mit Verlauf | Issue #105 |

**Kurz zum Vorhaben:** Ein Pflegedienst soll mit den Akten seiner Patientinnen arbeiten können.
Der Entwurf ordnet die Tätigkeiten in drei Zonen — Einsicht, Handeln im Namen der Person,
eigene Dokumentation. Zone 3 ist aus der ersten Auslieferung ausgenommen.

---

## A · Die tragende Frage

**1. Welche Rolle hat jeder Beteiligte bei den einzelnen Verarbeitungsvorgängen?**

Für welche Vorgänge ist der Pflegedienst eigener Verantwortlicher, für welche verarbeitet der
Portalbetreiber weisungsgebunden, und gibt es Vorgänge mit gemeinsamer Festlegung von Zwecken
und wesentlichen Mitteln?

> **Warum die Frage so und nicht anders gestellt ist.** Eine frühere Fassung fragte, ob „die
> betroffene Person in Zone 2 alleinige Verantwortliche bleibt". Das war zu grob. Nach den
> Leitlinien 07/2020 des Europäischen Datenschutzausschusses ist Verantwortlichkeit
> **vorgangsbezogen** zu bestimmen; maßgeblich ist, wer Zwecke und **wesentliche** Mittel
> festlegt. Die technische Ausgestaltung allein macht niemanden zum gemeinsam Verantwortlichen.
>
> Die Zonen sind eine brauchbare erste Ordnung, aber keine Rollenzuweisung. Die vier Aufgaben
> eines Pflegedienstes sind nicht vier Verarbeitungsvorgänge, sondern eher zehn.

**Die Matrix, ausgefüllt soweit wir sie belegen können.** Die Spalte *erwartete Rolle* ist
unsere Einschätzung, nicht das Ergebnis.

| Vorgang | Zweck gesetzt von | Wesentliche Mittel | Erwartete Rolle |
|---|---|---|---|
| Person füllt den Fragebogen aus | Person | Portal | Portal eigenverantwortlich, Art. 9 Abs. 2 lit. a |
| Übermittlung an den freigegebenen Dienst | Person | Portal (Freigabemechanik) | Portal eigenverantwortlich; Dienst wird eigener Verantwortlicher für das Empfangene |
| Dienst liest Modulwerte zur Vorbereitung der Begutachtung | Dienst | Dienst | Dienst eigenverantwortlich; Portal ohne eigenen Zweck — Weisungsgebundenheit zu prüfen |
| **Dienst erfasst beim Erstbesuch (Weg B)** | Dienst | Dienst **und** Portal | **offen — der schwierigste Eintrag** |
| **Widerspruchsentwurf mit Modulwerten** | Dienst | Portal (Generator, Fristenlogik, Textbausteine) | **offen — hier ist Art. 26 ernsthaft zu erwägen** |
| Zugriffsprotokollierung | Portal (Rechenschaftspflicht) | Portal | Portal eigenverantwortlich |

**Zur vorletzten Zeile:** Wenn das Portal Fristen berechnet, Textbausteine vorgibt und später
ein Sprachmodell die Begründung formuliert, legt es mehr fest als nur technische Mittel. Das
ist ein Argument, kein Ergebnis — aber es ist der Vorgang, an dem die Prüfung ansetzen sollte.

**Bitte:** Erst die Rollen je Vorgang bestimmen, dann die Vertragsarchitektur. Ein Vertragswerk
mit getrennten Modulen **je Verarbeitungsvorgang** bleibt möglich; offengelassene Rollen für
denselben Vorgang nicht.

---

## B · Einwilligung und Vertretung

**2. Wortlaut der Einwilligung je Zone.** Getrennt ansteuerbar, freiwillig, widerruflich, in
verständlicher Sprache. Ein Entwurf liegt bei.

**3. Form der Vollmacht für Zone 2.** Genügt eine Bestätigung im Portal, oder braucht es ein
unterschriebenes Dokument?
*Warum es zählt:* Papier erzwingt ein Upload-Verfahren und ist eine Hürde für die Zielgruppe.
Der Entwurf schlägt Papier vor, weil Sozialleistungsträger im Widerspruchsverfahren häufig eine
unterschriebene Vollmacht verlangen.

**4. Einwilligung, wenn der Dienst die Akte anlegt.** Der Erstbesuch findet in der Wohnung
statt; die Pflegekraft verarbeitet Gesundheitsdaten, bevor im Portal eingewilligt sein kann.
Vorgeschlagen: unterschriebene Einwilligung auf Papier zuerst, dann Erfassung, Beleg
hinterlegt. Genügt das?

**5. Drei Ebenen sauber trennen.** Der Entwurf unterscheidet neuerdings:

| Fall | Was vorliegt |
|---|---|
| Person füllt selbst aus | Einwilligung der betroffenen Person |
| Jemand **hilft** beim Ausfüllen, die Person weiß davon und ist einverstanden | weiterhin Einwilligung der betroffenen Person; die helfende Person tritt nicht als Vertreterin auf |
| Jemand handelt **für** eine Person, die das nicht selbst kann | Vertretung: Vollmacht oder rechtliche Betreuung |

Trägt diese Dreiteilung? Insbesondere: Genügt in der mittleren Zeile die Einwilligung der
betroffenen Person, ohne dass ein Vertretungsverhältnis konstruiert werden muss?

**6. Untervollmacht.** Eine Angehörige hat die Akte angelegt und erteilt nun die Freigabe an
den Pflegedienst — eine Vertreterin bevollmächtigt eine zweite. Trägt das, und unter welchen
Voraussetzungen?

**7. Rechtliche Betreuung.** Bei häuslich versorgten, oft hochbetagten Menschen häufig. Eine
Betreuerin handelt kraft gerichtlicher Bestellung, nicht kraft Erklärung der betroffenen
Person — das übrige Verfahren setzt aber durchgehend auf eine Erklärung auf.

- Wie wird die Bestellung nachgewiesen? Genügt ein Upload des Betreuerausweises?
- Welcher Aufgabenkreis deckt die Nutzung, und muss er geprüft werden?
- Wer kann widerrufen?
- **§ 1825 BGB (Einwilligungsvorbehalt):** Wir gehen davon aus, dass dieser Fall nicht technisch
  gelöst, sondern erkannt und aus dem Verfahren genommen wird. Ist das richtig?

**8. Widerruf einer Vollmacht.** Formfrei außerhalb des Systems widerruflich — der
BfArM-Kriterienkatalog stellt jedoch fest, dass im pseudonymen Modell „der Widerruf einer
Einwilligung durch einen berechtigten Vertreter … technisch nicht umsetzbar" ist (Erläuterung
zu CNST_1.4). Vorgeschlagen ist eine befristete Freigabe, die aktiv verlängert werden muss.
Trägt diese Konstruktion?

**9. Zustimmung zu den Nutzungsbedingungen.** Wird heute nirgends eingeholt. Getrennt von der
Einwilligung zu erheben (CNST_1.2 verbietet die Bündelung) — und wie sieht sie im
Vertretungsfall aus?

**10. Informationspflichten nach Art. 13 und 14.** Wenn der Dienst Daten erhebt und das Portal
sie verarbeitet, entstehen Informationspflichten auf beiden Seiten. Sie bleiben beim jeweiligen
Verantwortlichen; ein Merkblatt, das der Dienst aushändigt, ist für uns kein Nachweis. Wie ist
die Aufteilung zu gestalten und zu belegen?

---

## C · Rechtsgrundlagen und Strafrecht

**11. § 203 StGB — nach unserer Einschätzung der Regelfall.**

Ein nach § 72 SGB XI zugelassener Dienst muss eine verantwortliche Pflegefachkraft vorhalten;
die Pflegefachfrau und der Pflegefachmann nach PflBG sind Angehörige eines Heilberufs mit
staatlich geregelter Ausbildung im Sinne von § 203 Abs. 1 Nr. 1 StGB. Zu prüfen ist daher
**wer im konkreten Fall offenbart** — eine Hauswirtschaftshelferin ist keine
Geheimnisträgerin —, nicht *ob* das Thema besteht.

Wir planen deshalb, das Portal als sonstige mitwirkende Stelle zu behandeln und die
Verpflichtung nach § 203 Abs. 3 S. 2 und Abs. 4 StGB in das Onboarding jeder Organisation
aufzunehmen. Sie nachträglich einzuziehen wäre teurer, als sie mitzunehmen.
**Bitte um Bestätigung oder Korrektur.**

**12. Art. 9 Abs. 2 lit. h DSGVO für Zone 3.** Der Entwurf nennt diese Grundlage für die
spätere eigene Dokumentation des Dienstes. Uns ist bewusst, dass sie nur bei Vorliegen der
Voraussetzungen einschließlich Art. 9 Abs. 3 greift und dass Art. 6 getrennt zu bestimmen ist.
**Wir bitten um Prüfung, nicht um Bestätigung.**

**13. Freiwilligkeit und Lizenzkopplung.** Wenn die Lizenz eines Pflegedienstes den Fall
freischaltet, kostet ein Widerruf der Freigabe den Zugang zu Funktionen — die Einwilligung wäre
dann nicht mehr freiwillig nach Art. 7 Abs. 4 DSGVO. Der Einwilligungstext sagt ausdrücklich
zu, das Portal funktioniere auch ohne Freigabe. Wir halten die Kopplung deshalb für
ausgeschlossen. **Bestätigung erbeten**, weil davon das Abrechnungsmodell abhängt.

---

## D · Nachweis, Aufbewahrung, Zugriff

**14. Aufbewahrungsfristen.** Der methodische Grundsatz ist uns klar: je Kategorie Zweck,
Fristbeginn und Löschregel. Damit die Frage nicht unbeantwortet zurückkommt, hier ein
**ausgefüllter Vorschlag** — als Vorschlag gekennzeichnet, nicht als Rechtsauffassung.

| Kategorie | Zweck der Aufbewahrung | Fristbeginn | Vorschlag |
|---|---|---|---|
| Einwilligungsnachweis | Art. 7 Abs. 1, Rechenschaft | Widerruf oder Ende der Freigabe | 3 Jahre |
| Vollmachts- bzw. Betreuungsbeleg | Nachweis der Vertretungsmacht | Ende der Vertretung | 3 Jahre |
| Freigabe (aktiv/widerrufen) | Nachvollziehbarkeit des Zugriffs | Widerruf oder Ablauf | 3 Jahre |
| Zugriffsprotokoll | Art. 5 Abs. 2, Missbrauchserkennung | Eintrag | 12 Monate |
| Fallakte selbst | Zweck der Verarbeitung | letzte Aktivität | offen — abhängig von Frage 1 |
| Zahlungsdaten | handels- und steuerrechtlich | Ende des Geschäftsjahres | gesetzliche Fristen |

**Der Zielkonflikt, den wir bereits entschieden haben und der bestätigt werden muss:** Der
Einwilligungsnachweis darf **nicht** mit dem Fall gelöscht werden. Andernfalls vernichtet ein
Löschverlangen nach Art. 17 den Beleg für eine Verarbeitung, die stattgefunden hat (Art. 5
Abs. 2). Die Nachweiszeile läuft deshalb ohne Fallbezug weiter, gebunden nur an einen Hashwert.

**15. Darf die Fallübersicht eines Pflegedienstes Gesundheitsbezug haben?**
Vorgesehen ist: nur der Verfahrensstand; Werte, Tagebucheinträge und Pflegegrad erst nach dem
Öffnen eines einzelnen Falls und nur für berechtigte Rollen.
*Hinweis:* Uns ist bewusst, dass auch der bloße Verfahrensstand gesundheitsbezogen ist — dass
eine benennbare Person ein laufendes Pflegegradverfahren hat, sagt etwas über ihren Zustand.
Die Zusage lautet deshalb nicht „keine Gesundheitsdaten", sondern **kein über das für die
Arbeitssteuerung unvermeidbare Minimum hinausgehender Gesundheitsbezug**. Trägt das?

**16. Verwaltungszugang auf unserer Seite.** Der Zugang, mit dem wir Nutzenden bei Störungen
helfen, kann Gesundheitsdaten erreichen. Wir gehen von folgendem Rahmen aus: kein
Dauerzugriff, sondern anlassbezogene Freischaltung mit Grundangabe, Protokoll und
automatischem Ablauf. **Bestätigung oder Korrektur erbeten.**

**17. Benachrichtigung nach Art. 34 im pseudonymen Modell.** Wir verfügen über keine
Kontaktdaten der betroffenen Personen. Im Fall einer Datenschutzverletzung mit hohem Risiko
dürfte nur Art. 34 Abs. 3 lit. c gangbar sein — öffentliche Bekanntmachung oder eine ähnlich
wirksame Maßnahme. **Das sollte vorab festgelegt und begründet sein, nicht im Ernstfall
improvisiert.** Wie sollte diese Maßnahme aussehen?

---

## E · Vorab zu klärender Sachverhalt

Zwei Punkte betreffen den **bereits laufenden Betrieb** und sollten vor allen anderen
aufgeklärt werden.

**18. Auf welcher Grundlage steht die Verarbeitung heute?**
Im Portal wird seit Wiederaufnahme des Betriebs mit Modulwerten und Tagebucheinträgen
gearbeitet. Eine Einwilligungsverwaltung existiert nicht — was es gibt, ist ein Cookie-Banner
im Browserspeicher. Damit ist eine Einwilligung nach Art. 9 Abs. 2 lit. a weder eingeholt noch
nachweisbar. Zu klären ist der Sachverhalt, bevor er bewertet wird; erst danach lässt sich
sagen, ob Art. 33 oder 34 überhaupt in Betracht kommen.

**19. Werden heute Fallcodes von Patientinnen durch Pflegekräfte genutzt?**
Das Konzept beschreibt die künftige Freigabe als Ersatz für den „heute geteilten Fallcode".
Falls Pflegekräfte gegenwärtig Fallcodes kennen und nutzen, ist das ein eigener Sachverhalt
nach Art. 32 und gehört mit Punkt 18 zusammen aufgeklärt.

---

## F · Später, aber vorzumerken

**20. Formulierung durch ein Sprachmodell.** Vorgesehen ist, dass eine KI die Schreiben
individuell formuliert und Gesetzestexte einarbeitet. Datenschutzrechtlich zu klären: Rolle
des KI-Anbieters, Kapitel V bei Verarbeitung außerhalb der Union, vertraglicher Ausschluss der
Weiterverwendung zu Trainingszwecken — und ob die Bewertung persönlicher Aspekte den Zuschnitt
der Folgenabschätzung erweitert (Art. 35 Abs. 3 lit. a neben lit. b).

*Zur Einordnung nach der KI-Verordnung liegt eine eigene Prüfung vor; sie kommt zu „kein
Hochrisiko-System", weil Anhang III Nr. 5 lit. a den behördlichen Einsatz voraussetzt.*

---

## G · Bereits geklärt — nur zur Kenntnis

Diese Punkte sind durch den BfArM-Kriterienkatalog beantwortet und brauchen keine erneute
Prüfung.

| Punkt | Antwort | Fundstelle |
|---|---|---|
| Braucht es eine Folgenabschätzung? | Praktisch ja; die Schwellwertanalyse läuft gegen die Liste der Datenschutzkonferenz. Offen ist nur der Zuschnitt. | DSFA_1.1 |
| Ist der pseudonyme Fallcode zulässig? | Er ist vorgesehen — ein pseudonymer Zugang ist verpflichtend. | CNST_1.3 a |
| Müssen Einwilligungen widerrufbar sein? | Ja, aus der Anwendung heraus, jederzeit, verknüpft mit dem pseudonymen Konto. | CNST_1.3 a, CNST_1.4 |
| Gilt für Kinder Besonderes? | Ja: Einwilligungsfähigkeit abfragen, sonst Einwilligung eines Erziehungsberechtigten. | CNST_1.6 a |

---

## H · Nicht für die Datenschutzbeauftragte

Zur Abgrenzung — diese Punkte klären wir selbst:

- **Betriebsort der Verarbeitung** (AV_1.1, AV_1.3): Aufgabe der Systemarchitektur, kann aber
  die Betriebsplattform betreffen.
- **Ambulant, stationär oder Krankenhaus:** Der Entwurf gilt für den zugelassenen ambulanten
  Dienst; andere Einrichtungsarten brauchen später eine eigene Prüfung.
- **Barrierefreiheit nach dem BFSG:** Frage an die Geschäftsführung.
- **Erfüllt das Produkt § 40a SGB XI?** Gehört zur Beratung über das BfArM-Verfahren.

---

## Reihenfolge

1. **Sachverhalt im laufenden Betrieb** (Punkte 18 und 19) — bevor irgendetwas bewertet wird.
   Insbesondere keine neue Oberfläche, die eine Vertretung durch bloße Selbsterklärung
   legitimiert.
2. **Rollenmatrix je Verarbeitungsvorgang** (Frage 1) — vor jeder Vertragsarchitektur.
3. **Trennung von Einwilligung, Vertretungsmacht und Portalberechtigung** (Fragen 5 bis 8) —
   bis ins Datenmodell, nicht nur im Text.
4. **Die drei Zusagen, die heute nicht haltbar sind** (Fragen 13 und 15): die Abrechnungsformel
   im Einwilligungstext, das Abnahmekriterium zur Fallübersicht, und die mögliche Kopplung der
   Freischaltung an die Lizenz.
