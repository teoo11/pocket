-- Jobs. The public row has only the fuzzed pin and the area name; the exact spot and the street
-- address live in job_private, readable by the poster and (after the pick) the picked helper.
-- Nobody writes these tables directly: every change goes through the lifecycle functions.

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid references public.profiles (id) on delete set null,
  category public.job_category not null,
  category_label text check (category_label is null or char_length(btrim(category_label)) between 2 and 30),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  public_loc extensions.geography(point, 4326) not null,
  area_label text not null,
  starts_on date not null,
  start_min smallint not null check (start_min between 0 and 1439),
  dur_min smallint not null check (dur_min between 5 and 600),
  starts_at timestamptz not null, -- set by trigger from starts_on + start_min in Bucharest time
  pay_lei integer not null check (pay_lei between 10 and 5000),
  status public.job_status not null default 'open',
  helper_id uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  minutes smallint check (minutes between 1 and 600), -- time the helper reported when finishing
  confirmed_at timestamptz, -- the poster confirmed it's done: counts for points and the leaderboard month
  half1_paid_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  is_example boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_helper_when_matched check (status in ('open', 'cancelled') or helper_id is not null),
  constraint jobs_other_has_label check (category <> 'other' or category_label is not null)
);

create table public.job_private (
  job_id uuid primary key references public.jobs (id) on delete cascade,
  exact_loc extensions.geography(point, 4326) not null,
  address text not null default '' check (char_length(address) <= 200)
);

create index jobs_open_loc_idx on public.jobs using gist (public_loc) where status = 'open';
create index jobs_status_starts_idx on public.jobs (status, starts_at);
create index jobs_poster_idx on public.jobs (poster_id, created_at desc);
create index jobs_helper_idx on public.jobs (helper_id) where helper_id is not null;
create index jobs_confirmed_idx on public.jobs (confirmed_at) where status in ('completed', 'paid');
create index jobs_search_idx on public.jobs
  using gin (private.f_unaccent(lower(title || ' ' || description)) extensions.gin_trgm_ops);

create function private.jobs_set_times()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.starts_at := make_timestamptz(
    extract(year from new.starts_on)::int, extract(month from new.starts_on)::int, extract(day from new.starts_on)::int,
    new.start_min / 60, new.start_min % 60, 0, 'Europe/Bucharest'
  );
  new.updated_at := now();
  return new;
end;
$$;

create trigger jobs_set_times
  before insert or update on public.jobs
  for each row execute function private.jobs_set_times();

alter table public.jobs enable row level security;
alter table public.job_private enable row level security;

grant select on public.jobs to authenticated;
grant select on public.job_private to authenticated;

-- Open and finished jobs are public to signed-in users (finished ones feed profiles and the leaderboard).
-- Matched or cancelled jobs are visible to the poster, the helper, and anyone who offered.
create policy "jobs are readable when public or when involved" on public.jobs
  for select to authenticated
  using (
    status in ('open', 'completed', 'paid')
    or poster_id = (select auth.uid())
    or helper_id = (select auth.uid())
  );

create policy "address is readable by the poster and the picked helper" on public.job_private
  for select to authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_private.job_id
        and (
          j.poster_id = (select auth.uid())
          or (j.helper_id = (select auth.uid()) and j.status in ('accepted', 'started', 'done', 'completed', 'paid'))
        )
    )
  );
