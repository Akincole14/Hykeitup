-- =====================================================================
-- Hyke It Up — mailing list update v2: add Gender
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- =====================================================================
alter table public.mailing_signups
  add column if not exists gender text
  check (gender is null or gender in ('female', 'male', 'prefer_not_to_say'));
