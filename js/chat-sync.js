// =====================================================================
// SHARED COMMUNITY CHAT — Supabase sync layer
// main.js / community-plus.js keep reading and writing the local cache
// (communityGet/communityStore). This file:
//   • fills that cache from Supabase when a member is signed in,
//   • turns local edits (send, edit, delete, react, announce) into
//     Supabase writes by diffing what main.js stores,
//   • listens for real-time changes so everyone sees updates instantly.
// Requires supabase/chat.sql to have been run.
// =====================================================================
(function () {
  const sb = window.hyuSupabase;
  if (!sb || typeof window.communityStore !== 'function') return;

  const $ = id => document.getElementById(id);
  const isUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');
  const ANN = 'ann:';

  let live = false;        // true once the shared tables answered
  let applying = false;    // true while we write server data into the cache
  let channel = null;
  let myId = null;
  let refetchTimer = null;
  let pendingRender = false;

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'auth-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4500);
  }

  function friendly(error) {
    if (!error) return '';
    if (/row-level security|permission/i.test(error.message)) return "You don't have permission to do that.";
    if (/No member profile/i.test(error.message)) return 'Your member profile is missing — please sign out and back in.';
    return error.message;
  }

  // Shrink big announcement photos before saving (max 1200px, JPEG)
  function shrinkImage(dataUrl) {
    return new Promise(resolve => {
      if (!/^data:image\//.test(dataUrl || '') || dataUrl.length < 400000) return resolve(dataUrl || null);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // ---------------------------------------------------------------
  // Server → local cache
  // ---------------------------------------------------------------
  function groupReactions(rows) {
    const map = new Map();
    rows.forEach(r => {
      const key = r.target_type + ':' + r.target_id;
      if (!map.has(key)) map.set(key, {});
      const bucket = map.get(key);
      (bucket[r.emoji] = bucket[r.emoji] || []).push(r.username);
    });
    return map;
  }

  async function refetch() {
    const [msgs, anns, reacts, profiles] = await Promise.all([
      sb.from('chat_messages').select('id, username, body, reply_to, edited, created_at').order('created_at', { ascending: false }).limit(300),
      sb.from('announcements').select('id, username, body, image_url, edited, created_at').order('created_at', { ascending: true }).limit(100),
      sb.from('chat_reactions').select('target_type, target_id, username, emoji'),
      sb.from('profiles').select('id, username, first_name'),
    ]);

    const err = msgs.error || anns.error || reacts.error;
    if (err) {
      if (!live) console.warn('[chat-sync] Shared chat not available yet — run supabase/chat.sql.', err.message);
      return;
    }
    live = true;
    document.body.classList.add('chat-live');

    const reactions = groupReactions(reacts.data || []);
    const messages = (msgs.data || []).slice().reverse().map(m => ({
      id: m.id,
      username: m.username,
      text: m.body,
      timestamp: Date.parse(m.created_at),
      edited: m.edited,
      replyTo: m.reply_to || undefined,
      reactions: reactions.get('message:' + m.id) || undefined,
    }));
    const announcements = (anns.data || []).map(a => ({
      id: a.id,
      username: a.username,
      text: a.body,
      imageUrl: a.image_url,
      timestamp: Date.parse(a.created_at),
      edited: a.edited,
      reactions: reactions.get('announcement:' + a.id) || undefined,
    }));

    applying = true;
    try {
      communityStore('messages', messages);
      communityStore('announcements', announcements);
      if (!profiles.error) {
        const session = getSession();
        const local = getUsers();
        const users = (profiles.data || []).map(p => {
          const prev = local.find(u => u.supabaseId === p.id || u.username === p.username) || {};
          return { ...prev, username: p.username, firstName: p.first_name || prev.firstName || p.username, supabaseId: p.id, joinedAt: prev.joinedAt || Date.now() };
        });
        // keep my own richer record (settings fields)
        const mine = local.find(u => u.username === session?.username);
        if (mine) {
          const i = users.findIndex(u => u.username === mine.username);
          if (i >= 0) users[i] = { ...users[i], ...mine };
        }
        communityStore('users', users);
      }
    } finally {
      applying = false;
    }
    render();
  }

  function render() {
    const container = $('chat-messages');
    if (!container) return;
    // Don't wipe a message someone is halfway through editing
    if (document.querySelector('#chat-messages .msg-edit-wrap, #announcements-list .msg-edit-wrap')) {
      pendingRender = true;
      return;
    }
    pendingRender = false;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const keep = container.scrollTop;
    window.renderAnnouncements?.();   // also re-renders the chat feed (community-plus.js)
    if (!nearBottom) container.scrollTop = keep;
  }

  function scheduleRefetch(delay = 250) {
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(refetch, delay);
  }

  // Finish a deferred render once an edit box closes
  document.addEventListener('click', e => {
    if (pendingRender && e.target.closest('.msg-save, .msg-cancel, .ann-save, .ann-cancel')) setTimeout(render, 50);
  });

  // ---------------------------------------------------------------
  // Local cache → server (diff what main.js stores)
  // ---------------------------------------------------------------
  const idOf = (kind, x) => (kind === 'messages' ? (x.id || String(x.timestamp)) : (x.id || String(x.timestamp)));
  const TARGET = { messages: 'message', announcements: 'announcement' };
  const TABLE = { messages: 'chat_messages', announcements: 'announcements' };

  async function pushDiff(kind, before, after) {
    const me = getSession()?.username;
    const prev = new Map((before || []).map(x => [idOf(kind, x), x]));
    const next = new Map((after || []).map(x => [idOf(kind, x), x]));
    const jobs = [];

    next.forEach((x, id) => {
      const p = prev.get(id);
      if (!p) {
        if (isUuid(id)) return; // already on the server
        if (kind === 'messages') {
          jobs.push(sb.from(TABLE[kind]).insert({ body: x.text, reply_to: x.replyTo || null }));
        } else {
          jobs.push(shrinkImage(x.imageUrl).then(image_url => sb.from(TABLE[kind]).insert({ body: x.text, image_url })));
        }
        return;
      }
      if (!isUuid(id)) return;
      const changed = p.text !== x.text || (kind === 'announcements' && p.imageUrl !== x.imageUrl);
      if (changed) {
        const patch = { body: x.text, edited: true };
        if (kind === 'announcements') jobs.push(shrinkImage(x.imageUrl).then(image_url => sb.from(TABLE[kind]).update({ ...patch, image_url }).eq('id', id)));
        else jobs.push(sb.from(TABLE[kind]).update(patch).eq('id', id));
      }
      // My reactions only
      const pr = p.reactions || {};
      const nr = x.reactions || {};
      new Set([...Object.keys(pr), ...Object.keys(nr)]).forEach(emoji => {
        const had = (pr[emoji] || []).includes(me);
        const has = (nr[emoji] || []).includes(me);
        if (!had && has) jobs.push(sb.from('chat_reactions').insert({ target_type: TARGET[kind], target_id: id, emoji }));
        if (had && !has) jobs.push(sb.from('chat_reactions').delete().match({ target_type: TARGET[kind], target_id: id, emoji, user_id: myId }));
      });
    });

    prev.forEach((x, id) => {
      if (!next.has(id) && isUuid(id)) jobs.push(sb.from(TABLE[kind]).delete().eq('id', id));
    });

    if (!jobs.length) return;
    const results = await Promise.all(jobs);
    const failed = results.find(r => r && r.error);
    if (failed) toast(friendly(failed.error));
    scheduleRefetch(failed ? 0 : 400);
  }

  const originalStore = window.communityStore;
  window.communityStore = function (key, val) {
    const syncable = live && !applying && (key === 'messages' || key === 'announcements');
    const before = syncable ? communityGet(key) : null;
    originalStore(key, val);
    if (syncable) pushDiff(key, before, val);
  };

  // ---------------------------------------------------------------
  // Start / stop with the member's session
  // ---------------------------------------------------------------
  function start(session) {
    myId = session.user.id;
    refetch();
    if (channel) return;
    channel = sb.channel('community-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => scheduleRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => scheduleRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reactions' }, () => scheduleRefetch())
      .subscribe();
  }

  function stop() {
    myId = null;
    if (channel) { sb.removeChannel(channel); channel = null; }
    if (live) {
      applying = true;
      originalStore('messages', []);
      originalStore('announcements', []);
      applying = false;
    }
    live = false;
    document.body.classList.remove('chat-live');
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) setTimeout(() => start(session), 0);
    if (event === 'TOKEN_REFRESHED' && session && !channel) setTimeout(() => start(session), 0);
    if (event === 'SIGNED_OUT') stop();
  });

  // Catch up after the tab has been in the background
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && live) scheduleRefetch(0);
  });
})();
