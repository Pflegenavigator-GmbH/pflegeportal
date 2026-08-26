-- Setzt ausschließlich das Erwachsenen-Assessment (Module 1–6) zurück.
-- Kinder-Assessment (Modul 7) und Pflegetagebuch (Modul 10) bleiben erhalten.
-- Die Funktion kapselt Delete und Case-Update in einer PostgreSQL-Transaktion.
create or replace function public.reset_adult_assessment(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.answers
  where case_id = p_case_id
    and module_number between 1 and 6;

  update public.cases
  set care_level_guess = null,
      total_score = 0,
      traffic_light = null,
      updated_at = now()
  where id = p_case_id;

  if not found then
    raise exception 'Fall % existiert nicht', p_case_id using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.reset_adult_assessment(uuid) from public;
revoke all on function public.reset_adult_assessment(uuid) from anon;
revoke all on function public.reset_adult_assessment(uuid) from authenticated;
grant execute on function public.reset_adult_assessment(uuid) to service_role;
