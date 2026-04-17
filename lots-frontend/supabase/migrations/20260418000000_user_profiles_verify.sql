-- Adds the columns the user invite/verify flow depends on.
-- Idempotent: safe to re-run.

alter table public.user_profiles
  add column if not exists statut text default 'actif',
  add column if not exists user_code text,
  add column if not exists organisation text,
  add column if not exists verify_token text,
  add column if not exists verify_token_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_profiles_verify_token_unique'
  ) then
    create unique index user_profiles_verify_token_unique
      on public.user_profiles (verify_token)
      where verify_token is not null;
  end if;
end $$;
