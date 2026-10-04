-- Offers to help, and the chat that opens with each offer (one conversation per job and helper).
-- Phone numbers stay hidden until the pick; chat is how the two sides talk before that.

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  helper_id uuid not null references public.profiles (id) on delete cascade,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
-- One live offer per person per job; after withdrawing, they can offer again.
create unique index offers_one_live_idx on public.offers (job_id, helper_id) where status in ('pending', 'accepted');
create index offers_job_idx on public.offers (job_id, status);
create index offers_helper_idx on public.offers (helper_id, status);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  poster_id uuid references public.profiles (id) on delete set null,
  helper_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  closed_at timestamptz, -- read-only once closed (not picked, offer withdrawn, job cancelled)
  unique (job_id, helper_id)
);
create index conversations_poster_idx on public.conversations (poster_id, last_message_at desc nulls last);
create index conversations_helper_idx on public.conversations (helper_id, last_message_at desc nulls last);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null default auth.uid(),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index chat_messages_conversation_idx on public.chat_messages (conversation_id, id desc);
create index chat_messages_sender_idx on public.chat_messages (sender_id);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_reads_user_idx on public.conversation_reads (user_id);

alter table public.offers enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.conversation_reads enable row level security;

grant select on public.offers to authenticated;
grant select on public.conversations to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert, update on public.conversation_reads to authenticated;

create function private.is_job_poster(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.jobs where id = p_job_id and poster_id = (select auth.uid()))
$$;

create policy "offers are readable by the helper and the poster" on public.offers
  for select to authenticated
  using (helper_id = (select auth.uid()) or private.is_job_poster(job_id));

-- Someone who offered keeps seeing the job after it is matched with someone else or cancelled.
create policy "people who offered can read the job" on public.jobs
  for select to authenticated
  using (exists (select 1 from public.offers o where o.job_id = jobs.id and o.helper_id = (select auth.uid())));

create policy "conversations are readable by their two people" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (poster_id, helper_id));

create function private.is_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and (select auth.uid()) in (c.poster_id, c.helper_id)
  )
$$;

create function private.is_open_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.closed_at is null and (select auth.uid()) in (c.poster_id, c.helper_id)
  )
$$;

create policy "messages are readable by the two people" on public.chat_messages
  for select to authenticated
  using (private.is_participant(conversation_id));
create policy "people write in their own open conversations" on public.chat_messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.is_open_conversation(conversation_id));

create policy "people manage their own read markers" on public.conversation_reads
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.is_participant(conversation_id));

-- Keep the inbox order and stop floods (20 messages a minute per person).
create function private.chat_message_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.chat_messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) > 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger chat_message_inserted
  after insert on public.chat_messages
  for each row execute function private.chat_message_inserted();

grant execute on function private.is_job_poster(uuid) to authenticated;
grant execute on function private.is_participant(uuid) to authenticated;
grant execute on function private.is_open_conversation(uuid) to authenticated;
