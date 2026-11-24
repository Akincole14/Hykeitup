-- =====================================================================
-- Hyke It Up — landing page mailing list
-- Run once in Supabase → SQL Editor → New query → paste → Run.
--
-- Visitors can ADD themselves (insert only). Nobody can read the list
-- through the website — only you, from the Supabase dashboard.
-- =====================================================================

create table if not exists public.mailing_signups (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null check (char_length(first_name) between 1 and 80),
  last_name      text not null check (char_length(last_name) between 1 and 80),
  email          text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  phone          text check (phone is null or char_length(phone) <= 30),
  subscribed     boolean not null default false,
  subscribed_at  timestamptz,
  source         text not null default 'landing' check (char_length(source) <= 40),
  created_at     timestamptz not null default now()
);

-- One row per email address (a repeat sign-up is treated as "already on the list")
create unique index if not exists mailing_signups_email_key on public.mailing_signups (lower(email));

create or replace function public.mailing_signups_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  new.created_at := now();
  new.subscribed_at := case when new.subscribed then now() end;
  return new;
end;
$$;

drop trigger if exists mailing_signups_stamp on public.mailing_signups;
create trigger mailing_signups_stamp before insert on public.mailing_signups
  for each row execute procedure public.mailing_signups_stamp();

alter table public.mailing_signups enable row level security;

drop policy if exists "Anyone can sign up" on public.mailing_signups;
create policy "Anyone can sign up" on public.mailing_signups
  for insert to anon, authenticated with check (true);

revoke all on public.mailing_signups from anon, authenticated;
grant insert on public.mailing_signups to anon, authenticated;

-- ---------------------------------------------------------------------
-- EXPORT FOR MAILCHIMP / FLODESK — run in the SQL Editor, then use
-- "Download CSV". Only people who ticked "subscribe" are included.
-- ---------------------------------------------------------------------
-- select email as "Email Address", first_name as "First Name",
--        last_name as "Last Name", coalesce(phone, '') as "Phone Number",
--        subscribed_at as "Subscribed At"
-- from public.mailing_signups
-- where subscribed
-- order by subscribed_at desc;
