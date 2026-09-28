// Záložka Itálie: mapa mých cest, Top 1000 zajímavostí a praktické tipy na cestu.
import { CESTA } from './italie_cesta.js';
import { load, save } from './store.js';
import { speak, stopSpeaking } from './speech.js';
import { ICON, esc } from './ui.js';
import { pridejDoKarticek } from './preklad.js';
import { nactiTop, KATEGORIE, nazevKategorie } from './top1000.js';
import { renderMapa } from './mapa.js';
import { klikaci } from './slova.js';

export function renderItalie(app, sub) {
  const cast = ['top', 'cesta'].includes(sub) ? sub : 'mapa';
  app.innerHTML = `
    <header class="page-head"><h1>Itálie</h1></header>
    <div class="seg" style="margin-bottom:16px">
      <a class="${cast === 'mapa' ? 'on' : ''}" href="#/italie">Moje mapa</a>
      <a class="${cast === 'top' ? 'on' : ''}" href="#/italie/top">Top 1000</a>
      <a class="${cast === 'cesta' ? 'on' : ''}" href="#/italie/cesta">Na cestu</a>
    </div>
    <div id="obsah"></div>`;
  const box = app.querySelector('#obsah');
  if (cast === 'cesta') renderCesta(box);
  else if (cast === 'top') renderTop(box);
  else renderMapa(box);
}

// ---------- Top 1000 ----------
const STRANKA = 40;

async function renderTop(box) {
  box.innerHTML = '<p class="muted">Načítám…</p>';
  const TOP = await nactiTop();
  const stav = load('topFiltr', { kat: '', q: '' });
  if (stav.kat && !(stav.kat in KATEGORIE)) stav.kat = '';
  const pocty = {};
  TOP.forEach(t => (pocty[t.kat] = (pocty[t.kat] || 0) + 1));
  box.innerHTML = `
    <input type="text" id="hledat" placeholder="Hledat mezi ${TOP.length} zajímavostmi" value="${esc(stav.q)}" autocomplete="off">
    <div class="chips scroll" style="margin:12px 0 6px">
      <button class="chip ${stav.kat ? '' : 'on'}" data-k="">Vše</button>
      ${Object.entries(KATEGORIE).filter(([k]) => pocty[k]).map(([k, n]) => `<button class="chip ${stav.kat === k ? 'on' : ''}" data-k="${k}">${n}</button>`).join('')}
    </div>
    <p class="muted small" id="pocet"></p>
    <div id="seznam"></div>
    <button class="btn block" id="dalsi" hidden>Načíst další</button>`;
  const seznam = box.querySelector('#seznam');
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let list = [], zobrazeno = 0;

  const karta = t => `
    <article class="card fact">
      <div class="fact-head">
        <span class="emoji-ic">${esc(t.e || '📍')}</span>
        <div class="grow"><span class="fact-n">#${t.n} · ${esc(nazevKategorie(t.kat))}${t.region ? ` · ${esc(t.region)}` : ''}</span><b>${esc(t.cs)}</b><i>${klikaci(t.it)}</i></div>
      </div>
      <p class="fact-cs">${esc(t.dcs)}</p>
      <details class="fact-it"><summary>🇮🇹 Italsky</summary><p>${klikaci(t.dit)}</p></details>
      <div class="fact-tools">
        <button class="pill-btn" data-say="${t.n}">${ICON.speaker} Přečíst</button>
        <button class="pill-btn" data-add="${t.n}">${ICON.plus} Do kartiček</button>
        ${t.lat != null ? `<a class="pill-btn" href="https://maps.apple.com/?ll=${t.lat},${t.lon}&q=${encodeURIComponent(t.cs)}" target="_blank" rel="noopener">Na mapě</a>` : ''}
      </div>
    </article>`;

  function pridej() {
    const dalsi = list.slice(zobrazeno, zobrazeno + STRANKA);
    seznam.insertAdjacentHTML('beforeend', dalsi.map(karta).join(''));
    zobrazeno += dalsi.length;
    box.querySelector('#dalsi').hidden = zobrazeno >= list.length;
  }

  function vykresli() {
    const q = norm(stav.q.trim());
    list = TOP.filter(t => (!stav.kat || t.kat === stav.kat) && (!q || norm([t.cs, t.it, t.dcs, t.region].join(' ')).includes(q)));
    box.querySelector('#pocet').textContent = `${list.length} ${list.length === 1 ? 'zajímavost' : list.length < 5 && list.length ? 'zajímavosti' : 'zajímavostí'}`;
    seznam.innerHTML = list.length ? '' : '<p class="note">Nic nenalezeno.</p>';
    zobrazeno = 0;
    pridej();
  }

  const najdi = n => TOP.find(t => t.n === +n);
  seznam.addEventListener('click', e => {
    const say = e.target.closest('[data-say]'), add = e.target.closest('[data-add]');
    if (say) { stopSpeaking(); const t = najdi(say.dataset.say); speak(`${t.it}. ${t.dit}`); }
    if (add) { const t = najdi(add.dataset.add); if (pridejDoKarticek(t.it, t.cs)) { add.innerHTML = `${ICON.check} Přidáno`; add.disabled = true; } }
  });
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    stav.kat = b.dataset.k; save('topFiltr', stav);
    box.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b));
    vykresli();
  });
  let t;
  box.querySelector('#hledat').oninput = e => { stav.q = e.target.value; save('topFiltr', stav); clearTimeout(t); t = setTimeout(vykresli, 200); };
  box.querySelector('#dalsi').onclick = pridej;
  vykresli();
}

// ---------- Na cestu ----------
function renderCesta(box) {
  const otevrene = load('cestaOtevreno', []);
  box.innerHTML = `
    <p class="muted small" style="margin-top:0">Orientační údaje ke stavu ${esc(CESTA.stav)}. Ceny se liší podle regionu a sezóny, před cestou si důležité věci ověř.</p>
    ${CESTA.sekce.map(s => `
      <details class="card trip" data-id="${s.id}" ${otevrene.includes(s.id) ? 'open' : ''}>
        <summary><span class="emoji-ic">${s.e}</span><b>${esc(s.nazev)}</b></summary>
        <ul class="trip-list">${s.body.map(b => `
          <li>${b.t}${b.cena ? ` <span class="price">${esc(b.cena)}</span>` : ''}${b.it ? `<button class="say-inline" data-say="${esc(b.it)}">${ICON.speaker}<i>${klikaci(b.it)}</i></button>` : ''}</li>`).join('')}
        </ul>
        ${s.zdroje?.length ? `<p class="sources">Zdroje: ${s.zdroje.map(z => `<a href="${esc(z.url)}" target="_blank" rel="noopener">${esc(z.nazev)}</a>`).join(' · ')}</p>` : ''}
      </details>`).join('')}`;
  box.querySelectorAll('details.trip').forEach(d => d.addEventListener('toggle', () => {
    save('cestaOtevreno', [...box.querySelectorAll('details.trip[open]')].map(x => x.dataset.id));
  }));
  box.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(b.dataset.say); });
}
