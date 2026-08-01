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
| **CodeQL** | Statische Analyse des eigenen Codes (`security-extended`), blockierend |
| **Branch-Restrictions** | Schutz der Zielbranches |

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

Ziel ist **Vercel**. Der Build läuft als `output: "standalone"`; Chromium wird
in der Serverless-Umgebung automatisch über `@sparticuz/chromium` aufgelöst
(siehe `src/lib/pdf/README.md`). Sicherheits-Header samt Content Security
Policy setzt `next.config.ts`.

Einmalig einzurichten:

1. Umgebungsvariablen in Vercel hinterlegen (siehe `.env.example`).
2. Stripe-Webhook auf `/api/stripe/webhook` zeigen lassen.
3. Supabase Database Webhook auf `posts` → `/api/revalidate` (Presseportal).

## Lizenz

Proprietär. Alle Rechte vorbehalten.
