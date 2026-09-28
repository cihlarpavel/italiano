// Konverzace s Giulií: rozpoznání řeči (iPhone) → Claude → předčítání (iPhone).
import { client, modelParams, addUsage, errorText } from './claude.js';
export { MODELY, usageThisMonth } from './claude.js';
import { SCENARE } from './data.js';
import { load, save, settings, logActivity } from './store.js';
import { toast, ICON, ic } from './ui.js';
import { speak, stopSpeaking, onSpeechActivity, isSpeaking, canListen, listen } from './speech.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Avatar ----------
const AVATAR = `
<svg class="avatar" viewBox="0 0 120 120" aria-label="Giulia">
  <defs><clipPath id="av-c"><circle cx="60" cy="60" r="58"/></clipPath></defs>
  <g clip-path="url(#av-c)">
    <rect width="120" height="120" fill="#f1d9c7"/>
    <path d="M0 120 L0 104 Q60 86 120 104 L120 120Z" fill="#5a7d4f"/>
    <path d="M28 70 Q18 30 50 20 Q80 10 94 36 Q104 58 92 92 Q86 70 84 52 Q60 44 40 52 Q34 72 28 92 Q22 84 28 70Z" fill="#3b2418"/>
    <rect x="52" y="78" width="16" height="16" rx="6" fill="#d9a07f"/>
    <ellipse cx="60" cy="60" rx="24" ry="28" fill="#e7b392"/>
    <path d="M36 52 Q44 30 64 32 Q82 34 86 54 Q74 42 58 42 Q46 44 36 52Z" fill="#3b2418"/>
    <circle cx="36" cy="66" r="2.5" fill="#d9b24a"/><circle cx="84" cy="66" r="2.5" fill="#d9b24a"/>
    <g id="av-eyes">
      <ellipse cx="50" cy="58" rx="3.2" ry="3.6" fill="#2a1a12"/>
      <ellipse cx="70" cy="58" rx="3.2" ry="3.6" fill="#2a1a12"/>
    </g>
    <path d="M44 51 Q50 48 55 51 M65 51 Q70 48 76 51" stroke="#3b2418" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M60 60 Q58 67 61 69" stroke="#c98d6c" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <circle cx="45" cy="70" r="4" fill="#e59a86" opacity=".35"/><circle cx="75" cy="70" r="4" fill="#e59a86" opacity=".35"/>
    <path id="av-smile" d="M52 76 Q60 81 68 76" stroke="#b5524a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse id="av-mouth" cx="60" cy="77" rx="6" ry="1" fill="#7a2e2a" stroke="#b5524a" stroke-width="1.6" opacity="0"/>
  </g>
</svg>`;

function animateAvatar(root) {
  const mouth = root.querySelector('#av-mouth');
  const smile = root.querySelector('#av-smile');
  const eyes = root.querySelector('#av-eyes');
  let open = 0, pulse = 0, nextBlink = performance.now() + 2500, raf;
  const off = onSpeechActivity(type => { if (type === 'boundary' || type === 'start') pulse = 1; });
  const tick = t => {
    if (!root.isConnected) { off(); return; }
    const speaking = isSpeaking();
    pulse *= 0.86;
    const target = speaking ? 0.25 + 0.45 * Math.abs(Math.sin(t / 70)) * (0.6 + 0.4 * Math.sin(t / 230)) + 0.3 * pulse : 0;
    open += (target - open) * 0.35;
    mouth.setAttribute('ry', (1 + 6 * open).toFixed(2));
    mouth.setAttribute('opacity', open > 0.05 ? 1 : 0);
    smile.setAttribute('opacity', open > 0.05 ? 0 : 1);
    if (t > nextBlink) {
      eyes.style.transform = 'scaleY(0.1)';
      eyes.style.transformOrigin = '60px 58px';
      setTimeout(() => (eyes.style.transform = ''), 130);
      nextBlink = t + 2500 + Math.random() * 3000;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

// ---------- Prompt ----------
const DELKA = { kratke: '1–2 krátké věty, nejvýš asi 25 slov', stredni: '2–3 krátké věty, nejvýš asi 40 slov', delsi: '3–5 vět, nejvýš asi 70 slov' };
const OPRAVY = {
  vse: 'jen pokud poslední zpráva uživatele v italštině obsahovala chybu',
  dulezite: 'jen pokud poslední zpráva uživatele obsahovala chybu, která mění smysl nebo je hrubá; drobnosti (členy, přízvuky, drobná shoda) přejdi',
};

// Slovíčka, která se uživatel právě učí (krabičky 1–3), ať je Giulia používá v kontextu.
function uciSe() {
  const st = load('srs', {});
  return Object.entries(st).filter(([, v]) => v.box >= 1 && v.box <= 3).map(([id]) => id.split(':').slice(1).join(':')).slice(0, 40);
}

function systemPrompt(sc) {
  const s = settings();
  const slova = uciSe();
  return `Jsi Giulia, 32letá Italka z Boloně. Trpělivě a vlídně mluvíš s Čechem, který se učí italsky (úroveň ${s.giuliaLevel}). Svou italštinu přizpůsob této úrovni. Rozhovor probíhá nahlas: jeho věty přicházejí z rozpoznávání řeči a tvé odpovědi telefon předčítá.

Situace: ${sc.prompt}

Pravidla pro tvou repliku:
- Mluv jednoduchou italštinou: ${DELKA[s.giuliaLength] || DELKA.kratke}, běžná slovní zásoba.
- Skoro vždy skonči jednoduchou otázkou, ať rozhovor pokračuje.
- Buď přirozená a vřelá jako skutečný člověk. Žádné emoji, odrážky ani markdown – text se čte nahlas.
- Když uživatel napíše česky nebo nerozumí, odpověz ještě jednodušší italštinou a řekni mu, jak by to řekl italsky.
- Nepřítomnost interpunkce a velkých písmen u uživatele neopravuj (je to rozpoznaná řeč). Když věta nedává smysl, může jít o chybu rozpoznání – zeptej se znovu.
${slova.length ? `\nUživatel se právě učí tato slova a fráze. Když se to hodí, přirozeně je použij, ať je slyší v kontextu: ${slova.join(', ')}\n` : ''}${s.giuliaPokyny.length ? `\nPřání uživatele (dodržuj je, mají přednost před pravidly výše, formát odpovědi ale zachovej):\n${s.giuliaPokyny.map(p => '- ' + p).join('\n')}\n` : ''}
Formát odpovědi (přesně dodrž, každý údaj na samostatném řádku):
<tvá replika v italštině>
---
CZ: <český překlad tvé repliky>
${s.giuliaCorrections === 'zadne' ? '' : `OPRAVA: <${OPRAVY[s.giuliaCorrections] || OPRAVY.vse}: správná italská věta a krátké vysvětlení česky, nejvýš dvě věty. Jinak tento řádek vynech.>\n`}${s.giuliaHints ? 'NAPOVEDA: <dvě nebo tři krátké odpovědi, které by uživatel mohl na tvou otázku říct, jednoduchou italštinou, ve tvaru „italsky = česky“, oddělené znakem |>' : ''}`.trim();
}

const START = '(Začni rozhovor – pozdrav a polož první otázku.)';

function parse(raw) {
  const [it, rest = ''] = raw.split(/\n\s*-{3,}\s*\n?/);
  const out = { it: it.trim(), cz: '', fix: '', hints: [] };
  let cur = null;
  for (const line of rest.split('\n')) {
    const m = line.match(/^(CZ|OPRAVA|NAPOVEDA|NÁPOVĚDA):\s*(.*)$/);
    if (m) { cur = { CZ: 'cz', OPRAVA: 'fix' }[m[1]] || 'hints'; out[cur === 'hints' ? '_h' : cur] = m[2]; }
    else if (cur && cur !== 'hints' && line.trim()) out[cur] += ' ' + line.trim();
  }
  out.hints = (out._h || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 3).map(s => {
    const [i, c = ''] = s.split(/\s+=\s+/);
    return { it: i.replace(/^["„“]|["“”]$/g, '').trim(), cs: c.trim() };
  });
  out.cz = out.cz.trim(); out.fix = out.fix.trim();
  return out;
}

// ---------- Obrazovky ----------
export function renderChat(app, id) {
  const sc = SCENARE.find(s => s.id === id);
  if (!sc) return renderScenarios(app);
  renderConversation(app, sc);
}

const KEY_CARD = `<a class="card setup-card" href="#/nastaveni">${ic('sparkles', 'violet')}
  <div><b>Giulia potřebuje klíč k Claude API</b><span>Nastavení na 5 minut, pak jedna odpověď stojí kolem 0,3 Kč.</span></div></a>`;

const IKONY = { volne: '☕️', seznameni: '👋', kavarna: '🥐', nadrazi: '🚆', hotel: '🏨', trh: '🍅', vcera: '⏪' };

function renderScenarios(app) {
  const scen = SCENARE.map((s, i) => {
    const saved = load('chat:' + s.id, []).filter(m => !m.hidden).length;
    return `<a class="list-row" href="#/mluveni/${s.id}">
      <span class="emoji-ic">${IKONY[s.id] || '💬'}</span>
      <div class="grow"><b>${s.name}${i === 1 && !saved ? ' <span class="pill ok">na začátek</span>' : ''}</b>
      <span class="muted small">${saved ? `Pokračovat · ${saved} zpráv` : s.desc}</span></div>
      ${ICON.chevron}</a>`;
  }).join('');
  app.innerHTML = `
    <header class="page-head"><h1>Giulia</h1></header>
    <section class="hero green giulia-hero">
      ${AVATAR}
      <div><h2>Ciao, sono Giulia!</h2><p>Italka z Boloně. Mluví pomalu, přeloží ti, co řekla, a opraví tvé chyby.</p></div>
    </section>
    ${settings().apiKey ? '' : KEY_CARD}
    <div class="steps-row">
      <div><span>1</span>Vyber situaci</div><div><span>2</span>Poslouchej</div><div><span>3</span>Odpověz hlasem</div>
    </div>
    <h2>O čem si popovídáte?</h2>
    <div class="card list">${scen}</div>`;
  animateAvatar(app.querySelector('.avatar'));
  window.scrollTo(0, 0);
}

const MIC_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SEND_SVG = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
const STOP_SVG = '<svg width="24" height="24" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';

function renderConversation(app, sc) {
  const key = 'chat:' + sc.id;
  let history = load(key, []); // {role, text, hidden?}
  let state = 'idle'; // idle | listening | thinking
  let listening = null;

  app.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-head">
        <a class="icon-btn plain" href="#/mluveni" aria-label="Zpět">${ICON.back}</a>
        <button class="avatar-btn" id="av" aria-label="Zastavit nebo zopakovat">${AVATAR}</button>
        <div class="avatar-name" style="flex:1"><b>Giulia · ${esc(sc.name)}</b><span id="status"></span></div>
        <a class="icon-btn plain" href="#/prizpusobit" aria-label="Přizpůsobit Giulii">${ICON.sparkles}</a>
        <button class="back" id="restart">Nový</button>
      </div>
      <div class="msgs" id="msgs"></div>
      <div class="chat-pad"></div>
    </div>
    <div class="composer">
      <div class="hints" id="hints"></div>
      <div class="composer-inner">
        <textarea id="txt" rows="1" placeholder="Napiš italsky, nebo česky…" autocapitalize="sentences" enterkeyhint="send"></textarea>
        <button class="mic" id="act" aria-label="Mluvit">${MIC_SVG}</button>
      </div>
    </div>`;
  animateAvatar(app.querySelector('.avatar'));
  const msgsEl = app.querySelector('#msgs');
  const txt = app.querySelector('#txt');
  const act = app.querySelector('#act');
  const statusEl = app.querySelector('#status');
  const hintsEl = app.querySelector('#hints');

  const scrollDown = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

  // Jedno tlačítko: prázdné pole = mikrofon, s textem = odeslat, při poslechu = stop.
  function refresh() {
    const speaking = isSpeaking();
    const typed = !!txt.value.trim() && state !== 'listening';
    act.innerHTML = state === 'listening' ? STOP_SVG : typed ? SEND_SVG : MIC_SVG;
    act.classList.toggle('live', state === 'listening');
    act.setAttribute('aria-label', state === 'listening' ? 'Ukončit a odeslat' : typed ? 'Odeslat' : 'Mluvit');
    act.disabled = state === 'thinking' || !settings().apiKey;
    statusEl.textContent = !settings().apiKey ? 'Chybí klíč k API'
      : state === 'listening' ? '🎤 Poslouchám… až domluvíš, klepni na ■'
      : state === 'thinking' ? 'Přemýšlí…'
      : speaking ? 'Mluví · klepni na ni pro zastavení'
      : canListen ? 'Tvoje řada: klepni na 🎤 a mluv' : 'Tvoje řada: napiš nebo diktuj přes klávesnici';
    statusEl.className = state === 'listening' ? 'live' : '';
  }
  const offSpeech = onSpeechActivity(() => setTimeout(() => app.contains(act) ? refresh() : offSpeech(), 50));

  function bubble(m) {
    const el = document.createElement('div');
    if (m.role === 'user') {
      el.className = 'msg me';
      el.textContent = m.text;
    } else {
      el.className = 'msg her';
      fillHer(el, m.text);
    }
    msgsEl.appendChild(el);
    return el;
  }

  function fillHer(el, raw, streaming = false) {
    const p = parse(raw);
    const showCz = settings().showCz;
    el.innerHTML = `<div class="it">${esc(p.it) || '<span class="typing"><i></i><i></i><i></i></span>'}</div>
      ${!streaming && p.cz ? `<div class="cz" ${showCz ? '' : 'hidden'}>${esc(p.cz)}</div>` : ''}
      ${!streaming && p.fix ? `<div class="fix"><b>✏️ Oprava</b><br>${esc(p.fix)}</div>` : ''}
      ${!streaming ? `<div class="tools">
        <button data-a="say">🔊 Znovu</button><button data-a="slow">🐢 Pomalu</button>
        ${p.cz && !showCz ? '<button data-a="cz">🇨🇿 Překlad</button>' : ''}</div>` : ''}`;
    if (!streaming) {
      el.querySelector('[data-a=say]').onclick = () => { stopSpeaking(); speak(p.it); };
      el.querySelector('[data-a=slow]').onclick = () => { stopSpeaking(); speak(p.it, { rate: 0.65 }); };
      const czBtn = el.querySelector('[data-a=cz]');
      if (czBtn) czBtn.onclick = () => { el.querySelector('.cz').hidden = false; czBtn.remove(); };
    }
    return p;
  }

  function showHints(hints) {
    if (!settings().giuliaHints) hints = [];
    hintsEl.innerHTML = hints.length ? `<span class="hints-label">💡 Můžeš říct:</span>` + hints.map((h, i) =>
      `<button class="hint" data-i="${i}"><b>${esc(h.it)}</b>${h.cs ? `<span>${esc(h.cs)}</span>` : ''}</button>`).join('') : '';
    hintsEl.querySelectorAll('.hint').forEach(b => b.onclick = () => {
      const h = hints[+b.dataset.i];
      // Nápověda se nepošle sama – uživatel ji má zkusit vyslovit, nebo odeslat.
      txt.value = h.it;
      stopSpeaking();
      speak(h.it, { rate: 0.75 });
      refresh();
    });
  }

  history.filter(m => !m.hidden).forEach(bubble);
  const lastHer = [...history].reverse().find(m => m.role === 'assistant');
  if (lastHer && history[history.length - 1].role === 'assistant') showHints(parse(lastHer.text).hints);
  scrollDown();

  async function ask() {
    const s = settings();
    if (!s.apiKey) return;
    if (!history.length) history = [{ role: 'user', text: START, hidden: true }];
    state = 'thinking';
    showHints([]);
    refresh();
    const el = bubble({ role: 'assistant', text: '' });
    fillHer(el, '', true);
    scrollDown();

    const params = {
      ...modelParams('low'), // krátké repliky, rychlá odezva
      max_tokens: 8000,
      system: systemPrompt(sc),
      cache_control: { type: 'ephemeral' },
      // Posíláme jen posledních 30 zpráv, ať delší rozhovor nezdražuje.
      messages: trimHistory(history).map(m => ({ role: m.role, content: m.text })),
    };

    let spoken = 0;
    const speakReady = (snapshot, final) => {
      const sep = snapshot.search(/\n\s*-{3,}/);
      const itPart = sep >= 0 ? snapshot.slice(0, sep) : snapshot;
      let end = itPart.length;
      if (sep < 0 && !final) {
        // Předčítej jen celé věty, zbytek počká na další text.
        const m = [...itPart.slice(spoken).matchAll(/[.!?…]+["»”]?(?=\s)/g)].pop();
        end = m ? spoken + m.index + m[0].length : spoken;
      }
      const chunk = itPart.slice(spoken, end);
      if (chunk.trim()) speak(chunk.trim());
      spoken = end;
    };

    try {
      const stream = client().beta.messages.stream(params);
      stream.on('text', (_, snapshot) => { fillHer(el, snapshot, true); speakReady(snapshot, false); });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('Model tuto odpověď odmítl. Zkus to formulovat jinak.');
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      speakReady(text, true);
      addUsage(msg.model || params.model, msg.usage || {});
      history.push({ role: 'assistant', text });
      save(key, history);
      showHints(fillHer(el, text).hints);
      logActivity('vety');
    } catch (e) {
      el.remove();
      // Nezodpovězená zpráva uživatele zůstane, další pokus ji pošle znovu.
      bubbleNote(errorText(e), true);
    } finally {
      state = 'idle';
      refresh();
      scrollDown();
    }
  }

  function trimHistory(h) {
    let t = h.slice(-30);
    while (t.length && t[0].role !== 'user') t = t.slice(1);
    return t;
  }

  function bubbleNote(text, retry) {
    const el = document.createElement('div');
    el.className = 'note';
    el.innerHTML = esc(text) + (retry ? ' <button class="back" style="padding:0">Zkusit znovu</button>' : '');
    msgsEl.appendChild(el);
    el.querySelector('button')?.addEventListener('click', () => { el.remove(); ask(); });
    scrollDown();
  }

  function sendUser(text) {
    text = text.trim();
    if (!text || state === 'thinking') return;
    stopSpeaking();
    history.push({ role: 'user', text });
    save(key, history);
    bubble({ role: 'user', text });
    txt.value = '';
    autoGrow();
    ask();
  }

  async function startListening() {
    stopSpeaking();
    state = 'listening';
    txt.value = '';
    refresh();
    try {
      listening = listen({ onInterim: t => { txt.value = t; autoGrow(); } });
      const said = await listening.promise;
      state = 'idle';
      if (said) sendUser(said);
      else toast('Nic jsem neslyšela. Zkus to znovu a mluv blíž k telefonu.');
    } catch (err) {
      state = 'idle';
      bubbleNote(err === 'not-allowed' || err === 'service-not-allowed'
        ? 'Mikrofon není povolený. Povol ho v Nastavení iPhonu → Safari → Mikrofon, nebo použij diktování na klávesnici.'
        : `Rozpoznání řeči selhalo (${err}). Zkus to znovu nebo napiš text.`);
    } finally {
      listening = null;
      refresh();
    }
  }

  act.onclick = () => {
    if (state === 'listening') return listening?.stop();
    if (txt.value.trim()) return sendUser(txt.value);
    if (!canListen) { txt.focus(); toast('Klepni na 🎤 na klávesnici a diktuj italsky'); return; }
    startListening();
  };

  const autoGrow = () => { txt.style.height = 'auto'; txt.style.height = Math.min(txt.scrollHeight, 120) + 'px'; };
  txt.addEventListener('input', () => { autoGrow(); refresh(); });
  txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUser(txt.value); } });

  // Klepnutí na Giulii: když mluví, zastaví ji; jinak zopakuje poslední větu.
  app.querySelector('#av').onclick = () => {
    if (isSpeaking()) return stopSpeaking();
    const last = [...history].reverse().find(m => m.role === 'assistant');
    if (last) speak(parse(last.text).it);
  };

  app.querySelector('#restart').onclick = () => {
    if (state === 'thinking' || !settings().apiKey) return;
    if (history.some(m => !m.hidden) && !confirm('Začít nový rozhovor? Tenhle se smaže.')) return;
    stopSpeaking();
    history = [{ role: 'user', text: START, hidden: true }];
    save(key, history);
    msgsEl.innerHTML = '';
    ask();
  };

  refresh();
  // Nový rozhovor začíná Giulia.
  if (!settings().apiKey) {
    msgsEl.innerHTML = KEY_CARD;
  } else if (!history.length) {
    history = [{ role: 'user', text: START, hidden: true }];
    save(key, history);
    ask();
  } else if (history[history.length - 1].role === 'user') {
    bubbleNote('Poslední zpráva zůstala bez odpovědi.', true);
  }
}
