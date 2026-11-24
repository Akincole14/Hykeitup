// =====================================================================
// HYKE IT UP — LANDING PAGE
// Two screens (welcome + socials) with a sign-up card that floats
// centre-right on desktop and opens as a pop-up on phones.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPhoneLayout = () => window.matchMedia('(max-width: 960px)').matches;

  // ---------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------
  const SIGNUP_EMAIL_TO = 'hykeitupofficial@gmail.com';
  const INSTAGRAM_USER = 'hykeitup';
  const TIKTOK_USER = 'hykeitup';

  // ---------------------------------------------------------------
  // Backdrop slideshow + cursor glow
  // ---------------------------------------------------------------
  const slides = [...document.querySelectorAll('.lp-slide')];
  let current = 0;
  if (slides.length > 1 && !reduceMotion) {
    setInterval(() => {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 5500);
  }
  const spot = $('lp-spotlight');
  if (spot && !reduceMotion) {
    addEventListener('pointermove', e => {
      spot.style.setProperty('--x', e.clientX + 'px');
      spot.style.setProperty('--y', e.clientY + 'px');
    }, { passive: true });
  }

  // Magnetic buttons
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.lp-magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => (btn.style.transform = ''));
    });
  }

  // ---------------------------------------------------------------
  // Hand-drawn scribbles
  // ---------------------------------------------------------------
  const NS = 'http://www.w3.org/2000/svg';
  function scribble(el, d, viewBox) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lp-svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    svg.appendChild(p);
    el.appendChild(svg);
  }
  document.querySelectorAll('.lp-scribble-under').forEach(el => scribble(el, 'M3 11C48 4 118 13 197 5', '0 0 200 16'));
  document.querySelectorAll('.lp-scribble-circle').forEach(el => scribble(el, 'M150 7C112 -1 36 4 13 21C-6 36 38 58 112 54C172 51 201 35 187 18C176 7 141 3 92 6', '0 0 200 60'));
  const drawIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { setTimeout(() => en.target.classList.add('lp-drawn'), 600); drawIO.unobserve(en.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll('.lp-scribble-under, .lp-scribble-circle').forEach(el => drawIO.observe(el));

  // ---------------------------------------------------------------
  // Counters, scroll progress, top bar, backdrop dims on screen 2
  // ---------------------------------------------------------------
  const counted = new WeakSet();
  const countIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting || counted.has(en.target)) return;
    counted.add(en.target);
    const el = en.target, to = +el.dataset.to, suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = to.toLocaleString('en-GB') + suffix; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-GB') + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  document.querySelectorAll('.lp-count').forEach(el => countIO.observe(el));

  const bar = document.querySelector('.lp-bar');
  const progress = $('lp-progress');
  const shade = $('lp-shade');
  function onScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const k = Math.min(1, scrollY / max);
    bar?.classList.toggle('scrolled', scrollY > 40);
    if (progress) progress.style.width = k * 100 + '%';
    if (shade) shade.style.setProperty('--dim', (k * 0.75).toFixed(3));  // photos fade back as the feeds arrive
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------------------------------------------------------------
  // Floating sign-up card (desktop) / pop-up sheet (phones)
  // ---------------------------------------------------------------
  const card = $('lp-card');
  const fab = $('lp-signup-fab');
  const scrim = $('lp-card-scrim');

  function pulseCard() {
    card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
  }
  function openSheet() {
    document.body.classList.add('lp-card-open');
    scrim.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => $('lp-first')?.focus({ preventScroll: true }), 350);
  }
  function closeSheet() {
    document.body.classList.remove('lp-card-open');
    scrim.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }
  fab?.addEventListener('click', openSheet);
  scrim?.addEventListener('click', closeSheet);
  $('lp-card-close')?.addEventListener('click', closeSheet);
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('lp-card-open')) closeSheet(); });

  document.querySelectorAll('[data-open-signup]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (isPhoneLayout()) { openSheet(); return; }
    pulseCard();
    $('lp-first')?.focus({ preventScroll: true });
  }));
  document.querySelectorAll('[data-close-signup]').forEach(a => a.addEventListener('click', () => { if (isPhoneLayout()) closeSheet(); }));

  // ---------------------------------------------------------------
  // Sign-up form → email to Gmail + saved to the Supabase mailing list
  // ---------------------------------------------------------------
  const form = $('lp-form');
  const errEl = $('lp-error');
  const submitBtn = $('lp-submit');

  function showError(msg, field) {
    errEl.textContent = msg;
    errEl.hidden = false;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }

  const GENDER_LABELS = { female: 'Female', male: 'Male', prefer_not_to_say: 'Prefer not to say' };

  async function sendEmail(data) {
    const res = await fetch(`https://formsubmit.co/ajax/${SIGNUP_EMAIL_TO}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Website Sign-up – ${data.first_name} ${data.last_name}${data.subscribed ? ' (mailing list ✓)' : ''}`,
        _replyto: data.email,
        _template: 'table',
        _captcha: 'false',
        'First name': data.first_name,
        'Second name': data.last_name,
        'Email address': data.email,
        'Gender': GENDER_LABELS[data.gender] || '—',
        'Phone number': data.phone || '—',
        'Subscribed to mailing list': data.subscribed ? 'Yes' : 'No',
        'Signed up': new Date().toLocaleString('en-GB'),
      }),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && String(json.success) !== 'false';
  }

  // Returns 'saved', 'duplicate' (email already on the list) or 'error'
  async function saveToList(data) {
    const cfg = window.HYU_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey) return 'error';
    try {
      const res = await fetch(`${cfg.url}/rest/v1/mailing_signups`, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...data, source: 'landing' }),
      });
      if (res.status === 409) return 'duplicate';
      return res.ok ? 'saved' : 'error';
    } catch {
      return 'error';
    }
  }

  function confetti(fromEl) {
    if (reduceMotion) return;
    const r = fromEl.getBoundingClientRect();
    const colours = ['#D44F2C', '#E06840', '#F5F2EC', '#F2A65A'];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('span');
      c.className = 'lp-confetti';
      c.style.left = r.left + r.width / 2 + 'px';
      c.style.top = r.top + 30 + 'px';
      c.style.background = colours[i % colours.length];
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
      c.style.setProperty('--dx', Math.cos(a) * d + 'px');
      c.style.setProperty('--dy', Math.sin(a) * d + 120 + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1400);
    }
  }

  form?.addEventListener('input', e => { e.target.removeAttribute('aria-invalid'); errEl.hidden = true; });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    errEl.hidden = true;
    if (form.company_website.value) return; // bot

    const first = $('lp-first'), last = $('lp-last'), email = $('lp-email'), phone = $('lp-phone'), gender = $('lp-gender');
    const data = {
      first_name: first.value.trim(),
      last_name: last.value.trim(),
      email: email.value.trim().toLowerCase(),
      phone: phone.value.trim() || null,
      gender: gender.value || null,
      subscribed: $('lp-subscribe').checked,
    };
    if (!data.first_name) return showError('Please enter your first name.', first);
    if (!data.last_name) return showError('Please enter your second name.', last);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return showError('Please enter a valid email address.', email);
    if (!data.gender) return showError('Please choose an option for gender.', gender);
    if (data.phone && !/^[+()\d\s-]{7,30}$/.test(data.phone)) return showError('Please check your phone number (or leave it blank).', phone);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing you up…';

    // 1. Save to the list first — this is also the "already signed up?" check
    const saved = await saveToList(data);
    if (saved === 'duplicate') {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up';
      return showError("You've already signed up with this email address — you're on our list, so there's no need to register again.", email);
    }
    // 2. Only new sign-ups are emailed to us
    const emailed = await sendEmail(data).catch(() => false);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign up';

    if (saved !== 'saved' && !emailed) {
      return showError("Sorry — we couldn't sign you up just now. Please try again in a moment.");
    }
    if (!emailed) console.warn('[sign-up] Email notification not sent (FormSubmit may need activating).');
    if (saved !== 'saved') console.warn('[sign-up] Not saved to the mailing list table.');

    showSuccess(data.first_name);
  });

  // ---------------------------------------------------------------
  // "You're in." — celebration for 1 minute, then back to the form
  // ---------------------------------------------------------------
  const SUCCESS_MS = 60 * 1000;
  let successTimer = null;

  function showSuccess(firstName) {
    $('lp-success-text').textContent =
      `Thank you for joining, ${firstName}! Welcome to the community — keep a look out for our emails about upcoming hykes, socials, news and updates. We look forward to meeting you on a Hyke!`;
    form.hidden = true;
    const ok = $('lp-success');
    ok.hidden = false;
    ok.focus({ preventScroll: true });
    confetti($('lp-card'));
    fireworks($('lp-fireworks'), 6000);
    clearTimeout(successTimer);
    successTimer = setTimeout(resetSignup, SUCCESS_MS);
  }

  function resetSignup() {
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    errEl.hidden = true;
    $('lp-success').hidden = true;
    form.hidden = false;
  }

  // Fireworks drawn on a small canvas behind the 🎉
  function fireworks(canvas, duration) {
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const colours = ['#D44F2C', '#E06840', '#F5F2EC', '#F2A65A', '#FFD166'];
    const sparks = [];
    const t0 = performance.now();
    let nextBurst = 0;
    function burst() {
      const x = w * (0.15 + Math.random() * 0.7), y = h * (0.15 + Math.random() * 0.45);
      const c = colours[Math.floor(Math.random() * colours.length)];
      for (let i = 0; i < 46; i++) {
        const a = (Math.PI * 2 * i) / 46, v = 1.2 + Math.random() * 2.4;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c });
      }
    }
    function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, w, h);
      if (t < duration && t > nextBurst) { burst(); nextBurst = t + 380 + Math.random() * 420; }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.vx *= 0.985; p.life -= 0.016;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (t < duration || sparks.length) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(frame);
  }


  // ---------------------------------------------------------------
  // Instagram + TikTok widgets (official embeds)
  // If a platform's widget can't load (blocked, offline, privacy
  // extensions), a photo grid linking to the profile is shown instead.
  // ---------------------------------------------------------------
  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.body.appendChild(s);
  }

  function fallback(box, url, label, photos) {
    box.innerHTML = `
      <div class="lp-insta-grid">${photos.map(p => `
        <a class="lp-insta-item" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="See more on ${label} (opens in a new tab)">
          <img src="images/${p}.jpg" alt="" loading="lazy" />
        </a>`).join('')}</div>
      <a class="lp-btn lp-btn--ghost lp-feed-cta" href="${url}" target="_blank" rel="noopener noreferrer">Open ${label} ↗</a>`;
  }

  function whenRendered(box, check, onFail, wait = 9000) {
    const t0 = Date.now();
    const timer = setInterval(() => {
      if (check()) { clearInterval(timer); box.querySelector('.lp-feed-loading')?.remove(); }
      else if (Date.now() - t0 > wait) { clearInterval(timer); onFail(); }
    }, 400);
  }

  const igBox = $('lp-feed-instagram');
  if (igBox) {
    const url = `https://www.instagram.com/${INSTAGRAM_USER}/`;
    igBox.innerHTML = `
      <p class="lp-feed-loading">Loading Instagram…</p>
      <blockquote class="instagram-media" data-instgrm-permalink="${url}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14">
        <a href="${url}" target="_blank" rel="noopener noreferrer">View @${INSTAGRAM_USER} on Instagram</a>
      </blockquote>`;
    loadScript('https://www.instagram.com/embed.js');
    whenRendered(igBox, () => igBox.querySelector('iframe'), () => fallback(igBox, url, 'Instagram', ['img6', 'img7', 'img1', 'img4', 'img2', 'img5']));
  }

  const ttBox = $('lp-feed-tiktok');
  if (ttBox) {
    const url = `https://www.tiktok.com/@${TIKTOK_USER}`;
    ttBox.innerHTML = `
      <p class="lp-feed-loading">Loading TikTok…</p>
      <blockquote class="tiktok-embed" cite="${url}" data-unique-id="${TIKTOK_USER}" data-embed-type="creator" style="max-width:780px;min-width:288px;">
        <section><a target="_blank" rel="noopener noreferrer" href="${url}?refer=creator_embed">@${TIKTOK_USER}</a></section>
      </blockquote>`;
    loadScript('https://www.tiktok.com/embed.js');
    whenRendered(ttBox, () => ttBox.querySelector('iframe'), () => fallback(ttBox, url, 'TikTok', ['img3', 'img5', 'img2', 'img7', 'img1', 'img6']));
  }
})();
