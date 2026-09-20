-- 202609170000_case_code_hash_anlegen.sql
--
-- Schritt 1 von 2 für #153 (Phase B von #145): Suchschlüssel neben dem
-- Klartext anlegen. Die Spalte bleibt zunächst NULL-fähig und ohne NOT NULL —
-- gefüllt wird sie vom Backfill aus der Anwendung, weil der Pepper
-- (CASE_CODE_PEPPER) bewusst nicht in PostgreSQL liegt.
--
-- Reihenfolge der Umstellung:
--   1. diese Migration
--   2. node scripts/fallcode-hash-backfill.mjs   (füllt case_code_hash)
--   3. Anwendung deployen (sucht ab dann über case_code_hash)
--   4. 202609170001_case_code_entfernen.sql      (entfernt den Klartext)
--
-- Zwischen 2 und 4 findet die Anwendung Fälle über den Hash, der Klartext
-- steht noch daneben. Bricht etwas, genügt ein Rollback der Anwendung.

begin;

alter table public.cases
  add column if not exists case_code_hash text;

comment on column public.cases.case_code_hash is
  'HMAC-SHA-256(CASE_CODE_PEPPER, normalisierter Fallcode). Einziger Suchschlüssel für den Legacy-Fallcode (#153). Der Pepper liegt im Secret-Management der Anwendung, nicht in der Datenbank.';

-- Eindeutig wie der Klartext zuvor: Zwei Fälle mit demselben Zugangscode darf
-- es nicht geben. Partiell, damit der Index schon vor dem Backfill greift.
create unique index if not exists cases_case_code_hash_key
  on public.cases (case_code_hash)
  where case_code_hash is not null;

-- Der bestehende Suchindex (case_code, billing_status) wird mit dem Klartext
-- entfernt; sein Gegenstück auf dem Hash entsteht hier.
create index if not exists idx_cases_hash_billing_status
  on public.cases (case_code_hash, billing_status);

commit;
