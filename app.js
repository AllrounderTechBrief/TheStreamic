/* =========================================================
   STREAMIC — App bootstrap (home loader + shared renderer)
   - NO BLUR: simple transitions only
   - Reuses three JSON outputs from build.py:
       out-3d-vfx.json, out-editing.json, out-hardware.json
========================================================= */
(() => {
  /* ---------- Shared Card Renderer (no blur) ---------- */
  function renderCard(item) {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = item.link || '#';
    a.target = '_blank';
    a.rel = 'noopener';

    // Image area (always present to keep aspect-ratio stable)
    const fig = document.createElement('figure');
    fig.className = 'card-image';

    const img = document.createElement('img');
    img.alt = item.source ? ('Image from ' + item.source) : 'News image';
    img.loading = 'lazy';
    img.src = item.image || 'assets/fallback.jpg';

    // If real image fails, the fallback stays
    img.addEventListener('error', () => { img.src = 'assets/fallback.jpg'; });

    fig.appendChild(img);
    a.appendChild(fig);

    // Body
    const body = document.createElement('div');
    body.className = 'card-body';
    const h = document.createElement('h3'); h.textContent = item.title || 'Untitled';
    const s = document.createElement('span'); s.className = 'source'; s.textContent = item.source || '';
    body.appendChild(h); body.appendChild(s);
    a.appendChild(body);

    // Gentle tilt/parallax (light)
    a.addEventListener('pointermove', (e) => {
      const r = a.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = Math.max(-4, Math.min(4, py * 4));
      const ry = Math.max(-4, Math.min(4, -px * 4));
      a.style.transform = `translateY(-2px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    a.addEventListener('pointerleave', () => { a.style.transform = ''; });

    return a;
  }
  window.__streamicRenderCard = renderCard;

  /* ---------- Normalizer ---------- */
  const norm = (it) => ({
    title:  it.title || it.headline || 'Untitled',
    link:   it.link || it.url || '#',
    source: it.source || it.site || '',
    image:  it.image || it.imageUrl || it.thumbnail || ''
  });

  /* ---------- Map 6 homepage sections → 3 JSON files ---------- */
  const SOURCE_MAP = {
    'streaming-tech': 'data/out-hardware.json', // closest fit
    'newsroom':       'data/out-editing.json',
    'playout':        'data/out-hardware.json',
    'ip-video':       'data/out-3d-vfx.json',
    'cloud-ai':       'data/out-editing.json',
    'audio':          'data/out-hardware.json'
  };

  /* ---------- Home sections loader ---------- */
  function loadHome() {
    document.querySelectorAll('.home-section').forEach((sec) => {
      const id = (sec.querySelector('.card-grid')?.id || '').replace('grid-',''); // e.g., grid-streaming-tech → streaming-tech
      const src = SOURCE_MAP[id];
      const grid = sec.querySelector('.card-grid');
      if (!src || !grid) return;

      fetch(src)
        .then(r => r.json())
        .then(items => {
          (items || []).slice(0, 10).map(norm).forEach((it) => {
            grid.appendChild(renderCard(it));
          });
        })
        .catch(() => { /* silent fail */ });
    });
  }

  if (document.querySelector('.home')) {
    if (document.readyState !== 'loading') loadHome();
    else document.addEventListener('DOMContentLoaded', loadHome);
  }
})();
