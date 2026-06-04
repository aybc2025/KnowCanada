/* ═══════════════════════════════════════════
   map.js  —  Interactive Leaflet map
   Depends on: data.js, Leaflet CDN
═══════════════════════════════════════════ */

let mapReady = false, leafletMap, geoLayer, indigenousLayer;
const mapLayerState = { provinces:true, territories:true, capitals:true, geojson:false, indigenous:false };
const regionMarkers = [], capitalMarkers = [];

function toggleLayer(name) {
  const btnIds = {
    provinces:'tog-prov', territories:'tog-terr',
    capitals:'tog-caps',  geojson:'tog-geo', indigenous:'tog-indigenous'
  };
  mapLayerState[name] = !mapLayerState[name];
  const btn = document.getElementById(btnIds[name]);
  if (btn) btn.classList.toggle('on', mapLayerState[name]);

  if (name === 'geojson') {
    if (mapLayerState.geojson) loadGeoJSON();
    else if (geoLayer) leafletMap.removeLayer(geoLayer);
    return;
  }
  if (name === 'indigenous') {
    if (mapLayerState.indigenous) loadIndigenous();
    else if (indigenousLayer) leafletMap.removeLayer(indigenousLayer);
    return;
  }
  regionMarkers.forEach(m => {
    const show = m.isTerritory ? mapLayerState.territories : mapLayerState.provinces;
    if (show) m.marker.addTo(leafletMap); else leafletMap.removeLayer(m.marker);
    if (show) m.label.addTo(leafletMap);  else leafletMap.removeLayer(m.label);
  });
  capitalMarkers.forEach(m => {
    if (mapLayerState.capitals) m.addTo(leafletMap); else leafletMap.removeLayer(m);
  });
}

function loadGeoJSON() {
  const url = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson';
  fetch(url).then(r => r.json()).then(data => {
    if (geoLayer) leafletMap.removeLayer(geoLayer);
    geoLayer = L.geoJSON(data, {
      style: feat => {
        const name = feat.properties.name || '';
        const region = ALL_REGIONS.find(r =>
          name.toLowerCase().includes(r.en.toLowerCase().split(' ')[0].toLowerCase()) ||
          r.en.toLowerCase().includes(name.toLowerCase())
        );
        return { fillColor: region ? region.color : '#aaa', fillOpacity:0.25, color: region ? region.color : '#888', weight:1.5, dashArray:'4 3' };
      },
      onEachFeature: (feat, layer) => {
        const name = feat.properties.name || '';
        const region = ALL_REGIONS.find(r =>
          name.toLowerCase().includes(r.en.toLowerCase().split(' ')[0].toLowerCase()) ||
          r.en.toLowerCase().includes(name.toLowerCase())
        );
        if (region) {
          layer.on('click', () => { showMapInfo(region); leafletMap.fitBounds(layer.getBounds(), {padding:[30,30], maxZoom:6}); });
          layer.bindTooltip(region.he + ' · ' + region.en, {sticky:true, direction:'center', opacity:.9});
        }
      }
    }).addTo(leafletMap);
  }).catch(() => alert('לא ניתן לטעון גבולות — אנא נסה שוב | Could not load borders'));
}

function loadIndigenous() {
  const nations = [
    {name:'Haudenosaunee (Iroquois)', he:'האודנושוני (אירוקואים)', lat:43.5, lng:-79.5, color:'#8b4513'},
    {name:'Anishinaabe',              he:'אנישינאבה',              lat:48.0, lng:-88.0, color:'#a0522d'},
    {name:'Cree',                     he:'קרי',                    lat:55.0, lng:-77.0, color:'#8b6914'},
    {name:"Mi'kmaq",                  he:'מיקמאק',                 lat:46.0, lng:-62.5, color:'#7b3f00'},
    {name:'Blackfoot Confederacy',    he:'קונפדרציית הרגל השחורה', lat:50.5, lng:-113.0, color:'#6b2020'},
    {name:"Tsilhqot'in",              he:"צ'ילקוטין",              lat:52.0, lng:-123.0, color:'#4a0e6b'},
    {name:'Dene',                     he:'עם הדיני',               lat:62.0, lng:-120.0, color:'#1a4a6b'},
    {name:'Inuit',                    he:'אינואיט',                lat:69.0, lng:-80.0,  color:'#0a5a5a'},
    {name:'Métis',                    he:'מטיס',                   lat:53.0, lng:-101.0, color:'#5a3a00'},
  ];
  if (indigenousLayer) leafletMap.removeLayer(indigenousLayer);
  indigenousLayer = L.layerGroup();
  nations.forEach(n => {
    const m = L.circleMarker([n.lat, n.lng], {radius:10, fillColor:n.color, color:'#fff', weight:2, fillOpacity:.8});
    m.bindPopup(`
      <div style="direction:rtl;font-family:'Nunito',sans-serif">
        <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#1a2540">🪶 ${n.he}</div>
        <div style="font-size:.78rem;color:#8898b8;font-weight:700;direction:ltr">${n.name}</div>
        <div style="font-size:.78rem;color:#4a5a78;margin-top:5px;font-weight:600">שטח מסורתי / Traditional Territory</div>
      </div>`, {maxWidth:220});
    indigenousLayer.addLayer(m);
  });
  indigenousLayer.addTo(leafletMap);
}

function initMap() {
  if (mapReady) return;
  mapReady = true;

  leafletMap = L.map('map', {center:[62,-96], zoom:3, minZoom:2, maxZoom:10});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom:19
  }).addTo(leafletMap);

  ALL_REGIONS.forEach(r => {
    const marker = L.circleMarker([r.lat, r.lng], {
      radius: r.territory ? 15 : 17,
      fillColor:r.color, color:'#fff', weight:3, fillOpacity:.9
    }).addTo(leafletMap);

    const labelIcon = L.divIcon({
      className:'',
      html:`<div style="font-family:'Fredoka One',cursive;font-size:${r.abbr.length>2?'8px':'11px'};color:#fff;text-align:center;pointer-events:none;direction:ltr;white-space:nowrap;transform:translate(-50%,-50%);position:absolute;top:50%;left:50%;text-shadow:0 1px 3px rgba(0,0,0,.6)">${r.abbr}</div>`,
      iconSize:[0,0]
    });
    const label = L.marker([r.lat, r.lng], {icon:labelIcon, interactive:false}).addTo(leafletMap);

    marker.bindPopup(`
      <div style="direction:rtl;font-family:'Nunito',sans-serif">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:1.5rem">${r.emoji}</span>
          <div>
            <div class="pop-he">${r.he}</div>
            <div class="pop-en">${r.en}</div>
          </div>
        </div>
        <div class="pop-row">🏛️ ${r.capital_he} (${r.capital_en})</div>
        <div class="pop-row">👥 ${r.pop_he}</div>
      </div>`, {maxWidth:220});

    marker.on('click', () => { showMapInfo(r); leafletMap.flyTo([r.lat, r.lng], 5, {duration:1.0}); });
    marker.on('mouseover', function() { this.setStyle({radius: r.territory ? 18 : 20}); });
    marker.on('mouseout',  function() { this.setStyle({radius: r.territory ? 15 : 17}); });
    regionMarkers.push({marker, label, isTerritory:r.territory});

    // Capital dot
    const capIcon = L.divIcon({
      className:'', html:`<div class="capital-dot" title="${r.capital_en}"></div>`, iconSize:[10,10], iconAnchor:[5,5]
    });
    const capMarker = L.marker([r.capital_lat, r.capital_lng], {icon:capIcon});
    capMarker.bindTooltip(`🏛️ ${r.capital_he} · ${r.capital_en}`, {direction:'top', offset:[0,-6]});
    capMarker.on('click', () => { showMapInfo(r); leafletMap.flyTo([r.capital_lat, r.capital_lng], 7, {duration:1.0}); });
    capMarker.addTo(leafletMap);
    capitalMarkers.push(capMarker);
  });

  setTimeout(() => leafletMap.invalidateSize(), 100);
}

function showMapInfo(region) {
  const card = document.getElementById('map-info-card');
  card.classList.add('lit');
  const popPct  = Math.max(4, Math.round((region.pop      / MAX_POP)  * 100));
  const areaPct = Math.max(4, Math.round((region.area_km2 / MAX_AREA) * 100));
  const areaFmt = region.area_km2 >= 1000000
    ? (region.area_km2/1000000).toFixed(2)+' מיליון קמ״ר'
    : region.area_km2.toLocaleString()+' קמ״ר';
  card.innerHTML = `
    <div class="map-info-header">
      <div class="map-info-emoji">${region.emoji}</div>
      <div class="map-info-names">
        <div class="map-info-he">${region.he}</div>
        <div class="map-info-en">${region.en}</div>
      </div>
      <div class="map-info-abbr" style="background:${region.color}">${region.abbr}</div>
    </div>
    <div class="map-info-facts">
      <div class="fact-item"><span class="fact-label">🏛️ בירה</span><span class="fact-value">${region.capital_he}</span><span class="fact-sub">${region.capital_en}</span></div>
      <div class="fact-item"><span class="fact-label">🌆 עיר גדולה</span><span class="fact-value">${region.largest_he}</span><span class="fact-sub">${region.largest_en}</span></div>
      <div class="fact-item"><span class="fact-label">👥 אוכלוסיה</span><span class="fact-value">${region.pop_he}</span></div>
      <div class="fact-item"><span class="fact-label">📐 שטח</span><span class="fact-value">${areaFmt}</span></div>
    </div>
    <div style="padding:0 16px 4px">
      <div class="stat-row"><div class="stat-label" style="font-size:.68rem">👥</div><div class="stat-bar"><div class="stat-fill" style="width:${popPct}%;background:${region.color}"></div></div><div class="stat-val">${region.pop_he}</div></div>
      <div class="stat-row"><div class="stat-label" style="font-size:.68rem">📐</div><div class="stat-bar"><div class="stat-fill" style="width:${areaPct}%;background:${region.color}"></div></div><div class="stat-val">${areaFmt}</div></div>
    </div>
    <div class="map-info-funfact">💡 ${region.fun_he}<div class="en">${region.fun_en}</div></div>
  `;
}
