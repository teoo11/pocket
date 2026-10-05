-- Job photos: up to 4 per job, added while posting. The browser shrinks each photo to at most 1280px
-- WebP (which also drops EXIF data such as GPS) and uploads it to job-photos/<user id>/<file>.webp;
-- set_job_photos then attaches the paths to the poster's open job. Public to read, like avatars.

alter table public.jobs
  add column photo_paths text[] not null default '{}'
  constraint jobs_photo_paths_max check (cardinality(photo_paths) <= 4);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-photos', 'job-photos', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "people upload their own job photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'job-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "people read their own job photo files" on storage.objects
  for select to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "people delete their own job photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Attach (or replace) the photos of one of my open jobs. Every path must be my own uploaded file.
create function public.set_job_photos(p_job_id uuid, p_paths text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.current_user_id();
  v_paths text[] := coalesce(p_paths, '{}');
  v_path text;
begin
  if not exists (select 1 from public.jobs where id = p_job_id and poster_id = v_uid) then
    perform private.fail('not_found');
  end if;
  if not exists (select 1 from public.jobs where id = p_job_id and status = 'open') then
    perform private.fail('invalid_state');
  end if;
  if cardinality(v_paths) > 4 or cardinality(v_paths) <> (select count(distinct p) from unnest(v_paths) p) then
    perform private.fail('invalid_input');
  end if;
  foreach v_path in array v_paths loop
    if v_path !~ ('^' || v_uid::text || '/[A-Za-z0-9_-]{1,40}\.webp$')
       or not exists (select 1 from storage.objects o where o.bucket_id = 'job-photos' and o.name = v_path) then
      perform private.fail('invalid_input');
    end if;
  end loop;

  update public.jobs set photo_paths = v_paths where id = p_job_id;
end;
$$;

revoke execute on function public.set_job_photos(uuid, text[]) from public, anon;
grant execute on function public.set_job_photos(uuid, text[]) to authenticated;
