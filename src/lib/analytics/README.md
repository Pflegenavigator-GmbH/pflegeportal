# Web Analytics (Umami)

Anonyme Reichweitenmessung, die **ausschließlich nach Einwilligung** läuft.
Umsetzung von Issue #4.

## Aufbau

| Datei | Zweck |
| --- | --- |
| `events.ts` | Abschließender Katalog der Ereignisse und ihrer erlaubten Eigenschaften |
| `track.ts` | `verfolge()`, `verfolgeEinmalig()`, `verfolgeSeitenaufruf()` — anbieterunabhängig |
| `src/components/analytics/Analytics.tsx` | Lädt das Umami-Skript, meldet Seitenaufrufe |
| `src/lib/consent.ts` | Einwilligung: Zustand, Speicherung, Widerruf |
| `src/hooks/useConsent.ts` | Reaktiver Lesezugriff für Komponenten |

Der Rest der Anwendung kennt nur `verfolge()`. Ein Anbieterwechsel berührt
allein `track.ts` und die Analytics-Komponente.

## Einrichtung

1. In der Umami-Cloud (EU-Region) eine Website anlegen.
2. `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in Vercel setzen (siehe `.env.example`).
3. Ein abweichender Host braucht zusätzlich einen CSP-Eintrag in
   `next.config.ts` (Konstante `UMAMI`).

**Ohne Website-ID bleibt Analytics vollständig inaktiv** — kein Skript, keine
Verbindung, kein Fehler. Das ist der Normalzustand in der Entwicklung.

## Die vier Zusicherungen

Alle vier sind in `track.test.ts` und `consent.test.ts` abgedeckt:

1. **Kein Skript ohne Einwilligung.** Die Analytics-Komponente rendert das
   `<Script>`-Element erst, wenn zugestimmt wurde. Vorher wird nichts geladen
   und keine Verbindung aufgebaut.
2. **Kein Ereignis ohne Einwilligung.** `verfolge()` prüft die Einwilligung bei
   jedem Aufruf erneut. Das ist die zweite Verteidigungslinie: Nach einem
   Widerruf bleibt das geladene Skript im Speicher, wird aber nie wieder
   angesprochen.
3. **Widerruf wirkt sofort.** `useSyncExternalStore` verteilt die Änderung
   ohne Reload — auch über Tabs hinweg (`storage`-Event).
4. **Kein Fallcode in der Messung.** Siehe unten.

## Warum `data-auto-track="false"`

Umamis eingebaute Erfassung meldet die **vollständige URL**. Unsere URLs führen
aber Zugangsdaten mit sich:

```
/de/pflegegrad/start?session_id=cs_live_…&check_code=PF-XXXX-XXXX
/de/pflegegrad/start?case=PF-XXXX-XXXX
```

Der Fallcode ist der Zugangsschlüssel zum Pflegegutachten. Landet er in einem
Analyse-Dienst, kann jeder mit Dashboard-Zugriff fremde Gutachten öffnen — aus
einer Reichweitenmessung würde ein Datenleck.

Deshalb ist die automatische Erfassung abgeschaltet, und
`verfolgeSeitenaufruf()` übergibt nur den Pfad (`pfadOhneParameter`). Der
zweite Grund: Automatische Erfassung liefe nach einem Widerruf bis zum
nächsten Reload weiter.

## Ein Ereignis ergänzen

1. Schlüssel in `EREIGNISSE` (`events.ts`) aufnehmen.
2. Erlaubte Eigenschaften in `EreignisDaten` typisieren.
3. **Datenschutzerklärung ergänzen** (`src/app/[locale]/datenschutz/page.tsx`) —
   dort ist aufgezählt, was erhoben wird. Der Katalog dient als Nachweis der
   Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO).

⚠️ In die Eigenschaften gehören **nie**: Fallcodes, Stripe-Session-IDs, Namen,
E-Mail-Adressen, Postleitzahlen, Modul-Antworten oder sonstige
Gesundheitsdaten. Zulässig ist ausschließlich Kategoriales — Paketname,
Einstiegsart, ja/nein-Flags.

## Rechtliches

- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TTDSG.
- **Widerruf:** Art. 7 Abs. 3 DSGVO — erreichbar über „Cookie-Einstellungen"
  im Footer und auf der Datenschutzseite (`CookieEinstellungenButton`).
- Umami setzt keine Cookies und bildet keine geräteübergreifenden Profile.
- Für die Umami-Cloud ist ein Auftragsverarbeitungsvertrag abzuschließen und
  ins Verarbeitungsverzeichnis aufzunehmen.
