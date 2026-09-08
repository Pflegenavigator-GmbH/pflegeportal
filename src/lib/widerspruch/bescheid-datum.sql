-- src/lib/widerspruch/bescheid-datum.sql
-- Speichert den Zugang des Pflegegrad-Bescheids am Fall.
-- Grundlage für den Fristen-Monitor (§§ 84, 87, 88 SGG), der ohne dieses
-- Datum keine Frist berechnen kann.
--
-- Im Supabase-SQL-Editor ausführen. Idempotent — mehrfaches Ausführen ist
-- unschädlich.
--
-- Bewusst ohne CHECK-Constraint gegen Zukunftsdaten: Ein Ausdruck mit
-- CURRENT_DATE ist nicht immutable und in Constraints ein bekannter
-- Fallstrick (Dump/Restore, Planbarkeit). Die Prüfung liegt stattdessen
-- in der API (siehe cases/[code]/bescheid-datum), wo sie getestet ist.

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS bescheid_datum date;

COMMENT ON COLUMN public.cases.bescheid_datum IS
  'Zugang des Pflegegrad-Bescheids (Datum ohne Uhrzeit). Startpunkt der Widerspruchsfrist nach § 84 Abs. 1 SGG. Wird ausschließlich vom Nutzer gesetzt — kein Vorbelegen mit dem Tagesdatum, da eine Überschätzung der Restfrist zum Fristversäumnis führen kann.';
