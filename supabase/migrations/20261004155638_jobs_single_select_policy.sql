-- One SELECT policy on jobs instead of two (the advisor's multiple_permissive_policies): the same rule,
-- evaluated once per row.
drop policy "jobs are readable when public or when involved" on public.jobs;
drop policy "people who offered can read the job" on public.jobs;

create policy "jobs are readable when public, involved, or offered on" on public.jobs
  for select to authenticated
  using (
    status in ('open', 'completed', 'paid')
    or poster_id = (select auth.uid())
    or helper_id = (select auth.uid())
    or exists (select 1 from public.offers o where o.job_id = jobs.id and o.helper_id = (select auth.uid()))
  );
