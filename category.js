/* =========================================================
   STREAMIC — Category page loader (3‑col, smooth)
   ========================================================= */
(function(){
  const bind = window.__streamicBindCardEnhancements || ((c)=>{});

  function renderCard(i){
    const a = document.createElement('a');
    a.className = 'card';
    a.href = i.link; a.target = '_blank'; a.rel = 'noopener';

    const w = document.createElement('div'); w.className = 'card-image';
    const img = document.createElement('img');
    img.alt = i.source ? ('Image from ' + i.source) : 'News image';
    img.src = 'assets/fallback.jpg'; img.loading = 'lazy';

    if (i.image){
      const pre = new Image();
      pre.onload = () => { img.src = i.image; img.classList.add('loaded'); };
      pre.src = i.image;
    } else {
      requestAnimationFrame(()=>img.classList.add('loaded'));
    }
    w.appendChild(img); a.appendChild(w);

    const b = document.createElement('div'); b.className = 'card-body';
    const h = document.createElement('h3'); h.textContent = i.title || 'Untitled';
    const s = document.createElement('span'); s.className = 'source'; s.textContent = i.source || '';
    b.appendChild(h); b.appendChild(s); a.appendChild(b);

    bind(a);
    return a;
  }

  // Load a single file into a grid with a "Load more" button (9 per click)
  window.loadCategory = function(file, gridId, btnId){
    const grid = document.getElementById(gridId);
    const btn  = document.getElementById(btnId);
    if (!grid) return;

    let all = []; let idx = 0; const CHUNK = 9;

    function paintMore(){
      const slice = all.slice(idx, idx + CHUNK);
      slice.forEach(item => grid.appendChild(renderCard(item)));
      idx += slice.length;
      if (idx >= all.length && btn) btn.style.display = 'none';
    }

    fetch('data/' + file)
      .then(r => r.json())
      .then(items => { all = items || []; paintMore(); })
      .catch(()=>{ if (btn) btn.style.display = 'none'; });

    if (btn){ btn.addEventListener('click', paintMore); }
  };
})();
