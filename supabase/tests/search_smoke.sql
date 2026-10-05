-- Job search: runs after lifecycle_smoke.sql in the same rolled-back transaction, reusing its people
-- (P = a1 posts, H = a2 searches; both live near Floreasca). Test jobs are titled "Zqx…" so the
-- example data in the database doesn't change the numbers.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- A weekday and a Saturday, both at least tomorrow.
insert into public._t values
  ('wed', (private.bucharest_today() + 1 + ((3 - extract(isodow from private.bucharest_today() + 1)::integer + 7) % 7))::text),
  ('sat', (private.bucharest_today() + 1 + ((6 - extract(isodow from private.bucharest_today() + 1)::integer + 7) % 7))::text);

-- Near home (Floreasca), far (Otopeni) and a weekend job in between.
insert into public._t values
  ('s_near', public.create_job('pet', null, 'Zqx walk the dog', '', (select v::date from public._t where k = 'wed'), 600, 30, 20, 44.4598, 26.1047, 'Str. A 1')::text),
  ('s_far', public.create_job('errands', null, 'Zqx shopping run', '', (select v::date from public._t where k = 'wed'), 900, 60, 50, 44.5510, 26.0700, 'Str. B 2')::text),
  ('s_wkd', public.create_job('tech', null, 'Zqx set up a phone', '', (select v::date from public._t where k = 'sat'), 700, 30, 30, 44.4700, 26.1000, 'Str. C 3')::text);

-- Own jobs never show in your own search.
do $$ begin
  assert (select count(*) from public.search_jobs(p_q => 'zqx')) = 0, 'own jobs are left out';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
do $$
declare
  v_near uuid := (select v::uuid from public._t where k = 's_near');
  v_far uuid := (select v::uuid from public._t where k = 's_far');
  v_wkd uuid := (select v::uuid from public._t where k = 's_wkd');
begin
  assert (select count(*) from public.search_jobs(p_q => 'zqx')) = 3, 'all three found';
  -- Accents and case don't matter; LIKE wildcards are taken literally.
  assert (select count(*) from public.search_jobs(p_q => 'ZQX ȘHOPPING')) = 1, 'accents and case are ignored';
  assert (select count(*) from public.search_jobs(p_q => 'zqx shopping')) = 1, 'phrase found';
  assert (select count(*) from public.search_jobs(p_q => '%')) = 0, 'a percent sign is not a wildcard';

  -- Nearest first by default, from home.
  assert (select id from public.search_jobs(p_q => 'zqx') limit 1) = v_near, 'nearest first';
  assert (select array_agg(dist_m) = array_agg(dist_m order by dist_m) from public.search_jobs(p_q => 'zqx')), 'ordered by distance';
  assert (select bool_and(dist_m % 100 = 0) from public.search_jobs(p_q => 'zqx')), 'rounded to 100 m';
  assert (select id from public.search_jobs(p_q => 'zqx', p_sort => 'pay') limit 1) = v_far, 'highest pay first';
  assert (select id from public.search_jobs(p_q => 'zqx', p_sort => 'soon') offset 2 limit 1) = v_wkd
    or (select v::date from public._t where k = 'sat') < (select v::date from public._t where k = 'wed'), 'soonest first';

  -- "Near me now" in Otopeni: the far job becomes the nearest. Outside the area: back to home.
  assert (select id from public.search_jobs(p_q => 'zqx', p_lat => 44.5500, p_lng => 26.0710) limit 1) = v_far, 'origin moves';
  assert (select id from public.search_jobs(p_q => 'zqx', p_lat => 45.75, p_lng => 21.23) limit 1) = v_near, 'outside the area: home';
  assert (select dist_m from public.job_cards_for(array[v_far], 44.5500, 26.0710)) < 1000, 'job card from the origin';

  -- Filters.
  assert (select count(*) from public.search_jobs(p_q => 'zqx', p_min_pay => 40)) = 1, 'min pay';
  assert (select count(*) from public.search_jobs(p_q => 'zqx', p_max_dist_m => 3000)) = 2, 'max distance';
  assert (select array_agg(id) from public.search_jobs(p_q => 'zqx', p_when => 'weekend')) = array[v_wkd], 'weekend';
  assert (select count(*) from public.search_jobs(p_q => 'zqx', p_category => 'pet')) = 1, 'category';

  -- Each chip's count equals the cards it shows.
  assert (
    select bool_and(c.open_count = (select count(*) from public.search_jobs(p_q => 'zqx', p_category => c.category)))
    from public.search_job_counts(p_q => 'zqx') c
  ), 'counts match results';
  assert (select sum(open_count) from public.search_job_counts(p_q => 'zqx')) = 3, 'counts add up';
  assert (select open_count from public.search_job_counts(p_q => 'zqx', p_min_pay => 40) where category = 'errands') = 1, 'counts follow filters';

  -- Paging.
  assert (select count(*) from public.search_jobs(p_q => 'zqx', p_limit => 2)) = 2, 'limit';
  assert (select id from public.search_jobs(p_q => 'zqx', p_limit => 1, p_offset => 1)) <> v_near, 'offset';
end $$;
reset role;

-- The "Show examples" switch.
update public.jobs set is_example = true where id = (select v::uuid from public._t where k = 's_wkd');
set local role authenticated;
do $$ begin
  assert (select count(*) from public.search_jobs(p_q => 'zqx')) = 3, 'examples shown by default';
  assert (select count(*) from public.search_jobs(p_q => 'zqx', p_examples => false)) = 2, 'examples hidden';
  assert (select count(*) from public.search_job_counts(p_q => 'zqx', p_examples => false) where category = 'tech') = 0, 'counts without examples';
end $$;
reset role;

-- Signed-out visitors can't search.
set local role anon;
do $$ begin
  begin
    perform public.search_jobs(p_q => 'zqx');
    assert false, 'anon cannot search';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'SEARCH SMOKE TEST PASSED' as result;
