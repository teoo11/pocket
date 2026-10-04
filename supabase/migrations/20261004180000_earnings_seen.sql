-- When the helper last saw the "New earnings" pop-up; payments after this show in it once.
alter table public.profile_private add column earnings_seen_at timestamptz not null default now();
grant update (earnings_seen_at) on public.profile_private to authenticated;
