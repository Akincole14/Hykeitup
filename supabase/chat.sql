-- =====================================================================
-- Hyke It Up — shared community chat
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- (Run setup.sql first — this relies on public.profiles.)
--
-- Creates chat messages, announcements and emoji reactions that every
-- signed-in member shares in real time. Only signed-in members can read;
-- members can post and edit their own messages; only admins can delete
-- messages or post / edit / delete announcements.
-- =====================================================================

-- ---------- Helpers ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- Members can see each other's username + first name (for @mentions and
-- the avatar strip) — but never phone numbers or mailing-list choices.
drop policy if exists "Members see directory" on public.profiles;
create policy "Members see directory"
  on public.profiles for select to authenticated using (true);
revoke select on public.profiles from anon, authenticated;
grant select (id, username, first_name) on public.profiles to authenticated;

-- ---------- Tables ----------
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  username    text not null default '',
  body        text not null check (char_length(body) between 1 and 2000),
  reply_to    jsonb,
  edited      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  username    text not null default '',
  body        text not null check (char_length(body) between 1 and 4000),
  image_url   text check (image_url is null or char_length(image_url) < 1500000),
  edited      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_reactions (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null check (target_type in ('message', 'announcement')),
  target_id    uuid not null,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  username     text not null default '',
  emoji        text not null check (char_length(emoji) between 1 and 16),
  created_at   timestamptz not null default now(),
  unique (target_type, target_id, user_id, emoji)
);

create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);
create index if not exists chat_reactions_target_idx on public.chat_reactions (target_id);

-- ---------- Author stamping (no spoofing names or dates) ----------
create or replace function public.stamp_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;
  select p.username into new.username from public.profiles p where p.id = new.user_id;
  if new.username is null then
    raise exception 'No member profile found for this account';
  end if;
  return new;
end;
$$;

drop trigger if exists stamp_chat_messages on public.chat_messages;
create trigger stamp_chat_messages before insert or update on public.chat_messages
  for each row execute procedure public.stamp_author();

drop trigger if exists stamp_announcements on public.announcements;
create trigger stamp_announcements before insert or update on public.announcements
  for each row execute procedure public.stamp_author();

drop trigger if exists stamp_chat_reactions on public.chat_reactions;
create trigger stamp_chat_reactions before insert on public.chat_reactions
  for each row execute procedure public.stamp_author();

-- Remove reactions when their message / announcement is deleted
create or replace function public.cleanup_reactions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.chat_reactions where target_id = old.id;
  return old;
end;
$$;

drop trigger if exists cleanup_message_reactions on public.chat_messages;
create trigger cleanup_message_reactions after delete on public.chat_messages
  for each row execute procedure public.cleanup_reactions();

drop trigger if exists cleanup_announcement_reactions on public.announcements;
create trigger cleanup_announcement_reactions after delete on public.announcements
  for each row execute procedure public.cleanup_reactions();

-- ---------- Row level security ----------
alter table public.chat_messages  enable row level security;
alter table public.announcements  enable row level security;
alter table public.chat_reactions enable row level security;

-- Messages: members read all; post as themselves; edit/delete own (admins: any)
drop policy if exists "Members read messages" on public.chat_messages;
create policy "Members read messages" on public.chat_messages
  for select to authenticated using (true);
drop policy if exists "Members post messages" on public.chat_messages;
create policy "Members post messages" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members edit own messages" on public.chat_messages;
create policy "Members edit own messages" on public.chat_messages
  for update to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Members delete own messages" on public.chat_messages;
drop policy if exists "Admins delete messages" on public.chat_messages;
create policy "Admins delete messages" on public.chat_messages
  for delete to authenticated using (public.is_admin());

-- Announcements: members read; only admins write
drop policy if exists "Members read announcements" on public.announcements;
create policy "Members read announcements" on public.announcements
  for select to authenticated using (true);
drop policy if exists "Admins post announcements" on public.announcements;
create policy "Admins post announcements" on public.announcements
  for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit announcements" on public.announcements;
create policy "Admins edit announcements" on public.announcements
  for update to authenticated using (public.is_admin());
drop policy if exists "Admins delete announcements" on public.announcements;
create policy "Admins delete announcements" on public.announcements
  for delete to authenticated using (public.is_admin());

-- Reactions: members read all; add/remove their own
drop policy if exists "Members read reactions" on public.chat_reactions;
create policy "Members read reactions" on public.chat_reactions
  for select to authenticated using (true);
drop policy if exists "Members add reactions" on public.chat_reactions;
create policy "Members add reactions" on public.chat_reactions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members remove own reactions" on public.chat_reactions;
create policy "Members remove own reactions" on public.chat_reactions
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- Table access (signed-in members only; nothing for anon) ----------
revoke all on public.chat_messages, public.announcements, public.chat_reactions from anon;
grant select, insert, delete on public.chat_messages, public.announcements, public.chat_reactions to authenticated;
grant update (body, edited) on public.chat_messages to authenticated;
grant update (body, image_url, edited) on public.announcements to authenticated;

-- ---------- Real-time updates ----------
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.chat_reactions;
exception when duplicate_object then null;
end $$;
