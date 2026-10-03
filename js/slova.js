// Klepací slovníček: klepnutí na italské slovo ukáže jeho význam v dané větě.
// 1) připravený slovníček pro obsah kurzu (data/slovnik.json, offline a zdarma),
// 2) jinak se zeptá Clauda a výsledek si zapamatuje.
import { tokeny, klicVety, RE_SLOVO } from './tokeny.js';
import { load, save } from './store.js';
import { callJSON, hasKey, errorText } from './claude.js';
import { speak, stopSpeaking } from './speech.js';
import { ICON, esc } from './ui.js';
import { VOCAB, SLOVESA, OSOBY, CASY, tvary } from './data.js';

let slovnikP = null;
const slovnik = () => slovnikP ||= fetch('data/slovnik.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
let casovaniP = null;
const casovani = () => casovaniP ||= fetch('data/casovani.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
const OSOBY_CZ = ['já', 'ty', 'on / ona', 'my', 'vy', 'oni'];

// Italský text → HTML, kde je každé slovo klepací.
export function klikaci(text) {
  if (!text) return '';
  let out = '', i = 0, last = 0;
  for (const m of text.matchAll(RE_SLOVO)) {
    out += esc(text.slice(last, m.index));
    out += `<span class="w" data-i="${i++}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  out += esc(text.slice(last));
  return `<span class="kv" data-v="${esc(text)}">${out}</span>`;
}

const SCHEMA = {
  type: 'object',
  properties: { z: { type: 'string' }, cs: { type: 'string' }, g: { type: 'string' }, pritomny: { type: 'array', items: { type: 'string' } } },
  required: ['z', 'cs', 'g', 'pritomny'],
  additionalProperties: false,
};
const SYSTEM = `Jsi učitel italštiny pro Čecha začátečníka. Dostaneš italskou větu a jedno slovo z ní. Vysvětli, co to slovo znamená PRÁVĚ V TÉTO VĚTĚ.
- z: základní slovníkový tvar (u sloves infinitiv, u jmen jednotné číslo mužského rodu, u stažených předložek rozklad, např. nel → in + il).
- cs: český význam v této větě, 1–4 slova (u ustálených spojení i doslovný význam).
- g: krátká česká gramatická poznámka pro začátečníka, nejvýš 12 slov (slovní druh, osoba, číslo, čas, rod, vykání).
- pritomny: je-li slovo sloveso, jeho časování v přítomném čase oznamovacího způsobu v pořadí io, tu, lui/lei, noi, voi, loro (u zvratných sloves se zájmeny: mi chiamo…); jinak prázdné pole.
Čeština musí být bezchybná.`;

const CACHE = 'slovaCache';

async function vyznam(veta, i, slovo) {
  const klic = klicVety(veta);
  const offline = (await slovnik())[klic]?.[i];
  if (offline && offline.w.replace(/'/g, '’') === slovo.replace(/'/g, '’')) return offline;
  const samo = tokeny(veta).length === 1 && VOCAB.find(x => x.it === veta);
  if (samo) return { w: slovo, z: samo.it, cs: samo.cs, g: samo.topic === 'Slovesa' ? 'sloveso v infinitivu' : '' };
  const cache = load(CACHE, {});
  const ck = `${klic}#${i}`;
  if (cache[ck]) return cache[ck];
  if (!hasKey()) return null;
  const r = await callJSON({ system: SYSTEM, content: `Věta: „${veta}“\nSlovo: „${slovo}“ (${i + 1}. slovo věty)`, schema: SCHEMA, effort: 'low', kvalita: 'vysoka' });
  const zaznam = { w: slovo, z: r.z, cs: r.cs, g: r.g, ...(r.pritomny?.length === 6 ? { pritomny: r.pritomny } : {}) };
  const keys = Object.keys(cache);
  if (keys.length > 600) keys.slice(0, 100).forEach(k => delete cache[k]);
  cache[ck] = zaznam;
  save(CACHE, cache);
  return zaznam;
}

// ---------- Časování sloves ----------
const infinitiv = z => (z || '').split(/[\s(+,/]/)[0].toLowerCase();
const shoda = (tvar, slovo) => tvar.toLowerCase().split(/[\s/]/).includes(slovo.toLowerCase());

// Vrací { inf, casy: { klic: [6 tvarů] } } nebo null, když slovo není sloveso.
async function tabulky(v) {
  const inf = infinitiv(v.z);
  const sl = SLOVESA.find(x => x.inf === inf);
  if (sl) return { inf, casy: Object.fromEntries(Object.keys(CASY).map(c => [c, [0, 1, 2, 3, 4, 5].map(i => tvary(sl, c, i)[0])])) };
  const off = (await casovani())[inf];
  if (off) return { inf, casy: { presente: off } };
  if (v.pritomny?.length === 6) return { inf, casy: { presente: v.pritomny } };
  return null;
}

async function casovaniHTML(v, slovo) {
  if (!/sloves/i.test(v.g || '') && !v.pritomny) return '';
  const t = await tabulky(v);
  if (!t) return '';
  const klice = Object.keys(t.casy);
  // Výchozí čas: ten, ve kterém je klepnuté slovo; jinak přítomný.
  const vychozi = klice.find(c => t.casy[c].some(f => shoda(f, slovo))) || 'presente';
  return `<div class="sp-conj">
    <div class="sp-conj-head"><b>Časování ${esc(t.inf)}</b>
      ${klice.length > 1 ? `<div class="seg mini">${klice.map(c => `<button data-cas="${c}" class="${c === vychozi ? 'on' : ''}">${{ presente: 'teď', passato: 'minulý', imperfetto: 'průběh.', futuro: 'budoucí' }[c]}</button>`).join('')}</div>` : '<span class="muted small">přítomný čas</span>'}
    </div>
    ${klice.map(c => `<div class="conj-grid" data-tab="${c}" ${c === vychozi ? '' : 'hidden'}>${[0, 3, 1, 4, 2, 5].map(i => `
      <div class="cg ${shoda(t.casy[c][i], slovo) ? 'on' : ''}"><span>${OSOBY[i]} · ${OSOBY_CZ[i]}</span><b>${esc(t.casy[c][i])}</b></div>`).join('')}</div>`).join('')}
  </div>`;
}

function napojCasy(root) {
  root.querySelectorAll('[data-cas]').forEach(b => b.onclick = () => {
    root.querySelectorAll('[data-cas]').forEach(x => x.classList.toggle('on', x === b));
    root.querySelectorAll('[data-tab]').forEach(x => (x.hidden = x.dataset.tab !== b.dataset.cas));
  });
  root.querySelectorAll('.cg').forEach(c => c.onclick = () => { stopSpeaking(); speak(c.querySelector('b').textContent.replace(/\/\w$/, '')); });
}

// ---------- Kartička s významem ----------
let pop = null;
function zavri() {
  document.querySelectorAll('.w.w-on').forEach(x => x.classList.remove('w-on'));
  if (pop) { const p = pop; pop = null; p.classList.add('out'); setTimeout(() => p.remove(), 180); }
}

async function ukaz(el) {
  const kv = el.closest('.kv');
  if (!kv) return;
  const veta = kv.dataset.v;
  const i = +el.dataset.i;
  const slovo = tokeny(veta)[i] || el.textContent;
  document.querySelectorAll('.w.w-on').forEach(x => x.classList.remove('w-on'));
  el.classList.add('w-on');
  if (!pop) {
    pop = document.createElement('div');
    pop.className = 'slovo-pop';
    document.body.appendChild(pop);
  }
  const cisty = slovo.replace(/[’']$/, '');
  pop.innerHTML = `<div class="sp-head"><b>${esc(slovo)}</b>
      <div class="sp-btns"><button class="icon-btn" data-sp="say" aria-label="Přehrát">${ICON.speaker}</button><button class="icon-btn" data-sp="close" aria-label="Zavřít">${ICON.close}</button></div></div>
    <div class="sp-body"><span class="typing"><i></i><i></i><i></i></span></div>`;
  pop.querySelector('[data-sp=say]').onclick = () => { stopSpeaking(); speak(cisty); };
  pop.querySelector('[data-sp=close]').onclick = zavri;
  speak(cisty);
  try {
    const v = await vyznam(veta, i, slovo);
    if (!pop || !el.classList.contains('w-on')) return;
    const body = pop.querySelector('.sp-body');
    if (!v) {
      body.innerHTML = '<p class="muted small" style="margin:0">Význam tohohle slova zjistím, až v Nastavení vložíš klíč k Claude API.</p>';
      return;
    }
    body.innerHTML = `
      <p class="sp-cs">${esc(v.cs)}</p>
      ${v.z && v.z.toLowerCase() !== cisty.toLowerCase() ? `<p class="small" style="margin:0 0 4px"><span class="muted">základní tvar:</span> <b>${esc(v.z)}</b></p>` : ''}
      ${v.g ? `<p class="small muted" style="margin:0">${esc(v.g)}</p>` : ''}
      <div id="spConj"></div>
      <div class="sp-actions"><button class="pill-btn" data-sp="add">${ICON.plus} Do kartiček</button></div>`;
    casovaniHTML(v, cisty).then(html => { const c = body.querySelector('#spConj'); if (c && html) { c.innerHTML = html; napojCasy(c, v, cisty); } });
    body.querySelector('[data-sp=add]').onclick = async e => {
      const { pridejDoKarticek } = await import('./preklad.js');
      const it = v.z && v.z.length < 30 && !v.z.includes('+') ? v.z : cisty;
      if (pridejDoKarticek(it, v.cs)) { e.currentTarget.innerHTML = `${ICON.check} Přidáno`; e.currentTarget.disabled = true; }
    };
  } catch (e) {
    if (pop) pop.querySelector('.sp-body').innerHTML = `<p class="muted small" style="margin:0">${esc(errorText(e))}</p>`;
  }
}

// Jeden posluchač pro celou aplikaci. Zachytává klepnutí ještě před kartou,
// takže klepnutí na slovo kartičku neotočí ani nespustí jiné tlačítko.
document.addEventListener('click', e => {
  const w = e.target.closest?.('.w');
  if (w) { e.stopPropagation(); e.preventDefault(); ukaz(w); return; }
  if (pop && !e.target.closest('.slovo-pop')) zavri();
}, true);
window.addEventListener('hashchange', zavri);
