-- Reports and messages to the Pocket team. Insert-only for users; the team reads them in the
-- Supabase dashboard (Table Editor), so there is no admin UI and no read access from the app.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  kind public.report_kind not null,
  job_id uuid references public.jobs (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null, -- the person reported
  message_id bigint references public.chat_messages (id) on delete set null,
  reason text not null check (reason ~ '^[a-z_]{2,40}$'),
  details text not null default '' check (char_length(details) <= 1000),
  reporter_id uuid references public.profiles (id) on delete set null default auth.uid(),
  status text not null default 'new' check (status in ('new', 'in_review', 'closed')),
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_job_idx on public.reports (job_id);
create index reports_user_idx on public.reports (user_id);
create index reports_message_idx on public.reports (message_id);
create index reports_reporter_idx on public.reports (reporter_id);

create table public.team_messages (
  id uuid primary key default gen_random_uuid(),
  topic text not null check (topic ~ '^[a-z_]{2,40}$'),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  sender_id uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index team_messages_created_idx on public.team_messages (created_at desc);
create index team_messages_sender_idx on public.team_messages (sender_id);

alter table public.reports enable row level security;
alter table public.team_messages enable row level security;
grant insert (kind, job_id, user_id, message_id, reason, details) on public.reports to authenticated;
grant insert (topic, body) on public.team_messages to authenticated;

create policy "people file reports as themselves" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "people write to the team as themselves" on public.team_messages
  for insert to authenticated with check (sender_id = (select auth.uid()));

-- Simple flood control: 10 reports and 10 team messages per person per hour.
create function private.limit_per_hour()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if tg_table_name = 'reports' then
    select count(*) into v_count from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour';
  else
    select count(*) into v_count from public.team_messages
      where sender_id = new.sender_id and created_at > now() - interval '1 hour';
  end if;
  if v_count >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reports_limit before insert on public.reports
  for each row execute function private.limit_per_hour();
create trigger team_messages_limit before insert on public.team_messages
  for each row execute function private.limit_per_hour();
