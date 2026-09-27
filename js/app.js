import { DECKS, FRAZE, SLOVESA, OSOBY, CASY, tvary } from './data.js';
import { load, save, settings, setSettings, logActivity, streak, todayCount, today } from './store.js';
import { speak, unlockSpeech, italianVoices, stopSpeaking } from './speech.js';
import { renderChat, MODELY, usageThisMonth } from './chat.js';
import { toast } from './ui.js';

const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const h = html => { app.innerHTML = html; window.scrollTo(0, 0); };
const $ = id => document.getElementById(id);
const sayBtn = (text, label = 'Přehrát') => `<button class="icon-btn" data-say="${esc(text)}" aria-label="${label}">${ICON.speaker}</button>`;
const bindSay = root => root.querySelectorAll('[data-say]').forEach(b => b.onclick = e => { e.stopPropagation(); stopSpeaking(); speak(b.dataset.say); });

const ICON = {
  speaker: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

document.addEventListener('pointerdown', unlockSpeech, { once: true });

// ---------- Opakování v intervalech (Leitnerovy krabičky) ----------
const INTERVALY = [0, 1, 3, 7, 14, 30, 60]; // dny podle krabičky
const DAY = 86400000;
const cardId = (deck, item) => `${deck}:${item.it}`;
const srs = () => load('srs', {});

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
  return [...due, ...fresh].map(it => ({ deck, it, fresh: !st[cardId(deck, it)] }));
}

// Dnešní lekce: opakování ze všech balíčků napřed, nové karty prostřídané.
function mixedQueue() {
  const qs = Object.keys(DECKS).map(buildQueue);
  const due = qs.flatMap(q => q.filter(c => !c.fresh));
  const fresh = [];
  for (let i = 0; qs.some(q => q.filter(c => c.fresh)[i]); i++) qs.forEach(q => { const c = q.filter(c => c.fresh)[i]; if (c) fresh.push(c); });
  return [...shuffle(due), ...fresh];
}

// Kam se karta posune po odpovědi – stejná logika pro výpočet i pro popisky tlačítek.
function nextStep(card, g) {
  const cur = srs()[cardId(card.deck, card.it)] || { box: 0 };
  if (g === 'znovu') return { box: 0, days: 0 };
  if (g === 'tezke') return { box: cur.box, days: Math.max(1, Math.round(INTERVALY[cur.box] / 2)) };
  const box = Math.min((card.fresh ? 1 : cur.box) + 1, INTERVALY.length - 1);
  return { box, days: INTERVALY[box] };
}

function kdy(days) {
  if (days === 0) return 'za chvíli';
  if (days === 1) return 'zítra';
  if (days < 5) return `za ${days} dny`;
  if (days < 7) return `za ${days} dní`;
  if (days < 28) { const w = Math.round(days / 7); return w === 1 ? 'za týden' : `za ${w} týdny`; }
  const m = Math.round(days / 30); return m === 1 ? 'za měsíc' : `za ${m} měsíce`;
}

function grade(card, g) {
  const st = srs();
  const { box, days } = nextStep(card, g);
  st[cardId(card.deck, card.it)] = { box, due: Date.now() + days * DAY - 3600000 };
  save('srs', st);
  if (card.fresh) {
    const n = load('newToday', {});
    const fresh = n.date === today() ? n : { date: today() };
    fresh[card.deck] = (fresh[card.deck] || 0) + 1;
    save('newToday', fresh);
  }
  logActivity('karty');
}

function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const goal = () => settings().goal;

function ring(value, max, size = 76) {
  const r = size / 2 - 6, c = 2 * Math.PI * r, p = Math.min(1, max ? value / max : 0);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--surface-2)" stroke-width="8" fill="none"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${p >= 1 ? 'var(--accent-2)' : 'var(--accent)'}" stroke-width="8" fill="none"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${p >= 1 ? 26 : 17}" font-weight="700" fill="var(--text)">${p >= 1 ? '✓' : `${Math.round(p * 100)}%`}</text>
  </svg>`;
}

// ---------- Úvod při prvním spuštění ----------
function viewUvod(step = 0) {
  const dots = `<div class="dots">${[0, 1, 2, 3].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
  const next = () => viewUvod(step + 1);
  const steps = [
    () => `
      <div class="hero-emoji">🇮🇹</div>
      <h1>Benvenuto!</h1>
      <p class="lead">Italštinu se tu naučíš ve třech krocích, na každý stačí pár minut denně.</p>
      <div class="feature"><span>🃏</span><div><b>Kartičky</b><p>Slovíčka, vazby a fráze. Co nevíš, uvidíš brzy znovu, co umíš, až za pár dní.</p></div></div>
      <div class="feature"><span>⏱️</span><div><b>Časy</b><p>Časování nejčastějších sloves s okamžitou kontrolou.</p></div></div>
      <div class="feature"><span>💬</span><div><b>Giulia</b><p>Mluvíš nahlas s Italkou. Ona odpoví, přeloží a opraví tě.</p></div></div>
      <button class="btn primary block big" id="go">Pokračovat</button>`,
    () => `
      <div class="hero-emoji">🎯</div>
      <h1>Kolik času denně?</h1>
      <p class="lead">Podle toho ti nachystám dávku nových slovíček. Změnit to můžeš kdykoli v Nastavení.</p>
      ${[[5, 15, 'Pohodově', '5 minut · 5 nových denně'], [10, 30, 'Pravidelně', '10 minut · 10 nových denně'], [20, 60, 'Intenzivně', '20 minut · 20 nových denně']]
        .map(([n, g, t, d]) => `<button class="tile card choice ${settings().newPerDay === n ? 'on' : ''}" data-n="${n}" data-g="${g}"><b>${t}</b><span>${d}</span></button>`).join('')}`,
    () => `
      <div class="hero-emoji">🔊</div>
      <h1>Poslechni si výslovnost</h1>
      <p class="lead">Všechno ti telefon přečte italsky. Zkus, jestli slyšíš zvuk (vypni tichý režim).</p>
      <button class="btn block big" id="play">${ICON.speaker} Pustit ukázku</button>
      <p class="note" style="margin-top:14px">Tip: hezčí hlas stáhneš v iPhonu: Nastavení → Zpřístupnění → Předčítaný obsah → Hlasy → Italština → „Alice (vylepšený)“.</p>
      <button class="btn primary block big" id="go">Slyším, pokračovat</button>`,
    () => `
      <div class="hero-emoji">💬</div>
      <h1>Mluvení s Giulií</h1>
      <p class="lead">Giulia potřebuje připojení k umělé inteligenci Claude. Stačí vložit klíč a jedna její odpověď pak stojí kolem 0,3 Kč.</p>
      <p class="muted small">Kartičky a časy fungují i bez klíče, zdarma a offline.</p>
      <a class="btn primary block big" href="#/nastaveni" id="done1">Nastavit klíč teď</a>
      <p></p>
      <a class="btn block big" href="#/" id="done2">Později, jdu na kartičky</a>`,
  ];
  h(`<div class="onboarding">${dots}${steps[step]()}</div>`);
  $('go') && ($('go').onclick = next);
  $('play') && ($('play').onclick = () => { stopSpeaking(); speak('Ciao! Io sono Giulia. Benvenuto! Impariamo insieme l’italiano.'); });
  app.querySelectorAll('.choice').forEach(b => b.onclick = () => { setSettings({ newPerDay: +b.dataset.n, goal: +b.dataset.g }); next(); });
  ['done1', 'done2'].forEach(id => $(id) && $(id).addEventListener('click', () => save('onboarded', true)));
}

// ---------- Domů ----------
function frazeDne() {
  const d = today();
  let n = 0;
  for (const ch of d) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return FRAZE[n % FRAZE.length];
}

function viewHome() {
  const queue = mixedQueue();
  const done = todayCount('karty');
  const hour = new Date().getHours();
  const f = frazeDne();
  const s = streak();
  h(`
    <div class="greet">
      <div>
        <h1>${hour < 18 ? 'Buongiorno!' : 'Buonasera!'}</h1>
        <p class="muted">${s ? `🔥 ${s} ${s === 1 ? 'den' : s < 5 ? 'dny' : 'dní'} v řadě` : 'Dnes začínáš sérii'}</p>
      </div>
      <div class="ring-wrap">${ring(done, goal())}<span>denní cíl</span></div>
    </div>

    <div class="card today">
      ${queue.length ? `
        <b>Dnešní lekce</b>
        <p class="muted small">${queue.length} kartiček · asi ${Math.max(1, Math.round(queue.length * 0.25))} min</p>
        <a class="btn primary block big" href="#/lekce">Začít</a>` : `
        <b>Kartičky máš na dnešek hotové 🎉</b>
        <p class="muted small">Teď je ideální chvíle si popovídat nebo procvičit časy.</p>
        <a class="btn primary block big" href="#/mluveni">Popovídat si s Giulií</a>`}
    </div>

    <div class="card phrase">
      <div class="label">Fráze dne</div>
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div><div class="phrase-it">${esc(f.it)}</div><div class="muted">${esc(f.cs)}</div></div>
        ${sayBtn(f.it)}
      </div>
    </div>

    <h2>Procvičování</h2>
    <div class="grid2">
      <a class="tile card square" href="#/mluveni"><span class="emoji">💬</span><b>Mluvení</b><span>s Giulií</span></a>
      <a class="tile card square" href="#/casy"><span class="emoji">⏱️</span><b>Časy</b><span>časování sloves</span></a>
    </div>
    <h2>Balíčky kartiček</h2>
    ${Object.keys(DECKS).map(deckTile).join('')}
  `);
  bindSay(app);
}

function deckTile(k) {
  const d = deckStatus(k);
  const n = d.due + d.newAvail;
  return `<a class="tile card" href="#/karticky/${k}">
    <div class="row" style="justify-content:space-between">
      <div style="flex:1"><b>${DECKS[k].name}</b>
        <div class="bar"><i style="width:${(d.learned / d.total) * 100}%"></i></div>
        <span>${d.learned} z ${d.total} slov rozpracováno</span></div>
      ${n ? `<span class="badge">${n}</span>` : '<span class="badge done">✓</span>'}
    </div></a>`;
}

// ---------- Kartičky ----------
function viewDecks() {
  const dir = settings().direction;
  h(`
    <h1>Kartičky</h1>
    <p class="muted">Vyber balíček. Číslo ukazuje, kolik kartiček tě v něm dnes čeká.</p>
    ${Object.keys(DECKS).map(deckTile).join('')}
    <div class="card">
      <b>Směr zkoušení</b>
      <div class="seg" style="margin-top:10px">
        <button class="${dir === 'it-cs' ? 'on' : ''}" data-dir="it-cs">🇮🇹 → 🇨🇿</button>
        <button class="${dir === 'cs-it' ? 'on' : ''}" data-dir="cs-it">🇨🇿 → 🇮🇹</button>
      </div>
      <p class="muted small" style="margin-top:8px">${dir === 'it-cs' ? 'Vidíš italsky, vybavuješ si význam. Snazší, dobré na začátek.' : 'Vidíš česky, vybavuješ si italsky. Těžší, ale víc to naučí.'}</p>
    </div>
    <h2>Procházet seznam</h2>
    <div class="chips">${Object.keys(DECKS).map(k => `<a class="chip" href="#/seznam/${k}">${DECKS[k].name}</a>`).join('')}</div>
  `);
  app.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { setSettings({ direction: b.dataset.dir }); viewDecks(); });
}

function viewList(deck) {
  const groups = {};
  for (const it of DECKS[deck].items) (groups[it.topic] ||= []).push(it);
  h(`
    <button class="back" onclick="history.back()">‹ Zpět</button>
    <h1>${DECKS[deck].name}</h1>
    ${Object.entries(groups).map(([topic, items]) => `
      <h2>${esc(topic)}</h2>
      <div class="card list">${items.map(it => `
        <div class="list-row">
          <div><b>${esc(it.it)}</b><br><span class="muted small">${esc(it.cs)}</span></div>
          ${sayBtn(it.it)}
        </div>`).join('')}
      </div>`).join('')}
  `);
  bindSay(app);
}

function viewSession(queue, title, backHash) {
  const dir = settings().direction;
  const total = queue.length;
  let done = 0, known = 0;

  if (!total) {
    h(`<div class="empty">
      <div class="hero-emoji">✅</div><h1>Tady je pro dnešek hotovo</h1>
      <p class="muted">Nové kartičky přibydou zítra. Mezitím si můžeš popovídat s Giulií.</p>
      <a class="btn primary block big" href="#/mluveni">Popovídat si s Giulií</a><p></p>
      <a class="btn block big" href="${backHash}">Zpět</a></div>`);
    return;
  }

  function finish() {
    h(`<div class="empty">
      <div class="hero-emoji">🎉</div>
      <h1>Bravo!</h1>
      <p class="lead">Máš za sebou ${done} ${done === 1 ? 'kartičku' : done < 5 ? 'kartičky' : 'kartiček'}, ${known} z nich hned napoprvé.</p>
      ${ring(todayCount('karty'), goal(), 110)}
      <p class="muted">${todayCount('karty') >= goal() ? 'Denní cíl splněn!' : `Denní cíl: ${todayCount('karty')} z ${goal()}`}</p>
      <a class="btn primary block big" href="#/mluveni">Vyzkoušet slovíčka v rozhovoru</a><p></p>
      <a class="btn block big" href="#/">Domů</a></div>`);
  }

  function next() {
    if (!queue.length) return finish();
    const card = queue[0];
    const { it } = card;
    const front = dir === 'it-cs' ? it.it : it.cs;
    const back = dir === 'it-cs' ? it.cs : it.it;
    const lbl = g => kdy(nextStep(card, g).days);
    h(`
      <div class="session-top">
        <button class="icon-btn" id="close" aria-label="Ukončit">${ICON.close}</button>
        <div class="progress"><i style="width:${(done / (done + queue.length)) * 100}%"></i></div>
        <span class="muted small">${done + 1}/${done + queue.length}</span>
      </div>
      <div class="card flash" id="flash">
        <div class="topic">${esc(title === 'Dnešní lekce' ? DECKS[card.deck].name : it.topic)}${card.fresh ? ' · <span class="new">nové</span>' : ''}</div>
        <div class="front">${esc(front)}</div>
        <div class="back" id="back" hidden>${esc(back)}</div>
        <div class="flip-hint" id="hint">Vybav si ${dir === 'it-cs' ? 'význam' : 'italsky'}, pak klepni</div>
        <div class="flash-say">${sayBtn(it.it)}</div>
      </div>
      <button class="btn primary block big" id="show">Ukázat odpověď</button>
      <div class="answers" id="answers" hidden>
        <p class="muted small center" style="grid-column:1/-1;margin:0 0 2px">Jak to šlo?</p>
        <button class="btn" data-g="znovu">Nevím<small>${lbl('znovu')}</small></button>
        <button class="btn" data-g="tezke">Těžko<small>${lbl('tezke')}</small></button>
        <button class="btn olive" data-g="umim">Vím<small>${lbl('umim')}</small></button>
      </div>
    `);
    bindSay(app);
    if (dir === 'it-cs') speak(it.it);
    const reveal = () => {
      if (!$('back').hidden) return;
      $('flash').classList.add('flipped');
      $('back').hidden = false;
      $('hint').hidden = true;
      $('show').hidden = true;
      $('answers').hidden = false;
      if (dir === 'cs-it') { stopSpeaking(); speak(it.it); }
    };
    $('flash').onclick = reveal;
    $('show').onclick = reveal;
    $('close').onclick = () => (done ? finish() : (location.hash = backHash));
    app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      const g = b.dataset.g;
      grade(card, g);
      queue.shift();
      if (g === 'znovu') queue.splice(Math.min(3, queue.length), 0, { ...card, fresh: false });
      else { done++; if (g === 'umim') known++; }
      next();
    });
  }
  next();
}

// ---------- Časy ----------
const OSOBY_CZ = ['já', 'ty', 'on / ona', 'my', 'vy', 'oni'];

function viewCasy() {
  const sel = load('drillCasy', ['presente']);
  h(`
    <h1>Časy</h1>
    <p class="muted">Vyber, co chceš procvičit. Doporučuji začít přítomným časem.</p>
    <div class="card">
      ${Object.entries(CASY).map(([k, c]) => `
        <label class="check">
          <input type="checkbox" data-k="${k}" ${sel.includes(k) ? 'checked' : ''}>
          <div><b>${c.name.split(' (')[0]}</b><span class="muted small">${c.name.match(/\((.+)\)/)[1]}</span></div>
        </label>`).join('')}
    </div>
    <button class="btn primary block big" id="start">Procvičovat</button>
    <h2>Jak to funguje</h2>
    ${Object.values(CASY).map(c => `<details class="card"><summary><b>${c.name}</b></summary><p class="small" style="margin-top:8px">${esc(c.info)}</p></details>`).join('')}
    <h2>Tabulky sloves</h2>
    <div class="chips">${SLOVESA.map(v => `<a class="chip" href="#/sloveso/${v.inf}">${v.inf}</a>`).join('')}</div>
  `);
  const update = () => {
    const on = [...app.querySelectorAll('[data-k]:checked')].map(x => x.dataset.k);
    save('drillCasy', on);
    $('start').disabled = !on.length;
    $('start').textContent = on.length ? 'Procvičovat' : 'Vyber aspoň jeden čas';
  };
  app.querySelectorAll('[data-k]').forEach(b => b.onchange = update);
  update();
  $('start').onclick = () => (location.hash = '#/dril');
}

function conjTable(v, cas, highlight) {
  return `<table class="conj">${OSOBY.map((o, i) => {
    const f = tvary(v, cas, i)[0];
    return `<tr class="${i === highlight ? 'hl' : ''}"><td>${o}<br><span class="muted small">${OSOBY_CZ[i]}</span></td><td><b>${esc(f)}</b></td>
      <td style="width:48px">${sayBtn(o.split('/')[0] + ' ' + f.replace(/\/\w$/, ''))}</td></tr>`;
  }).join('')}</table>`;
}

function viewSloveso(inf) {
  const v = SLOVESA.find(x => x.inf === inf);
  if (!v) return viewCasy();
  h(`
    <button class="back" onclick="history.back()">‹ Zpět</button>
    <h1>${v.inf} <span class="muted" style="font-size:18px;font-weight:400">– ${esc(v.cs)}</span></h1>
    ${Object.entries(CASY).map(([k, c]) => `<div class="card"><b>${c.name}</b>${conjTable(v, k, -1)}</div>`).join('')}
  `);
  bindSay(app);
}

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
const normKeepAccents = s => s.toLowerCase().normalize('NFC').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();

function viewDril() {
  const casy = load('drillCasy', ['presente']);
  if (!casy.length) return (location.hash = '#/casy');
  const score = { ok: 0, bad: 0 };
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
      <div class="session-top">
        <button class="icon-btn" id="close" aria-label="Ukončit">${ICON.close}</button>
        <div style="flex:1"></div>
        <span class="score"><span class="ok">✓ ${score.ok}</span><span class="bad">✗ ${score.bad}</span></span>
      </div>
      <div class="card">
        <div class="drill-q">${CASY[cas].name}</div>
        <div class="drill-verb">${v.inf} <span class="muted" style="font-size:16px;font-weight:400">${esc(v.cs)}</span></div>
        <div class="drill-person"><b>${OSOBY[i]}</b> <span class="muted">(${OSOBY_CZ[i]})</span> …</div>
      </div>
      <form id="f" autocomplete="off">
        <input type="text" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Napiš tvar slovesa" enterkeyhint="done">
        <div class="accents">${['à', 'è', 'é', 'ì', 'ò', 'ù'].map(a => `<button type="button" data-a="${a}">${a}</button>`).join('')}</div>
        <div class="row">
          <button type="button" class="btn" id="dunno">Nevím</button>
          <button class="btn primary" id="check">Zkontrolovat</button>
        </div>
      </form>
      <div id="fb"></div>
    `);
    const input = $('ans');
    input.focus();
    $('close').onclick = () => (location.hash = '#/casy');
    app.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { input.value += b.dataset.a; input.focus(); });
    let checked = false;
    const evaluate = gaveUp => {
      checked = true;
      const val = input.value;
      const exact = !gaveUp && answers.some(a => normKeepAccents(a) === normKeepAccents(val));
      const loose = !gaveUp && answers.some(a => norm(a) === norm(val));
      if (exact || loose) score.ok++; else score.bad++;
      app.querySelector('.score').innerHTML = `<span class="ok">✓ ${score.ok}</span><span class="bad">✗ ${score.bad}</span>`;
      input.readOnly = true;
      app.querySelector('.accents').hidden = true;
      $('dunno').hidden = true;
      $('check').textContent = 'Další ›';
      $('fb').innerHTML = `
        ${exact || loose
          ? `<div class="feedback ok">Giusto! 👏${exact ? '' : `<br><span style="font-weight:400">Jen pozor na přízvuk: <b>${esc(answers[0])}</b></span>`}</div>`
          : `<div class="feedback bad">${gaveUp ? 'Správně je' : 'Skoro. Správně je'}: ${esc(answers[0])}</div>`}
        <div class="card" style="margin-top:12px"><b class="small muted">${v.inf} · ${CASY[cas].name}</b>${conjTable(v, cas, i)}</div>`;
      bindSay(app);
      logActivity('tvary');
      speak(`${OSOBY[i].split('/')[0]} ${answers[answers.length > 1 ? 1 : 0]}`);
      $('check').focus();
    };
    $('dunno').onclick = () => evaluate(true);
    $('f').onsubmit = e => {
      e.preventDefault();
      if (checked) return ask();
      if (!input.value.trim()) { input.focus(); return; }
      evaluate(false);
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

    <h2>Giulia (konverzace)</h2>
    <div class="card">
      <div class="field">
        <label for="key">Klíč k Claude API ${s.apiKey ? '<span class="pill ok">✓ uložen</span>' : '<span class="pill">chybí</span>'}</label>
        <div class="row">
          <input type="password" id="key" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button class="icon-btn" id="eye" aria-label="Zobrazit klíč">👁</button>
        </div>
      </div>
      <details ${s.apiKey ? '' : 'open'}>
        <summary>Jak klíč získat (5 minut)</summary>
        <ol class="small steps">
          <li>Otevři <b>console.anthropic.com</b> a přihlas se (e-mailem).</li>
          <li><b>Billing</b> → dobij kredit, stačí 5 USD na měsíce.</li>
          <li><b>Billing → Limits</b> → nastav měsíční limit (např. 5 USD), ať máš útratu pod kontrolou.</li>
          <li><b>API Keys → Create Key</b> → zkopíruj ho a vlož sem.</li>
        </ol>
        <p class="note small">Klíč zůstává jen v tomto telefonu a posílá se výhradně na api.anthropic.com.</p>
      </details>
      <div class="field" style="margin-top:14px">
        <label for="model">Model</label>
        <select id="model">${Object.entries(MODELY).map(([id, m]) =>
          `<option value="${id}" ${id === s.model ? 'selected' : ''}>${m.name}</option>`).join('')}</select>
      </div>
      <label class="toggle"><span>Ukazovat český překlad hned</span><input type="checkbox" id="cz" ${s.showCz ? 'checked' : ''}></label>
      <p class="small muted" style="margin-top:12px">Útrata tento měsíc: <b>${u.czk.toFixed(1).replace('.', ',')} Kč</b> · ${u.turns} odpovědí (orientačně, 1 USD ≈ 22 Kč)</p>
    </div>

    <h2>Hlas</h2>
    <div class="card">
      <div class="field">
        <label for="voice">Italský hlas</label>
        <select id="voice">${voices.length ? voices.map(v =>
          `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voice ? 'selected' : ''}>${esc(v.name)}</option>`).join('')
          : '<option value="">Výchozí</option>'}</select>
      </div>
      <div class="field">
        <label for="rate">Rychlost řeči</label>
        <div class="row"><span class="small">🐢</span><input type="range" id="rate" min="0.6" max="1.2" step="0.05" value="${s.rate}" style="flex:1"><span class="small">🐇</span></div>
      </div>
      <button class="btn block" id="test">${ICON.speaker} Vyzkoušet</button>
      <p class="note small" style="margin-top:12px">Hezčí hlas: Nastavení iPhonu → Zpřístupnění → Předčítaný obsah → Hlasy → Italština → „vylepšený“.</p>
    </div>

    <h2>Učení</h2>
    <div class="card">
      <div class="field">
        <label for="npd">Nových kartiček denně (v každém balíčku)</label>
        <select id="npd">${[5, 10, 15, 20, 30].map(n => `<option ${n === s.newPerDay ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="goal">Denní cíl (počet kartiček)</label>
        <select id="goal">${[15, 30, 45, 60, 100].map(n => `<option ${n === s.goal ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </div>
      <button class="btn block" id="intro">Znovu projít úvod</button>
      <p></p>
      <button class="btn block danger" id="reset">Smazat postup v kartičkách</button>
    </div>
  `);
  const saved = () => toast('Uloženo ✓');
  $('key').onchange = e => { setSettings({ apiKey: e.target.value.trim() }); saved(); viewNastaveni(); };
  $('eye').onclick = () => { $('key').type = $('key').type === 'password' ? 'text' : 'password'; };
  $('model').onchange = e => { setSettings({ model: e.target.value }); saved(); };
  $('cz').onchange = e => { setSettings({ showCz: e.target.checked }); saved(); };
  $('voice').onchange = e => { setSettings({ voice: e.target.value }); stopSpeaking(); speak('Ciao, sono Giulia!'); };
  $('rate').onchange = e => { setSettings({ rate: +e.target.value }); stopSpeaking(); speak('Piacere di conoscerti.'); };
  $('npd').onchange = e => { setSettings({ newPerDay: +e.target.value }); saved(); };
  $('goal').onchange = e => { setSettings({ goal: +e.target.value }); saved(); };
  $('test').onclick = () => { stopSpeaking(); speak('Ciao! Sono Giulia. Come stai oggi?'); };
  $('intro').onclick = () => (location.hash = '#/vitej');
  $('reset').onclick = () => {
    if (confirm('Opravdu smazat postup ve všech kartičkách? Nejde to vrátit.')) { save('srs', {}); save('newToday', {}); toast('Postup smazán'); }
  };
  // Hlasy se v Safari načítají se zpožděním.
  if (!voices.length) setTimeout(() => italianVoices().length && location.hash.includes('nastaveni') && viewNastaveni(), 800);
}

// ---------- Směrování ----------
function route() {
  stopSpeaking();
  const [, view = '', arg] = location.hash.split('/');
  if (!load('onboarded', false) && view !== 'vitej' && view !== 'nastaveni') return (location.hash = '#/vitej');
  const tab = { '': 'home', lekce: 'home', karticky: 'karticky', seznam: 'karticky', casy: 'casy', dril: 'casy', sloveso: 'casy', mluveni: 'mluveni', nastaveni: 'nastaveni' }[view] || 'home';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  // Při lekci a drilu lišta ruší – schová se, zavírá se křížkem.
  document.body.classList.toggle('focus', ['lekce', 'dril', 'vitej'].includes(view) || (view === 'karticky' && !!arg));
  document.body.classList.toggle('chat', view === 'mluveni' && !!arg);
  switch (view) {
    case 'vitej': return viewUvod();
    case 'lekce': return viewSession(mixedQueue(), 'Dnešní lekce', '#/');
    case 'karticky': return arg && DECKS[arg] ? viewSession(buildQueue(arg), DECKS[arg].name, '#/karticky') : viewDecks();
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
