-- 202609190000_case_sessions_anlegen.sql
--
-- Echte Sitzungen statt Fallcode im Cookie (#135, ADR-0002 Lage A).
--
-- Bisher stand im Cookie `pf_case_code` der Fallcode im Klartext. Das war
-- keine Sitzung, sondern eine zweite Kopie des Zugangsmittels: nicht
-- widerrufbar, nicht befristet und vom Zugangsmittel nicht unterscheidbar.
--
-- Gespeichert wird nur die SHA-256-Ableitung des Sitzungsnachweises. Der
-- Nachweis selbst existiert ausschließlich im Cookie des Geräts; ein Abfluss
-- dieser Tabelle gibt niemandem Zugang. Anders als beim Fallcode (#153)
-- braucht es hier keinen Pepper: Der Nachweis hat 256 Bit Entropie und ist
-- nicht zu erraten.

begin;

create table if not exists public.case_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  -- SHA-256 des Sitzungsnachweises, hex. Eindeutig, damit ein Nachweis
  -- niemals zwei Sitzungen trifft.
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- Gesetzt beim Abmelden, Fallwechsel oder Widerruf. Eine widerrufene
  -- Sitzung wirkt sofort nicht mehr, unabhängig von `expires_at`.
  revoked_at timestamptz
);

comment on table public.case_sessions is
  'Gerätesitzungen je Fall (#135). Enthält nur die Ableitung des Sitzungsnachweises, nie den Nachweis selbst und nie den Fallcode.';

-- Alle Sitzungen eines Falls beenden (Widerruf, Löschung).
create index if not exists idx_case_sessions_case on public.case_sessions (case_id);

-- Aufräumen abgelaufener Sitzungen.
create index if not exists idx_case_sessions_expires on public.case_sessions (expires_at);

commit;

-- Hinweis für den Betrieb: Abgelaufene und widerrufene Sitzungen werden nicht
-- automatisch entfernt. Bis es einen geplanten Lauf gibt, genügt gelegentlich:
--
--   delete from public.case_sessions
--   where expires_at < now() - interval '30 days'
--      or revoked_at < now() - interval '30 days';
