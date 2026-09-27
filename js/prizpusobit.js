// Přizpůsobení aplikace přáním v přirozené řeči („dávej mi častěji opakování“).
// Claude převede přání na změny povolených parametrů, uživatel je vidí předem a potvrdí.
import Anthropic from 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.128.0/+esm';
import { load, save, settings, setSettings, DEFAULT_SETTINGS } from './store.js';
import { MODELY, addUsage } from './chat.js';
import { canListen, listen, stopSpeaking } from './speech.js';
import { toast } from './ui.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (min, max, int) => v => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? Math.min(max, Math.max(min, int ? Math.round(n) : Math.round(n * 100) / 100)) : undefined; };
const oneOf = list => v => (list.includes(v) ? v : undefined);
const bool = v => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : undefined);

const ANO_NE = v => (v ? 'ano' : 'ne');

// Jediné parametry, které smí přání změnit. Popis jde i do promptu pro Claude.
export const PARAMS = {
  newPerDay: { label: 'Nových kartiček denně (na balíček)', popis: 'celé číslo 0–50', check: num(0, 50, true) },
  goal: { label: 'Denní cíl (kartiček)', popis: 'celé číslo 5–300', check: num(5, 300, true) },
  intervalScale: { label: 'Rozestupy opakování', popis: 'násobek intervalů 0.3–3; 1 = výchozí, 0.5 = karty se vracejí 2× dřív, 2 = 2× později', check: num(0.3, 3),
    show: v => (v === 1 ? 'výchozí' : v < 1 ? `karty se vrací ${fmt(1 / v)}× dřív` : `karty se vrací ${fmt(v)}× později`) },
  extraReview: { label: 'Procvičení naučeného navíc v lekci', popis: 'celé číslo 0–50: kolik už naučených (zatím nesplatných) karet přidat do dnešní lekce, nejdřív ty nejslabší', check: num(0, 50, true),
    show: v => (v ? `${v} karet` : 'nic') },
  direction: { label: 'Směr kartiček', popis: '"it-cs" (italsky→česky), "cs-it" (česky→italsky) nebo "mix" (střídavě)', check: oneOf(['it-cs', 'cs-it', 'mix']),
    show: v => ({ 'it-cs': 'italsky → česky', 'cs-it': 'česky → italsky', mix: 'střídavě' }[v]) },
  autoSpeak: { label: 'Kartičky se samy přečtou nahlas', popis: 'true/false', check: bool, show: ANO_NE },
  rate: { label: 'Rychlost předčítání', popis: 'číslo 0.5–1.3; 1 = normální tempo, výchozí 0.9', check: num(0.5, 1.3) },
  showCz: { label: 'Český překlad Giuliiných vět hned', popis: 'true/false', check: bool, show: ANO_NE },
  giuliaLevel: { label: 'Úroveň Giuliiny italštiny', popis: '"A1", "A1–A2", "A2", "B1"', check: oneOf(['A1', 'A1–A2', 'A2', 'B1']) },
  giuliaLength: { label: 'Délka Giuliiných replik', popis: '"kratke" (1–2 věty), "stredni" (2–3 věty), "delsi" (3–5 vět)', check: oneOf(['kratke', 'stredni', 'delsi']),
    show: v => ({ kratke: 'krátké', stredni: 'střední', delsi: 'delší' }[v]) },
  giuliaCorrections: { label: 'Opravy chyb', popis: '"vse" (každou chybu), "dulezite" (jen chyby, které mění smysl nebo jsou hrubé), "zadne"', check: oneOf(['vse', 'dulezite', 'zadne']),
    show: v => ({ vse: 'všechny', dulezite: 'jen důležité', zadne: 'žádné' }[v]) },
  giuliaHints: { label: 'Nápovědy „Můžeš říct“', popis: 'true/false', check: bool, show: ANO_NE },
  model: { label: 'Model', popis: Object.keys(MODELY).map(k => `"${k}"`).join(', ') + ' (od nejlepšího po nejlevnější)', check: oneOf(Object.keys(MODELY)),
    show: v => MODELY[v]?.name.split(' ·')[0] },
};
const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
export const showVal = (k, v) => (PARAMS[k].show ? PARAMS[k].show(v) : String(v).replace('.', ','));

const SCHEMA = {
  type: 'object',
  properties: {
    zmeny: {
      type: 'array',
      items: {
        type: 'object',
        properties: { klic: { type: 'string', enum: Object.keys(PARAMS) }, hodnota: { type: 'string' } },
        required: ['klic', 'hodnota'], additionalProperties: false,
      },
    },
    pridat_pokyny: { type: 'array', items: { type: 'string' } },
    odebrat_pokyny: { type: 'array', items: { type: 'string' } },
    mimo_moznosti: { type: 'array', items: { type: 'string' } },
    vysvetleni: { type: 'string' },
  },
  required: ['zmeny', 'pridat_pokyny', 'odebrat_pokyny', 'mimo_moznosti', 'vysvetleni'],
  additionalProperties: false,
};

function systemPokyny() {
  const s = settings();
  return `Jsi pomocník v osobní aplikaci na výuku italštiny (Čech, začátečník). Uživatel ti česky napíše přání, jak má aplikace fungovat jinak. Převeď ho na změny nastavení.

Aplikace má: kartičky s opakováním v intervalech (Leitner: 0, 1, 3, 7, 14, 30, 60 dní) ve třech balíčcích (slovíčka, vazby, fráze), denní lekci, dril časování sloves a konverzaci nahlas s avatarkou Giulií (jazykový model).

Parametry, které smíš měnit (klíč: význam – povolené hodnoty – aktuální hodnota):
${Object.entries(PARAMS).map(([k, p]) => `- ${k}: ${p.label} – ${p.popis} – aktuálně ${JSON.stringify(s[k])}`).join('\n')}

Vlastní pokyny pro Giulii (aktuálně): ${s.giuliaPokyny.length ? s.giuliaPokyny.map(p => `„${p}“`).join('; ') : 'žádné'}

Pravidla:
- Měň jen to, co z přání plyne. Hodnoty zapisuj jako text (čísla s tečkou, true/false, přesné řetězce z výčtu).
- Opakování: „častěji opakovat naučené“ = nižší intervalScale a/nebo extraReview, případně méně nových kartiček.
- Chování Giulie řeš přednostně parametry giulia*. Co parametry nepokryjí (témata, styl, zaměření na gramatiku, oslovení…), přidej jako krátký pokyn v češtině adresovaný Giulii do pridat_pokyny.
- Pokud přání ruší nebo mění existující pokyn, dej jeho přesné znění do odebrat_pokyny.
- Co nejde udělat žádným parametrem ani pokynem (nová funkce, nový obsah kartiček, změna vzhledu…), popiš jednou větou do mimo_moznosti.
- vysvetleni: 1–2 věty česky, tykej, co se změní a proč.`;
}

async function navrh(text) {
  const s = settings();
  const client = new Anthropic({ apiKey: s.apiKey, dangerouslyAllowBrowser: true });
  const model = s.model in MODELY ? s.model : 'claude-opus-5';
  const params = {
    model,
    max_tokens: 16000,
    system: systemPokyny(),
    messages: [{ role: 'user', content: text }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
  };
  if (model !== 'claude-haiku-4-5') params.output_config.effort = 'medium';
  if (model === 'claude-opus-5') { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }
  const msg = await client.beta.messages.create(params);
  addUsage(msg.model || model, msg.usage || {});
  if (msg.stop_reason === 'refusal') throw new Error('Model tento požadavek odmítl. Zkus ho formulovat jinak.');
  const raw = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const out = JSON.parse(raw);

  // Validace: nikdy nevěř hodnotám slepě, drž je v povolených mezích.
  const zmeny = [];
  for (const { klic, hodnota } of out.zmeny || []) {
    const p = PARAMS[klic];
    const v = p?.check(hodnota);
    if (v === undefined || v === s[klic]) continue;
    zmeny.push({ klic, od: s[klic], na: v });
  }
  const odebrat = (out.odebrat_pokyny || []).filter(p => s.giuliaPokyny.includes(p));
  const pridat = (out.pridat_pokyny || []).map(p => p.trim()).filter(p => p && !s.giuliaPokyny.includes(p));
  return { text, zmeny, pridat, odebrat, mimo: out.mimo_moznosti || [], vysvetleni: out.vysvetleni || '' };
}

function pouzij(n) {
  const s = settings();
  const patch = Object.fromEntries(n.zmeny.map(z => [z.klic, z.na]));
  patch.giuliaPokyny = [...s.giuliaPokyny.filter(p => !n.odebrat.includes(p)), ...n.pridat];
  const log = load('upravy', []);
  log.unshift({ datum: new Date().toISOString(), text: n.text, pred: Object.fromEntries(Object.keys(patch).map(k => [k, s[k]])), patch });
  save('upravy', log.slice(0, 30));
  if (n.mimo.length) save('prani', [...load('prani', []), ...n.mimo.map(t => ({ t, datum: new Date().toISOString() }))]);
  setSettings(patch);
}

function vratPosledni() {
  const log = load('upravy', []);
  const last = log.shift();
  if (!last) return;
  setSettings(last.pred);
  save('upravy', log);
}

const PRIKLADY = [
  'Dávej mi častěji opakování toho, co už jsme se učili',
  'Zpomal předčítání',
  'Giulia ať opravuje jen důležité chyby',
  'V rozhovorech víc minulého času',
  'Méně nových slovíček, ať to stíhám',
  'Kartičky střídavě oběma směry',
];

export function renderPrizpusobit(app) {
  const s = settings();
  const log = load('upravy', []);
  const prani = load('prani', []);
  const zmeneno = Object.keys(PARAMS).filter(k => s[k] !== DEFAULT_SETTINGS[k]);
  app.innerHTML = `
    <button class="back" onclick="history.back()">‹ Zpět</button>
    <h1>✨ Přizpůsobit</h1>
    <p class="muted">Napiš nebo řekni česky, co chceš jinak. Ukážu ti, co změním, a použiju to až po tvém potvrzení.</p>
    ${s.apiKey ? '' : '<p class="note">Potřebuje klíč k Claude API (Nastavení). Jedna úprava stojí zhruba 0,1–0,3 Kč.</p>'}
    <div class="card">
      <textarea id="prani" rows="3" placeholder="Např. dávej mi častěji opakování toho, co už jsme se učili"></textarea>
      <div class="row" style="margin-top:10px">
        ${canListen ? '<button class="btn" id="dikt">🎤 Nadiktovat</button>' : ''}
        <button class="btn primary" id="odeslat" ${s.apiKey ? '' : 'disabled'}>Navrhnout změny</button>
      </div>
      <p class="muted small" style="margin:14px 0 6px">Nápady:</p>
      <div class="chips scroll">${PRIKLADY.map(p => `<button class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    </div>
    <div id="navrh"></div>

    <h2>Co je teď upraveno</h2>
    <div class="card">
      ${zmeneno.length || s.giuliaPokyny.length ? '' : '<p class="muted small" style="margin:0">Zatím nic, vše je ve výchozím nastavení.</p>'}
      ${zmeneno.map(k => `<div class="list-row"><div><b>${PARAMS[k].label}</b><br><span class="muted small">${esc(showVal(k, s[k]))} (výchozí: ${esc(showVal(k, DEFAULT_SETTINGS[k]))})</span></div>
        <button class="icon-btn" data-reset="${k}" aria-label="Vrátit na výchozí">↺</button></div>`).join('')}
      ${s.giuliaPokyny.map((p, i) => `<div class="list-row"><div><span class="muted small">Pokyn pro Giulii</span><br><b>${esc(p)}</b></div>
        <button class="icon-btn" data-del="${i}" aria-label="Smazat pokyn">×</button></div>`).join('')}
      ${log.length ? `<button class="btn block" id="undo" style="margin-top:12px">↶ Vrátit poslední úpravu</button>` : ''}
    </div>

    ${prani.length ? `
    <h2>Přání na další verzi</h2>
    <div class="card">
      <p class="muted small" style="margin-top:0">Tohle aplikace zatím neumí. Zkopíruj seznam a pošli ho Claude Code, ten funkce doprogramuje.</p>
      ${prani.map((p, i) => `<div class="list-row"><div class="small">${esc(p.t)}</div><button class="icon-btn" data-pdel="${i}" aria-label="Smazat">×</button></div>`).join('')}
      <button class="btn block" id="copy" style="margin-top:12px">📋 Zkopírovat seznam</button>
    </div>` : ''}
  `;
  const $ = id => app.querySelector('#' + id);
  const area = $('prani');
  const rerender = () => renderPrizpusobit(app);

  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { area.value = b.dataset.p; area.focus(); });
  app.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { setSettings({ [b.dataset.reset]: DEFAULT_SETTINGS[b.dataset.reset] }); toast('Vráceno na výchozí'); rerender(); });
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const p = [...settings().giuliaPokyny]; p.splice(+b.dataset.del, 1); setSettings({ giuliaPokyny: p }); toast('Pokyn smazán'); rerender(); });
  app.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { const p = load('prani', []); p.splice(+b.dataset.pdel, 1); save('prani', p); rerender(); });
  $('undo') && ($('undo').onclick = () => { vratPosledni(); toast('Poslední úprava vrácena'); rerender(); });
  $('copy') && ($('copy').onclick = async () => {
    const text = 'Přání k aplikaci Italiano:\n' + load('prani', []).map(p => '- ' + p.t).join('\n');
    try { await navigator.clipboard.writeText(text); toast('Zkopírováno'); } catch { prompt('Zkopíruj si text:', text); }
  });
  $('dikt') && ($('dikt').onclick = async () => {
    stopSpeaking();
    const b = $('dikt');
    b.textContent = '🎤 Poslouchám…';
    try { const t = await listen({ lang: 'cs-CZ', onInterim: t => (area.value = t) }).promise; if (t) area.value = t; }
    catch { toast('Diktování se nepovedlo, napiš to prosím'); }
    b.textContent = '🎤 Nadiktovat';
  });

  $('odeslat').onclick = async () => {
    const text = area.value.trim();
    if (!text) { area.focus(); return; }
    const box = $('navrh');
    $('odeslat').disabled = true;
    box.innerHTML = '<div class="card"><span class="typing"><i></i><i></i><i></i></span> Promýšlím, co změnit…</div>';
    try {
      const n = await navrh(text);
      const nic = !n.zmeny.length && !n.pridat.length && !n.odebrat.length;
      box.innerHTML = `<div class="card setup">
        <b>Návrh</b>
        <p class="small" style="margin:6px 0 10px">${esc(n.vysvetleni)}</p>
        ${n.zmeny.map(z => `<div class="diff"><span>${PARAMS[z.klic].label}</span><b>${esc(showVal(z.klic, z.od))} → ${esc(showVal(z.klic, z.na))}</b></div>`).join('')}
        ${n.pridat.map(p => `<div class="diff"><span>Nový pokyn pro Giulii</span><b>+ ${esc(p)}</b></div>`).join('')}
        ${n.odebrat.map(p => `<div class="diff"><span>Odebrat pokyn</span><b>− ${esc(p)}</b></div>`).join('')}
        ${n.mimo.length ? `<p class="note small" style="margin-top:10px">Tohle zatím nastavit nejde, uložím to do přání na další verzi:<br>${n.mimo.map(esc).join('<br>')}</p>` : ''}
        <div class="row" style="margin-top:12px">
          <button class="btn" id="zrusit">Zrušit</button>
          <button class="btn primary" id="pouzit">${nic ? 'Uložit přání' : 'Použít'}</button>
        </div></div>`;
      if (nic && !n.mimo.length) $('pouzit').hidden = true;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('zrusit').onclick = () => { box.innerHTML = ''; $('odeslat').disabled = false; };
      $('pouzit').onclick = () => { pouzij(n); toast(nic ? 'Přání uloženo' : 'Hotovo, aplikace je upravená ✓'); rerender(); };
    } catch (e) {
      box.innerHTML = `<p class="note">${esc(e instanceof Anthropic.AuthenticationError ? 'Klíč k API je neplatný.' : e instanceof Anthropic.APIConnectionError ? 'Nepodařilo se spojit se serverem.' : e.message || String(e))}</p>`;
      $('odeslat').disabled = false;
    }
  };
}
