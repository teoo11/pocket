-- Payments: one row per half. Part 1 = the first half (ceil(pay / 2)) when the helper starts;
-- part 2 = whatever is left once the job is confirmed (the full pay if part 1 was skipped).
-- Cash is recorded by the poster; card payments (Stripe Connect, Phase 5) are settled by webhooks.
-- Amounts are in bani (1 leu = 100 bani). amount_bani is what the helper receives, fee_bani is Pocket's.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  part smallint not null check (part in (1, 2)),
  method public.payment_method not null,
  amount_bani integer not null check (amount_bani > 0),
  fee_bani integer not null default 0 check (fee_bani >= 0),
  payer_id uuid references public.profiles (id) on delete set null,
  payee_id uuid references public.profiles (id) on delete set null,
  status public.payment_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  succeeded_at timestamptz
);
-- At most one live payment per half: blocks paying twice, or starting a card payment twice.
create unique index payments_one_live_part_idx on public.payments (job_id, part) where status in ('pending', 'succeeded');
create index payments_payee_idx on public.payments (payee_id, status, succeeded_at desc);
create index payments_payer_idx on public.payments (payer_id);

alter table public.payments enable row level security;
grant select on public.payments to authenticated;

-- Earnings are private: a payment is visible only to the two people in it.
create policy "payments are readable by payer and payee" on public.payments
  for select to authenticated
  using ((select auth.uid()) in (payer_id, payee_id));
