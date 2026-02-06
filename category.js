/* category.js — Streamic
   Updated: 2026-02-06
   - Exactly 6 cards per row
   - Loads 6 at a time
   - Proper button visibility
   - Safe image loading with fallback
   - Basic error handling
*/
(() => {
  let allItems = [];
  let visible = 0;

  const BATCH = 6; // load 6 at a time
  const COLS = 6;  // show 6 columns per row

  const byId = (id) => document.getElementById(id);

  function ensureGridColumns() {
    const grid = byId('content');
    if (!grid) return;

    // Enforce a 6-column grid even if CSS hasn't been updated yet
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
    grid.style.gap = grid.style.gap || '28px';
    grid.style.padding = grid.style.padding || '24px 20px';
  }

  function createCard(item) {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = item?.link || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    // Image wrapper
    const w = document.createElement('div');
    w.className = 'card-image';

    const img = document.createElement('img');
    img.alt = item?.source ? `Image from ${item.source}` : 'News image';
    img.src = 'assets/fallback.jpg';
    img.loading = 'lazy';

    if (item?.image) {
      const tmp = new Image();
      tmp.onload = () => { img.src = item.image; };
      tmp.onerror = () => { /* keep fallback */ };
      tmp.src = item.image;
    }

    w.appendChild(img);
    a.appendChild(w);

    // Body
    const b = document.createElement('div');
    b.className = 'card-body';

    const h = document.createElement('h3');
    h.textContent = item?.title || 'Untitled';

    const s = document.createElement('span');
    s.className = 'source';
    s.textContent = item?.source || '';

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
    slice.forEach(item => grid.appendChild(createCard(item)));
    visible += slice.length;

    // Show the button only if there are more items to render
    if (btn) {
      if (visible < allItems.length) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    }
  }

  function loadSingleCategory(jsonFile) {
    const grid = byId('content');
    const btn = byId('loadMoreBtn');

    // Clean slate
    if (grid) grid.innerHTML = '';
    if (btn) btn.style.display = 'none';
    allItems = [];
    visible = 0;

    // Ensure 6-column layout
    ensureGridColumns();

    // Fetch data
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

  // Expose globally for category pages to call:
  window.loadSingleCategory = loadSingleCategory;
})();
