// Záložka Itálie: Top 100 zajímavostí a praktické tipy na cestu.
import { TOP, KATEGORIE } from './italie_top.js';
import { CESTA } from './italie_cesta.js';
import { load, save } from './store.js';
import { speak, stopSpeaking } from './speech.js';
import { ICON, esc } from './ui.js';
import { pridejDoKarticek } from './preklad.js';

export function renderItalie(app, sub) {
  const cesta = sub === 'cesta';
  app.innerHTML = `
    <header class="page-head"><h1>Itálie</h1></header>
    <div class="seg" style="margin-bottom:16px">
      <a class="${cesta ? '' : 'on'}" href="#/italie">Top 100</a>
      <a class="${cesta ? 'on' : ''}" href="#/italie/cesta">Na cestu</a>
    </div>
    <div id="obsah"></div>`;
  const box = app.querySelector('#obsah');
  cesta ? renderCesta(box) : renderTop(box);
}

// ---------- Top 100 ----------
function renderTop(box) {
  const stav = load('topFiltr', { kat: '', q: '' });
  box.innerHTML = `
    <input type="text" id="hledat" placeholder="Hledat (např. pizza, Řím, Michelangelo)" value="${esc(stav.q)}" autocomplete="off">
    <div class="chips scroll" style="margin:12px 0 6px">
      <button class="chip ${stav.kat ? '' : 'on'}" data-k="">Vše</button>
      ${Object.entries(KATEGORIE).map(([k, n]) => `<button class="chip ${stav.kat === k ? 'on' : ''}" data-k="${k}">${n}</button>`).join('')}
    </div>
    <div id="seznam"></div>`;
  const seznam = box.querySelector('#seznam');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function vykresli() {
    const q = norm(stav.q.trim());
    const list = TOP.filter(t => (!stav.kat || t.kat === stav.kat) && (!q || norm([t.cs, t.it, t.dcs, t.dit].join(' ')).includes(q)));
    seznam.innerHTML = list.length ? list.map(t => `
      <article class="card fact">
        <div class="fact-head">
          <span class="emoji-ic">${t.e}</span>
          <div class="grow"><span class="fact-n">#${t.n} · ${KATEGORIE[t.kat]}</span><b>${esc(t.cs)}</b><i>${esc(t.it)}</i></div>
        </div>
        <p class="fact-cs">${esc(t.dcs)}</p>
        <div class="fact-it">
          <p>${esc(t.dit)}</p>
          <div class="fact-tools">
            <button class="icon-btn" data-say="${t.n}" aria-label="Přečíst italsky">${ICON.speaker}</button>
            <button class="icon-btn" data-add="${t.n}" aria-label="Přidat do kartiček">${ICON.plus}</button>
          </div>
        </div>
      </article>`).join('') : '<p class="note">Nic nenalezeno.</p>';
    seznam.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); const t = TOP[b.dataset.say - 1]; speak(`${t.it}. ${t.dit}`); });
    seznam.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const t = TOP[b.dataset.add - 1];
      if (pridejDoKarticek(t.it, t.cs)) { b.innerHTML = ICON.check; b.disabled = true; }
    });
  }
  box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    stav.kat = b.dataset.k; save('topFiltr', stav);
    box.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b));
    vykresli();
  });
  box.querySelector('#hledat').oninput = e => { stav.q = e.target.value; save('topFiltr', stav); vykresli(); };
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
          <li>${b.t}${b.cena ? ` <span class="price">${esc(b.cena)}</span>` : ''}${b.it ? `<button class="say-inline" data-say="${esc(b.it)}">${ICON.speaker}<i>${esc(b.it)}</i></button>` : ''}</li>`).join('')}
        </ul>
        ${s.zdroje?.length ? `<p class="sources">Zdroje: ${s.zdroje.map(z => `<a href="${esc(z.url)}" target="_blank" rel="noopener">${esc(z.nazev)}</a>`).join(' · ')}</p>` : ''}
      </details>`).join('')}`;
  box.querySelectorAll('details.trip').forEach(d => d.addEventListener('toggle', () => {
    const ids = [...box.querySelectorAll('details.trip[open]')].map(x => x.dataset.id);
    save('cestaOtevreno', ids);
  }));
  box.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(b.dataset.say); });
}
