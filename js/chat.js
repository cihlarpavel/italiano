// Konverzace s Giulií: rozpoznání řeči (iPhone) → Claude → předčítání (iPhone).
import Anthropic from 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.128.0/+esm';
import { SCENARE } from './data.js';
import { load, save, settings, logActivity } from './store.js';
import { speak, stopSpeaking, onSpeechActivity, isSpeaking, canListen, listen } from './speech.js';

// Ceny v USD za milion tokenů (vstup / výstup).
export const MODELY = {
  'claude-opus-5': { name: 'Claude Opus 5 – nejlepší (≈ 0,3 Kč za odpověď)', in: 5, out: 25 },
  'claude-sonnet-5': { name: 'Claude Sonnet 5 – levnější (≈ 0,12 Kč)', in: 2, out: 10 },
  'claude-haiku-4-5': { name: 'Claude Haiku 4.5 – nejlevnější (≈ 0,06 Kč)', in: 1, out: 5 },
};
const KC_ZA_USD = 22;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Útrata ----------
const month = () => new Date().toLocaleDateString('sv').slice(0, 7);
export function usageThisMonth() {
  const u = load('usage', {});
  const cur = u.month === month() ? u : { usd: 0, turns: 0 };
  return { czk: cur.usd * KC_ZA_USD, turns: cur.turns };
}
function addUsage(model, usage) {
  const p = MODELY[model] || MODELY['claude-opus-5'];
  const inTok = usage.input_tokens || 0;
  const cw = usage.cache_creation_input_tokens || 0;
  const cr = usage.cache_read_input_tokens || 0;
  const usd = (inTok * p.in + cw * p.in * 1.25 + cr * p.in * 0.1 + (usage.output_tokens || 0) * p.out) / 1e6;
  const u = load('usage', {});
  const cur = u.month === month() ? u : { month: month(), usd: 0, turns: 0 };
  cur.usd += usd; cur.turns++;
  save('usage', cur);
}

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
function systemPrompt(sc) {
  return `Jsi Giulia, 32letá Italka z Bologni. Trpělivě a vlídně mluvíš s Čechem, který se učí italsky a je začátečník (úroveň A1–A2). Rozhovor probíhá nahlas: jeho věty přicházejí z rozpoznávání řeči a tvé odpovědi telefon předčítá.

Situace: ${sc.prompt}

Pravidla pro tvou repliku:
- Mluv jen jednoduchou italštinou: 1–3 krátké věty, nejvýš asi 30 slov, běžná slovní zásoba, hlavně přítomný čas a passato prossimo.
- Skoro vždy skonči jednoduchou otázkou, ať rozhovor pokračuje.
- Buď přirozená a vřelá jako skutečný člověk. Žádné emoji, odrážky ani markdown – text se čte nahlas.
- Když uživatel napíše česky nebo nerozumí, odpověz ještě jednodušší italštinou a klidně mu nabídni, jak by to řekl.
- Nepřítomnost interpunkce a velkých písmen u uživatele neopravuj (je to rozpoznaná řeč). Když věta nedává smysl, může jít o chybu rozpoznání – zeptej se znovu.

Formát odpovědi (přesně dodrž):
<tvá replika v italštině>
---
CZ: <český překlad tvé repliky>
OPRAVA: <jen pokud poslední zpráva uživatele v italštině obsahovala chybu: správná italská věta a krátké vysvětlení česky, nejvýš dvě věty. Pokud byla v pořádku, tento řádek vynech.>`;
}

const START = '(Začni rozhovor – pozdrav a polož první otázku.)';

function parse(raw) {
  const [it, rest = ''] = raw.split(/\n\s*-{3,}\s*\n?/);
  const cz = (rest.match(/^CZ:\s*(.+)$/m) || [])[1] || '';
  const fix = (rest.match(/^OPRAVA:\s*([\s\S]+)$/m) || [])[1] || '';
  return { it: it.trim(), cz: cz.trim(), fix: fix.trim() };
}

// ---------- Obrazovky ----------
export function renderChat(app, id) {
  const sc = SCENARE.find(s => s.id === id);
  if (!sc) return renderScenarios(app);
  renderConversation(app, sc);
}

function renderScenarios(app) {
  const hasKey = !!settings().apiKey;
  app.innerHTML = `
    <div class="avatar-box">${AVATAR}
      <div class="avatar-name"><b>Giulia</b><span>z Bologni · mluví pomalu a opraví tě</span></div>
    </div>
    ${hasKey ? '' : `<div class="card"><b>Nejdřív vlož klíč k Claude API</b>
      <p class="small" style="margin-top:6px">Giulia potřebuje jazykový model. Klíč vytvoříš na console.anthropic.com (API Keys) a vložíš ho v Nastavení. Jedna odpověď stojí kolem 0,3 Kč.</p>
      <a class="btn primary block" href="#/nastaveni">Otevřít nastavení</a></div>`}
    ${canListen ? '' : `<p class="note">Tento prohlížeč neumí rozpoznávat řeč přímo. Mluvit můžeš přes mikrofon na klávesnici iPhonu (diktování) – nastav si italskou klávesnici.</p>`}
    <h2>O čem si popovídáte?</h2>
    ${SCENARE.map(s => {
      const saved = load('chat:' + s.id, []).filter(m => !m.hidden).length;
      return `<a class="tile card" href="#/mluveni/${s.id}"><b>${s.name}</b><span>${s.desc}${saved ? ` · pokračovat (${saved} zpráv)` : ''}</span></a>`;
    }).join('')}`;
  animateAvatar(app.querySelector('.avatar'));
  window.scrollTo(0, 0);
}

function renderConversation(app, sc) {
  const key = 'chat:' + sc.id;
  let history = load(key, []); // {role, text, hidden?}
  let busy = false;

  app.innerHTML = `
    <div class="chat-wrap">
      <div class="avatar-box">${AVATAR}
        <div class="avatar-name" style="flex:1"><b>Giulia</b><span>${esc(sc.name)}</span></div>
        <button class="back" id="restart">Znovu</button>
      </div>
      <div class="msgs" id="msgs"></div>
      <div class="chat-pad"></div>
    </div>
    <div class="composer"><div class="composer-inner">
      <textarea id="txt" rows="1" placeholder="Mluv nebo piš…" autocapitalize="sentences" enterkeyhint="send"></textarea>
      <button class="send" id="send" aria-label="Odeslat">➤</button>
      <button class="mic" id="mic" aria-label="Mluvit">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
      </button>
    </div></div>`;
  animateAvatar(app.querySelector('.avatar'));
  const msgsEl = app.querySelector('#msgs');
  const txt = app.querySelector('#txt');
  const mic = app.querySelector('#mic');

  const scrollDown = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

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
    el.innerHTML = `<div class="it">${esc(p.it) || '<span class="typing">…</span>'}</div>
      ${!streaming && p.cz ? `<div class="cz" ${showCz ? '' : 'hidden'}>${esc(p.cz)}</div>` : ''}
      ${!streaming && p.fix ? `<div class="fix">✏️ ${esc(p.fix)}</div>` : ''}
      ${!streaming ? `<div class="tools">
        <button data-a="say">🔊 Znovu</button><button data-a="slow">🐢 Pomalu</button>
        ${p.cz && !showCz ? '<button data-a="cz">🇨🇿 Překlad</button>' : ''}</div>` : ''}`;
    if (!streaming) {
      el.querySelector('[data-a=say]').onclick = () => { stopSpeaking(); speak(p.it); };
      el.querySelector('[data-a=slow]').onclick = () => { stopSpeaking(); speak(p.it, { rate: 0.65 }); };
      const czBtn = el.querySelector('[data-a=cz]');
      if (czBtn) czBtn.onclick = () => { el.querySelector('.cz').hidden = false; czBtn.remove(); };
    }
  }

  history.filter(m => !m.hidden).forEach(bubble);
  scrollDown();

  async function ask() {
    const s = settings();
    if (!s.apiKey) {
      bubbleNote('Chybí klíč k Claude API – vlož ho v Nastavení.');
      return;
    }
    if (!history.length) history = [{ role: 'user', text: START, hidden: true }];
    busy = true;
    setBusy(true);
    const el = bubble({ role: 'assistant', text: '' });
    fillHer(el, '', true);
    scrollDown();

    const client = new Anthropic({ apiKey: s.apiKey, dangerouslyAllowBrowser: true });
    const model = s.model in MODELY ? s.model : 'claude-opus-5';
    const params = {
      model,
      max_tokens: 8000,
      system: systemPrompt(sc),
      cache_control: { type: 'ephemeral' },
      // Posíláme jen posledních 30 zpráv, ať delší rozhovor nezdražuje.
      messages: trimHistory(history).map(m => ({ role: m.role, content: m.text })),
    };
    if (model !== 'claude-haiku-4-5') params.output_config = { effort: 'low' }; // krátké repliky, rychlá odezva
    if (model === 'claude-opus-5') { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }

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
      const stream = client.beta.messages.stream(params);
      stream.on('text', (_, snapshot) => { fillHer(el, snapshot, true); speakReady(snapshot, false); });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('Model tuto odpověď odmítl. Zkus to formulovat jinak.');
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      speakReady(text, true);
      addUsage(msg.model || model, msg.usage || {});
      history.push({ role: 'assistant', text });
      save(key, history);
      fillHer(el, text);
      logActivity('vety');
    } catch (e) {
      el.remove();
      // Nezodpovězená zpráva uživatele zůstane, další pokus ji pošle znovu.
      bubbleNote(errorText(e), true);
    } finally {
      busy = false;
      setBusy(false);
      scrollDown();
    }
  }

  function trimHistory(h) {
    let t = h.slice(-30);
    while (t.length && t[0].role !== 'user') t = t.slice(1);
    return t;
  }

  function errorText(e) {
    if (e instanceof Anthropic.AuthenticationError) return 'Klíč k API je neplatný. Zkontroluj ho v Nastavení.';
    if (e instanceof Anthropic.PermissionDeniedError) return 'Klíč nemá oprávnění – zkontroluj účet na console.anthropic.com.';
    if (e instanceof Anthropic.RateLimitError) return 'Příliš mnoho dotazů najednou, zkus to za chvilku.';
    if (e instanceof Anthropic.APIConnectionError) return 'Nepodařilo se spojit se serverem. Jsi online?';
    if (e instanceof Anthropic.APIError) {
      if (/credit balance/i.test(e.message)) return 'Na účtu Anthropic došel kredit – dobij ho na console.anthropic.com (Billing).';
      return `Chyba API (${e.status ?? '?'}): ${e.message}`;
    }
    return e?.message || String(e);
  }

  function bubbleNote(text, retry) {
    const el = document.createElement('div');
    el.className = 'note';
    el.innerHTML = esc(text) + (retry ? ' <button class="back" style="padding:0">Zkusit znovu</button>' : '');
    msgsEl.appendChild(el);
    el.querySelector('button')?.addEventListener('click', () => { el.remove(); ask(); });
    scrollDown();
  }

  function setBusy(b) {
    app.querySelector('#send').disabled = b;
    mic.disabled = b;
  }

  function sendUser(text) {
    text = text.trim();
    if (!text || busy) return;
    stopSpeaking();
    history.push({ role: 'user', text });
    save(key, history);
    bubble({ role: 'user', text });
    txt.value = '';
    ask();
  }

  app.querySelector('#send').onclick = () => sendUser(txt.value);
  txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUser(txt.value); } });

  let listening = null;
  mic.onclick = async () => {
    if (!canListen) { txt.focus(); return; }
    if (listening) { listening.stop(); return; }
    stopSpeaking();
    mic.classList.add('live');
    txt.value = '';
    txt.placeholder = 'Poslouchám… (klepni znovu pro ukončení)';
    try {
      listening = listen({ onInterim: t => (txt.value = t) });
      const said = await listening.promise;
      if (said) sendUser(said);
    } catch (err) {
      bubbleNote(err === 'not-allowed' || err === 'service-not-allowed'
        ? 'Mikrofon není povolený. Povol ho v Nastavení iPhonu → Safari → Mikrofon, nebo použij diktování na klávesnici.'
        : `Rozpoznání řeči selhalo (${err}). Zkus to znovu nebo napiš text.`);
    } finally {
      listening = null;
      mic.classList.remove('live');
      txt.placeholder = 'Mluv nebo piš…';
    }
  };

  app.querySelector('#restart').onclick = () => {
    if (busy) return;
    stopSpeaking();
    history = [{ role: 'user', text: START, hidden: true }];
    save(key, history);
    msgsEl.innerHTML = '';
    ask();
  };

  // Nový rozhovor začíná Giulia.
  if (!settings().apiKey) {
    bubbleNote('Chybí klíč k Claude API – vlož ho v Nastavení.');
  } else if (!history.length) {
    history = [{ role: 'user', text: START, hidden: true }];
    save(key, history);
    ask();
  } else if (history[history.length - 1].role === 'user') {
    bubbleNote('Poslední zpráva zůstala bez odpovědi.', true);
  }
}
