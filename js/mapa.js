// Moje Itálie: mapa navštívených míst (s datem, fotkami a popiskem) a průvodce po zajímavostech z Top 1000.
import { load, save } from './store.js';
import { ICON, esc, toast } from './ui.js';
import { speak, stopSpeaking } from './speech.js';
import { nactiTop, nazevKategorie } from './top1000.js';
import { ulozFoto, nactiFoto, smazFoto, zmensi } from './fotky.js';
import { klikaci } from './slova.js';

const ITALIE = [[36.4, 6.6], [47.1, 18.6]];
const NOMINATIM = 'https://nominatim.openstreetmap.org';

// ---------- Data ----------
export const mista = () => load('mista', []);
const ulozMista = m => save('mista', m);
const novyId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const rokZ = datum => (datum || '').slice(0, 4);

function formatDatum(d) {
  if (!d) return '';
  if (d.length === 4) return d;
  const dt = new Date(d + 'T12:00');
  return isNaN(dt) ? d : dt.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function vzdalenost(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const km = d => d < 1 ? `${Math.round(d * 1000)} m` : `${d < 10 ? d.toFixed(1).replace('.', ',') : Math.round(d)} km`;

// ---------- Leaflet (načte se, až je mapa potřeba) ----------
let leafletP = null;
function nactiLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return leafletP ||= new Promise((res, rej) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = () => res(window.L);
    s.onerror = () => { leafletP = null; rej(new Error('Mapu se nepodařilo načíst. Jsi online?')); };
    document.head.appendChild(s);
  });
}

// ---------- Spodní panel ----------
function panel(html) {
  const el = document.createElement('div');
  el.className = 'sheet';
  el.innerHTML = `<div class="sheet-box"><div class="sheet-grip"></div>${html}</div>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  el.addEventListener('click', e => { if (e.target === el) close(); });
  el.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  return { el, close, $: sel => el.querySelector(sel) };
}

// ---------- Obrazovka ----------
export async function renderMapa(box) {
  const vse = mista();
  const regiony = new Set(vse.map(m => m.region).filter(Boolean));
  const roky = [...new Set(vse.map(m => rokZ(m.datum)).filter(Boolean))].sort();
  const filtr = load('mapaRok', '');
  const ukazZaj = load('mapaZajimavosti', true);

  box.innerHTML = `
    <div class="map-stats">
      <div><b>${vse.length}</b><span>${vse.length === 1 ? 'místo' : vse.length < 5 && vse.length ? 'místa' : 'míst'}</span></div>
      <div><b>${regiony.size}<small>/20</small></b><span>regionů</span></div>
      <div><b>${roky[0] || '–'}</b><span>první cesta</span></div>
    </div>
    <div class="map-wrap">
      <div id="mapa" class="map"><div class="map-loading">Načítám mapu…</div></div>
      <div class="map-tools">
        <button class="map-btn primary" id="pridat">${ICON.plus} Místo</button>
        <button class="map-btn" id="poblize">${ICON.target} Poblíž</button>
        <button class="map-btn ${ukazZaj ? 'on' : ''}" id="vrstva">★ Zajímavosti</button>
      </div>
    </div>
    ${roky.length > 1 ? `<div class="chips scroll" style="margin:12px 0 0">
      <button class="chip ${filtr ? '' : 'on'}" data-rok="">Všechny roky</button>
      ${roky.map(r => `<button class="chip ${filtr === r ? 'on' : ''}" data-rok="${r}">${r}</button>`).join('')}</div>` : ''}
    <div class="section-head"><h2>Moje cesty</h2>${vse.length ? '' : ''}</div>
    <div id="deník">${denik(vse, filtr)}</div>
    <p class="muted small">Mapa © přispěvatelé OpenStreetMap. Fotky a místa zůstávají jen v tomto telefonu – zálohuješ je v Nastavení.</p>`;

  box.querySelectorAll('[data-rok]').forEach(b => b.onclick = () => { save('mapaRok', b.dataset.rok); renderMapa(box); });
  box.querySelectorAll('[data-misto]').forEach(b => b.onclick = () => ukazMisto(b.dataset.misto, box));
  box.querySelector('#pridat').onclick = () => pridatMisto({}, box);
  dociNahledy(box);

  let L, map, top = [];
  try {
    [L, top] = await Promise.all([nactiLeaflet(), nactiTop()]);
  } catch (e) {
    box.querySelector('#mapa').innerHTML = `<div class="map-loading">${esc(e.message)}</div>`;
    return;
  }
  if (!box.isConnected) return;
  const el = box.querySelector('#mapa');
  el.innerHTML = '';
  map = L.map(el, { zoomControl: false, attributionControl: false, tap: true });
  // Podklad OpenStreetMap (bez klíče; podmínkou je uvedení autorů, viz text pod mapou).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  map.fitBounds(ITALIE);

  // Zajímavosti z Top 1000
  const zajVrstva = L.layerGroup();
  const navstivene = new Set(vse.map(m => m.zdroj).filter(Boolean));
  for (const t of top.filter(t => t.lat != null && t.lon != null)) {
    const byl = navstivene.has(t.it);
    L.marker([t.lat, t.lon], { icon: L.divIcon({ className: '', html: `<div class="pin-sight ${byl ? 'byl' : ''}">${byl ? '✓' : ''}</div>`, iconSize: [16, 16] }) })
      .on('click', () => ukazZajimavost(t, box, map))
      .addTo(zajVrstva);
  }
  if (ukazZaj) zajVrstva.addTo(map);
  box.querySelector('#vrstva').onclick = e => {
    const on = !map.hasLayer(zajVrstva);
    on ? zajVrstva.addTo(map) : map.removeLayer(zajVrstva);
    e.currentTarget.classList.toggle('on', on);
    save('mapaZajimavosti', on);
  };

  // Moje místa
  const moje = vse.filter(m => !filtr || rokZ(m.datum) === filtr);
  const body = [];
  for (const m of moje) {
    L.marker([m.lat, m.lon], { icon: L.divIcon({ className: '', html: `<div class="pin-me"><span>${esc(rokZ(m.datum) || '•')}</span></div>`, iconSize: [40, 40], iconAnchor: [20, 38] }), zIndexOffset: 1000 })
      .on('click', () => ukazMisto(m.id, box))
      .addTo(map);
    body.push([m.lat, m.lon]);
  }
  if (body.length) map.fitBounds(L.latLngBounds(body).pad(0.3), { maxZoom: 9 });

  // Dlouhé podržení (nebo pravé tlačítko) = přidat místo sem
  map.on('contextmenu', e => pridatMisto({ lat: e.latlng.lat, lon: e.latlng.lng }, box));

  box.querySelector('#poblize').onclick = () => poblize(top, box, map);
  setTimeout(() => map.invalidateSize(), 200);
}

function denik(vse, filtr) {
  const list = vse.filter(m => !filtr || rokZ(m.datum) === filtr).sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
  if (!list.length) return `<div class="note">Zatím tu nic není. Klepni na <b>+ Místo</b>, vyhledej třeba „Livigno“ a zadej rok, kdy jsi tam byl. Nebo podrž prst na mapě tam, kde jsi byl.</div>`;
  let rok = null;
  return list.map(m => {
    const r = rokZ(m.datum);
    const hlav = r !== rok ? `<div class="year-sep">${esc(r || 'Bez data')}</div>` : '';
    rok = r;
    return `${hlav}<button class="card place-row" data-misto="${m.id}">
      <div class="place-thumb" data-foto="${m.fotky?.[0] || ''}">${m.fotky?.length ? '' : '📍'}</div>
      <div class="grow"><b>${esc(m.nazev)}</b><span class="muted small">${esc([formatDatum(m.datum), m.region].filter(Boolean).join(' · '))}</span>
      ${m.popis ? `<span class="small place-desc">${esc(m.popis)}</span>` : ''}</div>${ICON.chevron}</button>`;
  }).join('');
}

// Náhledy fotek v deníku se dočítají z IndexedDB.
export async function dociNahledy(root) {
  for (const el of root.querySelectorAll('[data-foto]')) {
    const id = el.dataset.foto;
    if (!id) continue;
    const blob = await nactiFoto(id).catch(() => null);
    if (blob) el.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
  }
}

// ---------- Detail zajímavosti ----------
function ukazZajimavost(t, box, map) {
  const p = panel(`
    <span class="label">${esc(nazevKategorie(t.kat))}${t.region ? ` · ${esc(t.region)}` : ''}</span>
    <h2 style="margin:4px 0 0">${esc(t.e || '')} ${esc(t.cs)}</h2>
    <p class="it-name">${klikaci(t.it)}</p>
    <p>${esc(t.dcs)}</p>
    <details class="it-text"><summary>🇮🇹 Italsky</summary><p>${klikaci(t.dit)}</p></details>
    <div class="res-actions">
      <button class="pill-btn" id="say">${ICON.speaker} Přečíst</button>
      <button class="pill-btn primary" id="byl">${ICON.check} Byl jsem tu</button>
      <a class="pill-btn" href="https://maps.apple.com/?daddr=${t.lat},${t.lon}" target="_blank" rel="noopener">Navigovat</a>
    </div>`);
  p.$('#say').onclick = () => { stopSpeaking(); speak(`${t.it}. ${t.dit}`); };
  p.$('#byl').onclick = () => { p.close(); pridatMisto({ lat: t.lat, lon: t.lon, nazev: t.cs, region: t.region, zdroj: t.it }, box); };
}

// ---------- Poblíž (průvodce) ----------
function poblize(top, box, map) {
  if (!navigator.geolocation) { toast('Poloha není v tomto prohlížeči dostupná'); return; }
  toast('Zjišťuji polohu…');
  navigator.geolocation.getCurrentPosition(pos => {
    const ja = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    const blizko = top.filter(t => t.lat != null).map(t => ({ t, d: vzdalenost(ja, t) })).sort((a, b) => a.d - b.d).slice(0, 15);
    map.flyTo([ja.lat, ja.lon], 11);
    window.L.circleMarker([ja.lat, ja.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(map);
    const p = panel(`
      <h2 style="margin:0 0 4px">Co je poblíž</h2>
      <p class="muted small">Zajímavosti z Top 1000 seřazené podle vzdálenosti${blizko[0]?.d > 150 ? ' – v okolí nic není, jsi asi mimo Itálii' : ''}.</p>
      <div class="list">${blizko.map((x, i) => `<button class="list-row" data-i="${i}"><span class="emoji-ic">${esc(x.t.e || '📍')}</span>
        <div class="grow"><b>${esc(x.t.cs)}</b><span class="muted small">${esc(nazevKategorie(x.t.kat))} · ${km(x.d)}</span></div>${ICON.chevron}</button>`).join('')}</div>
      <button class="btn block" data-close style="margin-top:12px">Zavřít</button>`);
    p.el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const t = blizko[+b.dataset.i].t;
      p.close(); map.flyTo([t.lat, t.lon], 14); ukazZajimavost(t, box, map);
    });
  }, err => toast(err.code === 1 ? 'Povol aplikaci přístup k poloze (Nastavení iPhonu → Soukromí → Polohové služby → Safari)' : 'Polohu se nepodařilo zjistit'), { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
}

// ---------- Detail mého místa ----------
async function ukazMisto(id, box) {
  const m = mista().find(x => x.id === id);
  if (!m) return;
  const p = panel(`
    ${m.fotky?.length ? `<div class="gallery">${m.fotky.map(f => `<div class="gallery-img" data-foto="${f}"></div>`).join('')}</div>` : ''}
    <h2 style="margin:6px 0 2px">${esc(m.nazev)}</h2>
    <p class="muted">${esc([formatDatum(m.datum), m.region].filter(Boolean).join(' · ')) || 'Bez data'}</p>
    ${m.popis ? `<p style="white-space:pre-wrap">${esc(m.popis)}</p>` : ''}
    <div class="res-actions">
      <button class="pill-btn" id="upravit">Upravit</button>
      <a class="pill-btn" href="https://maps.apple.com/?daddr=${m.lat},${m.lon}" target="_blank" rel="noopener">Navigovat</a>
      <button class="pill-btn danger" id="smazat">Smazat</button>
    </div>`);
  for (const el of p.el.querySelectorAll('[data-foto]')) {
    const blob = await nactiFoto(el.dataset.foto).catch(() => null);
    if (blob) { const url = URL.createObjectURL(blob); el.style.backgroundImage = `url(${url})`; el.onclick = () => window.open(url, '_blank'); }
  }
  p.$('#upravit').onclick = () => { p.close(); pridatMisto(m, box); };
  p.$('#smazat').onclick = async () => {
    if (!confirm(`Smazat „${m.nazev}“ i s fotkami?`)) return;
    for (const f of m.fotky || []) await smazFoto(f).catch(() => {});
    ulozMista(mista().filter(x => x.id !== id));
    p.close(); toast('Smazáno'); renderMapa(box);
  };
}

// ---------- Přidání / úprava místa ----------
async function hledej(q) {
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=it,sm,va&accept-language=cs&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Vyhledávání teď nefunguje');
  return (await r.json()).map(x => ({
    nazev: x.name || x.display_name.split(',')[0],
    popis: x.display_name.split(',').slice(1, 3).join(',').trim(),
    lat: +x.lat, lon: +x.lon,
    region: x.address?.state || x.address?.region || '',
  }));
}

async function regionZ(lat, lon) {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=cs&lat=${lat}&lon=${lon}`);
    const j = await r.json();
    return { region: j.address?.state || j.address?.region || '', nazev: j.address?.village || j.address?.town || j.address?.city || j.name || '' };
  } catch { return { region: '', nazev: '' }; }
}

function pridatMisto(v, box) {
  const upravuji = !!v.id;
  const letos = new Date().getFullYear();
  const p = panel(`
    <h2 style="margin:0 0 12px">${upravuji ? 'Upravit místo' : 'Přidat místo'}</h2>
    ${v.lat == null ? `
      <div class="row"><input type="text" id="q" placeholder="Kde jsi byl? (např. Livigno, Paganella)" autocomplete="off">
        <button class="btn primary" id="hledat" style="flex:0 0 auto">Hledat</button></div>
      <div id="vysledky" class="list"></div>
      <button class="pill-btn" id="tady" style="margin-top:8px">${ICON.target} Jsem tady teď</button>
      <p class="muted small">Tip: místo můžeš přidat i podržením prstu na mapě.</p>` : ''}
    <form id="form" ${v.lat == null ? 'hidden' : ''}>
      <div class="field"><label for="nazev">Název</label><input type="text" id="nazev" value="${esc(v.nazev || '')}" required></div>
      <div class="field"><label>Kdy jsi tam byl</label>
        <div class="row"><input type="number" id="rok" inputmode="numeric" min="1950" max="${letos}" placeholder="Rok" value="${esc(rokZ(v.datum) || '')}" style="flex:0 0 110px">
        <input type="date" id="den" value="${v.datum?.length === 10 ? esc(v.datum) : ''}" max="${new Date().toLocaleDateString('sv')}"></div>
        <p class="muted small" style="margin:6px 0 0">Stačí rok. Přesné datum je nepovinné.</p></div>
      <div class="field"><label for="popis">Poznámka</label><textarea id="popis" rows="3" placeholder="S kým, co se ti líbilo, co jsi jedl…">${esc(v.popis || '')}</textarea></div>
      <div class="field"><label>Fotky</label>
        <div class="gallery edit" id="fotky"></div>
        <label class="pill-btn" style="margin-top:8px">${ICON.camera} Přidat fotky<input type="file" id="soubory" accept="image/*" multiple hidden></label></div>
      <p class="muted small" id="poloha"></p>
      <button class="btn primary block big">${upravuji ? 'Uložit' : 'Uložit místo'}</button>
    </form>
    <button class="btn ghost block" data-close>Zrušit</button>`);

  const stav = { ...v, fotky: [...(v.fotky || [])], nove: [] };
  const $ = s => p.$(s);
  const ukazForm = () => {
    $('#form').hidden = false;
    $('#poloha').textContent = `Poloha: ${stav.lat.toFixed(4)}, ${stav.lon.toFixed(4)}${stav.region ? ` · ${stav.region}` : ''}`;
    if (!$('#nazev').value) $('#nazev').focus();
  };
  if (v.lat != null) {
    ukazForm();
    if (!stav.region || !stav.nazev) regionZ(stav.lat, stav.lon).then(r => {
      stav.region ||= r.region;
      if (!$('#nazev').value && r.nazev) $('#nazev').value = r.nazev;
      if (p.el.isConnected) ukazForm();
    });
  }

  if ($('#hledat')) {
    const hled = async () => {
      const q = $('#q').value.trim();
      if (!q) return;
      $('#vysledky').innerHTML = '<p class="muted small">Hledám…</p>';
      try {
        const res = await hledej(q);
        $('#vysledky').innerHTML = res.length ? res.map((r, i) => `<button type="button" class="list-row" data-i="${i}"><span class="emoji-ic">📍</span><div class="grow"><b>${esc(r.nazev)}</b><span class="muted small">${esc(r.popis)}</span></div></button>`).join('') : '<p class="muted small">Nic nenalezeno. Zkus jiný název.</p>';
        $('#vysledky').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
          const r = res[+b.dataset.i];
          Object.assign(stav, { lat: r.lat, lon: r.lon, region: r.region });
          $('#nazev').value = r.nazev;
          $('#vysledky').innerHTML = ''; $('#q').closest('.row').hidden = true; $('#tady').hidden = true;
          ukazForm();
        });
      } catch (e) { $('#vysledky').innerHTML = `<p class="muted small">${esc(e.message)}</p>`; }
    };
    $('#hledat').onclick = hled;
    $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); hled(); } });
    $('#tady').onclick = () => navigator.geolocation?.getCurrentPosition(async pos => {
      Object.assign(stav, { lat: pos.coords.latitude, lon: pos.coords.longitude });
      const r = await regionZ(stav.lat, stav.lon);
      stav.region = r.region; $('#nazev').value = r.nazev;
      if (!$('#rok').value) $('#den').value = new Date().toLocaleDateString('sv');
      $('#q').closest('.row').hidden = true; $('#tady').hidden = true;
      ukazForm();
    }, () => toast('Polohu se nepodařilo zjistit'));
  }

  // Fotky: náhledy stávajících i nově vybraných
  const galerie = async () => {
    const g = $('#fotky');
    g.innerHTML = '';
    for (const id of stav.fotky) {
      const blob = await nactiFoto(id).catch(() => null);
      g.insertAdjacentHTML('beforeend', `<div class="gallery-img" style="${blob ? `background-image:url(${URL.createObjectURL(blob)})` : ''}"><button type="button" data-rm="${id}">×</button></div>`);
    }
    stav.nove.forEach((n, i) => g.insertAdjacentHTML('beforeend', `<div class="gallery-img" style="background-image:url(${n.url})"><button type="button" data-rmn="${i}">×</button></div>`));
    g.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { stav.fotky = stav.fotky.filter(f => f !== b.dataset.rm); (stav.smazat ||= []).push(b.dataset.rm); galerie(); });
    g.querySelectorAll('[data-rmn]').forEach(b => b.onclick = () => { stav.nove.splice(+b.dataset.rmn, 1); galerie(); });
  };
  galerie();
  $('#soubory').onchange = async e => {
    for (const f of e.target.files) {
      const blob = await zmensi(f).catch(() => null);
      if (blob) stav.nove.push({ blob, url: URL.createObjectURL(blob) });
    }
    e.target.value = '';
    galerie();
  };

  $('#den').onchange = e => { if (e.target.value) $('#rok').value = e.target.value.slice(0, 4); };

  $('#form').onsubmit = async e => {
    e.preventDefault();
    if (stav.lat == null) { toast('Nejdřív vyber místo'); return; }
    const nazev = $('#nazev').value.trim();
    if (!nazev) { $('#nazev').focus(); return; }
    const den = $('#den').value, rok = $('#rok').value.trim();
    if (rok && (+rok < 1900 || +rok > letos)) { toast('Zkontroluj rok'); return; }
    const datum = den || rok || '';
    const id = stav.id || novyId();
    for (const n of stav.nove) {
      const fid = `${id}-${novyId()}`;
      await ulozFoto(fid, n.blob);
      stav.fotky.push(fid);
    }
    for (const f of stav.smazat || []) await smazFoto(f).catch(() => {});
    const zaznam = { id, nazev, lat: stav.lat, lon: stav.lon, datum, popis: $('#popis').value.trim(), region: stav.region || '', fotky: stav.fotky, zdroj: stav.zdroj || '' };
    const vse = mista().filter(x => x.id !== id);
    vse.push(zaznam);
    ulozMista(vse);
    p.close();
    toast(upravuji ? 'Uloženo' : 'Místo přidáno na mapu 📍');
    renderMapa(box);
  };
}
