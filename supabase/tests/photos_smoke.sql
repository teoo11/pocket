-- Job photos: runs after lifecycle_smoke.sql in the same rolled-back transaction, reusing its people
-- (H2 = a3 posts here, so P's daily posting limit is untouched; S = a4 is a stranger).

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);

-- Uploads land only in my own folder.
insert into storage.objects (bucket_id, name) values
  ('job-photos', '00000000-0000-4000-8000-0000000000a3/one.webp'),
  ('job-photos', '00000000-0000-4000-8000-0000000000a3/two.webp');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('job-photos', '00000000-0000-4000-8000-0000000000a1/sneaky.webp');
    assert false, 'upload into someone else''s folder should fail';
  exception when insufficient_privilege then null;
  end;
end $$;

insert into public._t values ('photo_job',
  public.create_job('plants', null, 'Water the plants', '', private.bucharest_today() + 2, 600, 30, 25, 44.4598, 26.1047, 'Str. Foto 4')::text);

do $$
declare
  v_job uuid := (select v::uuid from public._t where k = 'photo_job');
  me text := '00000000-0000-4000-8000-0000000000a3/';
begin
  assert (select photo_paths from public.jobs where id = v_job) = '{}', 'no photos by default';

  perform public.set_job_photos(v_job, array[me || 'one.webp', me || 'two.webp']);
  assert (select photo_paths from public.jobs where id = v_job) = array[me || 'one.webp', me || 'two.webp'], 'photos attached in order';

  begin
    perform public.set_job_photos(v_job, array['00000000-0000-4000-8000-0000000000a1/photo.webp']);
    assert false, 'someone else''s file should fail';
  exception when others then assert sqlerrm = 'invalid_input', sqlerrm;
  end;
  begin
    perform public.set_job_photos(v_job, array[me || 'missing.webp']);
    assert false, 'a file that was never uploaded should fail';
  exception when others then assert sqlerrm = 'invalid_input', sqlerrm;
  end;
  begin
    perform public.set_job_photos(v_job, array[me || 'one.webp', me || 'one.webp']);
    assert false, 'duplicates should fail';
  exception when others then assert sqlerrm = 'invalid_input', sqlerrm;
  end;
  begin
    perform public.set_job_photos(v_job, array[me || 'a.webp', me || 'b.webp', me || 'c.webp', me || 'd.webp', me || 'e.webp']);
    assert false, 'more than 4 should fail';
  exception when others then assert sqlerrm = 'invalid_input', sqlerrm;
  end;

  perform public.set_job_photos(v_job, '{}');
  assert (select photo_paths from public.jobs where id = v_job) = '{}', 'photos can be cleared';
  perform public.set_job_photos(v_job, array[me || 'one.webp']);
end $$;

-- A stranger sees the photos of an open job but cannot change them.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}', true);
do $$ declare v_job uuid := (select v::uuid from public._t where k = 'photo_job'); begin
  assert (select cardinality(photo_paths) from public.jobs where id = v_job) = 1, 'stranger sees the photo';
  begin
    perform public.set_job_photos(v_job, '{}');
    assert false, 'only the poster can change photos';
  exception when others then assert sqlerrm = 'not_found', sqlerrm;
  end;
end $$;
reset role;

select 'PHOTOS SMOKE TEST PASSED' as result;
