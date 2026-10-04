-- The job lifecycle (SPEC §7) as the only way to change jobs, offers, payments and reviews.
--
--   open ─make_offer→ (offers) ─pick_helper→ accepted ─start_job→ started ─finish_job→ done
--        ─confirm_job→ completed ─record_cash_payment(2) / card→ paid ─submit_review (both sides)
--   First half: record_cash_payment(1) or card, any time between started and confirm.
--   cancel_job: open or accepted (before the helper starts).
--
-- Every function: SECURITY DEFINER with an empty search_path, checks auth.uid() and the current state
-- under row locks, and notifies in the same transaction. Errors are raised as stable keys
-- (errcode P0001) that the app translates: see src/lib/rpc-errors.ts.

create function private.fail(p_key text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception '%', p_key using errcode = 'P0001';
end;
$$;

create function private.current_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    perform private.fail('not_signed_in');
  end if;
  return v_uid;
end;
$$;

create function private.require_onboarded(p_uid uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = p_uid and onboarded_at is not null) then
    perform private.fail('not_onboarded');
  end if;
end;
$$;

create function private.paid_bani(p_job_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(amount_bani), 0)::integer from public.payments where job_id = p_job_id and status = 'succeeded'
$$;

-- ─── Home and onboarding ──────────────────────────────────────────────────────────────────────

create function public.set_home(p_lat double precision, p_lng double precision, p_label text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_point extensions.geography := private.make_point(p_lat, p_lng);
begin
  if v_point is null or not private.in_service_area(v_point) then
    perform private.fail('outside_area');
  end if;
  update public.profile_private
    set home = v_point, home_label = left(nullif(btrim(p_label), ''), 120)
    where user_id = v_uid;
  update public.profiles set area_label = private.nearest_place(v_point) where id = v_uid;
end;
$$;

create function public.complete_onboarding(
  p_display_name text,
  p_lat double precision,
  p_lng double precision,
  p_home_label text,
  p_phone text,
  p_locale text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if char_length(v_name) not between 2 and 40 then
    perform private.fail('invalid_name');
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9 ()-]{6,20}$' then
    perform private.fail('invalid_phone');
  end if;
  perform public.set_home(p_lat, p_lng, p_home_label);
  update public.profile_private set phone = v_phone where user_id = v_uid;
  update public.profiles
    set display_name = v_name,
        locale = case when p_locale in ('en', 'ro') then p_locale else locale end,
        onboarded_at = coalesce(onboarded_at, now())
    where id = v_uid;
end;
$$;

-- ─── Posting ──────────────────────────────────────────────────────────────────────────────────

create function public.create_job(
  p_category public.job_category,
  p_category_label text,
  p_title text,
  p_description text,
  p_starts_on date,
  p_start_min integer,
  p_dur_min integer,
  p_pay_lei integer,
  p_lat double precision,
  p_lng double precision,
  p_address text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_point extensions.geography := private.make_point(p_lat, p_lng);
  v_label text := nullif(btrim(coalesce(p_category_label, '')), '');
  v_title text := btrim(coalesce(p_title, ''));
  v_desc text := btrim(coalesce(p_description, ''));
  v_starts timestamptz;
  v_id uuid;
begin
  perform private.require_onboarded(v_uid);

  if p_category = 'other' and v_label is null then
    perform private.fail('category_label_required');
  end if;
  if p_category <> 'other' then
    v_label := null;
  end if;
  if char_length(v_title) not between 3 and 80 or char_length(v_desc) > 1000 then
    perform private.fail('invalid_input');
  end if;
  if private.has_blocked_words(concat_ws(' ', v_title, v_desc, v_label)) then
    perform private.fail('blocked_words');
  end if;
  if p_start_min not between 0 and 1439 or p_dur_min not between 5 and 600 or p_pay_lei not between 10 and 5000 then
    perform private.fail('invalid_input');
  end if;

  v_starts := make_timestamptz(
    extract(year from p_starts_on)::int, extract(month from p_starts_on)::int, extract(day from p_starts_on)::int,
    p_start_min / 60, p_start_min % 60, 0, 'Europe/Bucharest'
  );
  if v_starts < now() then
    perform private.fail('in_the_past');
  end if;
  if p_starts_on > private.bucharest_today() + 90 then
    perform private.fail('too_far_ahead');
  end if;
  if v_point is null or not private.in_service_area(v_point) then
    perform private.fail('outside_area');
  end if;
  if (select count(*) from public.jobs where poster_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    perform private.fail('rate_limited');
  end if;

  insert into public.jobs (
    poster_id, category, category_label, title, description, public_loc, area_label,
    starts_on, start_min, dur_min, starts_at, pay_lei
  ) values (
    v_uid, p_category, v_label, v_title, v_desc, private.fuzz(v_point), private.nearest_place(v_point),
    p_starts_on, p_start_min, p_dur_min, v_starts, p_pay_lei
  )
  returning id into v_id;

  insert into public.job_private (job_id, exact_loc, address)
  values (v_id, v_point, left(btrim(coalesce(p_address, '')), 200));

  -- Tell up to 50 people nearby who help with this kind of job.
  insert into public.notifications (user_id, type, data, link)
  select p.id, 'new_job_near', jsonb_build_object('title', v_title, 'pay', p_pay_lei), '/jobs/' || v_id
  from public.profiles p
  join public.profile_private pp on pp.user_id = p.id
  where p.id <> v_uid
    and not p.is_example
    and p.onboarded_at is not null
    and p_category = any (p.skills)
    and pp.home is not null
    and extensions.st_dwithin(pp.home, v_point, p.max_dist_m)
  limit 50;

  return v_id;
end;
$$;

create function public.cancel_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.poster_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  if v_job.status not in ('open', 'accepted') then
    perform private.fail('invalid_state');
  end if;

  update public.jobs set status = 'cancelled', cancelled_at = now() where id = p_job_id;
  update public.conversations set closed_at = coalesce(closed_at, now()) where job_id = p_job_id;

  with ended as (
    update public.offers set status = 'declined', decided_at = now()
    where job_id = p_job_id and status = 'pending'
    returning helper_id
  )
  insert into public.notifications (user_id, type, data, link)
  select helper_id, 'job_cancelled', jsonb_build_object('title', v_job.title), '/jobs/' || p_job_id from ended
  union all
  select v_job.helper_id, 'job_cancelled', jsonb_build_object('title', v_job.title), '/jobs/' || p_job_id
  where v_job.helper_id is not null;
end;
$$;

-- ─── Offers ───────────────────────────────────────────────────────────────────────────────────

create function public.make_offer(p_job_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
  v_offer_id uuid;
begin
  perform private.require_onboarded(v_uid);
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.poster_id = v_uid then
    perform private.fail('own_job');
  end if;
  if v_job.is_example then
    perform private.fail('example_job');
  end if;
  if v_job.status <> 'open' or v_job.starts_at + make_interval(mins => v_job.dur_min) < now() then
    perform private.fail('invalid_state');
  end if;
  if (select count(*) from public.offers where helper_id = v_uid and created_at > now() - interval '1 day') >= 30 then
    perform private.fail('rate_limited');
  end if;

  begin
    insert into public.offers (job_id, helper_id) values (p_job_id, v_uid) returning id into v_offer_id;
  exception when unique_violation then
    perform private.fail('already_offered');
  end;

  -- The chat opens with the offer.
  insert into public.conversations (job_id, poster_id, helper_id)
  values (p_job_id, v_job.poster_id, v_uid)
  on conflict (job_id, helper_id) do update set closed_at = null;

  perform private.notify(
    v_job.poster_id, 'offer_received',
    jsonb_build_object('title', v_job.title, 'name', (select display_name from public.profiles where id = v_uid)),
    '/jobs/' || p_job_id
  );
  return v_offer_id;
end;
$$;

create function public.withdraw_offer(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
begin
  update public.offers set status = 'withdrawn', decided_at = now()
    where job_id = p_job_id and helper_id = v_uid and status = 'pending';
  if not found then
    perform private.fail('invalid_state');
  end if;
  update public.conversations set closed_at = now() where job_id = p_job_id and helper_id = v_uid;
end;
$$;

create function public.pick_helper(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_offer public.offers;
  v_job public.jobs;
begin
  select * into v_offer from public.offers where id = p_offer_id;
  if not found then
    perform private.fail('not_found');
  end if;
  -- Lock the job first, then the offers, in the same order as make_offer.
  select * into v_job from public.jobs where id = v_offer.job_id for update;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if v_job.poster_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  if v_job.status <> 'open' or v_offer.status <> 'pending' then
    perform private.fail('invalid_state');
  end if;

  update public.offers set status = 'accepted', decided_at = now() where id = v_offer.id;
  update public.jobs set status = 'accepted', helper_id = v_offer.helper_id where id = v_job.id;

  with declined as (
    update public.offers set status = 'declined', decided_at = now()
    where job_id = v_job.id and status = 'pending'
    returning helper_id
  )
  insert into public.notifications (user_id, type, data, link)
  select helper_id, 'offer_declined', jsonb_build_object('title', v_job.title), '/jobs/' || v_job.id from declined;

  update public.conversations set closed_at = now()
    where job_id = v_job.id and helper_id <> v_offer.helper_id and closed_at is null;

  perform private.notify(v_offer.helper_id, 'picked', jsonb_build_object('title', v_job.title), '/jobs/' || v_job.id);
end;
$$;

-- ─── Doing the job ────────────────────────────────────────────────────────────────────────────

create function public.start_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.helper_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  if v_job.status <> 'accepted' then
    perform private.fail('invalid_state');
  end if;
  update public.jobs set status = 'started', started_at = now() where id = p_job_id;
  perform private.notify(
    v_job.poster_id, 'job_started',
    jsonb_build_object('title', v_job.title, 'amount', ceil(v_job.pay_lei / 2.0)::int),
    '/jobs/' || p_job_id
  );
end;
$$;

create function public.finish_job(p_job_id uuid, p_minutes integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
begin
  if p_minutes is null or p_minutes not between 1 and 600 then
    perform private.fail('invalid_input');
  end if;
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.helper_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  if v_job.status <> 'started' then
    perform private.fail('invalid_state');
  end if;
  update public.jobs set status = 'done', finished_at = now(), minutes = p_minutes where id = p_job_id;
  perform private.notify(
    v_job.poster_id, 'job_done', jsonb_build_object('title', v_job.title, 'minutes', p_minutes), '/jobs/' || p_job_id
  );
end;
$$;

create function public.confirm_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.poster_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  if v_job.status <> 'done' then
    perform private.fail('invalid_state');
  end if;
  if exists (select 1 from public.payments where job_id = p_job_id and status = 'pending') then
    perform private.fail('payment_pending');
  end if;
  update public.jobs set status = 'completed', confirmed_at = now() where id = p_job_id;
  perform private.notify(
    v_job.helper_id, 'job_confirmed',
    jsonb_build_object('title', v_job.title, 'points', private.job_points(coalesce(v_job.minutes, v_job.dur_min))),
    '/jobs/' || p_job_id
  );
end;
$$;

-- ─── Paying ───────────────────────────────────────────────────────────────────────────────────

-- What a half costs right now, in bani: part 1 = ceil(pay / 2); part 2 = pay minus what has succeeded.
-- Raises when that half can't be paid in the job's current state.
create function private.amount_due(p_job public.jobs, p_part integer)
returns integer
language plpgsql
stable
set search_path = ''
as $$
declare
  v_due integer;
begin
  if p_part = 1 then
    if p_job.status not in ('started', 'done') or p_job.half1_paid_at is not null then
      perform private.fail('invalid_state');
    end if;
    v_due := ceil(p_job.pay_lei / 2.0)::integer * 100;
  elsif p_part = 2 then
    if p_job.status <> 'completed' then
      perform private.fail('invalid_state');
    end if;
    v_due := p_job.pay_lei * 100 - private.paid_bani(p_job.id);
  else
    perform private.fail('invalid_input');
  end if;
  if exists (select 1 from public.payments where job_id = p_job.id and part = p_part and status in ('pending', 'succeeded')) then
    perform private.fail('already_paid');
  end if;
  return v_due;
end;
$$;

-- Marks a payment as succeeded and moves the job along. Shared by cash and (Phase 5) card payments.
-- Idempotent: does nothing when the payment is already final.
create function private.settle_payment(p_payment_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_pay public.payments;
  v_job public.jobs;
begin
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or v_pay.status <> 'pending' then
    return;
  end if;
  update public.payments set status = 'succeeded', succeeded_at = now() where id = p_payment_id;

  select * into v_job from public.jobs where id = v_pay.job_id for update;
  if v_pay.part = 1 then
    update public.jobs set half1_paid_at = now() where id = v_job.id;
  elsif private.paid_bani(v_job.id) >= v_job.pay_lei * 100 then
    update public.jobs set status = 'paid', paid_at = now() where id = v_job.id;
  end if;

  perform private.notify(
    v_pay.payee_id, 'payment_received',
    jsonb_build_object(
      'title', v_job.title,
      'amount', round((v_pay.amount_bani - v_pay.fee_bani) / 100.0, 2),
      'part', v_pay.part,
      'method', v_pay.method
    ),
    '/me/earnings'
  );
end;
$$;

create function public.record_cash_payment(p_job_id uuid, p_part integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
  v_due integer;
  v_payment_id uuid;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.poster_id is distinct from v_uid then
    perform private.fail('not_allowed');
  end if;
  v_due := private.amount_due(v_job, p_part);
  if v_due <= 0 then
    -- Nothing left to pay (can't normally happen): just close the job.
    update public.jobs set status = 'paid', paid_at = now() where id = p_job_id and status = 'completed';
    return;
  end if;
  insert into public.payments (job_id, part, method, amount_bani, payer_id, payee_id)
  values (p_job_id, p_part, 'cash', v_due, v_uid, v_job.helper_id)
  returning id into v_payment_id;
  perform private.settle_payment(v_payment_id);
end;
$$;

-- ─── Reviews ──────────────────────────────────────────────────────────────────────────────────

create function public.submit_review(p_job_id uuid, p_stars integer, p_tags text[], p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_job public.jobs;
  v_subject uuid;
  v_role public.review_role;
begin
  select * into v_job from public.jobs where id = p_job_id;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_uid = v_job.poster_id then
    v_subject := v_job.helper_id;
    v_role := 'helper';
  elsif v_uid = v_job.helper_id then
    v_subject := v_job.poster_id;
    v_role := 'poster';
  else
    perform private.fail('not_allowed');
  end if;
  if v_job.status <> 'paid' then
    perform private.fail('invalid_state');
  end if;
  if p_stars is null or p_stars not between 1 and 5 or char_length(coalesce(p_comment, '')) > 500 then
    perform private.fail('invalid_input');
  end if;

  begin
    insert into public.reviews (job_id, author_id, subject_id, subject_role, stars, tags, comment)
    values (p_job_id, v_uid, v_subject, v_role, p_stars, coalesce(p_tags, '{}'), btrim(coalesce(p_comment, '')));
  exception
    when unique_violation then perform private.fail('already_reviewed');
    when check_violation then perform private.fail('invalid_input');
  end;

  perform private.notify(v_subject, 'review_received', jsonb_build_object('title', v_job.title), '/profile/' || v_subject);
end;
$$;

-- ─── Grants: signed-in users may call the public functions; nothing else may. ─────────────────

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.set_home(double precision, double precision, text)',
    'public.complete_onboarding(text, double precision, double precision, text, text, text)',
    'public.create_job(public.job_category, text, text, text, date, integer, integer, integer, double precision, double precision, text)',
    'public.cancel_job(uuid)',
    'public.make_offer(uuid)',
    'public.withdraw_offer(uuid)',
    'public.pick_helper(uuid)',
    'public.start_job(uuid)',
    'public.finish_job(uuid, integer)',
    'public.confirm_job(uuid)',
    'public.record_cash_payment(uuid, integer)',
    'public.submit_review(uuid, integer, text[], text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
