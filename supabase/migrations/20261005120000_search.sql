-- Job search in one place: the filters, the distance origin ("from my home" or "near me now"),
-- the results and the per-category counts. Everything runs as the caller, so job RLS still applies.

-- Where distances are measured from: the given point when it is inside Bucharest and Ilfov,
-- otherwise the viewer's home (null when they have none).
create function private.search_origin(p_lat double precision, p_lng double precision)
returns extensions.geography
language sql
stable
set search_path = ''
as $$
  select case
    when private.in_service_area(private.make_point(p_lat, p_lng)) then private.make_point(p_lat, p_lng)
    else (select home from public.profile_private where user_id = (select auth.uid()))
  end
$$;

-- The open, upcoming jobs that match every filter except the category. Shared by the results and the
-- counts, so a chip's number is always the number of cards it shows.
create function private.search_base(
  p_origin extensions.geography,
  p_q text,
  p_max_dist_m integer,
  p_min_pay integer,
  p_when text,
  p_examples boolean
)
returns table (id uuid, category public.job_category)
language sql
stable
set search_path = ''
as $$
  with term as (
    select nullif(
      replace(replace(replace(private.f_unaccent(lower(btrim(coalesce(p_q, '')))), '\', '\\'), '%', '\%'), '_', '\_'),
      ''
    ) as t
  )
  select j.id, j.category
  from public.jobs j, term
  where j.status = 'open'
    and j.starts_at > now()
    and j.poster_id is distinct from (select auth.uid())
    and (coalesce(p_examples, true) or not j.is_example)
    and (p_min_pay is null or j.pay_lei >= p_min_pay)
    and (p_max_dist_m is null or extensions.st_dwithin(j.public_loc, p_origin, p_max_dist_m))
    and (
      term.t is null
      or private.f_unaccent(lower(j.title || ' ' || j.description || ' ' || coalesce(j.category_label, ''))) like '%' || term.t || '%'
    )
    and case coalesce(p_when, 'any')
      when 'today' then j.starts_on = private.bucharest_today()
      when 'tomorrow' then j.starts_on = private.bucharest_today() + 1
      when 'week' then j.starts_on <= private.bucharest_today() + 7
      when 'weekend' then extract(isodow from j.starts_on) in (6, 7)
      else true
    end
$$;

-- Job cards for the given ids, with the distance from the origin (rounded to 100 m, from the public pin).
-- The same columns as the job_cards view; job_cards stays for lists that always measure from home.
create function public.job_cards_for(p_ids uuid[], p_lat double precision default null, p_lng double precision default null)
returns setof public.job_cards
language sql
stable
set search_path = ''
as $$
  select
    j.id, j.poster_id, j.category, j.category_label, j.title, j.description, j.area_label,
    j.starts_on, j.start_min, j.dur_min, j.starts_at, j.pay_lei, j.status, j.helper_id,
    j.started_at, j.finished_at, j.minutes, j.confirmed_at, j.half1_paid_at, j.paid_at, j.cancelled_at,
    j.is_example, j.created_at,
    extensions.st_y(j.public_loc::extensions.geometry),
    extensions.st_x(j.public_loc::extensions.geometry),
    case
      when o.origin is null then null
      else greatest(100, round(extensions.st_distance(j.public_loc, o.origin) / 100) * 100)::integer
    end,
    coalesce(
      extensions.st_dwithin(j.public_loc, me.home, mp.max_dist_m)
        and jsonb_typeof(mp.schedule -> extract(dow from j.starts_on)::integer::text) = 'array'
        and j.start_min >= (mp.schedule -> extract(dow from j.starts_on)::integer::text ->> 0)::integer
        and j.start_min + j.dur_min <= (mp.schedule -> extract(dow from j.starts_on)::integer::text ->> 1)::integer,
      false
    ),
    private.f_unaccent(lower(j.title || ' ' || j.description)),
    p.display_name,
    p.avatar_path
  from public.jobs j
  cross join (select private.search_origin(p_lat, p_lng) as origin) o
  left join public.profiles p on p.id = j.poster_id
  left join public.profile_private me on me.user_id = (select auth.uid())
  left join public.profiles mp on mp.id = (select auth.uid())
  where j.id = any (p_ids)
$$;

-- The search: matching cards in the chosen order, one page at a time.
create function public.search_jobs(
  p_q text default null,
  p_category public.job_category default null,
  p_max_dist_m integer default null,
  p_min_pay integer default null,
  p_when text default 'any',
  p_examples boolean default true,
  p_sort text default 'near',
  p_lat double precision default null,
  p_lng double precision default null,
  p_limit integer default 60,
  p_offset integer default 0
)
returns setof public.job_cards
language sql
stable
set search_path = ''
as $$
  select c.*
  from public.job_cards_for(
    array(
      select b.id
      from private.search_base(private.search_origin(p_lat, p_lng), p_q, p_max_dist_m, p_min_pay, p_when, p_examples) b
      where p_category is null or b.category = p_category
    ),
    p_lat,
    p_lng
  ) c
  order by
    case when p_sort = 'pay' then c.pay_lei end desc nulls last,
    case when p_sort = 'soon' then c.starts_at end asc nulls last,
    c.dist_m asc nulls last,
    c.starts_at asc,
    c.id
  limit least(greatest(coalesce(p_limit, 60), 1), 300)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- How many jobs each category chip would show with the other filters as they are.
create function public.search_job_counts(
  p_q text default null,
  p_max_dist_m integer default null,
  p_min_pay integer default null,
  p_when text default 'any',
  p_examples boolean default true,
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (category public.job_category, open_count integer)
language sql
stable
set search_path = ''
as $$
  select b.category, count(*)::integer
  from private.search_base(private.search_origin(p_lat, p_lng), p_q, p_max_dist_m, p_min_pay, p_when, p_examples) b
  group by b.category
$$;

-- Home no longer shows "popular categories": the chips show live counts instead.
drop function public.popular_categories();

revoke execute on function public.job_cards_for(uuid[], double precision, double precision) from public, anon;
revoke execute on function public.search_jobs(text, public.job_category, integer, integer, text, boolean, text, double precision, double precision, integer, integer) from public, anon;
revoke execute on function public.search_job_counts(text, integer, integer, text, boolean, double precision, double precision) from public, anon;
grant execute on function public.job_cards_for(uuid[], double precision, double precision) to authenticated;
grant execute on function public.search_jobs(text, public.job_category, integer, integer, text, boolean, text, double precision, double precision, integer, integer) to authenticated;
grant execute on function public.search_job_counts(text, integer, integer, text, boolean, double precision, double precision) to authenticated;
grant execute on function private.search_origin(double precision, double precision) to authenticated;
grant execute on function private.search_base(extensions.geography, text, integer, integer, text, boolean) to authenticated;
