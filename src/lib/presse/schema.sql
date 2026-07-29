-- src/lib/presse/schema.sql
-- Presseportal: Datenmodell für Pressemitteilungen (Feature #64).
-- Von der UI entkoppelt; die Redaktion pflegt Inhalte über das
-- Supabase-Dashboard. Im Supabase-SQL-Editor ausführen. Idempotent.

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  locale        text not null default 'de',
  title         text not null,
  slug          text not null,
  subtitle      text,
  summary       text,
  content       jsonb,
  content_html  text,
  category      text not null,
  seo_meta      jsonb,
  status        text not null default 'draft',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Volltext-Index über die redaktionell sichtbaren Felder. GENERATED hält
  -- den Vektor automatisch synchron (kein Trigger nötig). 'german' liefert
  -- Stemming für die aktuell deutschsprachigen Inhalte.
  search_vector tsvector generated always as (
    to_tsvector(
      'german',
      coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(summary, '')
    )
  ) stored
);

-- Slug ist pro Sprache eindeutig (dieselbe Meldung kann je Locale denselben
-- Slug tragen, aber innerhalb einer Sprache nicht doppelt vorkommen).
create unique index if not exists posts_slug_locale_key on public.posts (slug, locale);

-- Erlaubte Statuswerte und Kategorien als CHECK — schützt vor Tippfehlern
-- auch bei direkter Pflege im Dashboard.
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check
  check (status in ('draft', 'review', 'published', 'archived'));

alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check
  check (category in ('produktlaunch', 'recht', 'statistik', 'migration'));

-- Indizes für die häufigen Zugriffsmuster (Liste, Filter, Suche).
create index if not exists posts_search_idx on public.posts using gin (search_vector);
create index if not exists posts_published_idx
  on public.posts (locale, category, published_at desc)
  where status = 'published';

comment on table public.posts is
  'Pressemitteilungen des Presseportals. Öffentlich lesbar nur im Status published (siehe RLS).';

-- ---------------------------------------------------------------------------
-- Row Level Security: öffentlich nur veröffentlichte Beiträge
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;

-- Anonyme/öffentliche Leser sehen ausschließlich published — Entwürfe,
-- Review und Archiv bleiben verborgen, selbst mit dem Anon-Key.
drop policy if exists "posts_public_read_published" on public.posts;
create policy "posts_public_read_published"
  on public.posts for select
  using (status = 'published');

-- ---------------------------------------------------------------------------
-- Seed: die bisherigen Mock-Meldungen (beispielMeldungen)
-- ---------------------------------------------------------------------------
insert into public.posts (locale, title, slug, subtitle, summary, category, status, published_at)
values
  (
    'de',
    'Neues Entlastungsbudget 2026: Was Angehörige jetzt wissen müssen',
    'entlastungsbudget-2026',
    'Zusammenlegung von Verhinderungs- und Kurzzeitpflege',
    'Das lange erwartete gemeinsame Entlastungsbudget ist da. Der PflegeNavigator EU berechnet ab sofort automatisch Ihre neuen, flexibleren Budgets für die häusliche Pflege.',
    'recht',
    'published',
    '2026-06-02'
  ),
  (
    'de',
    'Pflegekraftmangel: Digitale Fast-Lanes für ausländische Fachkräfte',
    'digitale-fast-lanes-fachkraefte',
    'Wie Bürokratieabbau die Anerkennung beschleunigt',
    'Neue gesetzliche Regelungen zur Fachkräfteeinwanderung greifen. Wir zeigen, wie Pflegedienste den Anerkennungsprozess durch digitale Dokumentenprüfung nun in Wochen statt Monaten abschließen.',
    'migration',
    'published',
    '2026-05-15'
  ),
  (
    'de',
    'PflegeNavigator EU startet europaweite Beta-Phase',
    'europaweite-beta-phase',
    'Barrierefreier Pflegegrad-Rechner in 35 Sprachen',
    'Pflegeberatung ohne Sprachbarrieren: Unser KI-gestütztes Portal ermöglicht Angehörigen erstmals eine fundierte Vorbereitung auf den MDK-Besuch in ihrer Muttersprache.',
    'produktlaunch',
    'published',
    '2026-04-27'
  ),
  (
    'de',
    'KI im Pflegealltag: 80% Zeitersparnis bei der Dokumentation',
    'ki-zeitersparnis-dokumentation',
    'Aktuelle Nutzerstatistiken unseres Pflege-Tagebuchs',
    'Eine Auswertung von über 10.000 anonymisierten Nutzerprofilen zeigt: Automatisierte Sprach-zu-Text-Tagebücher senken den Stresslevel pflegender Angehöriger messbar.',
    'statistik',
    'published',
    '2026-03-10'
  )
on conflict (slug, locale) do nothing;
