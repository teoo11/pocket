-- Foundation: extensions, deny-by-default privileges, the private helper schema and the shared enums.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Deny by default. Supabase used to grant anon/authenticated full rights on every new object in public;
-- from here on, every table and function grants exactly what it needs.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- Internal helpers live in a schema the Data API does not expose.
-- Signed-in users get USAGE so RLS policies and views can call the few helpers granted below; nothing
-- here is reachable through the API, and every function must be granted explicitly.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public;

-- Immutable unaccent wrapper so it can be used in indexes (search ignores Romanian diacritics: ș = s).
create function private.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

create type public.job_category as enum (
  'pet', 'tech', 'tutoring', 'carrying', 'plants', 'errands', 'household', 'creative', 'computer', 'other'
);
create type public.job_status as enum ('open', 'accepted', 'started', 'done', 'completed', 'paid', 'cancelled');
create type public.offer_status as enum ('pending', 'accepted', 'declined', 'withdrawn');
create type public.payment_method as enum ('cash', 'card');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'canceled', 'refunded');
create type public.review_role as enum ('helper', 'poster'); -- the role of the person being reviewed
create type public.report_kind as enum ('job', 'user', 'message', 'app');

-- "Today" and clock times in Pocket are always Bucharest time.
create function private.bucharest_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Bucharest')::date
$$;

-- Points per completed job: 1 for every 15 minutes, plus 1 for the job (SPEC §8).
create function private.job_points(p_minutes integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select floor(greatest(coalesce(p_minutes, 0), 0) / 15.0)::integer + 1
$$;

-- Words that are not allowed in a job (English and Romanian). Mirrored in src/features/jobs/safety.ts.
create function private.has_blocked_words(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select private.f_unaccent(lower(coalesce(p_text, ''))) ~ (
    '\m(overnight|alcohol|cigarettes?|drugs?|weapons?|massage|secret|don''?t tell|bank card|pin code'
    || '|peste noapte|alcool|tigari|tigara|droguri|drog|arma|arme|masaj|nu spune|card bancar|cod pin)\M'
  )
$$;

-- Pure helpers used inside views and RLS policies that run as the signed-in user.
grant execute on function private.f_unaccent(text) to authenticated;
grant execute on function private.bucharest_today() to authenticated;
grant execute on function private.job_points(integer) to authenticated;
