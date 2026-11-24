// =====================================================================
// HYKE IT UP — LANDING PAGE
// Hero slideshow, scroll effects, scribbles, sign-up form, Instagram.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------
  const SIGNUP_EMAIL_TO = 'hykeitupofficial@gmail.com';
  // Live Instagram feed: create a free feed at behold.so (connect @hykeitup),
  // then paste its Feed ID here. Until then, our own photos are shown.
  const BEHOLD_FEED_ID = '';
  const INSTAGRAM_URL = 'https://www.instagram.com/hykeitup/';

  // ---------------------------------------------------------------
  // Hero slideshow + cursor spotlight
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
  const hero = document.querySelector('.lp-hero');
  const spot = $('lp-spotlight');
  if (hero && spot && !reduceMotion) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      spot.style.setProperty('--x', `${e.clientX - r.left}px`);
      spot.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
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
    if (en.isIntersecting) { setTimeout(() => en.target.classList.add('lp-drawn'), 500); drawIO.unobserve(en.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll('.lp-scribble-under, .lp-scribble-circle').forEach(el => drawIO.observe(el));

  // ---------------------------------------------------------------
  // Word-by-word statement, counters, parallax, progress, top bar
  // ---------------------------------------------------------------
  const splits = [...document.querySelectorAll('.lp-split')];
  splits.forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

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
  }), { threshold: 0.6 });
  document.querySelectorAll('.lp-count').forEach(el => countIO.observe(el));

  const bar = document.querySelector('.lp-bar');
  const progress = $('lp-progress');
  const stmt = document.querySelector('.lp-statement');
  const stmtBg = document.querySelector('.lp-statement-bg');
  function onScroll() {
    const vh = innerHeight;
    bar?.classList.toggle('scrolled', scrollY > 40);
    if (progress) progress.style.width = (scrollY / Math.max(1, document.body.scrollHeight - vh)) * 100 + '%';
    splits.forEach(el => {
      const r = el.getBoundingClientRect();
      const start = vh * 0.85, end = vh * 0.5;
      const k = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height)));
      const words = el.querySelectorAll('.w');
      const lit = Math.round(k * words.length);
      words.forEach((w, i) => w.classList.toggle('on', reduceMotion || i < lit));
    });
    if (stmt && stmtBg && !reduceMotion) {
      const r = stmt.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) stmtBg.style.transform = `translate3d(0, ${(r.top + r.height / 2 - vh / 2) * -0.12}px, 0)`;
    }
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Floating photos follow the mouse
  const visual = document.querySelector('.lp-signup');
  if (visual && !reduceMotion) {
    const tiles = [...visual.querySelectorAll('.lp-tile')];
    visual.addEventListener('pointermove', e => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tiles.forEach(t => (t.style.translate = `${-x * t.dataset.depth}px ${-y * t.dataset.depth}px`));
    });
    visual.addEventListener('pointerleave', () => tiles.forEach(t => (t.style.translate = '0 0')));
  }

  // "Sign up" links pulse the form card
  document.querySelectorAll('a[href="#signup"]').forEach(a => a.addEventListener('click', () => {
    const card = $('lp-card');
    setTimeout(() => { card?.classList.remove('pulse'); void card?.offsetWidth; card?.classList.add('pulse'); $('lp-first')?.focus({ preventScroll: true }); }, 650);
  }));

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
        'Phone number': data.phone || '—',
        'Subscribed to mailing list': data.subscribed ? 'Yes' : 'No',
        'Signed up': new Date().toLocaleString('en-GB'),
      }),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok && String(json.success) !== 'false';
  }

  async function saveToList(data) {
    const cfg = window.HYU_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey) return false;
    const res = await fetch(`${cfg.url}/rest/v1/mailing_signups`, {
      method: 'POST',
      headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ ...data, source: 'landing' }),
    });
    if (res.status === 409) return true; // already on the list
    return res.ok;
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

    const first = $('lp-first'), last = $('lp-last'), email = $('lp-email'), phone = $('lp-phone');
    const data = {
      first_name: first.value.trim(),
      last_name: last.value.trim(),
      email: email.value.trim().toLowerCase(),
      phone: phone.value.trim() || null,
      subscribed: $('lp-subscribe').checked,
    };
    if (!data.first_name) return showError('Please enter your first name.', first);
    if (!data.last_name) return showError('Please enter your second name.', last);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return showError('Please enter a valid email address.', email);
    if (data.phone && !/^[+()\d\s-]{7,30}$/.test(data.phone)) return showError('Please check your phone number (or leave it blank).', phone);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing you up…';
    const [emailed, saved] = await Promise.all([
      sendEmail(data).catch(() => false),
      saveToList(data).catch(() => false),
    ]);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign up';

    if (!emailed && !saved) {
      return showError("Sorry — we couldn't sign you up just now. Please try again in a moment.");
    }
    if (!emailed) console.warn('[sign-up] Email notification not sent (FormSubmit may need activating).');
    if (!saved) console.warn('[sign-up] Not saved to the mailing list table (run supabase/mailing-list.sql).');

    $('lp-success-text').textContent = data.subscribed
      ? `Thanks ${data.first_name} — you're on the mailing list. Look out for ticket news and our next hyke.`
      : `Thanks ${data.first_name} — we've got your details and we'll be in touch about our next hyke.`;
    form.hidden = true;
    const ok = $('lp-success');
    ok.hidden = false;
    ok.focus({ preventScroll: true });
    confetti($('lp-card'));
  });

  // ---------------------------------------------------------------
  // Instagram: live widget if connected, otherwise our own photos
  // ---------------------------------------------------------------
  const feed = $('lp-insta-feed');
  if (feed) {
    if (BEHOLD_FEED_ID) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://w.behold.so/widget.js';
      document.head.appendChild(s);
      const w = document.createElement('behold-widget');
      w.setAttribute('feed-id', BEHOLD_FEED_ID);
      feed.appendChild(w);
    } else {
      const photos = ['img6', 'img7', 'img1', 'img4', 'img2', 'img5'];
      feed.innerHTML = `<div class="lp-insta-grid">${photos.map(p => `
        <a class="lp-insta-item" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="See more on Instagram (opens in a new tab)">
          <img src="images/${p}.jpg" alt="" loading="lazy" />
        </a>`).join('')}</div>`;
      if (!reduceMotion && matchMedia('(hover: hover)').matches) {
        feed.querySelectorAll('.lp-insta-item').forEach(item => {
          item.addEventListener('pointermove', e => {
            const r = item.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
            item.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
          });
          item.addEventListener('pointerleave', () => (item.style.transform = ''));
        });
      }
    }
  }
})();
