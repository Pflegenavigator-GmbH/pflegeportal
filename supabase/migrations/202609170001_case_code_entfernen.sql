-- 202609170001_case_code_entfernen.sql
--
-- Schritt 2 von 2 für #153: Den Klartext-Fallcode aus der Datenbank entfernen.
--
-- ERST AUSFÜHREN, wenn der Backfill gelaufen ist UND die Anwendung, die über
-- case_code_hash sucht, im Betrieb ist. Danach gibt es keinen Weg zurück: Aus
-- dem Hash lässt sich der Code nicht zurückrechnen. Wer ihn noch braucht,
-- fragt die Person danach — sie hat ihn.

begin;

-- Abbruch, solange ein Fall ohne Suchschlüssel existiert. Ohne diese Prüfung
-- würde die Migration genau die Fälle unerreichbar machen, die der Backfill
-- übersprungen hat.
do $$
declare
  fehlende integer;
begin
  select count(*) into fehlende
  from public.cases
  where case_code_hash is null;

  if fehlende > 0 then
    raise exception 'Abbruch: % Fälle ohne case_code_hash. Erst den Backfill vollständig laufen lassen (#153).', fehlende;
  end if;
end $$;

-- Die Funktion erzeugte den Code über random() — kein kryptografischer Zufall
-- — und schrieb ihn in die Klartextspalte. Beides ist mit #153 abgelöst; die
-- Erzeugung liegt jetzt in `src/app/api/cases/route.ts`.
drop function if exists public.create_case();

alter table public.cases
  drop column if exists case_code;

-- Ab jetzt ist der Suchschlüssel Pflicht: Ein Fall ohne ihn wäre nicht mehr
-- auffindbar.
alter table public.cases
  alter column case_code_hash set not null;

commit;
