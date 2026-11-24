-- =====================================================================
-- Hyke It Up — chat update v2
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- 1. Only admins can delete chat messages (members can still edit their own).
-- 2. Reactions accept any emoji, not just the original four.
-- =====================================================================

-- 1. Deleting messages: admins only
drop policy if exists "Members delete own messages" on public.chat_messages;
drop policy if exists "Admins delete messages" on public.chat_messages;
create policy "Admins delete messages" on public.chat_messages
  for delete to authenticated using (public.is_admin());

-- 2. Any emoji as a reaction (short text only)
alter table public.chat_reactions drop constraint if exists chat_reactions_emoji_check;
alter table public.chat_reactions add constraint chat_reactions_emoji_check
  check (char_length(emoji) between 1 and 16);
