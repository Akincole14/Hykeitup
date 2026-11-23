-- =====================================================================
-- Hyke It Up — Supabase setup
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Creates a private member profile for every sign-up, enforces unique
-- usernames, and records mailing-list consent.
-- =====================================================================

create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  first_name       text,
  last_name        text,
  phone            text,
  mailing_list     boolean not null default false,
  mailing_list_at  timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Members read own profile" on public.profiles;
create policy "Members read own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Members update own profile" on public.profiles;
create policy "Members update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Copy sign-up details into profiles. A duplicate username makes the
-- sign-up fail, which the site shows as "That username is already taken".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opted_in boolean := coalesce((new.raw_user_meta_data ->> 'mailing_list')::boolean, false);
begin
  insert into public.profiles (id, username, first_name, last_name, phone, mailing_list, mailing_list_at)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    opted_in,
    case when opted_in then now() end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- MAILING LIST EXPORT (run in the SQL Editor whenever you need it —
-- deliberately NOT a public view, so emails are never exposed to the site)
-- ---------------------------------------------------------------------
-- select u.email, p.first_name, p.last_name, p.mailing_list_at
-- from public.profiles p
-- join auth.users u on u.id = p.id
-- where p.mailing_list and u.email_confirmed_at is not null
-- order by p.mailing_list_at desc;

-- ---------------------------------------------------------------------
-- MAKE SOMEONE AN ADMIN (can post announcements) — replace the email:
-- ---------------------------------------------------------------------
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
-- where email = 'you@example.com';
