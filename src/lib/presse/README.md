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
| `queries.ts` | `ladeMeldungen()` — published, Locale-Fallback, Volltext, Filter |
| `kategorien.ts` | Kategorie-Schlüssel + Validierung |
| `src/app/api/presse/route.ts` | öffentliche GET-Such-API für die Live-Suche |
| `src/app/[locale]/presse/page.tsx` | Server-Component (ISR), Erststand + Hero + Sidebar |
| `…/presse/_components/PresseClient.tsx` | Client: Live-Suche + Kategoriefilter |

Der Server rendert den Erststand (SEO/ISR); jede Interaktion fragt
`/api/presse` ab (Postgres-Volltextsuche über `search_vector`).

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
