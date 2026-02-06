/* category.js — Streamic
   Updated: 2026-02-06
   - 6 cards per row (CSS enforced)
   - Load 6 at a time
   - Direct image load with onerror fallback (no pre-check)
*/
(() => {
  let allItems = [];
  let visible = 0;

  const BATCH = 6;
  const COLS = 6;

  const byId = (id) => document.getElementById(id);

  function ensureGridColumns() {
    const grid = byId('content');
    if (!grid) return;
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
    grid.style.gap = '28px';
    grid.style.padding = '24px 20px';
  }

  function renderCard(i){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = i.link;
    a.target = '_blank';
    a.rel = 'noopener';

    const w = document.createElement('div');
    w.className = 'card-image';

    const img = document.createElement('img');
    img.alt = i.source ? ('Image from ' + i.source) : 'News image';
    img.loading = 'lazy';
    img.src = i.image || 'assets/fallback.jpg';
    img.onerror = () => { img.src = 'assets/fallback.jpg'; };

    w.appendChild(img);
    a.appendChild(w);

    const b = document.createElement('div');
    b.className = 'card-body';

    const h = document.createElement('h3');
    h.textContent = i.title || 'Untitled';

    const s = document.createElement('span');
    s.className = 'source';
    s.textContent = i.source || '';

    b.appendChild(h);
    b.appendChild(s);
    a.appendChild(b);

    return a;
  }

  function renderNext() {
    const grid = byId('content');
    const btn = byId('loadMoreBtn');
    if (!grid) return;

    const slice = allItems.slice(visible, visible + BATCH);
    slice.forEach(item => grid.appendChild(renderCard(item)));
    visible += slice.length;

    if (btn) btn.style.display = (visible < allItems.length) ? '' : 'none';
  }

  function loadSingleCategory(jsonFile) {
    const grid = byId('content');
    const btn = byId('loadMoreBtn');
    if (grid) grid.innerHTML = '';
    if (btn) btn.style.display = 'none';
    allItems = [];
    visible = 0;

    ensureGridColumns();

    fetch(`data/${jsonFile}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(items => {
        allItems = Array.isArray(items) ? items : [];
        renderNext();
      })
      .catch(err => {
        console.error('loadSingleCategory error:', err);
        if (grid) {
          grid.innerHTML = `<p style="padding:20px;color:#c00">
            Failed to load items. Please try again later.
          </p>`;
        }
      });
  }

  function onLoadMoreClick(e) {
    e.preventDefault();
    renderNext();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = byId('loadMoreBtn');
    if (btn) btn.addEventListener('click', onLoadMoreClick);
  });

  window.loadSingleCategory = loadSingleCategory;
})();
