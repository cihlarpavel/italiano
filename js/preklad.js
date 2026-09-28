// Překladač: hlasem (česky / italsky), textem, nebo z fotky italského textu.
import { load, save } from './store.js';
import { callJSON, errorText, hasKey } from './claude.js';
import { speak, stopSpeaking, canListen, listen } from './speech.js';
import { ICON, ic, toast, esc } from './ui.js';
import { klikaci } from './slova.js';

// ---------- Moje slovíčka (vlastní balíček z překladů) ----------
export function pridejDoKarticek(it, cs) {
  const moje = load('moje', []);
  if (moje.some(m => m.it.toLowerCase() === it.toLowerCase())) { toast('Už je v kartičkách'); return false; }
  moje.push({ it, cs, topic: 'Z překladů' });
  save('moje', moje);
  toast('Přidáno do Moje slovíčka ✓');
  return true;
}

// ---------- Volání Clauda ----------
const TEXT_SCHEMA = {
  type: 'object',
  properties: {
    zdroj: { type: 'string', enum: ['cs', 'it', 'jiny'] },
    text: { type: 'string' },
    preklad: { type: 'string' },
    varianty: { type: 'array', items: { type: 'string' } },
    poznamka: { type: 'string' },
  },
  required: ['zdroj', 'text', 'preklad', 'varianty', 'poznamka'],
  additionalProperties: false,
};

const TEXT_SYSTEM = `Jsi překladatel mezi češtinou a italštinou pro Čecha, který se učí italsky (začátečník).
- Urči jazyk vstupu (zdroj). Z češtiny překládej do italštiny, z italštiny do češtiny, z jiného jazyka do češtiny.
- Vstup často pochází z rozpoznávání řeči: chybí interpunkce, mohou v něm být překlepy. Do pole text vrať vyčištěný zdrojový text (interpunkce, velká písmena, zjevné chyby rozpoznání).
- Překlad ať je přirozený a hovorový, jak by to řekl rodilý mluvčí.
- varianty: nejvýš 2 další běžné možnosti překladu (např. tykání/vykání, hovorovější tvar), jinak prázdné pole.
- poznamka: jedna krátká česká poznámka užitečná pro učení (zvláštní slovo, gramatika, výslovnost), nebo prázdný řetězec.
- Čeština musí být bezchybná: správný pravopis a diakritika (tenké, ne „tonké“; těsto, ne „tésto“), správné skloňování a přirozené české výrazy. Před odpovědí si český text po sobě zkontroluj.`;

const FOTO_SCHEMA = {
  type: 'object',
  properties: {
    nalezen_text: { type: 'boolean' },
    jazyk: { type: 'string' },
    text_it: { type: 'string' },
    preklad_cs: { type: 'string' },
    slovicka: {
      type: 'array',
      items: { type: 'object', properties: { it: { type: 'string' }, cs: { type: 'string' } }, required: ['it', 'cs'], additionalProperties: false },
    },
    poznamka: { type: 'string' },
  },
  required: ['nalezen_text', 'jazyk', 'text_it', 'preklad_cs', 'slovicka', 'poznamka'],
  additionalProperties: false,
};

const FOTO_SYSTEM = `Uživatel (Čech, začátečník v italštině) vyfotil text, typicky italský: cedule, jídelní lístek, etiketa, leták, dopis.
- text_it: věrný přepis textu z fotky, zachovej řádky a strukturu (položky menu na samostatných řádcích). Nečitelné části označ […].
- preklad_cs: přirozený český překlad se stejnou strukturou řádků. Pokud je stejná položka na fotce ve více jazycích (italsky, anglicky, německy…), přelož ji jen jednou – žádné zdvojené řádky. Názvy jídel překládej tak, jak by je napsal český jídelní lístek; ustálené italské názvy (bigoli, tagliatelle, risotto) nech italsky s krátkým vysvětlením.
- Čeština musí být bezchybná: správný pravopis a diakritika (tenké, ne „tonké“; těsto, ne „tésto“), správné skloňování, velká písmena jen na začátku (NE CELÉ VERZÁLKAMI, i když je originál verzálkami). Před odpovědí si český text po sobě zkontroluj.
- jazyk: jazyk textu česky (např. „italština“).
- slovicka: 3–8 nejužitečnějších slov nebo frází z textu pro začátečníka; podstatná jména se členem (il, la, l'…), cs = český význam.
- poznamka: krátká užitečná česká poznámka (např. co znamená zkratka, kulturní souvislost), nebo prázdný řetězec.
- Pokud na fotce žádný text není, nalezen_text = false, ostatní pole prázdná a v poznamka to vysvětli.`;

async function prelozText(text, jazyk) {
  const hint = jazyk === 'cs' ? '(Uživatel mluvil česky.)\n' : jazyk === 'it' ? '(Uživatel mluvil italsky.)\n' : '';
  return callJSON({ system: TEXT_SYSTEM, content: hint + text, schema: TEXT_SCHEMA, effort: 'low', kvalita: 'vysoka' });
}

// Fotka z iPhonu má klidně 12 Mpx – zmenšíme ji, ať je přenos rychlý a levný.
async function zmensitFotku(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const max = 1568;
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.85);
  return { url, data: dataUrl.split(',')[1] };
}

async function prelozFotku(data) {
  return callJSON({
    system: FOTO_SYSTEM,
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } },
      { type: 'text', text: 'Přepiš a přelož text na této fotce.' },
    ],
    schema: FOTO_SCHEMA,
    effort: 'medium',
    kvalita: 'vysoka',
  });
}

// ---------- Historie ----------
function doHistorie(zaznam) {
  const h = load('preklady', []);
  h.unshift({ ...zaznam, datum: new Date().toISOString() });
  save('preklady', h.slice(0, 30));
}

// ---------- Obrazovka ----------
export function renderPreklad(app) {
  const key = hasKey();
  app.innerHTML = `
    <header class="page-head"><h1>Přeložit</h1><p class="muted">Italsky ↔ česky · hlasem, textem nebo z fotky</p></header>
    ${key ? '' : `<a class="card setup-card" href="#/nastaveni">${ic('sparkles', 'violet')}<div><b>Nejdřív nastav klíč k Claude API</b><span>Překlad stojí asi 0,1–0,4 Kč. Nastavení zabere 5 minut.</span></div>${ICON.chevron}</a>`}
    <div class="grid2">
      <button class="action coral" id="mic-cs" ${key ? '' : 'disabled'}>${ICON.mic}<b>Řeknu česky</b><span>přeložím do italštiny</span></button>
      <button class="action green" id="mic-it" ${key ? '' : 'disabled'}>${ICON.mic}<b>Řeknu italsky</b><span>přeložím do češtiny</span></button>
    </div>
    <div class="action-row">
      <button class="action violet wide" id="foto" ${key ? '' : 'disabled'}>${ICON.camera}<div><b>Vyfotit italský text</b><span>menu, cedule, etiketa, dopis…</span></div></button>
      <button class="action-mini" id="galerie" ${key ? '' : 'disabled'} aria-label="Vybrat fotku z galerie">${ICON.image}<span>Galerie</span></button>
    </div>
    <input type="file" accept="image/*" capture="environment" id="cam" hidden>
    <input type="file" accept="image/*" id="gal" hidden>
    <div class="card input-card">
      <textarea id="txt" rows="2" placeholder="…nebo napiš česky či italsky"></textarea>
      <button class="btn primary" id="go" ${key ? '' : 'disabled'}>Přeložit</button>
    </div>
    <div id="out"></div>
    <div id="hist"></div>
  `;
  const $ = id => app.querySelector('#' + id);
  const out = $('out');

  const loading = text => {
    out.innerHTML = `<div class="card result loading"><span class="typing"><i></i><i></i><i></i></span><span class="muted">${esc(text)}</span></div>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const fail = e => { out.innerHTML = `<div class="note">${esc(errorText(e))}</div>`; };

  async function textovy(text, jazyk) {
    text = text.trim();
    if (!text) return;
    loading('Překládám…');
    try {
      const r = await prelozText(text, jazyk);
      doHistorie({ typ: 'text', ...r });
      ukazText(r);
      renderHistorie();
    } catch (e) { fail(e); }
  }

  function ukazText(r) {
    const it = r.zdroj === 'it' ? r.text : r.preklad;
    const cs = r.zdroj === 'it' ? r.preklad : r.text;
    const zLabel = { cs: 'Čeština', it: 'Italština', jiny: 'Původní text' }[r.zdroj];
    const doLabel = r.zdroj === 'cs' ? 'Italština' : 'Čeština';
    out.innerHTML = `
      <div class="card result">
        <div class="res-src"><span class="label">${zLabel}</span><p>${r.zdroj === 'it' ? klikaci(r.text) : esc(r.text)}</p></div>
        <div class="res-dst"><span class="label">${doLabel}</span><p class="big-text">${r.zdroj === 'cs' ? klikaci(r.preklad) : esc(r.preklad)}</p>
          ${r.varianty.length ? `<div class="variants">${r.varianty.map(v => `<span>${esc(v)}</span>`).join('')}</div>` : ''}
        </div>
        ${r.poznamka ? `<p class="tip">${ICON.sparkles}<span>${esc(r.poznamka)}</span></p>` : ''}
        <div class="res-actions">
          ${r.zdroj !== 'jiny' ? `<button class="pill-btn primary" id="r-say">${ICON.speaker} Přehrát italsky</button>` : ''}
          ${r.zdroj !== 'jiny' ? `<button class="pill-btn" id="r-add">${ICON.plus} Do kartiček</button>` : ''}
          <button class="pill-btn" id="r-copy">${ICON.copy} Kopírovat</button>
        </div>
      </div>`;
    $('r-say') && ($('r-say').onclick = () => { stopSpeaking(); speak(it); });
    $('r-add') && ($('r-add').onclick = () => pridejDoKarticek(it, cs));
    $('r-copy').onclick = () => kopiruj(r.preklad);
    if (r.zdroj === 'cs') speak(it);
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ukazFotku(r, url) {
    out.innerHTML = `
      <div class="card result">
        ${url ? `<img class="photo" src="${url}" alt="Vyfocený text">` : ''}
        ${!r.nalezen_text ? `<p>${esc(r.poznamka || 'Na fotce jsem nenašla žádný text.')}</p>` : `
        <div class="res-dst"><span class="label">Překlad${r.jazyk && r.jazyk !== 'italština' ? ` (${esc(r.jazyk)})` : ''}</span><p class="photo-text pre">${esc(r.preklad_cs)}</p></div>
        <details class="orig" open><summary>Původní text (klepni na slovo)</summary><p class="pre">${klikaci(r.text_it)}</p>
          <button class="pill-btn" id="r-say">${ICON.speaker} Přečíst nahlas</button></details>
        ${r.poznamka ? `<p class="tip">${ICON.sparkles}<span>${esc(r.poznamka)}</span></p>` : ''}
        ${r.slovicka.length ? `<span class="label" style="margin-top:14px">Slovíčka z textu</span>
          <div class="vocab">${r.slovicka.map((s, i) => `
            <div class="vocab-row"><div><b>${esc(s.it)}</b><span>${esc(s.cs)}</span></div>
              <button class="icon-btn" data-say="${i}" aria-label="Přehrát">${ICON.speaker}</button>
              <button class="icon-btn" data-add="${i}" aria-label="Přidat do kartiček">${ICON.plus}</button></div>`).join('')}
          </div>` : ''}
        <div class="res-actions"><button class="pill-btn" id="r-copy">${ICON.copy} Kopírovat překlad</button></div>`}
      </div>`;
    $('r-say') && ($('r-say').onclick = () => { stopSpeaking(); speak(r.text_it); });
    $('r-copy') && ($('r-copy').onclick = () => kopiruj(r.preklad_cs));
    out.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(r.slovicka[+b.dataset.say].it); });
    out.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const s = r.slovicka[+b.dataset.add];
      if (pridejDoKarticek(s.it, s.cs)) { b.innerHTML = ICON.check; b.disabled = true; }
    });
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function kopiruj(text) {
    try { await navigator.clipboard.writeText(text); toast('Zkopírováno'); } catch { toast('Kopírování se nepovedlo'); }
  }

  // Poslech: celoobrazovkový panel s živým přepisem.
  async function poslouchej(jazyk) {
    if (!canListen) { $('txt').focus(); toast('Diktuj přes 🎤 na klávesnici'); return; }
    stopSpeaking();
    const sheet = document.createElement('div');
    sheet.className = 'listen-sheet';
    sheet.innerHTML = `<div class="listen-box">
      <div class="listen-orb ${jazyk === 'cs' ? 'coral' : 'green'}">${ICON.mic}</div>
      <b>${jazyk === 'cs' ? 'Mluv česky' : 'Parla in italiano'}</b>
      <p id="live" class="muted">Poslouchám…</p>
      <button class="btn primary big block" id="stop">Hotovo, přelož</button>
      <button class="btn ghost block" id="cancel">Zrušit</button></div>`;
    document.body.appendChild(sheet);
    let zruseno = false;
    const l = listen({ lang: jazyk === 'cs' ? 'cs-CZ' : 'it-IT', onInterim: t => (sheet.querySelector('#live').textContent = t) });
    sheet.querySelector('#stop').onclick = () => l.stop();
    sheet.querySelector('#cancel').onclick = () => { zruseno = true; l.stop(); };
    try {
      const said = await l.promise;
      sheet.remove();
      if (zruseno) return;
      if (!said) { toast('Nic jsem neslyšela, zkus to znovu'); return; }
      $('txt').value = said;
      textovy(said, jazyk);
    } catch (err) {
      sheet.remove();
      out.innerHTML = `<div class="note">${err === 'not-allowed' || err === 'service-not-allowed'
        ? 'Mikrofon není povolený. Povol ho v Nastavení iPhonu → Safari → Mikrofon, nebo diktuj přes klávesnici.'
        : `Rozpoznání řeči selhalo (${esc(err)}).`}</div>`;
    }
  }

  async function fotka(file) {
    if (!file) return;
    loading('Čtu text z fotky…');
    try {
      const { url, data } = await zmensitFotku(file);
      const r = await prelozFotku(data);
      if (r.nalezen_text) doHistorie({ typ: 'foto', text: r.text_it, preklad: r.preklad_cs, foto: r });
      ukazFotku(r, url);
      renderHistorie();
    } catch (e) { fail(e); }
  }

  function renderHistorie() {
    const h = load('preklady', []);
    $('hist').innerHTML = h.length ? `
      <div class="section-head"><h2>Nedávné</h2><button class="link" id="clear">Smazat</button></div>
      <div class="card list">${h.slice(0, 15).map((x, i) => `
        <button class="list-row hist" data-i="${i}">
          ${ic(x.typ === 'foto' ? 'camera' : 'translate', x.typ === 'foto' ? 'violet' : 'blue', 'sm')}
          <div><b>${esc(x.preklad.slice(0, 80))}</b><span class="muted small">${esc(x.text.slice(0, 60))}</span></div>
        </button>`).join('')}</div>` : '';
    $('clear') && ($('clear').onclick = () => { save('preklady', []); renderHistorie(); });
    app.querySelectorAll('.hist').forEach(b => b.onclick = () => {
      const x = load('preklady', [])[+b.dataset.i];
      x.typ === 'foto' ? ukazFotku(x.foto, null) : ukazText(x);
    });
  }

  $('mic-cs').onclick = () => poslouchej('cs');
  $('mic-it').onclick = () => poslouchej('it');
  $('foto').onclick = () => $('cam').click();
  $('galerie').onclick = () => $('gal').click();
  // Hodnotu vynulujeme, ať jde vybrat i stejná fotka znovu.
  $('cam').onchange = e => { fotka(e.target.files[0]); e.target.value = ''; };
  $('gal').onchange = e => { fotka(e.target.files[0]); e.target.value = ''; };
  $('go').onclick = () => textovy($('txt').value);
  $('txt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); textovy($('txt').value); } });
  renderHistorie();
}
