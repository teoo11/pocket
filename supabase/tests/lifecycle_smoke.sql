-- Scenario test for access rules and the job lifecycle. Runs inside a transaction that is rolled back
-- (scripts/db-test.sh wraps it after the migrations), impersonating users the way PostgREST does:
-- `set local role authenticated` plus request.jwt.claims.
--
-- People: P = poster, H = helper, H2 = second helper (not picked), S = stranger.

create table public._t (k text primary key, v text);
grant all on public._t to authenticated, anon;

insert into auth.users (id, email, aud, role, instance_id, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', 'p@test.pocket', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{"display_name":"Paula P."}', '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000a2', 'h@test.pocket', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{"full_name":"Horia H."}', '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000a3', 'h2@test.pocket', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{"name":"Ilinca I."}', '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000a4', 's@test.pocket', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '{}', '{}', now(), now());

-- The sign-up trigger made both profile rows, with the name from the metadata (or the fallback).
do $$ begin
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000a2') = 'Horia H.', 'name from full_name';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000a4') = 'Neighbour', 'fallback name';
  assert (select count(*) from public.profile_private where user_id::text like '00000000-0000-4000-8000-0000000000a%') = 4, 'private rows';
end $$;

-- ── Onboarding (everyone near Floreasca) ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.complete_onboarding('Paula P.', 44.4598, 26.1047, 'Floreasca', '+40 721 000 001', 'ro');
-- Posting before onboarding is refused for others; outside the area is refused.
do $$ begin
  begin
    perform public.set_home(45.75, 21.23, 'Timișoara');
    assert false, 'outside area should fail';
  exception when others then assert sqlerrm = 'outside_area', sqlerrm;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.make_offer(gen_random_uuid());
    assert false, 'offer before onboarding should fail';
  exception when others then assert sqlerrm = 'not_onboarded', sqlerrm;
  end;
end $$;
select public.complete_onboarding('Horia H.', 44.4610, 26.1060, 'Floreasca', '+40 721 000 002', 'en');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
select public.complete_onboarding('Ilinca I.', 44.4580, 26.1020, 'Floreasca', '', 'en');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
select public.complete_onboarding('Sabin S.', 44.4500, 26.1250, 'Obor', null, 'en');

-- ── Posting ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare d date := (now() at time zone 'Europe/Bucharest')::date; begin
  begin
    perform public.create_job('pet', null, 'Walk my dog', 'Please bring alcohol', d + 1, 1020, 30, 30, 44.4598, 26.1047, 'Str. Test 1');
    assert false, 'blocked words should fail';
  exception when others then assert sqlerrm = 'blocked_words', sqlerrm;
  end;
  begin
    perform public.create_job('pet', null, 'Walk my dog', '', d - 1, 1020, 30, 30, 44.4598, 26.1047, 'Str. Test 1');
    assert false, 'past date should fail';
  exception when others then assert sqlerrm = 'in_the_past', sqlerrm;
  end;
  begin
    perform public.create_job('other', null, 'Fix my bike', '', d + 1, 1020, 30, 30, 44.4598, 26.1047, '');
    assert false, 'other needs a label';
  exception when others then assert sqlerrm = 'category_label_required', sqlerrm;
  end;
  insert into public._t values ('job', public.create_job('pet', null, 'Walk my dog', 'Half an hour around the park.', d + 1, 1020, 30, 31, 44.4598, 26.1047, 'Str. Test 1, ap. 2')::text);
end $$;

reset role;
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); v_m double precision; begin
  select extensions.st_distance(j.public_loc, jp.exact_loc) into v_m from public.jobs j join public.job_private jp on jp.job_id = j.id where j.id = v_job;
  assert v_m between 69 and 141, 'fuzz distance ' || v_m;
  assert (select area_label from public.jobs where id = v_job) = 'Floreasca', 'area label';
  assert (select to_char(starts_at at time zone 'Europe/Bucharest', 'HH24:MI') from public.jobs where id = v_job) = '17:00', 'starts_at in Bucharest time';
  -- H helps with every category and lives within 2 km: notified. P (the poster) is not.
  assert exists (select 1 from public.notifications where user_id = '00000000-0000-4000-8000-0000000000a2' and type = 'new_job_near'), 'nearby helper notified';
  assert not exists (select 1 from public.notifications where user_id = '00000000-0000-4000-8000-0000000000a1' and type = 'new_job_near'), 'poster not notified';
end $$;

-- ── Privacy before the pick ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select count(*) from public.jobs where id = v_job) = 1, 'open job is public';
  assert (select count(*) from public.job_private where job_id = v_job) = 0, 'stranger cannot read the address';
  assert (select count(*) from public.job_contact(v_job)) = 0, 'stranger gets no contact';
  assert (select count(*) from public.profile_private) = 1, 'only my own private row';
  assert (select dist_m from public.job_cards where id = v_job) % 100 = 0, 'distance rounded to 100 m';
end $$;

-- Nobody writes tables directly.
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    update public.jobs set pay_lei = 1 where id = v_job;
    assert false, 'direct job update should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.notifications (user_id, type) values ('00000000-0000-4000-8000-0000000000a4', 'picked');
    assert false, 'direct notification insert should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set accepts_card = true where id = '00000000-0000-4000-8000-0000000000a4';
    assert false, 'accepts_card is server-only';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Offers and chat ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  insert into public._t values ('offer_h', public.make_offer(v_job)::text);
  begin
    perform public.make_offer(v_job);
    assert false, 'second offer should fail';
  exception when others then assert sqlerrm = 'already_offered', sqlerrm;
  end;
  insert into public._t values ('conv_h', (select id::text from public.conversations where job_id = v_job));
  insert into public.chat_messages (conversation_id, body) values ((select v::uuid from public._t where k = 'conv_h'), 'Hi! Is the dog friendly?');
  assert (select count(*) from public.job_contact(v_job)) = 0, 'no contact before the pick';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  insert into public._t values ('offer_h2', public.make_offer(v_job)::text);
  insert into public._t values ('conv_h2', (select id::text from public.conversations where job_id = v_job));
  assert (select count(*) from public.conversations) = 1, 'H2 sees only their own conversation';
  assert (select count(*) from public.chat_messages) = 0, 'H2 cannot read H''s messages';
  assert (select count(*) from public.my_conversations()) = 1, 'H2 inbox: only their own conversation';
  assert public.unread_conversations() = 0, 'H2 has nothing unread';
  begin
    insert into public.chat_messages (conversation_id, body) values ((select v::uuid from public._t where k = 'conv_h'), 'sneaky');
    assert false, 'writing in someone else''s conversation should fail';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    perform public.make_offer(v_job);
    assert false, 'offering on your own job should fail';
  exception when others then assert sqlerrm = 'own_job', sqlerrm;
  end;
  assert (select count(*) from public.offer_candidates(v_job)) = 2, 'poster sees both offers';
  assert (select bool_and(dist_m % 500 = 0) from public.offer_candidates(v_job)), 'candidate distance rounded to 500 m';
  assert (select count(*) from public.chat_messages) = 1, 'poster reads the message';
  -- Inbox: two conversations (one per helper), one unread, with the last message and the other person.
  assert (select count(*) from public.my_conversations()) = 2, 'poster inbox has both conversations';
  assert public.unread_conversations() = 1, 'one conversation unread';
  assert (select unread from public.my_conversations() where id = (select v::uuid from public._t where k = 'conv_h')) = 1, 'one unread message';
  assert (select last_body from public.my_conversations() where id = (select v::uuid from public._t where k = 'conv_h')) = 'Hi! Is the dog friendly?', 'last message';
  assert (select bool_and(i_am_poster) from public.my_conversations()), 'poster side';
  insert into public.conversation_reads (conversation_id, user_id)
    values ((select v::uuid from public._t where k = 'conv_h'), '00000000-0000-4000-8000-0000000000a1');
  assert public.unread_conversations() = 0, 'read after opening';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.pick_helper((select v::uuid from public._t where k = 'offer_h'));
    assert false, 'stranger cannot pick';
  exception when others then assert sqlerrm = 'not_allowed', sqlerrm;
  end;
  assert (select count(*) from public.offer_candidates((select v::uuid from public._t where k = 'job'))) = 0, 'stranger sees no candidates';
end $$;

-- ── Pick ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.pick_helper((select v::uuid from public._t where k = 'offer_h'));
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select phone from public.job_contact(v_job)) = '+40 721 000 002', 'poster sees helper phone';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); c record; begin
  select * into c from public.job_contact(v_job);
  assert c.phone = '+40 721 000 001' and c.address = 'Str. Test 1, ap. 2', 'helper sees phone and address';
  assert (select count(*) from public.job_private where job_id = v_job) = 1, 'helper reads job_private';
  assert exists (select 1 from public.notifications where type = 'picked'), 'helper told they were picked';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select count(*) from public.job_contact(v_job)) = 0, 'H2 gets no contact';
  assert (select count(*) from public.job_private where job_id = v_job) = 0, 'H2 cannot read the address';
  assert (select count(*) from public.jobs where id = v_job) = 1, 'H2 still sees the job they offered on';
  assert (select status from public.offers where id = (select v::uuid from public._t where k = 'offer_h2')) = 'declined', 'H2 declined';
  assert exists (select 1 from public.notifications where type = 'offer_declined'), 'H2 told';
  begin
    insert into public.chat_messages (conversation_id, body) values ((select v::uuid from public._t where k = 'conv_h2'), 'still there?');
    assert false, 'closed conversation is read-only';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Doing and paying ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    perform public.start_job(v_job);
    assert false, 'poster cannot start';
  exception when others then assert sqlerrm = 'not_allowed', sqlerrm;
  end;
  begin
    perform public.record_cash_payment(v_job, 1);
    assert false, 'cannot pay before the start';
  exception when others then assert sqlerrm = 'invalid_state', sqlerrm;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
select public.start_job((select v::uuid from public._t where k = 'job'));

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.record_cash_payment((select v::uuid from public._t where k = 'job'), 1);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    perform public.record_cash_payment(v_job, 1);
    assert false, 'first half twice should fail';
  exception when others then assert sqlerrm = 'invalid_state', sqlerrm;
  end;
  begin
    perform public.confirm_job(v_job);
    assert false, 'cannot confirm before done';
  exception when others then assert sqlerrm = 'invalid_state', sqlerrm;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select sum(amount_bani) from public.payments) = 1600, 'first half of 31 lei is ceil = 16 lei';
  perform public.finish_job(v_job, 45);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.confirm_job((select v::uuid from public._t where k = 'job'));
select public.record_cash_payment((select v::uuid from public._t where k = 'job'), 2);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select status from public.jobs where id = v_job) = 'paid', 'job paid';
  assert (select sum(amount_bani) from public.payments where job_id = v_job) = 3100, 'total equals the pay';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.payments) = 0, 'earnings are private';
end $$;

-- ── Reviews (double-blind) and points ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.submit_review((select v::uuid from public._t where k = 'job'), 5, array['on_time', 'great_job'], 'Lovely walk.');
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    perform public.submit_review(v_job, 4, array['friendly'], '');
    assert false, 'reviewing twice should fail';
  exception when others then assert sqlerrm = 'already_reviewed', sqlerrm;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  -- (Only this job: the example data has revealed reviews of its own.)
  assert (select count(*) from public.reviews where job_id = v_job) = 0, 'one-sided review stays hidden';
  assert (select helper_reviews from public.profile_stats where user_id = '00000000-0000-4000-8000-0000000000a2') = 0, 'hidden review not in averages';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  begin
    perform public.submit_review(v_job, 4, array['on_time'], '');
    assert false, 'helper tags on a poster review should fail';
  exception when others then assert sqlerrm = 'invalid_input', sqlerrm;
  end;
  perform public.submit_review(v_job, 4, array['paid_on_time', 'friendly'], 'Clear instructions, thanks.');
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ declare r record; v_job uuid := (select v::uuid from public._t where k = 'job'); begin
  assert (select count(*) from public.reviews where job_id = v_job) = 2, 'both reviews revealed';
  select * into r from public.leaderboard('all', 'points') where user_id = '00000000-0000-4000-8000-0000000000a2';
  assert r.points = 4 and r.jobs_done = 1 and r.minutes = 45 and r.avg_rating = 5.0, 'leaderboard: 45 min = 4 points, rating 5';
  assert (select points from public.leaderboard(to_char(now() at time zone 'Europe/Bucharest', 'YYYY-MM'), 'points') where user_id = '00000000-0000-4000-8000-0000000000a2') = 4, 'this month';
  assert (select count(*) from public.leaderboard('2001-01', 'points')) = 0, 'empty month';
end $$;

-- ── Realtime topics ──
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$ begin
  assert private.can_listen('user:00000000-0000-4000-8000-0000000000a3'), 'own user topic';
  assert not private.can_listen('user:00000000-0000-4000-8000-0000000000a2'), 'not someone else''s';
  assert private.can_listen('conversation:' || (select v from public._t where k = 'conv_h2')), 'own conversation';
  assert not private.can_listen('conversation:' || (select v from public._t where k = 'conv_h')), 'not someone else''s conversation';
  assert not private.can_listen('anything:else'), 'unknown topics';
end $$;

-- ── Signed-out visitors see nothing ──
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.jobs limit 1;
    assert false, 'anon cannot read jobs';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.make_offer(gen_random_uuid());
    assert false, 'anon cannot call functions';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'LIFECYCLE SMOKE TEST PASSED' as result;
