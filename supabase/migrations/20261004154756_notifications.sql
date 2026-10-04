-- In-app notifications. Stored as a type key plus parameters, so they render in the reader's language.
-- Written only by the lifecycle functions (security definer); people can only mark their own as read.

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type ~ '^[a-z_]{2,40}$'),
  data jsonb not null default '{}'::jsonb,
  link text check (link is null or link ~ '^/'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "people read their own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "people mark their own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function private.notify(p_user_id uuid, p_type text, p_data jsonb, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, data, link)
  select p_user_id, p_type, coalesce(p_data, '{}'::jsonb), p_link
  where p_user_id is not null
$$;
