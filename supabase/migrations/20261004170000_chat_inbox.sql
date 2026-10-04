-- Chat inbox and live "new message" pings.

-- The signed-in person's conversations, newest first, with the other person, the job and the last message.
-- Security invoker: RLS on conversations, chat_messages, jobs and profiles decides what comes back.
create function public.my_conversations()
returns table (
  id uuid,
  job_id uuid,
  job_title text,
  job_status public.job_status,
  i_am_poster boolean,
  other_id uuid,
  other_name text,
  other_avatar text,
  last_body text,
  last_sender_id uuid,
  last_message_at timestamptz,
  unread integer,
  closed_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    c.id,
    c.job_id,
    j.title,
    j.status,
    c.poster_id = (select auth.uid()),
    p.id,
    p.display_name,
    p.avatar_path,
    m.body,
    m.sender_id,
    coalesce(c.last_message_at, c.created_at),
    (
      select count(*)::integer from public.chat_messages u
      where u.conversation_id = c.id
        and u.sender_id is distinct from (select auth.uid())
        and u.created_at > coalesce(r.last_read_at, '-infinity')
    ),
    c.closed_at
  from public.conversations c
  left join public.jobs j on j.id = c.job_id
  left join public.profiles p
    on p.id = case when c.poster_id = (select auth.uid()) then c.helper_id else c.poster_id end
  left join public.conversation_reads r on r.conversation_id = c.id and r.user_id = (select auth.uid())
  left join lateral (
    select body, sender_id from public.chat_messages
    where conversation_id = c.id order by id desc limit 1
  ) m on true
  where (select auth.uid()) in (c.poster_id, c.helper_id)
  order by coalesce(c.last_message_at, c.created_at) desc
  limit 100
$$;

revoke execute on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;

-- Number of conversations with unread messages, for the badge in the top bar.
create function public.unread_conversations()
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.conversations c
  left join public.conversation_reads r on r.conversation_id = c.id and r.user_id = (select auth.uid())
  where (select auth.uid()) in (c.poster_id, c.helper_id)
    and coalesce(c.last_message_at, '-infinity') > coalesce(r.last_read_at, '-infinity')
    and exists (
      select 1 from public.chat_messages u
      where u.conversation_id = c.id
        and u.sender_id is distinct from (select auth.uid())
        and u.created_at > coalesce(r.last_read_at, '-infinity')
    )
$$;

revoke execute on function public.unread_conversations() from public, anon;
grant execute on function public.unread_conversations() to authenticated;

-- Tell the other person (user:<id>, event "chat") so their badge and a toast update on any page.
create function private.broadcast_chat_ping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_to uuid;
begin
  select case when c.poster_id = new.sender_id then c.helper_id else c.poster_id end
    into v_to from public.conversations c where c.id = new.conversation_id;
  if v_to is not null then
    perform realtime.send(
      jsonb_build_object(
        'conversation_id', new.conversation_id,
        'sender_name', (select display_name from public.profiles where id = new.sender_id),
        'body', left(new.body, 140)
      ),
      'chat', 'user:' || v_to::text, true
    );
  end if;
  return null;
end;
$$;

create trigger chat_messages_ping
  after insert on public.chat_messages
  for each row execute function private.broadcast_chat_ping();
