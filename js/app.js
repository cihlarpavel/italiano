import { DECKS, SLOVESA, OSOBY, CASY, tvary } from './data.js';
import { load, save, settings, setSettings, logActivity, streak, todayCount, today } from './store.js';
import { speak, unlockSpeech, italianVoices, stopSpeaking } from './speech.js';
import { renderChat, MODELY, usageThisMonth } from './chat.js';

const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = html => { app.innerHTML = html; window.scrollTo(0, 0); };

document.addEventListener('pointerdown', unlockSpeech, { once: true });

// ---------- Opakování v intervalech (Leitnerovy krabičky) ----------
const INTERVALY = [0, 1, 3, 7, 14, 30, 60]; // dny podle krabičky
const DAY = 86400000;
const cardId = (deck, item) => `${deck}:${item.it}`;

function srs() { return load('srs', {}); }

function deckStatus(deck) {
  const st = srs();
  const now = Date.now();
  let due = 0, learned = 0, fresh = 0;
  for (const it of DECKS[deck].items) {
    const s = st[cardId(deck, it)];
    if (!s) fresh++;
    else { learned++; if (s.due <= now) due++; }
  }
  const newToday = load('newToday', {});
  const usedNew = newToday.date === today() ? (newToday[deck] || 0) : 0;
  const newAvail = Math.min(fresh, Math.max(0, settings().newPerDay - usedNew));
  return { due, learned, fresh, newAvail, total: DECKS[deck].items.length };
}

function buildQueue(deck) {
  const st = srs();
  const now = Date.now();
  const items = DECKS[deck].items;
  const due = items.filter(it => st[cardId(deck, it)]?.due <= now)
    .sort((a, b) => st[cardId(deck, a)].due - st[cardId(deck, b)].due);
  const { newAvail } = deckStatus(deck);
  const fresh = items.filter(it => !st[cardId(deck, it)]).slice(0, newAvail);
  return [...due, ...shuffle(fresh)].map(it => ({ it, fresh: !st[cardId(deck, it)] }));
}

function grade(deck, item, g, wasFresh) {
  const st = srs();
  const id = cardId(deck, item);
  const cur = st[id] || { box: 0 };
  let box = cur.box;
  if (g === 'znovu') box = 0;
  else if (g === 'umim') box = Math.min(box + 1, INTERVALY.length - 1);
  const days = g === 'tezke' ? Math.max(1, Math.round(INTERVALY[box] / 2)) : INTERVALY[box];
  st[id] = { box, due: Date.now() + days * DAY - 3600000 };
  save('srs', st);
  if (wasFresh) {
    const n = load('newToday', {});
    const fresh = n.date === today() ? n : { date: today() };
    fresh[deck] = (fresh[deck] || 0) + 1;
    save('newToday', fresh);
  }
  logActivity('karty');
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- Domů ----------
function viewHome() {
  const decks = Object.keys(DECKS).map(k => ({ k, ...deckStatus(k) }));
  const toDo = decks.reduce((n, d) => n + d.due + d.newAvail, 0);
  h(`
    <h1>Ciao! 👋</h1>
    <p class="muted">${toDo ? `Dnes tě čeká ${toDo} kartiček.` : 'Na dnešek máš kartičky hotové. Bravo!'}</p>
    <div class="stats">
      <div class="stat"><b>${streak()}</b><span>dní v řadě</span></div>
      <div class="stat"><b>${todayCount('karty')}</b><span>kartiček dnes</span></div>
      <div class="stat"><b>${todayCount('vety')}</b><span>vět s Giulií</span></div>
    </div>
    <h2>Pokračovat</h2>
    ${decks.map(d => `
      <a class="tile card" href="#/karticky/${d.k}">
        <div class="row" style="justify-content:space-between">
          <div><b>${DECKS[d.k].name}</b><span>${d.learned} z ${d.total} rozpracováno</span></div>
          <span class="badge">${d.due + d.newAvail}</span>
        </div>
      </a>`).join('')}
    <a class="tile card" href="#/casy"><b>Časování sloves</b><span>presente, passato prossimo, imperfetto, futuro</span></a>
    <a class="tile card" href="#/mluveni"><b>Mluvení s Giulií</b><span>Konverzace nahlas – kavárna, nádraží, seznámení…</span></a>
  `);
}

// ---------- Kartičky ----------
function viewDecks() {
  h(`
    <h1>Kartičky</h1>
    <p class="muted">Klepni na kartu pro otočení. Podle odpovědi se ti vrátí za den, za týden nebo za měsíc.</p>
    ${Object.keys(DECKS).map(k => {
      const d = deckStatus(k);
      return `<a class="tile card" href="#/karticky/${k}">
        <div class="row" style="justify-content:space-between">
          <div><b>${DECKS[k].name}</b><span>${d.due} k opakování · ${d.newAvail} nových · ${d.learned}/${d.total}</span></div>
          <span class="badge">${d.due + d.newAvail}</span>
        </div></a>`;
    }).join('')}
    <div class="card">
      <div class="toggle"><span>Směr: ${settings().direction === 'it-cs' ? 'italsky → česky' : 'česky → italsky'}</span>
      <button class="btn" id="dir">Otočit</button></div>
    </div>
    <h2>Procházet</h2>
    <div class="chips">${Object.keys(DECKS).map(k => `<a class="chip" href="#/seznam/${k}">${DECKS[k].name}</a>`).join('')}</div>
  `);
  document.getElementById('dir').onclick = () => {
    setSettings({ direction: settings().direction === 'it-cs' ? 'cs-it' : 'it-cs' });
    viewDecks();
  };
}

function viewList(deck) {
  const groups = {};
  for (const it of DECKS[deck].items) (groups[it.topic] ||= []).push(it);
  h(`
    <button class="back" onclick="history.back()">‹ Zpět</button>
    <h1>${DECKS[deck].name}</h1>
    ${Object.entries(groups).map(([topic, items]) => `
      <h2>${esc(topic)}</h2>
      <div class="card">${items.map(it => `
        <div class="row" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)">
          <div><b>${esc(it.it)}</b><br><span class="muted small">${esc(it.cs)}</span></div>
          <button class="icon-btn" data-say="${esc(it.it)}" aria-label="Přehrát">🔊</button>
        </div>`).join('')}
      </div>`).join('')}
  `);
  app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(b.dataset.say); });
}

function viewSession(deck) {
  const queue = buildQueue(deck);
  const total = queue.length;
  let done = 0;
  const dir = settings().direction;

  function next() {
    if (!queue.length) {
      h(`
        <h1>Hotovo! 🎉</h1>
        <p class="muted">Prošel jsi ${done} kartiček. Zítra tě čekají další.</p>
        <a class="btn primary block" href="#/mluveni">Procvičit mluvení s Giulií</a>
        <p></p><a class="btn block" href="#/karticky">Zpět na kartičky</a>`);
      return;
    }
    const { it, fresh } = queue[0];
    const front = dir === 'it-cs' ? it.it : it.cs;
    const back = dir === 'it-cs' ? it.cs : it.it;
    h(`
      <button class="back" onclick="location.hash='#/karticky'">‹ ${DECKS[deck].name}</button>
      <div class="progress"><i style="width:${total ? (done / (done + queue.length)) * 100 : 0}%"></i></div>
      <div class="card flash" id="flash">
        <div class="topic">${esc(it.topic)}${fresh ? ' · nové' : ''}</div>
        <div class="front">${esc(front)}</div>
        <div class="back" id="back" hidden>${esc(back)}</div>
        <div class="muted small" id="hint">klepni pro otočení</div>
      </div>
      <div class="row" style="justify-content:center;margin-bottom:12px">
        <button class="icon-btn" id="say" aria-label="Přehrát">🔊</button>
      </div>
      <div class="answers" id="answers" hidden>
        <button class="btn" data-g="znovu">Znovu<small>nevěděl jsem</small></button>
        <button class="btn" data-g="tezke">Těžké<small>s námahou</small></button>
        <button class="btn olive" data-g="umim">Umím<small>hned</small></button>
      </div>
    `);
    const say = () => { stopSpeaking(); speak(it.it); };
    document.getElementById('say').onclick = say;
    if (dir === 'it-cs') say();
    document.getElementById('flash').onclick = () => {
      document.getElementById('back').hidden = false;
      document.getElementById('hint').hidden = true;
      document.getElementById('answers').hidden = false;
      if (dir === 'cs-it') say();
    };
    document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const g = b.dataset.g;
      grade(deck, it, g, fresh);
      const card = queue.shift();
      if (g === 'znovu') queue.splice(Math.min(3, queue.length), 0, { ...card, fresh: false });
      else done++;
      next();
    });
  }
  next();
}

// ---------- Časy ----------
function viewCasy() {
  const sel = load('drillCasy', ['presente']);
  h(`
    <h1>Časování</h1>
    <p class="muted">Vyber časy, které chceš procvičovat, a doplňuj správné tvary.</p>
    <div class="chips" id="casy">${Object.entries(CASY).map(([k, c]) =>
      `<button class="chip ${sel.includes(k) ? 'on' : ''}" data-k="${k}">${c.name.split(' (')[0]}</button>`).join('')}</div>
    <p></p>
    <button class="btn primary block" id="start">Začít procvičovat</button>
    <h2>Kdy který čas</h2>
    ${Object.values(CASY).map(c => `<div class="card"><b>${c.name}</b><p class="small" style="margin-top:6px">${esc(c.info)}</p></div>`).join('')}
    <h2>Tabulky sloves</h2>
    <div class="chips">${SLOVESA.map(v => `<a class="chip" href="#/sloveso/${v.inf}">${v.inf}</a>`).join('')}</div>
  `);
  document.querySelectorAll('#casy .chip').forEach(b => b.onclick = () => {
    b.classList.toggle('on');
    const on = [...document.querySelectorAll('#casy .chip.on')].map(x => x.dataset.k);
    save('drillCasy', on);
  });
  document.getElementById('start').onclick = () => {
    if (!load('drillCasy', ['presente']).length) save('drillCasy', ['presente']);
    location.hash = '#/dril';
  };
}

function viewSloveso(inf) {
  const v = SLOVESA.find(x => x.inf === inf);
  if (!v) return viewCasy();
  h(`
    <button class="back" onclick="history.back()">‹ Zpět</button>
    <h1>${v.inf} <span class="muted" style="font-size:18px;font-weight:400">– ${esc(v.cs)}</span></h1>
    ${Object.entries(CASY).map(([k, c]) => `
      <div class="card"><b>${c.name}</b>
        <table class="conj">${OSOBY.map((o, i) => {
          const f = tvary(v, k, i)[0];
          return `<tr><td>${o}</td><td><b>${esc(f)}</b></td><td style="width:44px"><button class="icon-btn" data-say="${esc(o.split('/')[0] + ' ' + f.replace(/\/\w$/, ''))}">🔊</button></td></tr>`;
        }).join('')}</table>
      </div>`).join('')}
  `);
  app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(b.dataset.say); });
}

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
const normKeepAccents = s => s.toLowerCase().normalize('NFC').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();

function viewDril() {
  const casy = load('drillCasy', ['presente']);
  let score = { ok: 0, all: 0 };
  let last = '';

  function ask() {
    let v, cas, i, key;
    do {
      v = SLOVESA[Math.floor(Math.random() * SLOVESA.length)];
      cas = casy[Math.floor(Math.random() * casy.length)];
      i = Math.floor(Math.random() * 6);
      key = v.inf + cas + i;
    } while (key === last);
    last = key;
    const answers = tvary(v, cas, i);
    h(`
      <button class="back" onclick="location.hash='#/casy'">‹ Časy</button>
      <div class="muted small" style="text-align:right">${score.ok} / ${score.all} správně</div>
      <div class="card">
        <div class="drill-q">${CASY[cas].name}</div>
        <div class="drill-verb">${v.inf} <span class="muted" style="font-size:16px;font-weight:400">(${esc(v.cs)})</span></div>
        <div class="drill-person">${OSOBY[i]} …</div>
      </div>
      <form id="f" autocomplete="off">
        <input type="text" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="napiš tvar" enterkeyhint="done">
        <div class="accents">${['à', 'è', 'é', 'ì', 'ò', 'ù'].map(a => `<button type="button" data-a="${a}">${a}</button>`).join('')}</div>
        <button class="btn primary block" id="check">Zkontrolovat</button>
      </form>
      <div id="fb"></div>
    `);
    const input = document.getElementById('ans');
    input.focus();
    document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { input.value += b.dataset.a; input.focus(); });
    let checked = false;
    document.getElementById('f').onsubmit = e => {
      e.preventDefault();
      if (checked) return ask();
      const val = input.value;
      if (!val.trim()) return;
      checked = true;
      score.all++;
      const exact = answers.some(a => normKeepAccents(a) === normKeepAccents(val));
      const loose = answers.some(a => norm(a) === norm(val));
      const fb = document.getElementById('fb');
      if (exact || loose) {
        score.ok++;
        fb.innerHTML = `<div class="feedback ok">Giusto! ${exact ? '' : `<br><span style="font-weight:400">Jen pozor na přízvuk: <b>${esc(answers[0])}</b></span>`}</div>`;
      } else {
        fb.innerHTML = `<div class="feedback bad">Správně je: ${esc(answers[0])}</div>`;
      }
      logActivity('tvary');
      speak(`${OSOBY[i].split('/')[0]} ${answers[answers.length > 1 ? 1 : 0]}`);
      document.getElementById('check').textContent = 'Další';
    };
  }
  ask();
}

// ---------- Nastavení ----------
function viewNastaveni() {
  const s = settings();
  const voices = italianVoices();
  const u = usageThisMonth();
  h(`
    <h1>Nastavení</h1>
    <h2>Konverzace s Giulií</h2>
    <div class="card">
      <div class="field">
        <label for="key">Klíč k Claude API</label>
        <input type="password" id="key" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <p class="note" style="margin-top:8px">Klíč zůstává jen v tomto telefonu a posílá se výhradně na api.anthropic.com. Vytvoříš ho na console.anthropic.com → API Keys. Doporučuji tam nastavit měsíční limit útraty.</p>
      </div>
      <div class="field">
        <label for="model">Model</label>
        <select id="model">${Object.entries(MODELY).map(([id, m]) =>
          `<option value="${id}" ${id === s.model ? 'selected' : ''}>${m.name}</option>`).join('')}</select>
      </div>
      <div class="field toggle">
        <label for="cz" style="margin:0">Ukazovat český překlad Giuliiných vět</label>
        <input type="checkbox" id="cz" ${s.showCz ? 'checked' : ''}>
      </div>
      <p class="small muted">Útrata tento měsíc: <b>${u.czk.toFixed(1)} Kč</b> (${u.turns} odpovědí). Orientační přepočet 1 USD ≈ 22 Kč.</p>
    </div>
    <h2>Hlas</h2>
    <div class="card">
      <div class="field">
        <label for="voice">Italský hlas</label>
        <select id="voice">${voices.length ? voices.map(v =>
          `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')
          : '<option value="">Výchozí</option>'}</select>
        <p class="note" style="margin-top:8px">Hezčí hlasy stáhneš v iPhonu: Nastavení → Zpřístupnění → Předčítaný obsah → Hlasy → Italština (vyber „vylepšený“ nebo „prémiový“).</p>
      </div>
      <div class="field">
        <label for="rate">Rychlost řeči: <span id="rateV">${s.rate.toFixed(2)}</span></label>
        <input type="range" id="rate" min="0.6" max="1.2" step="0.05" value="${s.rate}" style="width:100%">
      </div>
      <button class="btn block" id="test">Vyzkoušet hlas</button>
    </div>
    <h2>Kartičky</h2>
    <div class="card">
      <div class="field">
        <label for="npd">Nových kartiček denně (v každém balíčku)</label>
        <select id="npd">${[5, 10, 15, 20, 30].map(n => `<option ${n === s.newPerDay ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </div>
      <button class="btn block" id="reset" style="color:var(--bad)">Smazat postup v kartičkách</button>
    </div>
  `);
  const $ = id => document.getElementById(id);
  $('key').onchange = e => setSettings({ apiKey: e.target.value.trim() });
  $('model').onchange = e => setSettings({ model: e.target.value });
  $('cz').onchange = e => setSettings({ showCz: e.target.checked });
  $('voice').onchange = e => setSettings({ voice: e.target.value });
  $('rate').oninput = e => { setSettings({ rate: +e.target.value }); $('rateV').textContent = (+e.target.value).toFixed(2); };
  $('npd').onchange = e => setSettings({ newPerDay: +e.target.value });
  $('test').onclick = () => { stopSpeaking(); speak('Ciao! Sono Giulia. Come stai oggi?'); };
  $('reset').onclick = () => {
    if (confirm('Opravdu smazat postup ve všech kartičkách?')) { save('srs', {}); save('newToday', {}); viewNastaveni(); }
  };
  // Hlasy se v Safari načítají se zpožděním.
  if (!voices.length) setTimeout(() => italianVoices().length && location.hash.includes('nastaveni') && viewNastaveni(), 800);
}

// ---------- Směrování ----------
function route() {
  stopSpeaking();
  const [, view = '', arg] = location.hash.split('/');
  const tab = { '': 'home', karticky: 'karticky', seznam: 'karticky', casy: 'casy', dril: 'casy', sloveso: 'casy', mluveni: 'mluveni', nastaveni: 'nastaveni' }[view] || 'home';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  document.body.classList.toggle('chat', view === 'mluveni');
  switch (view) {
    case 'karticky': return arg && DECKS[arg] ? viewSession(arg) : viewDecks();
    case 'seznam': return DECKS[arg] ? viewList(arg) : viewDecks();
    case 'casy': return viewCasy();
    case 'dril': return viewDril();
    case 'sloveso': return viewSloveso(decodeURIComponent(arg || ''));
    case 'mluveni': return renderChat(app, arg);
    case 'nastaveni': return viewNastaveni();
    default: return viewHome();
  }
}
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
