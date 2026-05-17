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
function resetTickets() {
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
