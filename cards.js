/* ═══════════════════════════════════════════
   cards.js  —  Province & territory cards
   Depends on: data.js
═══════════════════════════════════════════ */

function makeCard(item) {
  const div = document.createElement('div');
  div.className = 'pcard';
  div.style.setProperty('--accent', item.color);

  const popPct  = Math.max(4, Math.round((item.pop       / MAX_POP)  * 100));
  const areaPct = Math.max(4, Math.round((item.area_km2  / MAX_AREA) * 100));
  const areaFmt = item.area_km2 >= 1000000
    ? (item.area_km2 / 1000000).toFixed(2) + ' מיליון קמ״ר'
    : item.area_km2.toLocaleString() + ' קמ״ר';

  div.innerHTML = `
    ${item.territory ? '<span class="territory-badge">Territory</span>' : ''}
    <div class="pcard-flag-strip">
      <img src="${item.flag_url}" alt="${item.en} flag"
           onerror="this.parentNode.innerHTML='${item.emoji}'" loading="lazy">
    </div>
    <div class="pcard-top">
      <div class="pcard-emoji">${item.emoji}</div>
      <div class="pcard-names">
        <div class="pcard-he">${item.he}</div>
        <div class="pcard-en">${item.en}</div>
      </div>
      <div class="pcard-abbr" style="background:${item.color}">${item.abbr}</div>
    </div>
    <div class="pcard-divider"></div>
    <div class="pcard-facts">
      <div class="fact-item">
        <span class="fact-label">🏛️ בירה | Capital</span>
        <span class="fact-value">${item.capital_he}</span>
        <span class="fact-sub">${item.capital_en}</span>
      </div>
      <div class="fact-item">
        <span class="fact-label">🌆 עיר גדולה | Largest</span>
        <span class="fact-value">${item.largest_he}</span>
        <span class="fact-sub">${item.largest_en}</span>
      </div>
      <div class="fact-item">
        <span class="fact-label">📍 אזור | Region</span>
        <span class="fact-value">${item.region_he}</span>
        <span class="fact-sub">${item.region_en}</span>
      </div>
      <div class="fact-item">
        <span class="fact-label">🌸 פרח | Flower</span>
        <span class="fact-value">${item.flower_he}</span>
        <span class="fact-sub">${item.flower_en}</span>
      </div>
    </div>
    <div class="stat-bar-wrap">
      <div class="stat-row">
        <div class="stat-label">👥 אוכלוסיה</div>
        <div class="stat-bar"><div class="stat-fill" style="width:${popPct}%"></div></div>
        <div class="stat-val">${item.pop_he}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">📐 שטח</div>
        <div class="stat-bar"><div class="stat-fill" style="width:${areaPct}%"></div></div>
        <div class="stat-val">${areaFmt}</div>
      </div>
    </div>
    <div class="pcard-details">
      <div class="pcard-detail-inner">
        <div class="fun-fact">
          💡 ${item.fun_he}
          <div class="en">${item.fun_en}</div>
        </div>
      </div>
    </div>
    <div class="expand-hint">לחץ לפרטים נוספים · Click for more ▾</div>
  `;

  div.addEventListener('click', () => {
    div.classList.toggle('expanded');
    div.querySelector('.expand-hint').textContent = div.classList.contains('expanded')
      ? 'סגור · Close ▴'
      : 'לחץ לפרטים נוספים · Click for more ▾';
  });
  return div;
}

function initCards() {
  document.getElementById('provinces-grid').append(...PROVINCES.map(makeCard));
  document.getElementById('territories-grid').append(...TERRITORIES.map(makeCard));
}
