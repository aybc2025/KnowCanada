/* ═══════════════════════════════════════════
   timeline.js  —  Confederation timeline
   Depends on: data.js
═══════════════════════════════════════════ */

let timelineBuilt = false;

function buildTimelineOnce() {
  if (timelineBuilt) return;
  timelineBuilt = true;
  buildTimeline();
}

function buildTimeline() {
  const container = document.getElementById('tl-line');
  TIMELINE.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'tl-item';
    item.style.setProperty('--item-color', ev.color);
    const regionsStr = ev.regions.join(' · ');

    item.innerHTML = `
      <div class="tl-dot">${ev.year.toString().slice(2)}</div>
      <div class="tl-card">
        <div class="tl-year">${ev.year}</div>
        <div class="tl-names"><span class="tl-he">${ev.he}</span></div>
        <div style="font-size:.72rem;color:#8898b8;font-weight:700;margin-top:2px;direction:ltr">${ev.en}</div>
        <div class="tl-desc">${ev.desc_he}</div>
        <div class="tl-desc-en">${ev.desc_en}</div>
        <span class="tl-badge ${ev.type}">${ev.type === 'found' ? '🍁 יסוד' : ev.type === 'prov' ? '🗺️ פרובינציה' : '❄️ טריטוריה'}</span>
        ${ev.regions.length > 1 ? `<span class="tl-badge" style="background:#f0f4ff;color:#2a5a98;margin-right:4px">${regionsStr}</span>` : ''}
      </div>`;

    container.appendChild(item);

    // Animate in as each card scrolls into view
    setTimeout(() => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.disconnect(); } });
      }, {threshold: 0.15});
      obs.observe(item);
    }, i * 60);
  });
}
