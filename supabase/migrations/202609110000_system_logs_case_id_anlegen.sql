-- Issue #145, Phase A — Spalte case_id in system_logs anlegen.
--
-- Fallbezug im Protokoll ist die interne case_id, nie der Fallcode. Als eigene
-- Spalte mit Fremdschlüssel statt als metadata.caseId (Entscheidung vom
-- 14.09.2026): Wird ein Fall gelöscht (#146), löst "on delete set null" den
-- Verweis von selbst. Ein Wert in metadata bliebe als Verweis auf einen Fall
-- stehen, den es nicht mehr gibt.
--
-- VORAUSSETZUNG: VOR dem Deployment von #145 Phase A einspielen. Der neue Code
-- schreibt diese Spalte. Der alte Code kennt sie nicht und ignoriert sie —
-- das Einspielen vor dem Deployment ist daher gefahrlos.
--
-- Reihenfolge insgesamt:
--   202609110000  diese Datei          → vor dem Deployment
--   Deployment #145 Phase A
--   202609110001  Bestand bereinigen   → nach dem Deployment, vor Phase B
--   202609110002  Altspalten entfernen → nach Prüfung von 0001
--
-- Idempotent: Mehrfaches Einspielen ändert nichts mehr.

-- 0. Sicherung: Der Fremdschlüssel setzt eine uuid in cases.id voraus.
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'cases' and column_name = 'id'
  ) <> 'uuid' then
    raise exception 'cases.id ist nicht uuid — Migration vor dem Einspielen anpassen';
  end if;
end
$$;

alter table public.system_logs
  add column if not exists case_id uuid references public.cases (id) on delete set null;

create index if not exists system_logs_case_id_idx on public.system_logs (case_id);

comment on column public.system_logs.case_id is
  'Fallbezug (interne case_id). Nie den Fallcode speichern — er ist ein Zugangsmittel (#145).';
