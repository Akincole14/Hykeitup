// =====================================================================
// ICEBERG THEME — scribbles, word-by-word statement reveal,
// side tab and statement parallax. Pairs with css/iceberg.css.
// =====================================================================
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Hand-drawn scribbles -------------------------------------------
  const SHAPES = {
    circle: {
      viewBox: '0 0 200 60',
      d: 'M150 7C112 -1 36 4 13 21C-6 36 38 58 112 54C172 51 201 35 187 18C176 7 141 3 92 6',
    },
    underline: {
      viewBox: '0 0 200 16',
      d: 'M3 11C48 4 118 13 197 5',
    },
  };

  function addScribble(el, shape) {
    if (el.querySelector(':scope > .ib-scribble')) return;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'ib-scribble');
    svg.setAttribute('viewBox', SHAPES[shape].viewBox);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', SHAPES[shape].d);
    path.setAttribute('pathLength', '1');
    svg.appendChild(path);
    el.appendChild(svg);
  }

  document.querySelectorAll('.ib-circled').forEach(el => addScribble(el, 'circle'));
  document.querySelectorAll('.ib-underlined').forEach(el => addScribble(el, 'underline'));

  const drawObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('ib-drawn');
        drawObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.ib-circled, .ib-underlined').forEach(el => drawObserver.observe(el));

  // --- Word-by-word statement reveal ----------------------------------
  const splits = [...document.querySelectorAll('.ib-split')];
  splits.forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // --- Scroll-driven effects ------------------------------------------
  const sideTab = document.querySelector('.ib-side-tab');
  const hero = document.querySelector('#home .hero');
  const statement = document.querySelector('.ib-statement');
  const statementBg = document.querySelector('.ib-statement-bg');

  function onScroll() {
    const vh = window.innerHeight;

    if (sideTab) {
      const onHome = hero && hero.offsetParent !== null;
      const pastHero = onHome ? hero.getBoundingClientRect().bottom < vh * 0.5 : window.scrollY > vh * 0.4;
      sideTab.classList.toggle('show', pastHero);
    }

    splits.forEach(el => {
      const rect = el.getBoundingClientRect();
      // 0 when the block's top hits 85% of the viewport, 1 when its bottom reaches 55%
      const start = vh * 0.85, end = vh * 0.55;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height)));
      const words = el.querySelectorAll('.w');
      const lit = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle('on', reduceMotion || i < lit));
    });

    if (statement && statementBg && !reduceMotion) {
      const rect = statement.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < vh) {
        const offset = (rect.top + rect.height / 2 - vh / 2) * -0.12;
        statementBg.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    }
  }

  // --- Track the active page on <body> so CSS can tune per page --------
  function syncActivePage() {
    const active = document.querySelector('.page.active');
    if (active) document.body.dataset.page = active.id;
    onScroll();
  }
  const pageObserver = new MutationObserver(syncActivePage);
  document.querySelectorAll('.page').forEach(p => pageObserver.observe(p, { attributes: true, attributeFilter: ['class'] }));
  syncActivePage();

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
