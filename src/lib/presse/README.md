# Presseportal (CMS)

DB-gestütztes Presseportal (Feature #64). Inhalte liegen in Postgres
(`posts`-Tabelle), das Frontend liest ausschließlich daraus. Die Redaktion
pflegt Meldungen über das **Supabase-Dashboard** — eine eigene Admin-Oberfläche
ist bewusst nicht Teil dieser Story.

## Datenmodell

Schema, Constraints, Volltextindex, RLS und Seed liegen in
[`schema.sql`](schema.sql) — im Supabase-SQL-Editor ausführen (idempotent).

Kernpunkte:

- **`status`** (`draft` | `review` | `published` | `archived`): Nur
  `published` ist öffentlich sichtbar — durchgesetzt per **RLS-Policy**, nicht
  nur in der Query. Selbst mit dem Anon-Key sind Entwürfe unsichtbar.
- **`locale`**: eine Zeile = eine Sprache. Fehlt eine Meldung in der
  Nutzersprache, fällt die Anzeige auf Deutsch zurück (siehe `queries.ts`).
- **`category`**: `produktlaunch` | `recht` | `statistik` | `migration`
  (CHECK-Constraint). Die sichtbaren Labels kommen über i18n
  (`presse.kategorie.*`), nicht aus der DB.
- **`search_vector`**: `GENERATED ALWAYS` aus Titel/Untertitel/Zusammenfassung
  (`german`-Konfiguration, mit GIN-Index). Hält sich automatisch synchron.

## Eine Meldung veröffentlichen

Im Supabase-Dashboard einen `posts`-Eintrag anlegen bzw. `status` auf
`published` setzen und `published_at` füllen. `title`, `slug`, `category`,
`locale` sind Pflicht; `slug` ist pro Sprache eindeutig.

## Lese-Pfad (Code)

| Datei | Zweck |
| --- | --- |
| `src/lib/supabase/public.ts` | cookie-freier Anon-Client (ISR-tauglich, RLS-gebunden) |
| `queries.ts` | `ladeMeldungen()` (Liste), `ladeMeldung()` (Detail), `ladeVeroeffentlichteSlugs()` |
| `kategorien.ts` | Kategorie-Schlüssel + Validierung |
| `src/app/api/presse/route.ts` | öffentliche GET-Such-API für die Live-Suche |
| `src/app/[locale]/presse/page.tsx` | Listen-Seite: Server-Component (ISR), Hero + Sidebar |
| `…/presse/_components/PresseClient.tsx` | Client: Live-Suche + Kategoriefilter |
| `…/presse/[slug]/page.tsx` | Detailseite: Artikel, SEO-Metadaten, 404, ISR |
| `src/styles/presse.module.css` | ausgelagertes Design (kontrastgeprüft, reduced-motion) |

Der Server rendert den Erststand (SEO/ISR); jede Interaktion fragt
`/api/presse` ab (Postgres-Volltextsuche über `search_vector`). Die
Detailseiten werden per `generateStaticParams` vorab statisch erzeugt.

## Design & Barrierefreiheit

- Das Styling liegt in `src/styles/presse.module.css` (kein Inline-Hex im JSX).
- Redaktionelles Light-Design; Farben lokal als Custom Properties.
- **Kontrast:** Das frühere Teal `#20b2aa` failt auf Weiß (2.85:1); für Text
  wird deshalb `#0f766e` genutzt (AA-tauglich). Alle Text-Elemente ≥ 4.5:1.
- **Animationen** (Karten-Auftritt, Hover) stecken vollständig hinter
  `@media (prefers-reduced-motion: reduce)`.
- Semantische Landmarks, Fokus-Indikatoren, Touch-Ziele ≥ 44px.

## Langtext & Sicherheit (`content_html`)

Die Detailseite rendert `content_html` via `dangerouslySetInnerHTML`.
**Vertrauensgrenze:** Der Inhalt stammt ausschließlich aus dem
Supabase-Dashboard — die RLS-Policy lässt öffentlich nur `SELECT` auf
`published` zu, kein öffentliches Schreiben. Solange nur interne Redakteure
schreiben, ist das vertretbar.

⚠️ **Wenn künftig Editor-Rechte an Dritte delegiert werden**, sollte
`content_html` serverseitig sanitisiert werden (z.B. `sanitize-html`), sonst
entsteht ein Stored-XSS-Vektor. Bis dahin bewusst nicht eingebaut (keine
zusätzliche Abhängigkeit ohne Bedarf).

## Caching & ISR

- Die Seite ist statisch mit **stündlicher Revalidierung**
  (`export const revalidate = 3600`).
- **Sofort-Aktualisierung beim Publishing**: `src/app/api/revalidate/route.ts`
  erneuert alle Presse-Sprachseiten on demand. Einrichtung:
  1. `REVALIDATE_SECRET` in Vercel setzen.
  2. In Supabase einen **Database Webhook** auf `posts`
     (INSERT/UPDATE/DELETE) anlegen, Ziel:
     `POST https://<domain>/api/revalidate` mit Header
     `x-revalidate-secret: <REVALIDATE_SECRET>`.
  - Ohne Webhook greift weiterhin die stündliche Baseline. Ohne gesetztes
    Secret ist der Endpunkt deaktiviert (fail-closed).

## i18n

UI-Texte im Namespace `presse` (`public/locales/<locale>/presse.json`,
registriert in `src/i18n/namespaces.json`). Deutsch und Englisch sind gepflegt;
weitere Sprachen greifen über den next-intl-Fallback. Inhalts-Fallback (fehlende
Meldung → Deutsch) ist davon unabhängig und liegt in `queries.ts`.
