-- Card payments with Stripe Connect (Express accounts, destination charges).
-- The browser never calls these functions: server actions and webhooks do, with the service role,
-- after checking who is signed in. Cash payments are unchanged (public.record_cash_payment).

-- A helper's Stripe Express account. Readable by its owner (to show the setup state); written by the server only.
create table public.payout_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_account_id text not null unique,
  transfers_active boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payout_accounts enable row level security;
grant select on public.payout_accounts to authenticated;
create policy "people read their own payout account" on public.payout_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Each Stripe event is handled once, even when Stripe sends it again.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- Starts a card payment for one half: checks the job like a cash payment, then inserts a pending row
-- (the unique index on live payments stops a second one). Returns what the Checkout Session needs.
create function public.begin_card_payment(p_user_id uuid, p_job_id uuid, p_part integer, p_fee_percent numeric)
returns table (payment_id uuid, amount_bani integer, fee_bani integer, destination text, job_title text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.jobs;
  v_due integer;
  v_fee integer;
  v_dest text;
  v_id uuid;
begin
  select * into v_job from public.jobs where id = p_job_id for update;
  if not found then
    perform private.fail('not_found');
  end if;
  if v_job.poster_id is distinct from p_user_id then
    perform private.fail('not_allowed');
  end if;
  v_due := private.amount_due(v_job, p_part);
  if v_due < 200 then
    -- Stripe's minimum charge in RON is 2 lei.
    perform private.fail('invalid_state');
  end if;
  select pa.stripe_account_id into v_dest
  from public.payout_accounts pa
  join public.profiles p on p.id = pa.user_id
  where pa.user_id = v_job.helper_id and p.accepts_card;
  if v_dest is null then
    perform private.fail('card_not_accepted');
  end if;
  v_fee := ceil(v_due * greatest(0, least(coalesce(p_fee_percent, 0), 50)) / 100.0)::integer;
  insert into public.payments (job_id, part, method, amount_bani, fee_bani, payer_id, payee_id)
  values (p_job_id, p_part, 'card', v_due, v_fee, p_user_id, v_job.helper_id)
  returning id into v_id;
  return query select v_id, v_due, v_fee, v_dest, v_job.title;
end;
$$;

create function public.attach_checkout_session(p_payment_id uuid, p_session_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set stripe_checkout_session_id = p_session_id
  where id = p_payment_id and status = 'pending' and method = 'card';
$$;

-- Checkout finished and the money is in: settle like cash (job moves on, helper is notified). Idempotent.
create function public.card_payment_succeeded(p_session_id text, p_payment_intent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.payments
  set stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_payment_intent)
  where stripe_checkout_session_id = p_session_id and method = 'card'
  returning id into v_id;
  if v_id is not null then
    perform private.settle_payment(v_id);
  end if;
end;
$$;

-- Checkout expired, was cancelled, or the payment failed: the half can be paid again.
create function public.card_payment_closed(p_session_id text, p_status public.payment_status)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set status = p_status
  where stripe_checkout_session_id = p_session_id and status = 'pending' and p_status in ('failed', 'canceled');
$$;

-- The pending card payment of one half, by its payer (to cancel it from the job page).
create function public.pending_card_session(p_user_id uuid, p_job_id uuid, p_part integer)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select stripe_checkout_session_id from public.payments
  where job_id = p_job_id and part = p_part and payer_id = p_user_id and status = 'pending' and method = 'card'
$$;

-- A refund made in the Stripe dashboard: recorded for the team (the job itself is not reopened).
create function public.card_payment_refunded(p_payment_intent text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments set status = 'refunded'
  where stripe_payment_intent_id = p_payment_intent and status = 'succeeded';
$$;

-- Mirrors a Stripe account's state; a helper can receive cards once transfers and payouts are on.
create function public.sync_payout_account(
  p_user_id uuid,
  p_account_id text,
  p_transfers_active boolean,
  p_payouts_enabled boolean,
  p_details_submitted boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.payout_accounts (user_id, stripe_account_id, transfers_active, payouts_enabled, details_submitted)
  values (p_user_id, p_account_id, p_transfers_active, p_payouts_enabled, p_details_submitted)
  on conflict (user_id) do update set
    stripe_account_id = excluded.stripe_account_id,
    transfers_active = excluded.transfers_active,
    payouts_enabled = excluded.payouts_enabled,
    details_submitted = excluded.details_submitted,
    updated_at = now();
  update public.profiles set accepts_card = p_transfers_active and p_payouts_enabled where id = p_user_id;
end;
$$;

-- The account's owner, for account.updated events (Stripe sends the account id, not ours).
create function public.payout_account_owner(p_account_id text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id from public.payout_accounts where stripe_account_id = p_account_id
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.begin_card_payment(uuid, uuid, integer, numeric)',
    'public.attach_checkout_session(uuid, text)',
    'public.card_payment_succeeded(text, text)',
    'public.card_payment_closed(text, public.payment_status)',
    'public.pending_card_session(uuid, uuid, integer)',
    'public.card_payment_refunded(text)',
    'public.sync_payout_account(uuid, text, boolean, boolean, boolean)',
    'public.payout_account_owner(text)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
