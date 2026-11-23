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
  const REACTIONS = ['🧡', '🥾', '🙌', '😂'];

  function decorateMessages(newestAnimated) {
    const session = getSession();
    const container = $('chat-messages');
    if (!container || !session) return;
    const byId = new Map(getMessages().map(m => [msgId(m), m]));
    container.querySelectorAll('.chat-msg').forEach(el => {
      const m = byId.get(el.dataset.id);
      if (!m || el.querySelector('.cx-reacts')) return;
      const r = m.reactions || {};
      const row = document.createElement('div');
      row.className = 'cx-reacts';
      row.innerHTML = REACTIONS.map(emo => {
        const who = r[emo] || [];
        const mine = who.includes(session.username);
        return `<button type="button" class="cx-react${who.length ? ' has' : ''}${mine ? ' mine' : ''}" data-emo="${emo}"
          aria-pressed="${mine}" title="${who.length ? escapeHtml(who.join(', ')) : 'React'}">${emo}${who.length ? `<b>${who.length}</b>` : ''}</button>`;
      }).join('');
      el.appendChild(row);
    });
    if (newestAnimated) container.querySelector('.chat-msg:last-of-type')?.classList.add('cx-new');
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
    const btn = e.target.closest('.cx-react');
    if (!btn) return;
    e.stopPropagation();
    const session = getSession();
    const id = btn.closest('.chat-msg')?.dataset.id;
    if (!session || !id) return;
    const msgs = getMessages();
    const m = msgs.find(x => msgId(x) === id);
    if (!m) return;
    const emo = btn.dataset.emo;
    m.reactions = m.reactions || {};
    const who = m.reactions[emo] || [];
    const had = who.includes(session.username);
    m.reactions[emo] = had ? who.filter(u => u !== session.username) : [...who, session.username];
    if (!m.reactions[emo].length) delete m.reactions[emo];
    communityStore('messages', msgs);

    if (!had) { const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, emo); }
    const container = $('chat-messages');
    const keep = container.scrollTop;
    renderMessages();
    container.scrollTop = keep;
  }, true);

  // ---------------------------------------------------------------
  // Community Chat / Leave a Review switcher (replaces nav dropdown)
  // ---------------------------------------------------------------
  let pendingPanel = null;
  const dashboardOpen = () => !!getSession() && $('community-chat')?.style.display !== 'none';

  function syncSwitch() {
    const activeId = dashboardOpen() ? document.querySelector('#community .comm-main .member-panel.active')?.id : pendingPanel;
    document.querySelectorAll('[data-cx-switch]').forEach(a => {
      const on = a.dataset.cxSwitch === activeId;
      a.classList.toggle('active', on);
      a.setAttribute('aria-pressed', on);
    });
  }

  function openPanel(id) {
    document.querySelector(`#community .sidebar-nav a[data-panel="${id}"]`)?.click();
    $('community-chat')?.scrollTo({ top: 0, behavior: 'smooth' });
    syncSwitch();
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-cx-switch]');
    if (a) {
      e.preventDefault();
      if (dashboardOpen()) { openPanel(a.dataset.cxSwitch); return; }
      // Signed out: remember the choice, open it straight after sign-in
      pendingPanel = a.dataset.cxSwitch;
      syncSwitch();
      communityOpenTab('signin');
      const box = document.querySelector('.community-auth-box');
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box?.classList.remove('cx-pulse'); void box?.offsetWidth; box?.classList.add('cx-pulse');
      return;
    }
    if (e.target.closest('#community .sidebar-nav a, #community .comm-bottom-link')) setTimeout(syncSwitch, 0);
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
      const count = getMessages().length;
      decorateMessages(count > lastCount);
      lastCount = count;
      renderCrew();
    };
  }
  if (typeof window.communityShowChat === 'function') {
    const originalShow = window.communityShowChat;
    window.communityShowChat = function () {
      originalShow.apply(this, arguments);
      renderWelcome();
      renderCrew();
      decorateMessages(false);
      if (pendingPanel) { openPanel(pendingPanel); pendingPanel = null; }
      syncSwitch();
    };
  }

  showPrompt();
  if (getSession() && $('community-chat')?.style.display !== 'none') {
    renderWelcome();
    renderCrew();
    decorateMessages(false);
  }
})();
