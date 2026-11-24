// =====================================================================
// COMMUNITY — immersive + interactive layer
// Builds on the globals in main.js (getSession, getMessages, getUsers,
// communityStore, msgId, renderMessages, communityShowChat, HIKES).
// =====================================================================
(function () {
  if (typeof getSession !== 'function') return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);

  // ---------------------------------------------------------------
  // Logged-out: feature cards jump to Register, mosaic follows mouse
  // ---------------------------------------------------------------
  document.querySelectorAll('[data-auth-jump]').forEach(btn => {
    btn.addEventListener('click', () => {
      communityOpenTab(btn.dataset.authJump);
      const box = document.querySelector('.community-auth-box');
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box?.classList.remove('cx-pulse'); void box?.offsetWidth; box?.classList.add('cx-pulse');
      setTimeout(() => box?.querySelector('.community-auth-panel.active input')?.focus({ preventScroll: true }), 500);
    });
  });

  const pitch = document.querySelector('.cx-pitch');
  if (pitch && !reduceMotion) {
    const tiles = [...pitch.querySelectorAll('.cx-tile')];
    pitch.addEventListener('mousemove', e => {
      const r = pitch.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tiles.forEach(t => {
        const d = +t.dataset.depth;
        t.style.translate = `${-x * d}px ${-y * d}px`;
      });
    });
    pitch.addEventListener('mouseleave', () => tiles.forEach(t => (t.style.translate = '0 0')));

    // Feature cards tilt toward the cursor
    pitch.querySelectorAll('.cx-feature').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`;
        card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
      });
      card.addEventListener('mouseleave', () => (card.style.transform = ''));
    });
  }

  // ---------------------------------------------------------------
  // Logged-in: greeting + next-hyke countdown
  // ---------------------------------------------------------------
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function nextHyke() {
    if (typeof HIKES === 'undefined') return null;
    const now = Date.now();
    return HIKES
      .map(h => ({ ...h, at: Date.parse(h.date + ' 08:00') }))
      .filter(h => !isNaN(h.at) && h.at > now)
      .sort((a, b) => a.at - b.at)[0] || null;
  }

  let countdownTimer = null;
  function renderWelcome() {
    const session = getSession();
    if (!session) return;
    const name = session.firstName || session.username;
    $('cx-greet-label') && ($('cx-greet-label').textContent = greeting());
    $('cx-greet-name') && ($('cx-greet-name').textContent = name);

    const box = $('cx-next');
    if (!box) return;
    clearInterval(countdownTimer);
    const hyke = nextHyke();
    if (!hyke) {
      box.innerHTML = `
        <span class="cx-next-label">Next hyke</span>
        <strong class="cx-next-name">New dates dropping soon</strong>
        <span class="cx-next-meta">Watch the announcements in chat</span>
        <a href="#" class="cx-next-link" data-cx-panel="cm-panel-chat">Open chat →</a>`;
    } else {
      box.innerHTML = `
        <span class="cx-next-label">Next hyke · ${hyke.type}</span>
        <strong class="cx-next-name">${escapeHtml(hyke.name)}</strong>
        <span class="cx-next-meta">${escapeHtml(hyke.location)} · ${escapeHtml(hyke.date)}</span>
        <div class="cx-countdown">${['d', 'h', 'm', 's'].map(u => `<span><b data-u="${u}">00</b><i>${u}</i></span>`).join('')}</div>`;
      const tick = () => {
        let s = Math.max(0, Math.floor((hyke.at - Date.now()) / 1000));
        const parts = { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
        box.querySelectorAll('b[data-u]').forEach(b => (b.textContent = String(parts[b.dataset.u]).padStart(2, '0')));
      };
      tick();
      countdownTimer = setInterval(tick, 1000);
    }
  }

  // Let links inside dashboard cards switch panels via the existing sidebar
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-cx-panel]');
    if (!link) return;
    e.preventDefault();
    document.querySelector(`.sidebar-nav a[data-panel="${link.dataset.cxPanel}"]`)?.click();
  });

  // ---------------------------------------------------------------
  // Crew strip — click a member to @mention them
  // ---------------------------------------------------------------
  const HUES = [14, 28, 150, 200, 260, 330, 45, 180];
  function hueFor(name) {
    let n = 0;
    for (const c of name) n = (n * 31 + c.charCodeAt(0)) >>> 0;
    return HUES[n % HUES.length];
  }

  function renderCrew() {
    const crew = $('cx-crew');
    const session = getSession();
    if (!crew || !session) return;
    const msgs = getMessages();
    const lastSeen = {};
    msgs.forEach(m => (lastSeen[m.username] = Math.max(lastSeen[m.username] || 0, m.timestamp)));
    const users = getUsers()
      .filter(u => u.username !== session.username)
      .sort((a, b) => (lastSeen[b.username] || 0) - (lastSeen[a.username] || 0))
      .slice(0, 12);
    crew.innerHTML = users.map(u => {
      const name = u.firstName || u.username;
      const active = lastSeen[u.username] && Date.now() - lastSeen[u.username] < 86400000 * 3;
      return `<button type="button" class="cx-avatar${active ? ' is-active' : ''}" data-mention="${escapeHtml(u.username)}"
        style="--h:${hueFor(u.username)}" title="Mention @${escapeHtml(u.username)}">
        ${escapeHtml(name.substring(0, 2).toUpperCase())}<span>@${escapeHtml(u.username)}</span></button>`;
    }).join('');
  }

  $('cx-crew')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-mention]');
    const input = $('chat-input');
    if (!btn || !input) return;
    const tag = '@' + btn.dataset.mention + ' ';
    input.value = (input.value && !input.value.endsWith(' ') ? input.value + ' ' : input.value) + tag;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  // ---------------------------------------------------------------
  // Trail question prompt
  // ---------------------------------------------------------------
  const PROMPTS = [
    "What's your dream hyke abroad?",
    'Best trail snack — go.',
    'Which UK summit is next on your list?',
    'Your most underrated bit of kit?',
    'Sunrise hyke or sunset hyke?',
    'Best post-hyke pub you’ve found?',
    'One hyke that changed your mind about something?',
    'Rain or shine — what’s your worst-weather hyke story?',
  ];
  let promptIdx = Math.floor(Date.now() / 86400000) % PROMPTS.length; // question of the day
  function showPrompt() {
    const el = $('cx-prompt-text');
    if (!el) return;
    el.classList.remove('cx-swap'); void el.offsetWidth; el.classList.add('cx-swap');
    el.textContent = PROMPTS[promptIdx];
  }
  $('cx-prompt-next')?.addEventListener('click', () => { promptIdx = (promptIdx + 1) % PROMPTS.length; showPrompt(); });
  $('cx-prompt-answer')?.addEventListener('click', () => {
    const input = $('chat-input');
    if (!input) return;
    input.value = `💭 ${PROMPTS[promptIdx]} — `;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  // ---------------------------------------------------------------
  // Emoji reactions on chat messages
  // ---------------------------------------------------------------

  // ---------------------------------------------------------------
  // Announcements appear inside the community chat feed for everyone.
  // Members can react and reply; only admins edit/delete (on the
  // separate Announcements view).
  // ---------------------------------------------------------------
  const ANN_PREFIX = 'ann:';

  function injectAnnouncements() {
    const container = $('chat-messages');
    if (!container || !getSession()) return;
    const anns = getAnnouncements();
    if (!anns.length) return;
    container.querySelector('.chat-empty')?.remove();
    const stamps = new Map(getMessages().map(m => [msgId(m), m.timestamp]));
    const msgEls = [...container.querySelectorAll('.chat-msg')];
    anns.slice().sort((a, b) => a.timestamp - b.timestamp).forEach(a => {
      const el = document.createElement('div');
      el.className = 'chat-msg cx-ann';
      el.dataset.id = ANN_PREFIX + annId(a);
      el.innerHTML = `
        <div class="cx-ann-card">
          <div class="cx-ann-head">
            <span class="cx-ann-badge">📢 Announcement</span>
            <span class="cx-ann-meta">Hyke It Up · ${formatTime(a.timestamp)}${a.edited ? ' · edited' : ''}</span>
          </div>
          <div class="cx-ann-text cx-ann-preview">${richText(a.text)}</div>
          ${a.imageUrl && /^data:image\//.test(a.imageUrl) ? `<img src="${a.imageUrl}" alt="Announcement image" class="cx-ann-img" />` : ''}
          <div class="cx-ann-actions">
            <span class="cx-ann-actions-left">
              <button type="button" class="cx-ann-open">Read more →</button>
              <button type="button" class="cx-ann-reply">↩ Reply in chat</button>
            </span>
            ${getSession()?.isAdmin ? '<button type="button" class="cx-ann-delete">Delete</button>' : ''}
          </div>
        </div>`;
      const before = msgEls.find(m => (stamps.get(m.dataset.id) || 0) > a.timestamp);
      container.insertBefore(el, before || null);
      // Only offer "Read more" when the preview is actually cut short
      const prev = el.querySelector('.cx-ann-preview');
      el.classList.toggle('is-clipped', prev.scrollHeight > prev.clientHeight + 2);
    });
  }

  // ---------------------------------------------------------------
  // Announcement text → safe HTML with clickable links.
  // Supports bare URLs (https://…, www.…) and [label](url).
  // Links on our own site open in the same tab (and jump to the right
  // page section, e.g. https://www.hykeitup.com/#tickets); everything
  // else opens in a new tab.
  // ---------------------------------------------------------------
  const PAGE_IDS = [...document.querySelectorAll('.page[id]')].map(p => p.id);
  const OWN_HOSTS = /(^|\.)hykeitup\.com$/i;

  function linkTag(rawHref, label) {
    let href = rawHref.trim();
    if (/^www\./i.test(href)) href = 'https://' + href;
    let url;
    try { url = new URL(href, location.href); } catch { return escapeHtml(label); }
    if (!/^https?:$/.test(url.protocol)) return escapeHtml(label);
    const internal = url.host === location.host || OWN_HOSTS.test(url.hostname);
    const page = internal && url.hash && PAGE_IDS.includes(url.hash.slice(1)) ? url.hash.slice(1) : '';
    const attrs = internal
      ? (page ? ` data-cx-page="${page}"` : '')
      : ' target="_blank" rel="noopener noreferrer"';
    const icon = internal ? '' : '<span class="cx-ext" aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span>';
    return `<a class="cx-link" href="${escapeHtml(url.href)}"${attrs}>${escapeHtml(label)}${icon}</a>`;
  }

  function richText(raw) {
    const text = String(raw || '');
    const re = /\[([^\]\n]{1,120})\]\(((?:https?:\/\/|www\.|\/|#)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]'"])/gi;
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      out += escapeHtml(text.slice(last, m.index));
      out += m[1] ? linkTag(m[2], m[1]) : linkTag(m[3], m[3].replace(/^https?:\/\//i, ''));
      last = re.lastIndex;
    }
    return out + escapeHtml(text.slice(last));
  }

  // Our own page links (e.g. /#tickets) switch page without reloading
  document.addEventListener('click', e => {
    const a = e.target.closest('a.cx-link[data-cx-page]');
    if (!a) return;
    e.preventDefault();
    closeAnnModal();
    showPage(a.dataset.cxPage);
  });

  // ---------------------------------------------------------------
  // Announcement pop-out reader
  // ---------------------------------------------------------------
  let annModal = null;
  let annReturnFocus = null;

  function buildAnnModal() {
    annModal = document.createElement('div');
    annModal.className = 'cx-ann-modal';
    annModal.hidden = true;
    annModal.innerHTML = `
      <div class="cx-ann-modal-backdrop" data-close></div>
      <div class="cx-ann-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cx-ann-modal-title">
        <button type="button" class="cx-ann-modal-close" data-close aria-label="Close">✕</button>
        <div class="cx-ann-head">
          <span class="cx-ann-badge" id="cx-ann-modal-title">📢 Announcement</span>
          <span class="cx-ann-meta" id="cx-ann-modal-meta"></span>
        </div>
        <div class="cx-ann-modal-body" id="cx-ann-modal-body" tabindex="0"></div>
        <div class="cx-ann-modal-foot">
          <button type="button" class="btn btn-primary btn-sm" id="cx-ann-modal-reply">↩ Reply in chat</button>
          <button type="button" class="btn btn-outline btn-sm" data-close>Close</button>
        </div>
      </div>`;
    document.body.appendChild(annModal);
    annModal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeAnnModal(); });
    annModal.querySelector('#cx-ann-modal-reply').addEventListener('click', () => {
      const id = annModal.dataset.id;
      const { item } = findReactable(id || '');
      closeAnnModal();
      if (item) setReplyContext({ text: item.text, username: '📢 Announcement', id });
    });
  }

  function openAnnModal(id) {
    const { item } = findReactable(id);
    if (!item) return;
    if (!annModal) buildAnnModal();
    annReturnFocus = document.activeElement;
    annModal.dataset.id = id;
    $('cx-ann-modal-meta').textContent = `Hyke It Up · ${formatTime(item.timestamp)}${item.edited ? ' · edited' : ''}`;
    $('cx-ann-modal-body').innerHTML =
      `<div class="cx-ann-modal-text">${richText(item.text)}</div>` +
      (item.imageUrl && /^data:image\//.test(item.imageUrl) ? `<img src="${item.imageUrl}" alt="Announcement image" class="cx-ann-modal-img" />` : '');
    annModal.hidden = false;
    document.body.classList.add('cx-modal-open');
    requestAnimationFrame(() => annModal.classList.add('open'));
    $('cx-ann-modal-body').scrollTop = 0;
    annModal.querySelector('.cx-ann-modal-close').focus({ preventScroll: true });
  }

  function closeAnnModal() {
    if (!annModal || annModal.hidden) return;
    annModal.classList.remove('open');
    document.body.classList.remove('cx-modal-open');
    setTimeout(() => { annModal.hidden = true; }, 200);
    annReturnFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener('keydown', e => {
    if (!annModal || annModal.hidden) return;
    if (e.key === 'Escape') closeAnnModal();
    if (e.key === 'Tab') { // keep focus inside the pop-up
      const f = [...annModal.querySelectorAll('button, a[href], [tabindex="0"]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function findReactable(id) {
    if (id.startsWith(ANN_PREFIX)) {
      const list = getAnnouncements();
      return { list, item: list.find(a => ANN_PREFIX + annId(a) === id), key: 'announcements' };
    }
    const list = getMessages();
    return { list, item: list.find(m => msgId(m) === id), key: 'messages' };
  }

  function decorateMessages(newestAnimated) {
    const session = getSession();
    const container = $('chat-messages');
    if (!container || !session) return;
    const byId = new Map([
      ...getMessages().map(m => [msgId(m), m]),
      ...getAnnouncements().map(a => [ANN_PREFIX + annId(a), a]),
    ]);
    container.querySelectorAll('.chat-msg').forEach(el => {
      const m = byId.get(el.dataset.id);
      if (!m || el.querySelector('.cx-reacts')) return;
      const r = m.reactions || {};
      const row = document.createElement('div');
      row.className = 'cx-reacts';
      row.innerHTML = Object.entries(r).filter(([, who]) => who && who.length).map(([emo, who]) => {
        const mine = who.includes(session.username);
        return `<button type="button" class="cx-react has${mine ? ' mine' : ''}" data-emo="${escapeHtml(emo)}"
          aria-pressed="${mine}" title="${escapeHtml(who.join(', '))}">${escapeHtml(emo)}<b>${who.length}</b></button>`;
      }).join('') + `<button type="button" class="cx-react-add" aria-label="Add a reaction" title="Add a reaction"><span aria-hidden="true">😊</span><i aria-hidden="true">+</i></button>`;
      el.appendChild(row);
    });
    if (newestAnimated) {
      const all = container.querySelectorAll('.chat-msg');
      all[all.length - 1]?.classList.add('cx-new');
    }
  }

  function burst(x, y, emo) {
    if (reduceMotion) return;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      p.className = 'cx-particle';
      p.textContent = emo;
      const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const d = 34 + Math.random() * 26;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d - 20 + 'px');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  $('chat-messages')?.addEventListener('click', e => {
    // Reply to an announcement from the chat feed
    const annReply = e.target.closest('.cx-ann-reply');
    if (annReply) {
      e.stopPropagation();
      const id = annReply.closest('.chat-msg')?.dataset.id;
      const { item } = findReactable(id || '');
      if (item) setReplyContext({ text: item.text, username: '📢 Announcement', id });
      return;
    }

    // Open the announcement pop-out (but let links and buttons do their own thing)
    const card = e.target.closest('.cx-ann-card');
    if (card && !e.target.closest('a, .cx-ann-reply, .cx-ann-delete')) {
      e.stopPropagation();
      openAnnModal(card.closest('.chat-msg').dataset.id);
      return;
    }

    const addBtn = e.target.closest('.cx-react-add');
    if (addBtn) {
      e.stopPropagation();
      const id = addBtn.closest('.chat-msg')?.dataset.id;
      if (id) openPicker(addBtn, emo => toggleReaction(id, emo, addBtn));
      return;
    }

    const annDel = e.target.closest('.cx-ann-delete');
    if (annDel) {
      e.stopPropagation();
      if (!getSession()?.isAdmin) return;
      const id = annDel.closest('.chat-msg')?.dataset.id || '';
      if (annDel.dataset.confirm !== '1') {
        annDel.dataset.confirm = '1';
        annDel.textContent = 'Tap again to delete';
        setTimeout(() => { annDel.dataset.confirm = ''; annDel.textContent = 'Delete'; }, 3000);
        return;
      }
      communityStore('announcements', getAnnouncements().filter(a => ANN_PREFIX + annId(a) !== id));
      renderAnnouncements();
      return;
    }

    const btn = e.target.closest('.cx-react');
    if (!btn) {
      // Stop main.js treating announcement cards as editable messages
      if (e.target.closest('.cx-ann') && !e.target.closest('.msg-reply-quote')) e.stopPropagation();
      return;
    }
    e.stopPropagation();
    const id = btn.closest('.chat-msg')?.dataset.id;
    if (id) toggleReaction(id, btn.dataset.emo, btn);
  }, true);

  function toggleReaction(id, emo, originEl) {
    const session = getSession();
    if (!session || !id || !emo) return;
    const { list, item: m, key } = findReactable(id);
    if (!m) return;
    m.reactions = m.reactions || {};
    const who = m.reactions[emo] || [];
    const had = who.includes(session.username);
    m.reactions[emo] = had ? who.filter(u => u !== session.username) : [...who, session.username];
    if (!m.reactions[emo].length) delete m.reactions[emo];
    communityStore(key, list);

    if (!had && originEl) { const r = originEl.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, emo); }
    const container = $('chat-messages');
    const keep = container.scrollTop;
    renderMessages();
    container.scrollTop = keep;
  }

  // ---------------------------------------------------------------
  // Emoji picker — one pop-up used for reactions and for typing
  // ---------------------------------------------------------------
  const RECENT_KEY = 'hyu_recent_emoji';
  let picker = null;
  let onPick = null;
  let pickerAnchor = null;

  function recentEmoji() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
  }
  function rememberEmoji(emo) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify([emo, ...recentEmoji().filter(x => x !== emo)].slice(0, 24))); } catch {}
  }

  function buildPicker() {
    const cats = window.HYU_EMOJI || [];
    picker = document.createElement('div');
    picker.className = 'cx-picker';
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', 'Choose an emoji');
    picker.hidden = true;
    picker.innerHTML = `
      <div class="cx-picker-tabs" role="tablist">
        <button type="button" class="cx-picker-tab" data-jump="recent" title="Recently used" aria-label="Recently used">🕘</button>
        ${cats.map(c => `<button type="button" class="cx-picker-tab" data-jump="${c.id}" title="${c.name}" aria-label="${c.name}">${c.icon}</button>`).join('')}
      </div>
      <div class="cx-picker-scroll">
        <section data-cat="recent"><h4>Recently used</h4><div class="cx-picker-grid" id="cx-picker-recent"></div></section>
        ${cats.map(c => `<section data-cat="${c.id}"><h4>${c.name}</h4><div class="cx-picker-grid">${
          c.list.split(/\s+/).filter(Boolean).map(e => `<button type="button" class="cx-emoji" data-e="${e}">${e}</button>`).join('')
        }</div></section>`).join('')}
      </div>`;
    document.body.appendChild(picker);

    picker.addEventListener('click', e => {
      const tab = e.target.closest('.cx-picker-tab');
      if (tab) {
        const sec = picker.querySelector(`section[data-cat="${tab.dataset.jump}"]`);
        const scroller = picker.querySelector('.cx-picker-scroll');
        if (sec && scroller) scroller.scrollTo({ top: sec.offsetTop - scroller.offsetTop, behavior: 'smooth' });
        return;
      }
      const em = e.target.closest('.cx-emoji');
      if (em) {
        const emo = em.dataset.e;
        rememberEmoji(emo);
        const cb = onPick;
        closePicker();
        cb?.(emo);
      }
    });
  }

  function renderRecent() {
    const grid = picker.querySelector('#cx-picker-recent');
    const recent = recentEmoji();
    grid.innerHTML = recent.map(e => `<button type="button" class="cx-emoji" data-e="${escapeHtml(e)}">${escapeHtml(e)}</button>`).join('');
    grid.closest('section').hidden = !recent.length;
    picker.querySelector('.cx-picker-tab[data-jump="recent"]').hidden = !recent.length;
  }

  function openPicker(anchor, cb) {
    if (!picker) buildPicker();
    if (!picker.hidden && pickerAnchor === anchor) { closePicker(); return; }
    onPick = cb;
    pickerAnchor = anchor;
    renderRecent();
    picker.hidden = false;
    picker.querySelector('.cx-picker-scroll').scrollTop = 0;
    // Position next to the button, kept on screen
    const r = anchor.getBoundingClientRect();
    const w = picker.offsetWidth, h = picker.offsetHeight;
    const pad = 10;
    let left = Math.min(Math.max(pad, r.left + r.width / 2 - w / 2), window.innerWidth - w - pad);
    let top = r.top - h - 8;
    if (top < pad) top = Math.min(r.bottom + 8, window.innerHeight - h - pad);
    picker.style.left = left + 'px';
    picker.style.top = Math.max(pad, top) + 'px';
    picker.querySelector('.cx-emoji')?.focus({ preventScroll: true });
  }

  function closePicker() {
    if (picker) picker.hidden = true;
    onPick = null;
    pickerAnchor = null;
  }

  document.addEventListener('click', e => {
    if (picker && !picker.hidden && !e.target.closest('.cx-picker, .cx-react-add, .cx-emoji-btn')) closePicker();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });
  window.addEventListener('resize', closePicker);
  $('chat-messages')?.addEventListener('scroll', closePicker, { passive: true });

  // Emoji button beside the chat box — inserts into your message
  (function addComposerEmoji() {
    const input = $('chat-input');
    const send = $('send-msg-btn');
    if (!input || !send || $('cx-emoji-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'cx-emoji-btn';
    btn.className = 'cx-emoji-btn';
    btn.setAttribute('aria-label', 'Add an emoji to your message');
    btn.title = 'Emoji';
    btn.textContent = '😊';
    send.parentNode.insertBefore(btn, send);
    btn.addEventListener('click', () => {
      openPicker(btn, emo => {
        const start = input.selectionStart ?? input.value.length;
        const end = input.selectionEnd ?? input.value.length;
        input.value = input.value.slice(0, start) + emo + input.value.slice(end);
        const pos = start + emo.length;
        input.focus();
        input.setSelectionRange(pos, pos);
      });
    });
  })();

  // ---------------------------------------------------------------
  // Community Chat / Leave a Review switcher (replaces nav dropdown)
  // ---------------------------------------------------------------
  let pendingPanel = null;
  const dashboardOpen = () => !!getSession() && $('community-chat')?.style.display !== 'none';

  // Chat panel has two views: "chat" (everyone) and "announcements" (admins only)
  let chatView = 'chat';
  function setChatView(view) {
    const isAdmin = !!getSession()?.isAdmin;
    chatView = isAdmin && view === 'announcements' ? 'announcements' : 'chat';
    const panel = $('cm-panel-chat');
    if (panel) {
      panel.dataset.view = chatView;
      panel.classList.toggle('is-admin', isAdmin);
    }
    syncSwitch();
  }

  // Admins: "Community Chat" in the top switcher becomes a dropdown
  function buildAdminDropdowns() {
    const isAdmin = !!getSession()?.isAdmin;
    document.querySelectorAll('.community-switch--header').forEach(sw => {
      const existing = sw.querySelector('.cx-dd');
      const plain = sw.querySelector(':scope > [data-cx-switch="cm-panel-chat"]');
      if (isAdmin && !existing && plain) {
        const dd = document.createElement('div');
        dd.className = 'cx-dd';
        dd.innerHTML = `
          <button type="button" class="cx-dd-toggle" data-cx-switch-dd aria-haspopup="true" aria-expanded="false">Community Chat <span aria-hidden="true">▾</span></button>
          <div class="cx-dd-menu" role="menu">
            <a href="#" role="menuitem" data-cx-switch="cm-panel-chat" data-cx-view="chat">💬 Community Chat</a>
            <a href="#" role="menuitem" data-cx-switch="cm-panel-chat" data-cx-view="announcements">📢 Announcements</a>
          </div>`;
        plain.replaceWith(dd);
      } else if (!isAdmin && existing) {
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.cxSwitch = 'cm-panel-chat';
        a.textContent = 'Community Chat';
        existing.replaceWith(a);
      }
    });
  }

  function closeDropdowns() {
    document.querySelectorAll('.cx-dd.open').forEach(dd => {
      dd.classList.remove('open');
      dd.querySelector('.cx-dd-toggle')?.setAttribute('aria-expanded', 'false');
    });
  }

  function syncSwitch() {
    const activeId = dashboardOpen() ? document.querySelector('#community .comm-main .member-panel.active')?.id : pendingPanel;
    document.querySelectorAll('[data-cx-switch]').forEach(a => {
      const panelOn = a.dataset.cxSwitch === activeId;
      const on = panelOn && (!a.dataset.cxView || a.dataset.cxView === chatView);
      a.classList.toggle('active', on);
      a.setAttribute('aria-pressed', on);
    });
    document.querySelectorAll('.cx-dd-toggle').forEach(t => t.classList.toggle('active', activeId === 'cm-panel-chat'));
  }

  function openPanel(id, view) {
    document.querySelector(`#community .sidebar-nav a[data-panel="${id}"]`)?.click();
    if (id === 'cm-panel-chat') setChatView(view || 'chat');
    $('community-chat')?.scrollTo({ top: 0, behavior: 'smooth' });
    syncSwitch();
  }

  document.addEventListener('click', e => {
    const ddToggle = e.target.closest('[data-cx-switch-dd]');
    if (ddToggle) {
      e.preventDefault();
      const dd = ddToggle.closest('.cx-dd');
      const willOpen = !dd.classList.contains('open');
      closeDropdowns();
      dd.classList.toggle('open', willOpen);
      ddToggle.setAttribute('aria-expanded', willOpen);
      return;
    }
    if (!e.target.closest('.cx-dd')) closeDropdowns();

    const a = e.target.closest('[data-cx-switch]');
    if (a) {
      e.preventDefault();
      closeDropdowns();
      if (dashboardOpen()) { openPanel(a.dataset.cxSwitch, a.dataset.cxView); return; }
      // Signed out: remember the choice, open it straight after sign-in
      pendingPanel = a.dataset.cxSwitch;
      syncSwitch();
      communityOpenTab('signin');
      const box = document.querySelector('.community-auth-box');
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box?.classList.remove('cx-pulse'); void box?.offsetWidth; box?.classList.add('cx-pulse');
      return;
    }
    const side = e.target.closest('#community .sidebar-nav a, #community .comm-bottom-link');
    if (side) setTimeout(() => (side.dataset.panel === 'cm-panel-chat' && e.isTrusted ? setChatView('chat') : syncSwitch()), 0);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDropdowns(); });

  // Replying from the admin Announcements view jumps to the chat to type it
  $('announcements-list')?.addEventListener('click', e => {
    if (e.target.closest('.ann-reply-btn')) setTimeout(() => { setChatView('chat'); $('chat-input')?.focus(); }, 0);
  });

  // "Join the Community" / "Register as a Member" → registration form
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-community-tab="register"]');
    if (!link) return;
    if (link.id === 'ea-popup-register') $('ea-popup-close')?.click();
    setTimeout(() => {
      const box = document.querySelector('.community-auth-box');
      if (!box || box.offsetParent === null) return;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.classList.remove('cx-pulse'); void box.offsetWidth; box.classList.add('cx-pulse');
      setTimeout(() => $('reg-first')?.focus({ preventScroll: true }), 600);
    }, 550);
  });

  // ---------------------------------------------------------------
  // Register: mailing list opt-in (unticked by default — opt-in consent)
  // One gentle reminder if left unticked, then save the choice.
  // ---------------------------------------------------------------
  const regBtn = $('register-btn');
  const regBox = $('reg-mailing');
  const reminder = $('reg-opt-reminder');
  let reminded = false;

  regBox?.addEventListener('change', () => { if (regBox.checked && reminder) reminder.hidden = true; });

  // Capture phase: runs before main.js's register handler
  regBtn?.addEventListener('click', e => {
    if (!regBox || regBox.checked || reminded) return;
    const filled = ['reg-first', 'reg-username', 'reg-email', 'reg-password'].every(id => $(id)?.value.trim());
    if (!filled) return; // let main.js show its validation message first
    e.preventDefault();
    e.stopImmediatePropagation();
    reminded = true;
    reminder.hidden = false;
    const opt = $('reg-opt-in');
    opt?.classList.remove('cx-pulse'); void opt?.offsetWidth; opt?.classList.add('cx-pulse');
    reminder.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, true);

  $('reg-opt-yes')?.addEventListener('click', () => { regBox.checked = true; reminder.hidden = true; regBtn.click(); });
  $('reg-opt-no')?.addEventListener('click', () => { reminder.hidden = true; regBtn.click(); });

  // The choice is sent with the Supabase sign-up (js/auth.js reads #reg-mailing).

  // ---------------------------------------------------------------
  // Hook into main.js renders
  // ---------------------------------------------------------------
  if (typeof window.renderMessages === 'function') {
    const original = window.renderMessages;
    let lastCount = getMessages().length;
    window.renderMessages = function () {
      original.apply(this, arguments);
      injectAnnouncements();
      const c = $('chat-messages');
      if (c && !arguments[0]?.keepScroll) c.scrollTop = c.scrollHeight;
      const count = getMessages().length;
      decorateMessages(count > lastCount);
      lastCount = count;
      renderCrew();
    };
  }
  // New / edited / deleted announcements refresh the chat feed too
  if (typeof window.renderAnnouncements === 'function') {
    const originalAnn = window.renderAnnouncements;
    window.renderAnnouncements = function () {
      originalAnn.apply(this, arguments);
      const byId = new Map(getAnnouncements().map(a => [annId(a), a]));
      document.querySelectorAll('#announcements-list .announcement-msg').forEach(el => {
        const a = byId.get(el.dataset.id);
        const t = el.querySelector('.msg-text');
        if (a && t) t.innerHTML = richText(a.text);
      });
      if ($('chat-messages')) window.renderMessages();
    };
  }
  if (typeof window.communityShowChat === 'function') {
    const originalShow = window.communityShowChat;
    window.communityShowChat = function () {
      originalShow.apply(this, arguments);
      const tag = document.querySelector('#community .comm-profile-tag');
      if (tag) tag.textContent = getSession()?.isAdmin ? 'Admin' : 'Member';
      buildAdminDropdowns();
      setChatView(chatView);
      renderWelcome();
      renderCrew();
      decorateMessages(false);
      if (pendingPanel) { openPanel(pendingPanel); pendingPanel = null; }
      syncSwitch();
    };
  }

  showPrompt();
  if (getSession() && $('community-chat')?.style.display !== 'none') {
    buildAdminDropdowns();
    setChatView('chat');
    renderWelcome();
    renderCrew();
    decorateMessages(false);
  }
})();
