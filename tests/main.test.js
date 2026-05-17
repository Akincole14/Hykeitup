/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const scriptSrc = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');

beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.scrollTo = jest.fn();
  window.requestAnimationFrame = fn => setTimeout(fn, 0);
  window.Stripe = jest.fn(() => ({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({ mount: jest.fn(), on: jest.fn() })),
    })),
    confirmPayment: jest.fn(),
  }));
});

// Load the HTML and execute main.js fresh before each test
function setup() {
  document.documentElement.innerHTML = html;
  eval(scriptSrc); // eslint-disable-line no-eval
}

// ── PAGE ROUTING ──────────────────────────────────────────────────

describe('Page routing', () => {
  beforeEach(setup);

  test('home page is active on load', () => {
    expect(document.getElementById('home').classList.contains('active')).toBe(true);
  });

  test('about page is hidden on load', () => {
    expect(document.getElementById('about').classList.contains('active')).toBe(false);
  });

  test('clicking About in nav activates the about page', () => {
    document.querySelector('[data-page="about"]').click();
    expect(document.getElementById('about').classList.contains('active')).toBe(true);
    expect(document.getElementById('home').classList.contains('active')).toBe(false);
  });

  test('clicking Gallery in nav activates the gallery page', () => {
    document.querySelector('[data-page="gallery"]').click();
    expect(document.getElementById('gallery').classList.contains('active')).toBe(true);
  });

  test('clicking a nav link closes the mobile menu', () => {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.add('open');
    document.querySelector('[data-page="about"]').click();
    expect(navLinks.classList.contains('open')).toBe(false);
  });
});

// ── GALLERY FILTER ────────────────────────────────────────────────

describe('Gallery filter', () => {
  beforeEach(setup);

  test('"All" filter button is active on load', () => {
    expect(document.querySelector('.filter-btn[data-filter="all"]').classList.contains('active')).toBe(true);
  });

  test('clicking a filter button gives it the active class', () => {
    const majorBtn = document.querySelector('.filter-btn[data-filter="major"]');
    majorBtn.click();
    expect(majorBtn.classList.contains('active')).toBe(true);
  });

  test('clicking Major filter removes active from All button', () => {
    document.querySelector('.filter-btn[data-filter="major"]').click();
    expect(document.querySelector('.filter-btn[data-filter="all"]').classList.contains('active')).toBe(false);
  });

  test('clicking Major filter sets opacity:0 on non-major items', () => {
    document.querySelector('.filter-btn[data-filter="major"]').click();
    const nonMajor = Array.from(document.querySelectorAll('.gallery-item'))
      .filter(el => el.dataset.category !== 'major');
    expect(nonMajor.length).toBeGreaterThan(0);
    nonMajor.forEach(el => expect(el.style.opacity).toBe('0'));
  });

  test('clicking Major filter leaves major items displayed', () => {
    document.querySelector('.filter-btn[data-filter="major"]').click();
    const major = Array.from(document.querySelectorAll('.gallery-item'))
      .filter(el => el.dataset.category === 'major');
    expect(major.length).toBeGreaterThan(0);
    major.forEach(el => expect(el.style.display).not.toBe('none'));
  });
});

// ── TICKET BOOKING — STEP 1 ───────────────────────────────────────

describe('Ticket booking — step 1', () => {
  beforeEach(setup);

  test('three hike options are rendered', () => {
    expect(document.querySelectorAll('.hike-option').length).toBe(3);
  });

  test('Continue button is disabled before selecting a hike', () => {
    expect(document.getElementById('step1-next').disabled).toBe(true);
  });

  test('selecting a hike enables the Continue button', () => {
    document.querySelector('.hike-option').click();
    expect(document.getElementById('step1-next').disabled).toBe(false);
  });

  test('Snowdon total shows £47.00 (£45 ticket + £2 booking fee)', () => {
    document.querySelector('[data-hike-id="snowdon"]').click();
    expect(document.getElementById('step1-total').textContent).toBe('£47.00');
  });

  test('qty display starts at 1', () => {
    expect(document.getElementById('qty-display').textContent).toBe('1');
  });

  test('qty minus button is disabled on load', () => {
    expect(document.getElementById('qty-minus').disabled).toBe(true);
  });

  test('clicking + after selecting a hike increments qty to 2', () => {
    document.querySelector('.hike-option').click();
    document.getElementById('qty-plus').click();
    expect(document.getElementById('qty-display').textContent).toBe('2');
  });

  test('clicking + then - returns qty to 1', () => {
    document.querySelector('.hike-option').click();
    document.getElementById('qty-plus').click();
    document.getElementById('qty-minus').click();
    expect(document.getElementById('qty-display').textContent).toBe('1');
  });

  test('total updates when ticket quantity changes (2 × Snowdon = £94.00)', () => {
    document.querySelector('[data-hike-id="snowdon"]').click();
    document.getElementById('qty-plus').click();
    expect(document.getElementById('step1-total').textContent).toBe('£94.00');
  });

  test('clicking Continue advances to step 2', () => {
    document.querySelector('.hike-option').click();
    document.getElementById('step1-next').click();
    expect(document.getElementById('ticket-step-2').classList.contains('active')).toBe(true);
  });
});

// ── ATTENDEE FORM VALIDATION ──────────────────────────────────────

describe('Attendee form validation', () => {
  beforeEach(() => {
    setup();
    document.querySelector('.hike-option').click();
    document.getElementById('step1-next').click();
  });

  test('clicking Continue with empty form does not advance to step 3', () => {
    document.getElementById('step2-next').click();
    expect(document.getElementById('ticket-step-3').classList.contains('active')).toBe(false);
  });

  test('empty required fields get a red border on submit attempt', () => {
    document.getElementById('step2-next').click();
    expect(document.getElementById('t-first').style.borderColor).toContain('224,82,82');
  });

  test('filling all required fields allows advancing to step 3', () => {
    document.getElementById('t-first').value = 'Jane';
    document.getElementById('t-last').value = 'Smith';
    document.getElementById('t-email').value = 'jane@example.com';
    document.getElementById('t-phone').value = '+44 7700 000001';
    document.getElementById('t-em-name').value = 'Bob Smith';
    document.getElementById('t-em-phone').value = '+44 7700 000002';
    document.getElementById('t-fitness').value = 'intermediate';
    document.getElementById('step2-next').click();
    expect(document.getElementById('ticket-step-3').classList.contains('active')).toBe(true);
  });

  test('Back button from step 2 returns to step 1', () => {
    document.getElementById('step2-back').click();
    expect(document.getElementById('ticket-step-1').classList.contains('active')).toBe(true);
  });
});

// ── LIGHTBOX ──────────────────────────────────────────────────────

describe('Lightbox', () => {
  beforeEach(setup);

  test('lightbox is closed on load', () => {
    expect(document.getElementById('lightbox').classList.contains('open')).toBe(false);
  });

  test('clicking a gallery item opens the lightbox', () => {
    document.querySelector('.gallery-item').click();
    expect(document.getElementById('lightbox').classList.contains('open')).toBe(true);
  });

  test('lightbox image src is populated when opened', () => {
    document.querySelector('.gallery-item').click();
    expect(document.getElementById('lightbox-img').src).not.toBe('');
  });

  test('close button closes the lightbox', () => {
    document.querySelector('.gallery-item').click();
    document.getElementById('lightbox-close').click();
    expect(document.getElementById('lightbox').classList.contains('open')).toBe(false);
  });

  test('clicking the lightbox backdrop closes it', () => {
    document.querySelector('.gallery-item').click();
    const lightbox = document.getElementById('lightbox');
    lightbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(lightbox.classList.contains('open')).toBe(false);
  });
});
