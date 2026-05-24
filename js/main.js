// === PROGRESS BAR ===
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  progressBar.style.width = (scrolled * 100) + '%';
});

// === NAVBAR SCROLL ===
const nav = document.querySelector('nav');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// === PAGE ROUTING ===
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.opacity = '0';
  });
  document.querySelectorAll('[data-page]').forEach(a => a.classList.remove('active'));

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    requestAnimationFrame(() => {
      page.style.transition = 'opacity 0.4s';
      page.style.opacity = '1';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll(`[data-page="${pageId}"]`).forEach(el => el.classList.add('active'));
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');

  // Restore footer when leaving community page
  if (pageId !== 'community') document.querySelector('footer').style.display = '';

  // Re-trigger reveal animations for new page
  setTimeout(triggerReveal, 100);
  if (pageId === 'home') setTimeout(animateStats, 600);
  if (pageId === 'tickets') resetTickets();
}

let pendingHikeId = null;

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    if (el.dataset.hike) pendingHikeId = el.dataset.hike;
    if (el.dataset.communityTab) communityOpenTab(el.dataset.communityTab);
    showPage(el.dataset.page);
  });
});

// === SCROLL REVEAL ===
function triggerReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
    else el.classList.add('visible');
  });
}

// === HERO CAROUSEL ===
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.querySelector('.hero-dots');
  if (!slides.length) return;

  let current = 0;
  let timer;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  document.querySelector('.hero-arrow-prev')?.addEventListener('click', () => goTo(current - 1));
  document.querySelector('.hero-arrow-next')?.addEventListener('click', () => goTo(current + 1));

  resetTimer();
})();

// === ANIMATED STATS COUNTER ===
function animateStats() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const startVal = 0;

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// === MEMBERS SIDEBAR ===
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const panel = link.dataset.panel;
    document.querySelectorAll('.member-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
    const el = document.getElementById(panel);
    if (el) {
      el.classList.add('active');
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '1';
      });
    }
    link.classList.add('active');
  });
});

// === GALLERY FILTER ===
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    document.querySelectorAll('.gallery-item').forEach((item, i) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.style.transition = `opacity 0.3s ${i * 0.04}s, transform 0.3s ${i * 0.04}s`;
      if (show) {
        item.style.display = '';
        requestAnimationFrame(() => { item.style.opacity = '1'; item.style.transform = ''; });
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        setTimeout(() => { item.style.display = 'none'; }, 300 + i * 40);
      }
    });
  });
});

// === LIGHTBOX ===
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('.gallery-img');
    if (img && lightbox && lightboxImg) {
      lightboxImg.src = img.src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });
});

document.getElementById('lightbox-close')?.addEventListener('click', () => {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
});

lightbox?.addEventListener('click', e => {
  if (e.target === lightbox) {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// === CONTACT FORM (Formspree) ===
// Sign up at formspree.io → create a form → paste your endpoint below
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = contactForm.querySelector('.form-submit');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: new FormData(contactForm),
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      // Save mailing list opt-in locally
      if (document.getElementById('mailingList')?.checked) {
        const subs = JSON.parse(localStorage.getItem('hyu_ea_submissions') || '[]');
        const name = `${document.getElementById('firstName')?.value || ''} ${document.getElementById('lastName')?.value || ''}`.trim();
        const email = document.getElementById('email')?.value || '';
        if (email && !subs.find(s => s.email === email)) {
          subs.push({ name, email, source: 'contact-form', ts: Date.now() });
          localStorage.setItem('hyu_ea_submissions', JSON.stringify(subs));
        }
      }
      contactForm.style.transition = 'opacity 0.4s';
      contactForm.style.opacity = '0';
      setTimeout(() => {
        contactForm.style.display = 'none';
        const success = document.getElementById('formSuccess');
        success.style.display = 'block';
        success.style.opacity = '0';
        requestAnimationFrame(() => { success.style.transition = 'opacity 0.5s'; success.style.opacity = '1'; });
      }, 400);
    } else {
      btn.textContent = 'Try again →';
      btn.disabled = false;
      btn.style.background = 'rgba(224,82,82,0.8)';
    }
  } catch {
    btn.textContent = 'Try again →';
    btn.disabled = false;
    btn.style.background = 'rgba(224,82,82,0.8)';
  }
});

function handleExtraForm(formId, successId) {
  const form = document.getElementById(formId);
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        form.style.transition = 'opacity 0.4s';
        form.style.opacity = '0';
        setTimeout(() => {
          form.style.display = 'none';
          const success = document.getElementById(successId);
          success.style.display = 'block';
          success.style.opacity = '0';
          requestAnimationFrame(() => { success.style.transition = 'opacity 0.5s'; success.style.opacity = '1'; });
        }, 400);
      } else {
        btn.textContent = 'Try again →';
        btn.disabled = false;
        btn.style.background = 'rgba(224,82,82,0.8)';
      }
    } catch {
      btn.textContent = 'Try again →';
      btn.disabled = false;
      btn.style.background = 'rgba(224,82,82,0.8)';
    }
  });
}

handleExtraForm('volunteerForm', 'volunteerSuccess');
handleExtraForm('partnerForm', 'partnerSuccess');
handleExtraForm('contactPartnerForm', 'contactPartnerSuccess');

// === CONTACT PAGE TABS ===
document.querySelectorAll('.contact-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.contact-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.contact-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// === SCROLL CUE ===
document.querySelector('.scroll-cue')?.addEventListener('click', () => {
  const featuresSection = document.querySelector('.section');
  if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
});

// === INIT ===
document.querySelectorAll('.page').forEach(p => { p.style.opacity = '1'; });
showPage('home');

// =================================================================
// === TICKET BOOKING ===
// =================================================================
//
// STRIPE SETUP (required to take real payments):
//
// 1. Create a free account at stripe.com
// 2. Go to Developers → API keys and copy your Publishable Key
// 3. Replace 'pk_test_YOUR_KEY_HERE' below with your key
// 4. Set up a backend endpoint that creates a PaymentIntent and
//    returns { clientSecret }. Simple Netlify/Vercel example:
//
//    // api/create-payment-intent.js
//    const Stripe = require('stripe');
//    module.exports = async (req, res) => {
//      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
//      const { amount, currency, metadata } = req.body;
//      const intent = await stripe.paymentIntents.create({ amount, currency, metadata });
//      res.json({ clientSecret: intent.client_secret });
//    };
//
// 5. Set BACKEND_ENDPOINT below to your function URL
// =================================================================

const STRIPE_KEY = 'pk_live_51QlwjoC11OF9EVPg7JMB3V3xfE4xIyQgjnynUqUJ8Rn1xmSD61ZvohnMUyVgd9hgPeAyXGxH4kN8BWC92sf6UUJS00s0axxWMT';
const BACKEND_ENDPOINT = '/api/create-payment-intent';
const BOOKING_FEE = 2;

const HIKES = [
  {
    id: 'snowdon',
    name: 'Snowdon Summit Challenge',
    date: '7 Jun 2026',
    location: 'Snowdonia, Wales',
    duration: 'Full Day',
    type: 'Major',
    price: 45,
    image: 'images/img4.jpg',
    spotsLeft: 8,
    includes: ['Coach travel from London', 'Professional guide', 'Safety briefing kit', 'Post-hyke social'],
  },
  {
    id: 'south-downs',
    name: 'South Downs Morning Walk',
    date: '14 Jun 2026',
    location: 'Eastbourne, Sussex',
    duration: 'Half Day',
    type: 'Mini',
    price: 15,
    image: 'images/img1.jpg',
    spotsLeft: 15,
    includes: ['GPX route map', 'Safety briefing', 'Community WhatsApp access'],
  },
  {
    id: 'peak-district',
    name: 'Peak District Loop',
    date: '21 Jun 2026',
    location: 'Stanage Edge, Derbyshire',
    duration: 'Half Day',
    type: 'Mini',
    price: 15,
    image: 'images/img3.jpg',
    spotsLeft: 20,
    includes: ['GPX route map', 'Safety briefing', 'Community WhatsApp access'],
  },
];

let selectedHike = null;
let ticketQty = 1;
let stripeInstance = null;
let stripeElems = null;
let paymentElementReady = false;

function getBookingTotal() {
  if (!selectedHike) return 0;
  return (selectedHike.price + BOOKING_FEE) * ticketQty;
}

// ── Step navigation ─────────────────────────────────────────────
function goToTicketStep(step) {
  document.querySelectorAll('.ticket-step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`ticket-step-${step}`);
  if (el) {
    el.classList.add('active');
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.transition = 'opacity 0.3s'; el.style.opacity = '1'; });
  }
  document.querySelectorAll('.step-item').forEach(item => {
    const n = +item.dataset.step;
    item.classList.toggle('active', n === step);
    item.classList.toggle('completed', n < step);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (step === 3) { buildOrderSummary(); mountPaymentElement(); }
}

// ── Hike option cards ────────────────────────────────────────────
function renderHikeOptions() {
  const container = document.getElementById('hike-options');
  if (!container) return;
  container.innerHTML = HIKES.map(h => `
    <div class="hike-option" data-hike-id="${h.id}">
      <div class="hike-option-img">
        <img src="${h.image}" alt="${h.name}" loading="lazy" />
        <span class="hike-option-tag${h.type === 'Mini' ? ' mini' : ''}">${h.type} Hyke</span>
      </div>
      <div class="hike-option-body">
        <h3>${h.name}</h3>
        <div class="hike-option-meta">
          <span>📅 ${h.date}</span>
          <span>📍 ${h.location}</span>
          <span>⏱ ${h.duration}</span>
        </div>
        <ul class="hike-includes">
          ${h.includes.map(i => `<li>${i}</li>`).join('')}
        </ul>
        <div class="hike-option-footer">
          <div><span class="price-amount">£${h.price}</span><span class="price-per">/ person</span></div>
          <div class="spots-left${h.spotsLeft <= 5 ? ' low' : ''}">${h.spotsLeft} spots left</div>
        </div>
      </div>
      <div class="hike-option-check">✓</div>
    </div>
  `).join('');

  container.querySelectorAll('.hike-option').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.hike-option').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedHike = HIKES.find(h => h.id === card.dataset.hikeId);
      updateStep1UI();
    });
  });
}

function updateStep1UI() {
  const totalEl = document.getElementById('step1-total');
  const nextBtn = document.getElementById('step1-next');
  const noteEl  = document.getElementById('qty-note');
  const minus   = document.getElementById('qty-minus');
  const plus    = document.getElementById('qty-plus');

  if (totalEl) totalEl.textContent = selectedHike ? `£${getBookingTotal().toFixed(2)}` : '—';
  if (nextBtn) nextBtn.disabled = !selectedHike;
  if (noteEl && selectedHike) noteEl.textContent = `${selectedHike.spotsLeft} spot${selectedHike.spotsLeft !== 1 ? 's' : ''} remaining`;
  if (minus) minus.disabled = ticketQty <= 1;
  if (plus)  plus.disabled  = !!(selectedHike && ticketQty >= selectedHike.spotsLeft);
}

// ── Form validation ──────────────────────────────────────────────
function validateAttendeeForm() {
  const ids = ['t-first','t-last','t-email','t-phone','t-em-name','t-em-phone','t-fitness'];
  let valid = true;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const ok = el.value.trim() !== '';
    el.style.borderColor = ok ? '' : 'rgba(224,82,82,0.7)';
    if (!ok) valid = false;
    el.addEventListener('input', () => { if (el.value.trim()) el.style.borderColor = ''; }, { once: true });
  });
  return valid;
}

// ── Order summary ────────────────────────────────────────────────
function buildOrderSummary() {
  const el = document.getElementById('order-summary-body');
  if (!el || !selectedHike) return;
  const subtotal = selectedHike.price * ticketQty;
  const fee      = BOOKING_FEE * ticketQty;
  const total    = subtotal + fee;
  el.innerHTML = `
    <div class="summary-hike">
      <img src="${selectedHike.image}" alt="${selectedHike.name}" />
      <div class="summary-hike-info">
        <strong>${selectedHike.name}</strong>
        <span>${selectedHike.date} · ${selectedHike.location}</span>
      </div>
    </div>
    <div class="summary-lines">
      <div class="summary-line"><span>${ticketQty} × Ticket</span><span>£${subtotal.toFixed(2)}</span></div>
      <div class="summary-line"><span>Booking fee</span><span>£${fee.toFixed(2)}</span></div>
    </div>
    <div class="summary-total"><span>Total</span><span>£${total.toFixed(2)}</span></div>
    <p class="summary-note">🔒 Encrypted & secure. Confirmation email sent instantly on payment.</p>
  `;
}

// ── Stripe Payment Element ───────────────────────────────────────
async function mountPaymentElement() {
  if (paymentElementReady) return;
  const loadingEl = document.getElementById('payment-loading');
  const payBtn    = document.getElementById('pay-btn');
  const payBtnTxt = document.getElementById('pay-btn-text');

  try {
    if (!stripeInstance) stripeInstance = Stripe(STRIPE_KEY);

    const amountPence = Math.round(getBookingTotal() * 100);
    const res = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountPence,
        currency: 'gbp',
        metadata: {
          hike: selectedHike.name,
          date: selectedHike.date,
          tickets: String(ticketQty),
          customer_email: document.getElementById('t-email')?.value || '',
        },
      }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const { clientSecret } = await res.json();

    stripeElems = stripeInstance.elements({
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#D44F2C',
          colorBackground: '#2C2C2C',
          colorText: '#FFFFFF',
          colorTextSecondary: '#9A9A9A',
          colorDanger: '#E05252',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '8px',
        },
        rules: {
          '.Input': { border: '2px solid rgba(255,255,255,0.08)', padding: '10px 14px' },
          '.Input:focus': { border: '2px solid #D44F2C', boxShadow: '0 0 0 3px rgba(212,79,44,0.15)' },
          '.Label': { fontWeight: '700', marginBottom: '4px' },
        },
      },
    });

    const paymentEl = stripeElems.create('payment');
    paymentEl.mount('#payment-element');
    paymentEl.on('ready', () => {
      if (loadingEl) loadingEl.style.display = 'none';
      if (payBtn) {
        payBtn.disabled = false;
        if (payBtnTxt) payBtnTxt.textContent = `Pay £${getBookingTotal().toFixed(2)}`;
      }
      paymentElementReady = true;
    });

  } catch (err) {
    if (loadingEl) loadingEl.innerHTML = `
      <div style="text-align:center;color:#9A9A9A;padding:2rem;">
        <p style="margin-bottom:0.6rem;font-size:1.1rem;">⚠️ Payment form unavailable</p>
        <p style="font-size:0.82rem;line-height:1.6;">Add your Stripe publishable key and backend endpoint<br/>to <strong style="color:rgba(255,255,255,0.6)">js/main.js</strong> to enable payments.</p>
        <p style="font-size:0.75rem;margin-top:0.8rem;opacity:0.5;">${err.message}</p>
      </div>
    `;
  }
}

// ── Payment submission ───────────────────────────────────────────
async function submitPayment() {
  if (!stripeInstance || !stripeElems) return;
  const payBtn    = document.getElementById('pay-btn');
  const payBtnTxt = document.getElementById('pay-btn-text');
  const errorEl   = document.getElementById('payment-error');

  payBtn.disabled = true;
  payBtnTxt.textContent = 'Processing…';
  if (errorEl) errorEl.style.display = 'none';

  const { error } = await stripeInstance.confirmPayment({
    elements: stripeElems,
    confirmParams: {
      return_url: window.location.href,
      payment_method_data: {
        billing_details: {
          name: `${document.getElementById('t-first')?.value || ''} ${document.getElementById('t-last')?.value || ''}`.trim(),
          email: document.getElementById('t-email')?.value || '',
          phone: document.getElementById('t-phone')?.value || '',
        },
      },
    },
    redirect: 'if_required',
  });

  if (error) {
    if (errorEl) { errorEl.textContent = error.message; errorEl.style.display = 'block'; }
    payBtn.disabled = false;
    payBtnTxt.textContent = `Pay £${getBookingTotal().toFixed(2)}`;
  } else {
    showBookingSuccess();
  }
}

function showBookingSuccess() {
  document.querySelectorAll('.ticket-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-item').forEach(i => i.classList.add('completed'));
  const el = document.getElementById('ticket-success');
  if (el) {
    el.style.display = 'block'; el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.transition = 'opacity 0.5s'; el.style.opacity = '1'; });
  }
  const refEl = document.getElementById('booking-ref');
  if (refEl) {
    const ref = 'HIU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    refEl.innerHTML = `<span>Booking Reference</span><strong>${ref}</strong>`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Reset on page navigation ────────────────────────────────────
function reinitTTWidget() {
  const wrap = document.querySelector('.tt-embed-wrap');
  if (!wrap) return;
  // Remove any iframe the previous widget run created
  wrap.querySelectorAll('iframe').forEach(f => f.remove());
  // Re-inject a fresh script so the widget re-initialises in the now-visible container
  const s = document.createElement('script');
  s.src = 'https://cdn.tickettailor.com/js/widgets/min/widget.js';
  s.setAttribute('data-url', 'https://www.tickettailor.com/events/hykeitup');
  s.setAttribute('data-type', 'inline');
  s.setAttribute('data-bg-color', '#1a1a1a');
  s.setAttribute('data-primary-colour', '#D44F2C');
  wrap.appendChild(s);
}

function resetTickets() {
  reinitTTWidget();
  selectedHike = null;
  ticketQty = 1;
  stripeElems = null;
  paymentElementReady = false;

  const qtyDisplay = document.getElementById('qty-display');
  if (qtyDisplay) qtyDisplay.textContent = '1';

  document.querySelectorAll('.hike-option').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.ticket-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ticket-step-1')?.classList.add('active');

  const successEl = document.getElementById('ticket-success');
  if (successEl) successEl.style.display = 'none';

  const paymentEl = document.getElementById('payment-element');
  if (paymentEl) paymentEl.innerHTML = '';

  const loadingEl = document.getElementById('payment-loading');
  if (loadingEl) { loadingEl.innerHTML = '<div class="payment-spinner"></div><p>Connecting to secure payment…</p>'; loadingEl.style.display = 'flex'; }

  const errorEl = document.getElementById('payment-error');
  if (errorEl) errorEl.style.display = 'none';

  document.querySelectorAll('.step-item').forEach(item => {
    item.classList.remove('active', 'completed');
    if (+item.dataset.step === 1) item.classList.add('active');
  });

  document.getElementById('qty-note').textContent = 'Select a hyke to see available spots';
  updateStep1UI();

  if (pendingHikeId) {
    const card = document.querySelector(`.hike-option[data-hike-id="${pendingHikeId}"]`);
    if (card) {
      card.classList.add('selected');
      selectedHike = HIKES.find(h => h.id === pendingHikeId);
      updateStep1UI();
    }
    pendingHikeId = null;
  }
}

// ── Wire up all ticket event listeners (once on load) ────────────
function initTicketPage() {
  renderHikeOptions();
  updateStep1UI();

  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (ticketQty > 1) { ticketQty--; document.getElementById('qty-display').textContent = ticketQty; updateStep1UI(); }
  });

  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (!selectedHike || ticketQty < selectedHike.spotsLeft) {
      ticketQty++; document.getElementById('qty-display').textContent = ticketQty; updateStep1UI();
    }
  });

  document.getElementById('step1-next')?.addEventListener('click', () => {
    if (selectedHike) goToTicketStep(2);
  });

  document.getElementById('step2-back')?.addEventListener('click', () => goToTicketStep(1));

  document.getElementById('step2-next')?.addEventListener('click', () => {
    if (validateAttendeeForm()) goToTicketStep(3);
  });

  document.getElementById('step3-back')?.addEventListener('click', () => {
    stripeElems = null;
    paymentElementReady = false;
    const el = document.getElementById('payment-element');
    if (el) el.innerHTML = '';
    const loading = document.getElementById('payment-loading');
    if (loading) { loading.innerHTML = '<div class="payment-spinner"></div><p>Connecting to secure payment…</p>'; loading.style.display = 'flex'; }
    document.getElementById('pay-btn').disabled = true;
    goToTicketStep(2);
  });

  document.getElementById('pay-btn')?.addEventListener('click', submitPayment);
}

initTicketPage();

// =============================================
// === COMMUNITY SYSTEM ========================
// =============================================

const ADMIN_USERNAME = 'hykeitup_admin';
const ADMIN_PASSWORD = 'HykeAdmin2024!';

function communityStore(key, val) { localStorage.setItem('hyu_' + key, JSON.stringify(val)); }
function communityGet(key) { try { return JSON.parse(localStorage.getItem('hyu_' + key)); } catch { return null; } }

// Seed admin account + example content if not present
(function seedAdmin() {
  const users = communityGet('users') || [];
  if (!users.find(u => u.username === ADMIN_USERNAME)) {
    users.push({ username: ADMIN_USERNAME, email: 'admin@hykeitup.com', password: ADMIN_PASSWORD, firstName: 'Admin', lastName: '', isAdmin: true, joinedAt: Date.now() });
    users.push({ username: 'sable_hikes', email: 'sable@hykeitup.com', password: 'demo', firstName: 'Sable', lastName: '', isAdmin: false, joinedAt: Date.now() - 86400000 });
    users.push({ username: 'akin_trails', email: 'akin@hykeitup.com', password: 'demo', firstName: 'Akin', lastName: '', isAdmin: false, joinedAt: Date.now() - 43200000 });
    communityStore('users', users);
  }

  if (!communityGet('announcements')) {
    communityStore('announcements', [
      {
        username: ADMIN_USERNAME,
        text: '🏔️ June Major Hyke — Snowdon Summit is now OPEN for bookings! Spaces are limited so grab yours via the Book Tickets page. Kit list and meeting point details will be shared closer to the date. See you on the trail! 🧡',
        imageUrl: null,
        timestamp: Date.now() - 3600000
      },
      {
        username: ADMIN_USERNAME,
        text: '📋 Community Guidelines Reminder: Please keep conversations respectful and on-topic. This is a safe space for everyone. Any questions, DM us directly.',
        imageUrl: null,
        timestamp: Date.now() - 7200000
      }
    ]);
  }

  if (!communityGet('messages')) {
    communityStore('messages', [
      { username: 'sable_hikes', text: 'Hey everyone! So excited for the Snowdon hyke next month 🙌 who else is going?', timestamp: Date.now() - 5400000 },
      { username: 'akin_trails', text: '@sable_hikes I\'m in! Already booked my spot. Can\'t wait!', timestamp: Date.now() - 4800000 },
      { username: 'sable_hikes', text: 'Amazing! @akin_trails let\'s coordinate travel from London, might be cheaper to share a car 🚗', timestamp: Date.now() - 4200000 },
      { username: 'akin_trails', text: 'Great idea! Drop me a message and we can sort the details 👍', timestamp: Date.now() - 3000000 },
    ]);
  }
})();

function getSession() { return communityGet('session'); }
function getUsers() { return communityGet('users') || []; }
function getMessages() { return communityGet('messages') || []; }
function getAnnouncements() { return communityGet('announcements') || []; }

// --- Auth tab switching ---
function communityOpenTab(tab) {
  document.querySelectorAll('.community-auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.community-auth-panel').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector(`.community-auth-tab[data-auth="${tab}"]`);
  const panel = document.getElementById('auth-' + tab);
  if (btn) btn.classList.add('active');
  if (panel) panel.classList.add('active');
}

document.querySelectorAll('.community-auth-tab').forEach(tab => {
  tab.addEventListener('click', () => communityOpenTab(tab.dataset.auth));
});

// --- Forgot Password ---
document.getElementById('forgot-link')?.addEventListener('click', () => {
  document.querySelectorAll('.community-auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.community-auth-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('auth-forgot').classList.add('active');
  document.getElementById('forgot-error').style.display = 'none';
  document.getElementById('forgot-success').style.display = 'none';
  ['fp-username','fp-email','fp-newpw','fp-confirmpw'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
});

document.getElementById('back-to-signin')?.addEventListener('click', () => communityOpenTab('signin'));

document.getElementById('fp-submit-btn')?.addEventListener('click', () => {
  const username = document.getElementById('fp-username').value.trim().toLowerCase();
  const email    = document.getElementById('fp-email').value.trim().toLowerCase();
  const newpw    = document.getElementById('fp-newpw').value;
  const confirmpw = document.getElementById('fp-confirmpw').value;
  const errEl    = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');

  errEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!username || !email || !newpw || !confirmpw) return showAuthError(errEl, 'Please fill in all fields.');
  if (newpw.length < 6) return showAuthError(errEl, 'Password must be at least 6 characters.');
  if (newpw !== confirmpw) return showAuthError(errEl, 'Passwords do not match.');

  const users = getUsers();
  const user = users.find(u => u.username === username && u.email.toLowerCase() === email);
  if (!user) return showAuthError(errEl, 'No account found with that username and email.');

  user.password = newpw;
  communityStore('users', users);
  successEl.style.display = 'block';
  document.getElementById('fp-newpw').value = '';
  document.getElementById('fp-confirmpw').value = '';
  setTimeout(() => communityOpenTab('signin'), 2000);
});

// --- Register ---
document.getElementById('register-btn')?.addEventListener('click', () => {
  const first    = document.getElementById('reg-first').value.trim();
  const last     = document.getElementById('reg-last').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase().replace(/\s+/g, '_');
  const email    = document.getElementById('reg-email').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('register-error');

  errEl.style.display = 'none';
  if (!first || !username || !email || !password) return showAuthError(errEl, 'Please fill in all fields.');
  if (password.length < 6) return showAuthError(errEl, 'Password must be at least 6 characters.');

  const users = getUsers();
  if (users.find(u => u.username === username)) return showAuthError(errEl, 'That username is already taken.');
  if (users.find(u => u.email === email)) return showAuthError(errEl, 'An account with that email already exists.');

  users.push({ username, email, phone, password, firstName: first, lastName: last, isAdmin: false, joinedAt: Date.now() });
  communityStore('users', users);
  communityStore('session', { username, isAdmin: false, firstName: first });
  communityShowChat();
});

// --- Sign In ---
document.getElementById('signin-btn')?.addEventListener('click', () => {
  const username = document.getElementById('si-username').value.trim().toLowerCase();
  const password = document.getElementById('si-password').value;
  const errEl    = document.getElementById('signin-error');
  errEl.style.display = 'none';

  const user = getUsers().find(u => u.username === username && u.password === password);
  if (!user) return showAuthError(errEl, 'Incorrect username or password.');

  communityStore('session', { username: user.username, isAdmin: user.isAdmin, firstName: user.firstName });
  communityShowChat();
});

// --- Sign Out ---
document.getElementById('signout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('hyu_session');
  document.getElementById('community-hero').style.display = '';
  document.getElementById('community-auth').style.display = 'flex';
  document.getElementById('community-chat').style.display = 'none';
  document.querySelector('footer').style.display = '';
  // Reset sidebar to tickets panel for next login
  document.querySelectorAll('#community-chat [data-panel^="cm-"]').forEach((l, i) => l.classList.toggle('active', i === 0));
  document.querySelectorAll('#community-chat .member-panel').forEach((p, i) => p.classList.toggle('active', i === 0));
});

function showAuthError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

function communityShowChat() {
  const session = getSession();
  if (!session) return;
  document.getElementById('community-auth').style.display = 'none';
  document.getElementById('community-hero')?.style && (document.getElementById('community-hero').style.display = 'none');
  document.getElementById('community-chat').style.display = 'block';
  document.querySelector('footer').style.display = 'none';
  document.getElementById('chat-username-display').textContent = session.username;
  // Set avatar initials
  const name = session.firstName || session.username;
  const initials = name.substring(0, 2).toUpperCase();
  const avatarSm = document.getElementById('comm-avatar-sm');
  const avatarLg = document.getElementById('comm-avatar-lg');
  const profileName = document.getElementById('comm-profile-name');
  if (avatarSm) avatarSm.textContent = initials;
  if (avatarLg) avatarLg.textContent = initials;
  if (profileName) profileName.textContent = name;
  const badge = document.getElementById('chat-admin-badge');
  const adminForm = document.getElementById('admin-announce-form');
  if (session.isAdmin) { badge.style.display = 'inline'; adminForm.style.display = 'block'; }
  else { badge.style.display = 'none'; adminForm.style.display = 'none'; }
  renderAnnouncements();
  renderMessages();
  renderTickets();
  loadSettingsPanel();
  initChatAccordion();
}

function initChatAccordion() {
  const annSection = document.querySelector('.chat-announcements');
  const chatSection = document.querySelector('.chat-main');
  const chatInput = document.getElementById('chat-input');
  const announceInput = document.getElementById('announce-input');
  if (!annSection || !chatSection || !chatInput) return;

  function expandChat() {
    chatSection.classList.add('section-expanded');
    chatSection.classList.remove('section-collapsed');
    annSection.classList.add('section-collapsed');
    annSection.classList.remove('section-expanded');
  }

  function expandAnn() {
    annSection.classList.add('section-expanded');
    annSection.classList.remove('section-collapsed');
    chatSection.classList.add('section-collapsed');
    chatSection.classList.remove('section-expanded');
  }

  const annHeader = annSection.querySelector('.chat-panel-header');
  const chatHeader = chatSection.querySelector('.chat-panel-header');

  // Remove any previous listeners before re-attaching
  if (chatInput._chatAccordion) chatInput.removeEventListener('focus', chatInput._chatAccordion);
  if (announceInput?._annAccordion) announceInput.removeEventListener('focus', announceInput._annAccordion);
  if (annHeader?._annHeaderAccordion) annHeader.removeEventListener('click', annHeader._annHeaderAccordion);
  if (chatHeader?._chatHeaderAccordion) chatHeader.removeEventListener('click', chatHeader._chatHeaderAccordion);

  chatInput._chatAccordion = expandChat;
  chatInput.addEventListener('focus', expandChat);

  if (announceInput) {
    announceInput._annAccordion = expandAnn;
    announceInput.addEventListener('focus', expandAnn);
  }

  // Tapping a collapsed section header expands it
  if (annHeader) {
    annHeader._annHeaderAccordion = expandAnn;
    annHeader.addEventListener('click', expandAnn);
  }
  if (chatHeader) {
    chatHeader._chatHeaderAccordion = expandChat;
    chatHeader.addEventListener('click', expandChat);
  }

  // Default: chat expanded
  expandChat();
}

// --- Auto-login if session exists ---
document.getElementById('community')?.addEventListener('community:enter', communityShowChat);

// Check session when community page is shown
const _origShowPage = window._origShowPage || showPage;
const _communityPageCheck = function() {
  if (document.getElementById('community')?.classList.contains('active')) {
    const session = getSession();
    if (session) communityShowChat();
  }
};
document.addEventListener('DOMContentLoaded', _communityPageCheck);

// Hook into page routing to check session when community page is navigated to
const origLinks = document.querySelectorAll('[data-page="community"]');
origLinks.forEach(el => el.addEventListener('click', () => setTimeout(_communityPageCheck, 50)));

function annId(a) { return a.id || a.timestamp.toString(); }

// --- Announcements ---
let pendingReply = null;

function setReplyContext(obj) {
  pendingReply = { text: obj.text, username: obj.username, id: obj.id || null };
  document.getElementById('reply-preview-author').textContent = '↩ Replying to ' + obj.username;
  document.getElementById('reply-preview-text').textContent = obj.text;
  document.getElementById('reply-preview').style.display = 'block';
  document.getElementById('chat-input').focus();
}

function clearReplyContext() {
  pendingReply = null;
  document.getElementById('reply-preview').style.display = 'none';
}

function renderAnnouncements() {
  const list = document.getElementById('announcements-list');
  const session = getSession();
  const announcements = getAnnouncements();
  if (!announcements.length) {
    list.innerHTML = '<p class="chat-empty">No announcements yet.</p>';
    return;
  }
  list.innerHTML = announcements.map(a => `
    <div class="announcement-msg" data-id="${annId(a)}">
      <div class="msg-meta">
        ${a.username} · ${formatTime(a.timestamp)}${a.edited ? ' · <span class="msg-edited">edited</span>' : ''}
        <button class="ann-reply-btn" data-ann-id="${annId(a)}">↩ Reply</button>
        ${session?.isAdmin ? `<span class="ann-actions">
          <button class="ann-action-btn edit">Edit</button>
          <button class="ann-action-btn delete">Delete</button>
        </span>` : ''}
      </div>
      <div class="msg-text">${escapeHtml(a.text)}</div>
      ${a.imageUrl ? `<img src="${a.imageUrl}" alt="Announcement image" />` : ''}
    </div>
  `).join('');
  list.scrollTop = list.scrollHeight;
}

document.getElementById('reply-cancel-btn')?.addEventListener('click', clearReplyContext);

document.getElementById('announcements-list')?.addEventListener('click', e => {
  const annEl = e.target.closest('.announcement-msg');
  if (!annEl) return;
  const id = annEl.dataset.id;

  if (e.target.closest('.ann-reply-btn')) {
    const ann = getAnnouncements().find(a => annId(a) === id);
    if (ann) setReplyContext(ann);
    return;
  }

  if (e.target.closest('.ann-action-btn.delete')) {
    let anns = getAnnouncements();
    anns = anns.filter(a => annId(a) !== id);
    communityStore('announcements', anns);
    renderAnnouncements();
    return;
  }

  if (e.target.closest('.ann-action-btn.edit')) {
    const ann = getAnnouncements().find(a => annId(a) === id);
    if (!ann) return;
    annEl.querySelector('.msg-text').style.display = 'none';
    const actEl = annEl.querySelector('.ann-actions');
    if (actEl) actEl.style.display = 'none';
    const wrap = document.createElement('div');
    wrap.className = 'msg-edit-wrap';
    const ta = document.createElement('textarea');
    ta.className = 'msg-edit-textarea';
    ta.value = ann.text;
    const btns = document.createElement('div');
    btns.className = 'msg-edit-btns';
    btns.innerHTML = '<button class="ann-save btn btn-primary btn-sm">Save</button><button class="ann-cancel btn btn-outline btn-sm">Cancel</button>';
    wrap.appendChild(ta); wrap.appendChild(btns);
    annEl.appendChild(wrap);
    ta.focus();
    return;
  }

  if (e.target.closest('.ann-save')) {
    const newText = annEl.querySelector('.msg-edit-textarea')?.value.trim();
    if (!newText) return;
    const anns = getAnnouncements();
    const ann = anns.find(a => annId(a) === id);
    if (ann) { ann.text = newText; ann.edited = true; }
    communityStore('announcements', anns);
    renderAnnouncements();
    return;
  }

  if (e.target.closest('.ann-cancel')) { renderAnnouncements(); }
});

let announceImageData = null;
document.getElementById('announce-img')?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    announceImageData = ev.target.result;
    const preview = document.getElementById('announce-img-preview');
    preview.style.display = 'block';
    preview.innerHTML = `<img src="${announceImageData}" alt="preview" />`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('post-announce-btn')?.addEventListener('click', () => {
  const session = getSession();
  if (!session?.isAdmin) return;
  const text = document.getElementById('announce-input').value.trim();
  if (!text) return;
  const announcements = getAnnouncements();
  announcements.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), username: session.username, text, imageUrl: announceImageData || null, timestamp: Date.now() });
  communityStore('announcements', announcements);
  document.getElementById('announce-input').value = '';
  document.getElementById('announce-img-preview').style.display = 'none';
  announceImageData = null;
  renderAnnouncements();
});

// --- Chat messages ---
function msgId(m) { return m.id || m.timestamp.toString(); }

function renderMessages() {
  const session = getSession();
  const msgs = getMessages();
  const container = document.getElementById('chat-messages');
  if (!msgs.length) { container.innerHTML = '<p class="chat-empty">No messages yet. Start the conversation!</p>'; return; }
  container.innerHTML = msgs.map(m => {
    const isOwn = session && m.username === session.username;
    const textWithMentions = escapeHtml(m.text).replace(/@(\w+)/g, '<span class="msg-mention">@$1</span>');
    const editedMark = m.edited ? ' · <span class="msg-edited">edited</span>' : '';
    const canAct = isOwn || session?.isAdmin;
    const actions = `
      <div class="msg-actions">
        <button class="msg-action-btn reply">↩ Reply</button>
        ${canAct ? '<button class="msg-action-btn edit">Edit</button><button class="msg-action-btn delete">Delete</button>' : ''}
      </div>`;
    const replyQuote = m.replyTo ? `
      <div class="msg-reply-quote${m.replyTo.id ? ' is-jumpable' : ''}" ${m.replyTo.id ? `data-target-id="${m.replyTo.id}"` : ''}>
        <div class="msg-reply-quote-author">↩ ${escapeHtml(m.replyTo.username)}</div>
        <div class="msg-reply-quote-text">${escapeHtml(m.replyTo.text)}</div>
      </div>` : '';
    return `
      <div class="chat-msg ${isOwn ? 'own' : 'other'}${(!isOwn && session?.isAdmin) ? ' admin-can-act' : ''}" data-id="${msgId(m)}">
        <div class="msg-info">${isOwn ? '' : m.username + ' · '}${formatTime(m.timestamp)}${editedMark}</div>
        <div class="msg-bubble">${replyQuote}${textWithMentions}</div>
        ${actions}
      </div>
    `;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const session = getSession();
  if (!session) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  const msgs = getMessages();
  const msg = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), username: session.username, text, timestamp: Date.now() };
  if (pendingReply) msg.replyTo = pendingReply;
  msgs.push(msg);
  communityStore('messages', msgs);
  input.value = '';
  mentionDropdown.style.display = 'none';
  clearReplyContext();
  renderMessages();
}

// --- Edit / Delete message ---
document.getElementById('chat-messages')?.addEventListener('click', e => {
  // Jump to original message when reply quote is tapped
  const quote = e.target.closest('.msg-reply-quote.is-jumpable');
  if (quote) {
    const targetEl = document.querySelector(`#chat-messages .chat-msg[data-id="${quote.dataset.targetId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('msg-highlight');
      setTimeout(() => targetEl.classList.remove('msg-highlight'), 1800);
    }
    return;
  }

  const msgEl = e.target.closest('.chat-msg');
  if (!msgEl) return;
  const id = msgEl.dataset.id;

  if (e.target.closest('.msg-action-btn.reply')) {
    const msg = getMessages().find(m => msgId(m) === id);
    if (msg) setReplyContext({ text: msg.text, username: msg.username, id: msgId(msg) });
    return;
  }

  if (e.target.closest('.msg-action-btn.delete')) {
    let msgs = getMessages();
    msgs = msgs.filter(m => msgId(m) !== id);
    communityStore('messages', msgs);
    renderMessages();
    return;
  }

  if (e.target.closest('.msg-action-btn.edit')) {
    const msgs = getMessages();
    const msg = msgs.find(m => msgId(m) === id);
    if (!msg) return;
    msgEl.querySelector('.msg-bubble').style.display = 'none';
    msgEl.querySelector('.msg-actions').style.display = 'none';
    const wrap = document.createElement('div');
    wrap.className = 'msg-edit-wrap';
    const ta = document.createElement('textarea');
    ta.className = 'msg-edit-textarea';
    ta.value = msg.text;
    const btns = document.createElement('div');
    btns.className = 'msg-edit-btns';
    btns.innerHTML = '<button class="msg-save btn btn-primary btn-sm">Save</button><button class="msg-cancel btn btn-outline btn-sm">Cancel</button>';
    wrap.appendChild(ta); wrap.appendChild(btns);
    msgEl.appendChild(wrap);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    return;
  }

  if (e.target.closest('.msg-save')) {
    const wrap = msgEl.querySelector('.msg-edit-wrap');
    const newText = wrap?.querySelector('.msg-edit-textarea').value.trim();
    if (!newText) return;
    const msgs = getMessages();
    const msg = msgs.find(m => msgId(m) === id);
    if (msg) { msg.text = newText; msg.edited = true; }
    communityStore('messages', msgs);
    renderMessages();
    return;
  }

  if (e.target.closest('.msg-cancel')) {
    renderMessages();
  }
});

document.getElementById('send-msg-btn')?.addEventListener('click', sendMessage);
document.getElementById('chat-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// --- @ Mention dropdown ---
const mentionDropdown = document.getElementById('mention-dropdown');
let mentionQuery = '';
let mentionStart = -1;
let selectedMention = 0;

document.getElementById('chat-input')?.addEventListener('input', e => {
  const val = e.target.value;
  const cursor = e.target.selectionStart;
  const textBefore = val.slice(0, cursor);
  const match = textBefore.match(/@(\w*)$/);

  if (match) {
    mentionQuery = match[1].toLowerCase();
    mentionStart = textBefore.lastIndexOf('@');
    const users = getUsers().filter(u => u.username !== getSession()?.username && u.username.toLowerCase().includes(mentionQuery));
    if (users.length) {
      selectedMention = 0;
      mentionDropdown.style.display = 'block';
      mentionDropdown.innerHTML = users.slice(0, 6).map((u, i) =>
        `<div class="mention-item${i === 0 ? ' selected' : ''}" data-username="${u.username}">@${u.username}</div>`
      ).join('');
      mentionDropdown.querySelectorAll('.mention-item').forEach(item => {
        item.addEventListener('click', () => insertMention(item.dataset.username));
      });
    } else {
      mentionDropdown.style.display = 'none';
    }
  } else {
    mentionDropdown.style.display = 'none';
  }
});

document.getElementById('chat-input')?.addEventListener('keydown', e => {
  if (mentionDropdown.style.display === 'none') return;
  const items = mentionDropdown.querySelectorAll('.mention-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); selectedMention = Math.min(selectedMention + 1, items.length - 1); updateMentionSelection(items); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); selectedMention = Math.max(selectedMention - 1, 0); updateMentionSelection(items); }
  if (e.key === 'Tab' || e.key === 'Enter') {
    if (items[selectedMention]) { e.preventDefault(); insertMention(items[selectedMention].dataset.username); }
  }
  if (e.key === 'Escape') mentionDropdown.style.display = 'none';
});

function updateMentionSelection(items) {
  items.forEach((item, i) => item.classList.toggle('selected', i === selectedMention));
}

function insertMention(username) {
  const input = document.getElementById('chat-input');
  const val = input.value;
  const before = val.slice(0, mentionStart);
  const after  = val.slice(input.selectionStart);
  input.value = before + '@' + username + ' ' + after;
  input.focus();
  mentionDropdown.style.display = 'none';
}

// --- Utilities ---
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}

// Members sidebar panel switching (scoped to the containing grid)
document.querySelectorAll('[data-panel^="cm-"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const panelId = link.dataset.panel;
    const container = link.closest('.comm-dashboard, .members-grid');
    if (!container) return;
    container.querySelectorAll('[data-panel^="cm-"]').forEach(l => l.classList.remove('active'));
    container.querySelectorAll('.member-panel').forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    const panel = document.getElementById(panelId);
    if (panel) { panel.classList.add('active'); panel.style.opacity = '0'; requestAnimationFrame(() => { panel.style.transition = 'opacity 0.3s'; panel.style.opacity = '1'; }); }
  });
});

// --- Star rating ---
let currentRating = 0;
const starBtns = document.querySelectorAll('#star-rating .star');
starBtns.forEach((star, idx) => {
  star.addEventListener('mouseover', () => {
    starBtns.forEach((s, i) => s.classList.toggle('lit', i <= idx));
  });
  star.addEventListener('mouseout', () => {
    starBtns.forEach((s, i) => s.classList.toggle('lit', i < currentRating));
  });
  star.addEventListener('click', () => {
    currentRating = idx + 1;
    starBtns.forEach((s, i) => s.classList.toggle('lit', i < currentRating));
  });
});

// --- Testimonial submit ---
document.getElementById('testi-submit-btn')?.addEventListener('click', () => {
  const session = getSession();
  const quote = document.getElementById('testi-quote').value.trim();
  const role  = document.getElementById('testi-role').value.trim();
  const errEl = document.getElementById('testi-error');
  const okEl  = document.getElementById('testi-success');
  errEl.style.display = 'none';
  okEl.style.display  = 'none';
  if (!currentRating)  return showAuthError(errEl, 'Please select a star rating.');
  if (quote.length < 20) return showAuthError(errEl, 'Please write at least a sentence about your experience.');
  const testimonials = communityGet('testimonials') || [];
  testimonials.push({
    username:  session.username,
    firstName: session.firstName || session.username,
    quote,
    role: role || (session.firstName || session.username),
    rating:    currentRating,
    timestamp: Date.now()
  });
  communityStore('testimonials', testimonials);
  okEl.style.display = 'block';
  document.getElementById('testi-quote').value = '';
  document.getElementById('testi-role').value  = '';
  currentRating = 0;
  starBtns.forEach(s => s.classList.remove('lit'));
  renderHomepageTestimonials();
});

// --- Render member-submitted testimonials on home page ---
function renderHomepageTestimonials() {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;
  grid.querySelectorAll('.testimonial-card.user-submitted').forEach(el => el.remove());
  const testimonials = communityGet('testimonials') || [];
  testimonials.forEach(t => {
    const initials  = (t.firstName || t.username).substring(0, 2).toUpperCase();
    const starStr   = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
    const card = document.createElement('div');
    card.className = 'testimonial-card user-submitted reveal';
    card.innerHTML = `
      <div class="testimonial-stars">${starStr}</div>
      <p class="testimonial-quote">${escapeHtml(t.quote)}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar" style="font-size:0.8rem;">${initials}</div>
        <div>
          <div class="testimonial-name">${escapeHtml(t.firstName || t.username)}</div>
          <div class="testimonial-role">${escapeHtml(t.role)}</div>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}
document.addEventListener('DOMContentLoaded', renderHomepageTestimonials);

// === SETTINGS ===

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUsers().find(u => u.username === session.username) || null;
}

function updateUserRecord(updated) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === updated.username);
  if (idx === -1) return false;
  users[idx] = updated;
  communityStore('users', users);
  return true;
}

function loadSettingsPanel() {
  const user = getCurrentUser();
  if (!user) return;
  const f = {
    'set-first': user.firstName || '', 'set-last': user.lastName || '',
    'set-email': user.email || '', 'set-phone': user.phone || '',
    'set-addr1': user.addr1 || '', 'set-addr2': user.addr2 || '',
    'set-postcode': user.postcode || '', 'set-city': user.city || '', 'set-county': user.county || '',
  };
  Object.entries(f).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  ['set-cur-pw','set-new-pw','set-confirm-pw'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const status = document.getElementById('set-postcode-status');
  if (status) { status.textContent = ''; status.className = 'postcode-status'; }
}

document.getElementById('set-profile-save')?.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) return;
  const first    = document.getElementById('set-first').value.trim();
  const last     = document.getElementById('set-last').value.trim();
  const email    = document.getElementById('set-email').value.trim();
  const phone    = document.getElementById('set-phone').value.trim();
  const addr1    = document.getElementById('set-addr1').value.trim();
  const addr2    = document.getElementById('set-addr2').value.trim();
  const postcode = document.getElementById('set-postcode').value.trim().toUpperCase();
  const city     = document.getElementById('set-city').value.trim();
  const county   = document.getElementById('set-county').value.trim();
  const errEl = document.getElementById('set-profile-error');
  const okEl  = document.getElementById('set-profile-success');
  errEl.style.display = 'none'; okEl.style.display = 'none';
  if (!first || !email) { errEl.textContent = 'First name and email are required.'; errEl.style.display = 'block'; return; }
  const others = getUsers().filter(u => u.username !== user.username);
  if (others.find(u => u.email.toLowerCase() === email.toLowerCase())) { errEl.textContent = 'That email is already in use by another account.'; errEl.style.display = 'block'; return; }
  updateUserRecord({ ...user, firstName: first, lastName: last, email, phone, addr1, addr2, postcode, city, county });
  // Keep session first name in sync
  const session = getSession();
  if (session) communityStore('session', { ...session, firstName: first });
  document.getElementById('comm-profile-name').textContent = first;
  const initials = first.substring(0, 2).toUpperCase();
  ['comm-avatar-sm','comm-avatar-lg'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = initials; });
  okEl.style.display = 'block';
  setTimeout(() => { okEl.style.display = 'none'; }, 3000);
});

document.getElementById('set-pw-save')?.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) return;
  const cur     = document.getElementById('set-cur-pw').value;
  const newPw   = document.getElementById('set-new-pw').value;
  const confirm = document.getElementById('set-confirm-pw').value;
  const errEl   = document.getElementById('set-pw-error');
  const okEl    = document.getElementById('set-pw-success');
  errEl.style.display = 'none'; okEl.style.display = 'none';
  if (!cur || !newPw || !confirm) { errEl.textContent = 'Please fill in all password fields.'; errEl.style.display = 'block'; return; }
  if (cur !== user.password) { errEl.textContent = 'Current password is incorrect.'; errEl.style.display = 'block'; return; }
  if (newPw.length < 6) { errEl.textContent = 'New password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
  if (newPw !== confirm) { errEl.textContent = 'New passwords do not match.'; errEl.style.display = 'block'; return; }
  updateUserRecord({ ...user, password: newPw });
  ['set-cur-pw','set-new-pw','set-confirm-pw'].forEach(id => { document.getElementById(id).value = ''; });
  okEl.style.display = 'block';
  setTimeout(() => { okEl.style.display = 'none'; }, 3000);
});

document.getElementById('set-postcode-find')?.addEventListener('click', async () => {
  const raw    = document.getElementById('set-postcode').value.trim();
  const status = document.getElementById('set-postcode-status');
  if (!raw) { status.textContent = 'Please enter a postcode first.'; status.className = 'postcode-status err'; return; }
  status.textContent = 'Looking up…'; status.className = 'postcode-status';
  try {
    const res  = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(raw.replace(/\s+/g, '')));
    const data = await res.json();
    if (data.status === 200 && data.result) {
      const r = data.result;
      document.getElementById('set-postcode').value = r.postcode;
      document.getElementById('set-city').value   = r.admin_district || r.parish || '';
      document.getElementById('set-county').value = r.admin_county   || r.region  || '';
      status.textContent = '✓ Postcode found — city and county filled in'; status.className = 'postcode-status ok';
    } else {
      status.textContent = 'Postcode not found. Please check and try again.'; status.className = 'postcode-status err';
    }
  } catch {
    status.textContent = 'Could not reach the address service. Please try again.'; status.className = 'postcode-status err';
  }
});

// === MY TICKETS ===

function getTickets() {
  const session = getSession();
  if (!session) return [];
  const raw = localStorage.getItem('hyu_tickets_' + session.username);
  return raw ? JSON.parse(raw) : [];
}

function storeTickets(tickets) {
  const session = getSession();
  if (!session) return;
  localStorage.setItem('hyu_tickets_' + session.username, JSON.stringify(tickets));
}

function generateBarcodeSVG(ref) {
  const chars = (ref || 'TICKET').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const bars = [{ w: 3, g: 2 }, { w: 1.5, g: 1.5 }];
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bars.push({ w: (code >> b) & 1 ? 3 : 1.5, g: 1.5 });
    }
  }
  bars.push({ w: 1.5, g: 1.5 }, { w: 3, g: 0 });

  const h = 72;
  let x = 4, rects = '';
  bars.forEach(b => {
    rects += `<rect x="${x.toFixed(1)}" y="0" width="${b.w.toFixed(1)}" height="${h}" fill="white"/>`;
    x += b.w + b.g;
  });
  const W = (x + 4).toFixed(0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" style="background:#111;border-radius:4px;padding:8px 4px;box-sizing:border-box;">${rects}</svg>`;
}

function showTicketModal(ticket) {
  const modal = document.getElementById('ticket-modal');
  if (!modal) return;
  document.getElementById('tm-event').textContent = ticket.event;
  const d = ticket.date ? new Date(ticket.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBC';
  document.getElementById('tm-date').textContent = d;
  document.getElementById('tm-location').textContent = ticket.location || 'Location TBC';
  document.getElementById('tm-qty').textContent = ticket.qty + (ticket.qty === 1 ? ' ticket' : ' tickets');
  document.getElementById('tm-ref').textContent = ticket.ref;
  const barcodeEl = document.getElementById('tm-barcode');
  barcodeEl.innerHTML = generateBarcodeSVG(ticket.ref);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTicketModal() {
  const modal = document.getElementById('ticket-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function renderTickets() {
  const list = document.getElementById('tickets-list');
  const empty = document.getElementById('tickets-empty');
  if (!list) return;
  const tickets = getTickets();
  if (tickets.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = tickets.map((t, i) => {
    const dateStr = t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC';
    return `<div class="ticket-card" data-ticket-idx="${i}">
      <div class="ticket-card-left">
        <div class="ticket-card-icon">🎟️</div>
        <div class="ticket-card-info">
          <h4>${escapeHtml(t.event)}</h4>
          <p>${escapeHtml(dateStr)} · ${escapeHtml(t.location || 'Location TBC')} · Ref: <strong>${escapeHtml(t.ref)}</strong></p>
        </div>
      </div>
      <div class="ticket-card-actions">
        <span class="ticket-card-badge">${t.qty} ticket${t.qty !== 1 ? 's' : ''}</span>
        <button class="ticket-delete-btn" data-del-ticket="${i}" title="Remove ticket">✕ Remove</button>
      </div>
    </div>`;
  }).join('');
}

// Ticket card interactions
document.addEventListener('click', e => {
  const delBtn = e.target.closest('[data-del-ticket]');
  if (delBtn) {
    e.stopPropagation();
    const idx = parseInt(delBtn.dataset.delTicket, 10);
    const tickets = getTickets();
    tickets.splice(idx, 1);
    storeTickets(tickets);
    renderTickets();
    return;
  }
  const card = e.target.closest('.ticket-card[data-ticket-idx]');
  if (card) {
    const idx = parseInt(card.dataset.ticketIdx, 10);
    const t = getTickets()[idx];
    if (t) showTicketModal(t);
  }
});

document.getElementById('ticket-modal-close')?.addEventListener('click', closeTicketModal);
document.querySelector('.ticket-modal-backdrop')?.addEventListener('click', closeTicketModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTicketModal(); });

document.getElementById('add-ticket-btn')?.addEventListener('click', () => {
  const form = document.getElementById('add-ticket-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('cancel-ticket-btn')?.addEventListener('click', () => {
  const form = document.getElementById('add-ticket-form');
  if (form) form.style.display = 'none';
  const err = document.getElementById('ticket-form-error');
  if (err) err.style.display = 'none';
});

document.getElementById('save-ticket-btn')?.addEventListener('click', () => {
  const event = document.getElementById('ticket-event').value.trim();
  const date = document.getElementById('ticket-date').value;
  const location = document.getElementById('ticket-location').value.trim();
  const ref = document.getElementById('ticket-ref').value.trim();
  const qty = parseInt(document.getElementById('ticket-qty').value, 10) || 1;
  const errEl = document.getElementById('ticket-form-error');
  if (!event || !ref) {
    errEl.textContent = 'Event name and booking reference are required.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  const tickets = getTickets();
  tickets.unshift({ event, date, location, ref, qty, added: Date.now() });
  storeTickets(tickets);
  renderTickets();
  ['ticket-event', 'ticket-date', 'ticket-location', 'ticket-ref'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('ticket-qty').value = '1';
  document.getElementById('add-ticket-form').style.display = 'none';
});

// --- Nav dropdown toggle (touch/click support) ---
document.querySelectorAll('.nav-dropdown-wrap').forEach(wrap => {
  wrap.querySelector('.nav-dropdown-trigger')?.addEventListener('click', e => {
    e.preventDefault();
    wrap.classList.toggle('open');
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('.nav-dropdown-wrap')) {
    document.querySelectorAll('.nav-dropdown-wrap').forEach(w => w.classList.remove('open'));
  }
});

// === TICKET TAILOR IFRAME LOGIC ===
(function () {
  const iframe    = document.getElementById('tt-iframe');
  const loading   = document.getElementById('tt-loading');
  const wrap      = document.getElementById('tt-iframe-wrap');
  const comingSoon = document.getElementById('tt-coming-soon');
  if (!iframe || !comingSoon) return;

  let resolved = false;

  function showEvents(height) {
    if (resolved) return;
    resolved = true;
    if (loading) loading.style.display = 'none';
    iframe.style.display = 'block';
    if (height) iframe.style.height = height + 'px';
    if (comingSoon) comingSoon.style.display = 'none';
  }

  function showComingSoon() {
    if (resolved) return;
    resolved = true;
    if (wrap) wrap.style.display = 'none';
    if (comingSoon) {
      comingSoon.style.display = 'flex';
      renderCSPreviews();
    }
  }

  function renderCSPreviews() {
    const container = document.getElementById('tt-cs-previews');
    if (!container || typeof HIKES === 'undefined') return;
    container.innerHTML = HIKES.map(h => `
      <div class="tt-preview-card">
        <div class="tt-preview-img">
          <img src="${h.image}" alt="${h.name}" loading="lazy" />
          <span class="tt-preview-tag">${h.type} Hyke</span>
          <span class="tt-cs-label">Coming Soon</span>
        </div>
        <div class="tt-preview-body">
          <h3>${h.name}</h3>
          <div class="tt-preview-meta">
            <span>📅 ${h.date}</span>
            <span>📍 ${h.location}</span>
            <span>⏱ ${h.duration}</span>
          </div>
          <div class="tt-preview-price">
            <span>£${h.price}</span>
            <em>per person</em>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Ticket Tailor sends postMessage to resize their embed iframe
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object') return;
    const h = e.data.height || e.data.frameHeight || e.data.iframeHeight;
    if (h !== undefined) {
      parseInt(h, 10) > 150 ? showEvents(parseInt(h, 10)) : showComingSoon();
    }
  });

  // Fallback: iframe loaded but no postMessage — check after a grace period
  iframe.addEventListener('load', function () {
    setTimeout(function () {
      if (!resolved) showComingSoon();
    }, 4000);
  });

  // Fallback: if iframe never fires load (blocked/error) after 8s
  setTimeout(function () {
    if (!resolved) showComingSoon();
  }, 8000);
})();

// === EARLY ACCESS POPUP ===
(function () {
  const STORAGE_KEY = 'hyu_ea_popup_seen';
  const popup = document.getElementById('early-access-popup');
  if (!popup) return;

  function closePopup() {
    popup.style.opacity = '0';
    popup.style.transition = 'opacity 0.3s';
    setTimeout(() => { popup.style.display = 'none'; }, 300);
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function showPopup() {
    popup.style.display = 'flex';
    popup.style.opacity = '0';
    requestAnimationFrame(() => {
      popup.style.transition = 'opacity 0.4s';
      popup.style.opacity = '1';
    });
  }

  // Show after 1.5s on first visit only
  if (!localStorage.getItem(STORAGE_KEY)) {
    setTimeout(showPopup, 1500);
  }

  // Close buttons
  document.getElementById('ea-popup-close')?.addEventListener('click', closePopup);
  document.getElementById('ea-popup-skip')?.addEventListener('click', closePopup);
  document.querySelector('.ea-popup-backdrop')?.addEventListener('click', closePopup);

  // Form submit
  document.getElementById('ea-popup-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('ea-fullname').value.trim();
    const email = document.getElementById('ea-email').value.trim();
    const errEl = document.getElementById('ea-popup-error');

    if (!name) {
      errEl.textContent = 'Please enter your full name.';
      errEl.style.display = 'block';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter a valid email address.';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';

    // Store submission and show success state
    const submissions = JSON.parse(localStorage.getItem('hyu_ea_submissions') || '[]');
    submissions.push({ name, email, ts: Date.now() });
    localStorage.setItem('hyu_ea_submissions', JSON.stringify(submissions));
    localStorage.setItem(STORAGE_KEY, '1');

    const body = popup.querySelector('.ea-popup-body');
    body.innerHTML = `
      <div class="ea-popup-success">
        <div class="ea-popup-success-icon">🎉</div>
        <h3>You're on the list!</h3>
        <p>Thanks, <strong>${escapeHtml(name)}</strong>! We'll be in touch with early access and member offers very soon.</p>
      </div>`;
    setTimeout(closePopup, 2800);
  });
})();
