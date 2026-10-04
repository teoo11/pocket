-- Deleting an account: runs last, in the same rolled-back transaction, reusing the earlier people.
set local role authenticated;

-- S (a4) posts a job and H (a2) offers on it; S also offers on a job of P (a1).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
select public.complete_onboarding('Sorin S.', 44.4598, 26.1047, 'Floreasca', null, 'en')
where not exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-0000000000a4' and onboarded_at is not null);
insert into public._t values ('sjob', public.create_job('plants', null, 'Water the plants', '', private.bucharest_today() + 2, 600, 15, 15, 44.4598, 26.1047, 'Str. S 3')::text);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public._t values ('pjob', public.create_job('tech', null, 'Set up a router', '', private.bucharest_today() + 2, 900, 30, 30, 44.4598, 26.1047, 'Str. P 4')::text);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
select public.make_offer((select v::uuid from public._t where k = 'sjob'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
insert into public._t values ('soffer', public.make_offer((select v::uuid from public._t where k = 'pjob'))::text);

-- Open job and pending offer only: S can delete; the job is cancelled and the offer withdrawn.
select public.prepare_account_deletion();
do $$ begin
  assert (select status from public.jobs where id = (select v::uuid from public._t where k = 'sjob')) = 'cancelled', 'open job cancelled';
  assert (select status from public.offers where id = (select v::uuid from public._t where k = 'soffer')) = 'withdrawn', 'offer withdrawn';
end $$;
reset role;
do $$ begin
  assert exists (select 1 from public.notifications where user_id = '00000000-0000-4000-8000-0000000000a2' and type = 'job_cancelled'), 'H told';
end $$;

-- Once picked for a job, S cannot delete until it is finished.
set local role authenticated;
insert into public._t values ('soffer2', public.make_offer((select v::uuid from public._t where k = 'pjob'))::text);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.pick_helper((select v::uuid from public._t where k = 'soffer2'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.prepare_account_deletion();
    assert false, 'active job should block deletion';
  exception when others then assert sqlerrm = 'active_jobs', sqlerrm;
  end;
end $$;
reset role;

-- Deleting the person keeps the other side's history, with the link cleared.
delete from auth.users where id = '00000000-0000-4000-8000-0000000000a3';
do $$ begin
  assert (select helper_id from public.jobs where id = (select v::uuid from public._t where k = 'cjob')) is null, 'job kept, helper cleared';
  assert (select count(*) from public.payments where job_id = (select v::uuid from public._t where k = 'cjob')) > 0, 'payments kept';
  assert not exists (select 1 from public.payout_accounts where user_id = '00000000-0000-4000-8000-0000000000a3'), 'payout account gone';
end $$;

select 'ACCOUNT SMOKE TEST PASSED' as result;
