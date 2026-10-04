-- Card payments (Stripe): runs after lifecycle_smoke.sql in the same rolled-back transaction, reusing its people.
-- P = poster (a1), H2 = helper (a3, onboarded there). The server's calls are made as the table owner, like the
-- service role; people's calls as `authenticated`.

-- ── A new job between P and H2, started ──
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public._t values ('cjob', public.create_job('pet', null, 'Feed the cat', '', private.bucharest_today() + 1, 1020, 30, 25, 44.4598, 26.1047, 'Str. Card 2')::text);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
insert into public._t values ('coffer', public.make_offer((select v::uuid from public._t where k = 'cjob'))::text);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select public.pick_helper((select v::uuid from public._t where k = 'coffer'));
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
select public.start_job((select v::uuid from public._t where k = 'cjob'));

-- People cannot call the card functions themselves.
do $$ begin
  begin
    perform public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', (select v::uuid from public._t where k = 'cjob'), 1, 0);
    assert false, 'people cannot start card payments directly';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.sync_payout_account('00000000-0000-4000-8000-0000000000a3', 'acct_x', true, true, true);
    assert false, 'people cannot mark themselves as accepting cards';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ── The server: no payout account yet, then one ──
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'cjob'); begin
  begin
    perform public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 1, 10);
    assert false, 'helper without a payout account is cash only';
  exception when others then assert sqlerrm = 'card_not_accepted', sqlerrm;
  end;
  perform public.sync_payout_account('00000000-0000-4000-8000-0000000000a3', 'acct_test_h2', true, false, true);
  assert not (select accepts_card from public.profiles where id = '00000000-0000-4000-8000-0000000000a3'), 'no payouts yet';
  perform public.sync_payout_account('00000000-0000-4000-8000-0000000000a3', 'acct_test_h2', true, true, true);
  assert (select accepts_card from public.profiles where id = '00000000-0000-4000-8000-0000000000a3'), 'now accepts cards';
  assert public.payout_account_owner('acct_test_h2') = '00000000-0000-4000-8000-0000000000a3', 'owner by account id';
  begin
    perform public.begin_card_payment('00000000-0000-4000-8000-0000000000a4', v_job, 1, 10);
    assert false, 'only the poster pays';
  exception when others then assert sqlerrm = 'not_allowed', sqlerrm;
  end;
end $$;

-- First half by card: 13 lei, 10% fee = 1.30 lei, to the helper's account.
do $$ declare r record; v_job uuid := (select v::uuid from public._t where k = 'cjob'); begin
  select * into r from public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 1, 10);
  assert r.amount_bani = 1300 and r.fee_bani = 130 and r.destination = 'acct_test_h2' and r.job_title = 'Feed the cat', 'checkout details';
  perform public.attach_checkout_session(r.payment_id, 'cs_test_1');
  assert public.pending_card_session('00000000-0000-4000-8000-0000000000a1', v_job, 1) = 'cs_test_1', 'pending session';
  begin
    perform public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 1, 10);
    assert false, 'a second card payment for the same half should fail';
  exception when others then assert sqlerrm = 'already_paid', sqlerrm;
  end;
  begin
    perform public.record_cash_payment(v_job, 1);
    assert false, 'no cash while a card payment is pending';
  exception when others then null;
  end;
  -- Cancelled at checkout: the half can be paid again.
  perform public.card_payment_closed('cs_test_1', 'canceled');
  assert (select status from public.payments where id = r.payment_id) = 'canceled', 'cancelled';
  select * into r from public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 1, 10);
  perform public.attach_checkout_session(r.payment_id, 'cs_test_2');
  perform public.card_payment_succeeded('cs_test_2', 'pi_test_2');
  perform public.card_payment_succeeded('cs_test_2', 'pi_test_2'); -- Stripe may send it twice
  assert (select count(*) from public.payments where job_id = v_job and status = 'succeeded') = 1, 'settled once';
  assert (select half1_paid_at from public.jobs where id = v_job) is not null, 'first half paid';
  assert (select data ->> 'amount' from public.notifications
          where user_id = '00000000-0000-4000-8000-0000000000a3' and type = 'payment_received' order by id desc limit 1) = '11.70',
    'helper told what they got after the fee';
  perform public.card_payment_closed('cs_test_2', 'failed'); -- a late failure does not undo a success
  assert (select status from public.payments where id = r.payment_id) = 'succeeded', 'still succeeded';
end $$;

-- Earnings privacy: the payout account is visible to its owner only.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.payout_accounts) = 1, 'helper sees their account';
end $$;
select public.finish_job((select v::uuid from public._t where k = 'cjob'), 30);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.payout_accounts) = 0, 'poster cannot see it';
end $$;
reset role;

-- Second half: a pending card payment blocks confirming; afterwards it is pay minus what succeeded.
do $$ declare r record; v_job uuid := (select v::uuid from public._t where k = 'cjob'); begin
  begin
    perform public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 2, 10);
    assert false, 'second half only after confirming';
  exception when others then assert sqlerrm = 'invalid_state', sqlerrm;
  end;
  update public.jobs set status = 'completed', confirmed_at = now() where id = v_job;
  select * into r from public.begin_card_payment('00000000-0000-4000-8000-0000000000a1', v_job, 2, 0);
  assert r.amount_bani = 1200 and r.fee_bani = 0, 'rest is 12 lei, no fee at 0%';
  perform public.attach_checkout_session(r.payment_id, 'cs_test_3');
  perform public.card_payment_succeeded('cs_test_3', 'pi_test_3');
  assert (select status from public.jobs where id = v_job) = 'paid', 'job paid';
  perform public.card_payment_refunded('pi_test_3');
  assert (select status from public.payments where id = r.payment_id) = 'refunded', 'refund recorded';
end $$;

select 'STRIPE SMOKE TEST PASSED' as result;
