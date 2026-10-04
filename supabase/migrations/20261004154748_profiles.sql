-- Profiles. One account does both (post and help), so there are no roles or account types.
-- profiles: what every signed-in user may see. profile_private: only the owner (phone, exact home, savings goal).

create function private.every_day_schedule()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  -- Weekday (0 = Sunday … 6 = Saturday) -> [from, to] in minutes after midnight, or null when not available.
  select '{"0":[480,1260],"1":[480,1260],"2":[480,1260],"3":[480,1260],"4":[480,1260],"5":[480,1260],"6":[480,1260]}'::jsonb
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 200),
  area_label text, -- nearest place to home: public, coarse
  bio text not null default '' check (char_length(bio) <= 200),
  skills public.job_category[] not null default enum_range(null::public.job_category),
  schedule jsonb not null default private.every_day_schedule() check (jsonb_typeof(schedule) = 'object'),
  max_dist_m integer not null default 2000 check (max_dist_m in (500, 1000, 2000, 5000, 20000)),
  locale text not null default 'en' check (locale in ('en', 'ro')),
  accepts_card boolean not null default false, -- Stripe Connect payouts active; written only by the server
  is_example boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  home extensions.geography(point, 4326),
  home_label text check (home_label is null or char_length(home_label) <= 120),
  savings_goal_name text check (savings_goal_name is null or char_length(savings_goal_name) <= 60),
  savings_goal_lei integer check (savings_goal_lei is null or savings_goal_lei between 1 and 100000),
  last_seen_level integer not null default 1
);
create index profile_private_home_idx on public.profile_private using gist (home);

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_path, bio, skills, schedule, max_dist_m, locale) on public.profiles to authenticated;
grant select on public.profile_private to authenticated;
-- home and home_label change only through set_home(), which checks the service area.
grant update (phone, savings_goal_name, savings_goal_lei, last_seen_level) on public.profile_private to authenticated;

create policy "profiles are readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "people update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "people read their own private details" on public.profile_private
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "people update their own private details" on public.profile_private
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- New sign-up -> profile rows. The name comes from the OAuth provider or the sign-up form, and is
-- confirmed during onboarding. The fallback avoids failing the sign-up when no name is given.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  ));
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'en');
begin
  if char_length(v_name) < 2 then
    v_name := 'Neighbour';
  end if;
  insert into public.profiles (id, display_name, locale, is_example)
  values (
    new.id,
    left(v_name, 40),
    case when v_locale in ('en', 'ro') then v_locale else 'en' end,
    coalesce((new.raw_app_meta_data ->> 'is_example')::boolean, false)
  );
  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
