-- Realtime over private Broadcast channels, sent from the database (no tables in the publication).
--   user:<id>           new notifications for that person (bell + toast)
--   conversation:<id>   new chat messages, for the two people in it
--   job:<id>            "this job changed" pings: carries only the id, the page re-reads what it may see
-- Who can listen is decided by the RLS policy on realtime.messages below.

create function private.broadcast_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('id', new.id, 'type', new.type, 'data', new.data, 'link', new.link, 'created_at', new.created_at),
    'notification', 'user:' || new.user_id::text, true
  );
  return null;
end;
$$;

create trigger notifications_broadcast
  after insert on public.notifications
  for each row execute function private.broadcast_notification();

create function private.broadcast_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id', new.id, 'conversation_id', new.conversation_id, 'sender_id', new.sender_id,
      'body', new.body, 'created_at', new.created_at
    ),
    'message', 'conversation:' || new.conversation_id::text, true
  );
  return null;
end;
$$;

create trigger chat_messages_broadcast
  after insert on public.chat_messages
  for each row execute function private.broadcast_chat_message();

create function private.broadcast_job_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- The trigger argument names the column holding the job id ('id' on jobs, 'job_id' elsewhere).
  v_job_id uuid := (to_jsonb(new) ->> tg_argv[0])::uuid;
begin
  perform realtime.send(jsonb_build_object('job_id', v_job_id), 'job_changed', 'job:' || v_job_id::text, true);
  return null;
end;
$$;

create trigger jobs_broadcast after insert or update on public.jobs
  for each row execute function private.broadcast_job_changed('id');
create trigger offers_broadcast after insert or update on public.offers
  for each row execute function private.broadcast_job_changed('job_id');
create trigger payments_broadcast after insert or update on public.payments
  for each row execute function private.broadcast_job_changed('job_id');

create function private.can_listen(p_topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case split_part(p_topic, ':', 1)
    when 'user' then p_topic = 'user:' || (select auth.uid())::text
    when 'conversation' then exists (
      select 1 from public.conversations c
      where c.id::text = split_part(p_topic, ':', 2)
        and (select auth.uid()) in (c.poster_id, c.helper_id)
    )
    when 'job' then exists (
      select 1 from public.jobs j where j.id::text = split_part(p_topic, ':', 2)
    )
    else false
  end
$$;
grant execute on function private.can_listen(text) to authenticated;

create policy "pocket private channels" on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'broadcast' and private.can_listen((select realtime.topic())));
