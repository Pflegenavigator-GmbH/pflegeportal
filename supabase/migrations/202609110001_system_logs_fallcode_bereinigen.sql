-- Issue #145, Phase A — Fallcodes aus dem Altbestand von system_logs entfernen.
--
-- Der Fallcode ist ein Zugangsmittel. Bis zum 11.09.2026 stand er in
-- system_logs an drei Stellen: in der Spalte case_code, im Meldungstext
-- (NotFoundError, Webhook) und in metadata (Fehlerkontext expectedCode).
-- Seit dem Code-Stand dieses Issues schreibt die Anwendung ihn nicht mehr;
-- diese Migration räumt den Bestand.
--
-- VORAUSSETZUNG: erst einspielen, NACHDEM (a) 202609110000 die Spalte
-- case_id angelegt hat und (b) die Anwendung mit dem Code-Stand von #145
-- Phase A ausgeliefert ist — sonst entstehen parallel neue Einträge.
--
-- BESTAND (Prüfung vom 11.09.2026):
--   system_logs.case_code gesetzt ............ 20 Zeilen
--   Fallcode im Meldungstext .................  1 Zeile
--   Fallcode in metadata ..................... 11 Zeilen
--   feedback.case_code gesetzt ...............  0 Zeilen
--   system_logs.metadata ..................... jsonb
--   expires_at im Bestand .................... 19.06.2026 – 05.09.2026
--
-- LÖSCHENTSCHEIDUNG (11.09.2026): schwärzen, nicht löschen. Die Zeilen
-- bleiben erhalten, nur das Zugangsmittel verschwindet. Der Fallbezug wird
-- vorher in die Spalte case_id übernommen — das geht nur, solange
-- cases.case_code noch im Klartext existiert (vor Phase B).
--
-- Hinweis: Sämtliche Zeilen liegen bereits hinter ihrem eigenen expires_at.
-- Die Tabelle erklärt eine Aufbewahrungsfrist, die niemand vollzieht — das
-- ist ein eigener Befund außerhalb von #145.
--
-- Das Entfernen der Spalten folgt in 202609110002.
--
-- Idempotent: Mehrfaches Einspielen ändert nichts mehr.

-- 0. Sicherung gegen falsche Annahme: Die Schritte unten setzen jsonb voraus.
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'system_logs' and column_name = 'metadata'
  ) <> 'jsonb' then
    raise exception 'system_logs.metadata ist nicht jsonb — Migration vor dem Einspielen anpassen';
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'system_logs' and column_name = 'case_id'
  ) then
    raise exception 'system_logs.case_id fehlt — zuerst 202609110000 einspielen';
  end if;
end
$$;

-- 1. Fallbezug sichern: case_code → Spalte case_id (nur wo noch nicht gesetzt).
update public.system_logs as l
set case_id = c.id
from public.cases as c
where l.case_code is not null
  and l.case_id is null
  and upper(l.case_code) = upper(c.case_code);

-- 2. Codes in Meldungstext und Metadaten schwärzen — dasselbe Muster und
--    derselbe Ersatzwert wie src/lib/log-schwaerzung.ts.
update public.system_logs
set message = regexp_replace(message, 'PF-[A-Z0-9]{4}-[A-Z0-9]{4}', 'PF-****-****', 'gi')
where message ~* 'PF-[A-Z0-9]{4}-[A-Z0-9]{4}';

update public.system_logs
set metadata = regexp_replace(metadata::text, 'PF-[A-Z0-9]{4}-[A-Z0-9]{4}', 'PF-****-****', 'gi')::jsonb
where metadata::text ~* 'PF-[A-Z0-9]{4}-[A-Z0-9]{4}';

-- 3. Spalte leeren. Das Entfernen der Spalte folgt gesondert, siehe oben.
update public.system_logs
set case_code = null
where case_code is not null;
