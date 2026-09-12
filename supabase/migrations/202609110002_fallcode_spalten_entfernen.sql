-- Issue #145, Phase A — die beiden Protokollspalten für den Fallcode entfernen.
--
-- VORAUSSETZUNG, in dieser Reihenfolge:
--   1. Anwendung mit dem Code-Stand von #145 Phase A ist ausgeliefert
--      (sie schreibt keine der beiden Spalten mehr).
--   2. 202609110001 ist eingespielt — sie sichert den Fallbezug aus
--      system_logs.case_code, bevor diese Spalte hier verschwindet.
--
-- system_logs.case_code: nach 202609110001 leer; Fallbezug steht in
--   metadata.caseId.
-- feedback.case_code: im Bestand nie gesetzt (Prüfung vom 11.09.2026:
--   0 Zeilen), im Code von keiner Stelle geschrieben. Ein Zugangsmittel neben
--   Rückmeldungstexten wäre fachlich ohne Zweck.
--
-- Die Typen in src/types/supabase.ts führen beide Spalten bereits nicht mehr.

-- Abbruch, falls 202609110001 noch nicht gelaufen ist: Sonst ginge der
-- Fallbezug der Altzeilen mit der Spalte verloren.
do $$
begin
  if exists (select 1 from public.system_logs where case_code is not null) then
    raise exception 'system_logs.case_code ist noch befüllt — zuerst 202609110001 einspielen';
  end if;
end
$$;

alter table public.system_logs drop column if exists case_code;
alter table public.feedback drop column if exists case_code;
