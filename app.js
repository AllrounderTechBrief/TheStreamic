/* =========================================================
   STREAMIC — Home loader + smooth effects (fast)
   ========================================================= */
(() => {
  /* ---------- Mobile nav toggle (kept, hidden on desktop) ---------- */
  const t = document.querySelector('.nav-toggle');
  const l = document.getElementById('navLinks');
  if (t && l) {
    t.addEventListener('click', () => {
      const e = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!e));
      l.classList.toggle('show');
    });
  }

  /* =========================================================
     View Transitions — zero‑jank page change
     ========================================================= */
  (function enableViewTransitions() {
    if (!('startViewTransition' in document)) return;
    document.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (a.target === '_blank' || a.hasAttribute('download') || url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      ev.preventDefault();
      document.startViewTransition(() => { location.href = a.href; });
    }, { capture: true });
  })();

  /* =========================================================
     Card rendering
     ========================================================= */
  function renderCard(i) {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = i.link;
    a.target = '_blank';
    a.rel = 'noopener';

    const w = document.createElement('div');
    w.className = 'card-image';

    const img = document.createElement('img');
    img.alt = i.source ? ('Image from ' + i.source) : 'News image';
    img.src = 'assets/fallback.jpg';
    img.loading = 'lazy';

    if (i.image) {
      const pre = new Image();
      pre.onload = () => { img.src = i.image; img.classList.add('loaded'); };
      pre.src = i.image;
    } else {
      requestAnimationFrame(() => img.classList.add('loaded'));
    }

    w.appendChild(img); a.appendChild(w);

    const b = document.createElement('div');
    b.className = 'card-body';
    const h = document.createElement('h3'); h.textContent = i.title || 'Untitled';
    const s = document.createElement('span'); s.className = 'source'; s.textContent = i.source || '';
    b.appendChild(h); b.appendChild(s); a.appendChild(b);

    bindCardEnhancements(a);
    return a;
  }

  /* =========================================================
     Smooth Effects — fade-in, parallax, 3D tilt
     ========================================================= */
  const visibleCards = new Set();
  let rafScheduled = false;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const card = en.target;
      if (en.isIntersecting) {
        card.classList.add('in-view');
        visibleCards.add(card);
      } else {
        visibleCards.delete(card);
      }
    });
    scheduleParallax();
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

  function scheduleParallax(){
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(applyParallax);
  }

  function applyParallax(){
    rafScheduled = false;
    const vh = window.innerHeight || 800;
    visibleCards.forEach((card) => {
      const img = card.querySelector('.card-image img');
      if (!img) return;
      const rect = card.getBoundingClientRect();
      const p = (rect.top + rect.height / 2 - vh / 2) / vh;
      const translate = Math.max(-12, Math.min(12, -p * 24));
      img.style.setProperty('--py', translate.toFixed(2) + 'px');
    });
  }

  window.addEventListener('scroll', scheduleParallax, { passive: true });
  window.addEventListener('resize', scheduleParallax, { passive: true });

  const hasFinePointer = matchMedia('(pointer:fine)').matches;
  function bindTilt(card){
    if (!hasFinePointer) return;
    let raf = 0;
    function onMove(e){
      if (raf) return;
      const { clientX:x, clientY:y } = e;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = card.getBoundingClientRect();
        const dx = (x - r.left) / r.width - 0.5;
        const dy = (y - r.top) / r.height - 0.5;
        const max = 6;
        card.classList.add('tilting');
        card.style.setProperty('--ry', (-dx * max).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ( dy * max).toFixed(2) + 'deg');
      });
    }
    function onLeave(){
      if (raf) cancelAnimationFrame(raf);
      card.classList.remove('tilting');
      card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
    }
    card.addEventListener('mousemove', onMove, { passive: true });
    card.addEventListener('mouseleave', onLeave, { passive: true });
  }

  function bindCardEnhancements(card){
    io.observe(card);
    bindTilt(card);
  }

  // Expose for category.js
  window.__streamicBindCardEnhancements = bindCardEnhancements;

  /* =========================================================
     HOME: auto-load sections
     ========================================================= */
  function loadHome(){
    document.querySelectorAll('.home-section').forEach(sec => {
      const file = sec.getAttribute('data-json');
      const grid = sec.querySelector('.card-grid');
      if (!file || !grid) return;
      fetch('data/' + file)
        .then(r => r.json())
        .then(items => {
          (items || []).slice(0, 10).forEach(it => grid.appendChild(renderCard(it)));
          scheduleParallax();
        })
        .catch(()=>{ /* ignore */ });
    });
  }

  if (document.querySelector('.home')) loadHome();

})();
