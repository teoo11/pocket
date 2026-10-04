-- Before an account is deleted (the server then deletes the auth user; rows about other people keep their
-- history with the link cleared, see the `on delete set null` foreign keys).
-- Refuses while a job is under way, so nobody is left without their helper or their pay; otherwise cancels
-- the person's open jobs and withdraws their live offers, which tells the people involved.
create function public.prepare_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job uuid;
begin
  if exists (
    select 1 from public.jobs
    where v_uid in (poster_id, helper_id) and status in ('accepted', 'started', 'done', 'completed')
  ) then
    perform private.fail('active_jobs');
  end if;
  for v_job in select id from public.jobs where poster_id = v_uid and status = 'open' loop
    perform public.cancel_job(v_job);
  end loop;
  for v_job in select job_id from public.offers where helper_id = v_uid and status = 'pending' loop
    perform public.withdraw_offer(v_job);
  end loop;
end;
$$;

revoke execute on function public.prepare_account_deletion() from public, anon;
grant execute on function public.prepare_account_deletion() to authenticated;

-- A finished job keeps its history when the helper's account is deleted (helper_id becomes null);
-- a job under way still needs its helper (and blocks the deletion above).
alter table public.jobs drop constraint jobs_helper_when_matched;
alter table public.jobs add constraint jobs_helper_when_matched
  check (status in ('open', 'cancelled', 'completed', 'paid') or helper_id is not null);
