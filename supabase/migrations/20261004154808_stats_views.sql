-- Read models. Views run as the caller (security_invoker), so table RLS still applies.

-- Every job as the app shows it: fuzzed pin as lat/lng, the viewer's distance (from the fuzzed pin,
-- rounded to 100 m so exact spots can't be worked out), and whether it fits the viewer's distance and hours.
create view public.job_cards
with (security_invoker = true) as
select
  j.id,
  j.poster_id,
  j.category,
  j.category_label,
  j.title,
  j.description,
  j.area_label,
  j.starts_on,
  j.start_min,
  j.dur_min,
  j.starts_at,
  j.pay_lei,
  j.status,
  j.helper_id,
  j.started_at,
  j.finished_at,
  j.minutes,
  j.confirmed_at,
  j.half1_paid_at,
  j.paid_at,
  j.cancelled_at,
  j.is_example,
  j.created_at,
  extensions.st_y(j.public_loc::extensions.geometry) as lat,
  extensions.st_x(j.public_loc::extensions.geometry) as lng,
  case
    when me.home is null then null
    else greatest(100, round(extensions.st_distance(j.public_loc, me.home) / 100) * 100)::integer
  end as dist_m,
  coalesce(
    extensions.st_dwithin(j.public_loc, me.home, mp.max_dist_m)
      and jsonb_typeof(sched.day_window) = 'array'
      and j.start_min >= (sched.day_window ->> 0)::integer
      and j.start_min + j.dur_min <= (sched.day_window ->> 1)::integer,
    false
  ) as fits_me,
  private.f_unaccent(lower(j.title || ' ' || j.description)) as search_text,
  p.display_name as poster_name,
  p.avatar_path as poster_avatar
from public.jobs j
left join public.profiles p on p.id = j.poster_id
left join public.profile_private me on me.user_id = (select auth.uid())
left join public.profiles mp on mp.id = (select auth.uid())
left join lateral (select mp.schedule -> extract(dow from j.starts_on)::integer::text as day_window) sched on true;

grant select on public.job_cards to authenticated;

-- Public numbers for a profile. Earnings are never part of it. Ratings count only revealed reviews
-- (double-blind), whoever is asking, so averages can't leak a review before it is shown.
create view public.profile_stats
with (security_invoker = true) as
select
  p.id as user_id,
  coalesce(h.jobs_done, 0)::integer as jobs_done,
  coalesce(h.minutes, 0)::integer as minutes,
  coalesce(h.points, 0)::integer as points,
  coalesce(posted.jobs_posted, 0)::integer as jobs_posted,
  hr.avg_stars as helper_rating,
  coalesce(hr.n, 0)::integer as helper_reviews,
  pr.avg_stars as poster_rating,
  coalesce(pr.n, 0)::integer as poster_reviews
from public.profiles p
left join lateral (
  select count(*) as jobs_done,
    sum(coalesce(j.minutes, j.dur_min)) as minutes,
    sum(private.job_points(coalesce(j.minutes, j.dur_min))) as points
  from public.jobs j
  where j.helper_id = p.id and j.status in ('completed', 'paid')
) h on true
left join lateral (
  select count(*) as jobs_posted from public.jobs j where j.poster_id = p.id and j.status in ('completed', 'paid')
) posted on true
left join lateral (
  select round(avg(r.stars), 1) as avg_stars, count(*) as n
  from public.reviews r where r.subject_id = p.id and r.subject_role = 'helper'
    and private.review_is_revealed(r.job_id, r.author_id, r.created_at)
) hr on true
left join lateral (
  select round(avg(r.stars), 1) as avg_stars, count(*) as n
  from public.reviews r where r.subject_id = p.id and r.subject_role = 'poster'
    and private.review_is_revealed(r.job_id, r.author_id, r.created_at)
) pr on true;

grant select on public.profile_stats to authenticated;

-- The Top board. p_period: 'all' or 'YYYY-MM' (month of confirmation, Bucharest time).
-- p_by: 'points' | 'jobs' | 'time'. Ties: points, then average rating (as in the prototype).
create function public.leaderboard(p_period text default 'all', p_by text default 'points', p_limit integer default 100)
returns table (
  user_id uuid,
  display_name text,
  avatar_path text,
  is_example boolean,
  jobs_done integer,
  minutes integer,
  points integer,
  avg_rating numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with done as (
    select j.id, j.helper_id, coalesce(j.minutes, j.dur_min) as mins
    from public.jobs j
    where j.status in ('completed', 'paid')
      and j.helper_id is not null
      and (
        p_period = 'all'
        or to_char(j.confirmed_at at time zone 'Europe/Bucharest', 'YYYY-MM') = p_period
      )
  ),
  agg as (
    select d.helper_id,
      count(*)::integer as jobs_done,
      sum(d.mins)::integer as minutes,
      sum(private.job_points(d.mins))::integer as points,
      round(avg(r.stars), 1) as avg_rating
    from done d
    left join public.reviews r on r.job_id = d.id and r.subject_role = 'helper'
      and private.review_is_revealed(r.job_id, r.author_id, r.created_at)
    group by d.helper_id
  )
  select a.helper_id, p.display_name, p.avatar_path, p.is_example, a.jobs_done, a.minutes, a.points, a.avg_rating
  from agg a
  join public.profiles p on p.id = a.helper_id
  order by
    case p_by when 'jobs' then a.jobs_done when 'time' then a.minutes else a.points end desc,
    a.points desc,
    a.avg_rating desc nulls last
  limit least(greatest(p_limit, 1), 200)
$$;

-- The five most asked-for categories (all jobs, "other" left out), with how many are open now.
create function public.popular_categories()
returns table (category public.job_category, total integer, open_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select j.category, count(*)::integer, (count(*) filter (where j.status = 'open'))::integer
  from public.jobs j
  where j.category <> 'other' and j.status <> 'cancelled'
  group by j.category
  order by count(*) desc, j.category
  limit 5
$$;

-- Contact details after the pick: the other person's phone (if they added one) and, for the helper,
-- the street address and exact spot. Empty for anyone else, or before the pick.
create function public.job_contact(p_job_id uuid)
returns table (
  other_id uuid,
  other_name text,
  other_avatar text,
  phone text,
  address text,
  lat double precision,
  lng double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    other.id,
    other.display_name,
    other.avatar_path,
    pp.phone,
    jp.address,
    extensions.st_y(jp.exact_loc::extensions.geometry),
    extensions.st_x(jp.exact_loc::extensions.geometry)
  from public.jobs j
  join public.job_private jp on jp.job_id = j.id
  join public.profiles other
    on other.id = case when j.poster_id = (select auth.uid()) then j.helper_id else j.poster_id end
  left join public.profile_private pp on pp.user_id = other.id
  where j.id = p_job_id
    and j.status in ('accepted', 'started', 'done', 'completed', 'paid')
    and (select auth.uid()) in (j.poster_id, j.helper_id)
$$;

-- For the poster: everyone with a pending offer, with their track record and how far they live
-- from the job (rounded to 500 m, never exact).
create function public.offer_candidates(p_job_id uuid)
returns table (
  offer_id uuid,
  helper_id uuid,
  display_name text,
  avatar_path text,
  is_example boolean,
  offered_at timestamptz,
  dist_m integer,
  jobs_done integer,
  points integer,
  helper_rating numeric,
  helper_reviews integer,
  conversation_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.helper_id,
    p.display_name,
    p.avatar_path,
    p.is_example,
    o.created_at,
    case when pp.home is null then null
      else greatest(500, round(extensions.st_distance(jp.exact_loc, pp.home) / 500) * 500)::integer end,
    s.jobs_done,
    s.points,
    s.helper_rating,
    s.helper_reviews,
    c.id
  from public.offers o
  join public.jobs j on j.id = o.job_id
  join public.job_private jp on jp.job_id = j.id
  join public.profiles p on p.id = o.helper_id
  left join public.profile_private pp on pp.user_id = o.helper_id
  left join public.profile_stats s on s.user_id = o.helper_id
  left join public.conversations c on c.job_id = o.job_id and c.helper_id = o.helper_id
  where o.job_id = p_job_id
    and o.status = 'pending'
    and j.poster_id = (select auth.uid())
  order by o.created_at
$$;

revoke execute on function public.leaderboard(text, text, integer) from public, anon;
revoke execute on function public.popular_categories() from public, anon;
revoke execute on function public.job_contact(uuid) from public, anon;
revoke execute on function public.offer_candidates(uuid) from public, anon;
grant execute on function public.leaderboard(text, text, integer) to authenticated;
grant execute on function public.popular_categories() to authenticated;
grant execute on function public.job_contact(uuid) to authenticated;
grant execute on function public.offer_candidates(uuid) to authenticated;
