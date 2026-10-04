-- Removes every example person and job (run before launch: npx supabase db query --linked -f supabase/cleanup_examples.sql).
begin;
delete from public.jobs where is_example;
delete from auth.users where raw_app_meta_data ->> 'is_example' = 'true';
commit;
