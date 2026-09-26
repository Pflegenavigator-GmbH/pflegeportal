# PflegeNavigator EU

Digitaler Begleiter durch die Pflegebegutachtung nach SGB XI. Die Plattform
führt Betroffene und Angehörige durch die sechs Begutachtungsmodule des
Medizinischen Dienstes, ermittelt den voraussichtlichen Pflegegrad, überwacht
die Widerspruchsfristen und erzeugt fertige Dokumente zum Einreichen.

> **Status:** Beta. Die Anwendung ersetzt keine Rechts- oder Pflegeberatung;
> alle Ergebnisse sind Einschätzungen auf Basis der Begutachtungs-Richtlinie.

## Funktionsumfang

| Bereich | Beschreibung |
| --- | --- |
| **Pflegegrad-Ermittlung** | Module 1–6 inkl. Kinder-Sonderregeln, gewichtete Punkteberechnung, serverseitig als Single Source of Truth |
| **Fristen-Monitor** | Widerspruchs- und Wartefristen mit visueller Ampel, Feiertagsberechnung, Eilantrags-Hinweis (§ 84 Abs. 1 SGG, § 87 Abs. 1 SGG, § 25 SGB X) |
| **Widerspruch** | Begründeter Schreibentwurf; Vorschau frei zugänglich, Speichern/Gutachten-Vorschau/Download hinter der Bezahlschranke |
| **Pflegetagebuch** | Dokumentation des Hilfebedarfs als Nachweis gegenüber dem MD |
| **PDF-Erzeugung** | Serverseitig via Puppeteer, auf Vercel mit `@sparticuz/chromium` |
| **Presseportal** | Redaktionelles CMS auf PostgreSQL mit Volltextsuche, ISR und On-Demand-Revalidierung |
| **Reichweitenmessung** | Umami (EU, cookiefrei) — lädt ausschließlich nach Einwilligung, Widerruf wirkt sofort |
| **Barrierefreiheit** | Kontrastmodus, Schriftgrößen, Bewegungsreduktion; WCAG 2.2 AA als Zielmaß |

## Technischer Stack

- **Next.js 16** (App Router, React Server Components) · **TypeScript** (strict)
- **Supabase** (PostgreSQL, Row Level Security) · **Stripe** (Zahlungen)
- **next-intl** (Mehrsprachigkeit DE/EN) · **Tailwind CSS 4** + CSS-Module
- **Upstash Redis** (Edge-Rate-Limit und öffentlicher Cache)
- **Vitest** (Unit) · **Playwright** (E2E)

> ⚠️ **Diese Next.js-Version weicht von älteren Konventionen ab.** Die
> Middleware liegt in `src/proxy.ts` statt `middleware.ts`. Vor Änderungen an
> Framework-APIs bitte `node_modules/next/dist/docs/` konsultieren — siehe
> `AGENTS.md`.

## Schnellstart

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Die Anwendung läuft anschließend auf http://localhost:3000 und leitet auf die
Standardsprache (`/de`) um.

### Umgebungsvariablen

Alle Variablen sind in `.env.example` dokumentiert. Pflicht sind Supabase,
Stripe und Brevo; Upstash, der Puppeteer-Pfad und `REVALIDATE_SECRET` sind
optional und degradieren sauber, wenn sie fehlen.

🔐 **`SUPABASE_SERVICE_ROLE_KEY` umgeht die Row Level Security und darf
ausschließlich serverseitig verwendet werden** — niemals mit `NEXT_PUBLIC_`
präfixen, nie in Client Components importieren.

### Datenbank

Die Schemata liegen als SQL im Repository und werden im Supabase-SQL-Editor
ausgeführt:

| Datei | Inhalt |
| --- | --- |
| `src/lib/presse/schema.sql` | `posts`-Tabelle, RLS-Policies, `tsvector`-Suchindex |
| `src/lib/widerspruch/bescheid-datum.sql` | Spalte `bescheid_datum` an `cases` |
| `src/lib/monitoring/supabase-monitoring-functions.sql` | Monitoring-Funktionen |

## Skripte

```bash
npm run dev            # Entwicklungsserver
npm run build          # Produktions-Build
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run format:check   # Prettier prüfen (format:fix korrigiert)
npm test               # Vitest
npm run test:e2e       # Playwright
```

## Projektstruktur

```
src/
├── app/[locale]/      Seiten (App Router, mehrsprachig)
├── app/api/           Route Handler
├── components/        UI, nach Domäne gegliedert
├── lib/               Fachlogik, frei von React
│   ├── analytics/     Reichweitenmessung    → README.md
│   ├── billing/       Freischaltung & Stripe-Anbindung
│   ├── pdf/           PDF-Erzeugung        → README.md
│   ├── presse/        Presse-CMS           → README.md
│   ├── redis/         Edge-Cache & Limits  → README.md
│   └── widerspruch/   Fristen & Schreiben
├── styles/            CSS-Module
├── i18n/              next-intl-Konfiguration
└── proxy.ts           Middleware (Rate-Limit, Cache, Locale-Routing)
```

Fachlogik gehört nach `src/lib/` und bleibt dort frei von React-Abhängigkeiten
— das hält sie testbar und wiederverwendbar. Die oben markierten Unterordner
haben eigene READMEs mit Details und Betriebshinweisen.

## Qualitätssicherung

Jeder Pull Request auf `main` oder `develop` durchläuft `.github/workflows/`:

| Workflow | Prüfung |
| --- | --- |
| **CI → Lint, Format & Typecheck** | ESLint, Prettier, TypeScript |
| **CI → Tests** | Vitest |
| **CI → Build** | Produktions-Build |
| **CI → Security** | Snyk Open Source (Abhängigkeiten), blockierend ab High; `npm audit` als Gegenprobe |
| **CI → Secret Scanning** | Gitleaks über die gesamte Git-History, blockierend |
| **CI → Trivy** | Dateisystem- und Konfigurations-Scan, blockierend ab High |
| **CI → E2E Smoke Tests** | Playwright gegen den Produktions-Build (Chromium), blockierend |
| **CI → Bundle Size Guard** | PR-Kommentar bei wachsendem Client-Bundle, nicht blockierend |
| **CodeQL** | Statische Analyse des eigenen Codes (`security-extended`), blockierend |
| **Branch-Restrictions** | Schutz der Zielbranches |

Alle acht Jobs laufen **parallel** (keine `needs`-Abhängigkeiten); die
Gesamtlaufzeit richtet sich nach dem langsamsten, nicht nach der Summe.
Playwright ist auf der CI bewusst auf Chromium und wenige, breite Tests
beschränkt — die Feinprüfung leistet Vitest.

Der Security-Job benötigt das Repository-Secret **`SNYK_TOKEN`**
(Snyk → Account Settings → Auth Token).

Die beiden Sicherheitsprüfungen ergänzen sich und ersetzen einander nicht:
**Snyk** prüft die Abhängigkeiten, **CodeQL** den eigenen Quelltext. Auf
öffentlichen Repositories ist CodeQL kostenlos; wird das Repository privat
gestellt, braucht es GitHub Advanced Security — der Ersatz wäre dann Snyk Code
(siehe Kommentar im CI-Workflow).

Die Sicherheitslage, bewusst akzeptierte Befunde und deren Begründung stehen in
[`SECURITY.md`](SECURITY.md).

## Deployment

Derzeit läuft die Anwendung auf **Vercel**; Ziel ist ein eigener Server mit
Containern (ADR-0003, #177/#178). Beide Wege nutzen denselben Build:
`output: "standalone"` in `next.config.ts`. Sicherheits-Header samt Content
Security Policy setzt ebenfalls `next.config.ts`.

Chromium für die PDF-Erzeugung kommt je nach Umgebung aus einer anderen Quelle
— im Container als Systempaket, auf Vercel über `@sparticuz/chromium`
(`src/lib/pdf/puppeteer.ts`, `src/lib/pdf/README.md`).

Einmalig einzurichten:

1. Umgebungsvariablen hinterlegen (siehe `.env.example` bzw.
   `.env.container.example`).
2. Stripe-Webhook auf `/api/stripe/webhook` zeigen lassen.
3. Supabase Database Webhook auf `posts` → `/api/revalidate` (Presseportal).

### Container

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=… \
  --build-arg NEXT_PUBLIC_URL=https://pflegenavigator.example \
  -t pflegeportal:lokal .
```

Die Werte mit dem Präfix `NEXT_PUBLIC_` müssen beim **Bauen** vorliegen: Next
schreibt sie ins Browser-Bündel. Alles andere — Supabase-Service-Key, Pepper,
Stripe — kommt erst beim **Start** aus `.env.container` und steht nie im Abbild.

```bash
cp .env.container.example .env.container   # ausfüllen
docker compose --env-file .env.container up -d
```

Öffentlich erreichbar ist allein Caddy. Anwendung und Valkey haben keinen
veröffentlichten Port.

| Endpunkt | Frage | Wer fragt |
| --- | --- | --- |
| `/api/live` | Läuft der Prozess? | der Container selbst (`HEALTHCHECK`) |
| `/api/health` | Kann er auch arbeiten? | die Auslieferung, danach die Beobachtung |

`/api/health` prüft die Datenbank und meldet den Zustand des Ratenspeichers.
Caddy gibt den Endpunkt nach außen **nicht** frei — die Auskunft, dass die
Ratenbegrenzung gerade nur prozesslokal wirkt, hilft niemandem außer jemandem,
der Fallcodes durchprobiert.

Gemessen auf einem Testlauf des Abbilds (12-seitiges PDF):

| | Speicher |
| --- | --- |
| Leerlauf | 48 MB |
| eine PDF-Erzeugung | 578 MB in der Spitze |
| zwei gleichzeitig | 749 MB in der Spitze |

Deshalb steht `PDF_MAX_PARALLEL` auf 1: Jede Erzeugung startet eine eigene
Chromium-Instanz, und auf 2 GB RAM teilen sich alle denselben Speicher.
Wartende Anfragen stehen in einer kurzen Schlange
(`src/lib/pdf/warteschlange.ts`).

## Lizenz

Proprietär. Alle Rechte vorbehalten.
