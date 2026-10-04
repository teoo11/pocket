-- Two-way reviews after a job: the poster reviews the helper and the helper reviews the poster.
-- Double-blind: a review is shown once both sides have reviewed, or 7 days after it was written.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  subject_id uuid references public.profiles (id) on delete set null,
  subject_role public.review_role not null,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (job_id, author_id),
  constraint reviews_tags_allowed check (
    (subject_role = 'helper' and tags <@ array['on_time', 'friendly', 'careful', 'great_job'])
    or (subject_role = 'poster' and tags <@ array['clear_instructions', 'friendly', 'paid_on_time', 'was_ready'])
  )
);
create index reviews_subject_idx on public.reviews (subject_id, subject_role, created_at desc);
create index reviews_author_idx on public.reviews (author_id);

alter table public.reviews enable row level security;
grant select on public.reviews to authenticated;

create function private.review_is_revealed(p_job_id uuid, p_author_id uuid, p_created_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_created_at < now() - interval '7 days'
    or exists (select 1 from public.reviews r where r.job_id = p_job_id and r.author_id is distinct from p_author_id)
$$;
grant execute on function private.review_is_revealed(uuid, uuid, timestamptz) to authenticated;

create policy "reviews are readable by their author, or once revealed" on public.reviews
  for select to authenticated
  using (author_id = (select auth.uid()) or private.review_is_revealed(job_id, author_id, created_at));
