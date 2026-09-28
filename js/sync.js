// Synchronizace dat mezi zařízeními přes soukromý repozitář <uživatel>/italiano-data na GitHubu.
// Data se slučují chytře (po kartičkách, místech, dnech…), takže se učení na dvou zařízeních nepřepisuje.
// Klíče k API, přístupový token a nastavení hlasu zůstávají jen v zařízení. Fotky z mapy se nesynchronizují.
import { load, save, settings } from './store.js';

const REPO_NAZEV = 'italiano-data';
const SOUBOR = 'paolo-italiano.json';
const API = 'https://api.github.com';

// Co zůstává jen v tomto zařízení.
const LOKALNI = new Set(['sync', 'syncStav', 'posledniZaloha', 'mapaRok', 'mapaZajimavosti', 'topFiltr', 'cestaOtevreno',
  'drillFocus', 'kartyFocus', 'slovaCache', 'usage', 'elVoices', 'pametNove', 'drillCasy']);
const TAJNE_NASTAVENI = ['apiKey', 'elKey', 'elVoice', 'elVoiceName', 'voice', 'hlas'];
const jeLokalni = k => LOKALNI.has(k) || k.startsWith('chatFocus:');

export const syncNastaveni = () => load('sync', null);
export const syncStav = () => load('syncStav', {});

// ---------- GitHub ----------
async function gh(path, opts = {}, token = syncNastaveni()?.token) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
  });
  if (r.status === 401) throw new Error('Token není platný nebo vypršel.');
  if (r.status === 403) throw new Error('Token nemá oprávnění k repozitáři italiano-data (Contents: Read and write).');
  return r;
}

const b64 = s => { const u = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(bin); };
const unb64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));

// Ověří token, najde repozitář a uloží nastavení. Vrací login.
export async function zapnout(token) {
  const u = await gh('/user', {}, token);
  if (!u.ok) throw new Error('Token se nepodařilo ověřit.');
  const login = (await u.json()).login;
  const repo = `${login}/${REPO_NAZEV}`;
  const r = await gh(`/repos/${repo}`, {}, token);
  if (r.status === 404) throw new Error(`Na GitHubu chybí soukromý repozitář „${REPO_NAZEV}“, nebo k němu token nemá přístup.`);
  if (!r.ok) throw new Error(`GitHub vrátil chybu ${r.status}.`);
  save('sync', { token, repo });
  return login;
}

export function vypnout() { try { localStorage.removeItem('sync'); localStorage.removeItem('syncStav'); } catch { /* nic */ } }

async function stahni(repo) {
  const r = await gh(`/repos/${repo}/contents/${SOUBOR}`);
  if (r.status === 404) return { obsah: null, sha: null };
  if (!r.ok) throw new Error(`Stažení se nepovedlo (${r.status}).`);
  const j = await r.json();
  let text = j.content ? unb64(j.content) : '';
  if (!text) { // soubor nad 1 MB – stáhnout surový obsah
    const raw = await gh(`/repos/${repo}/contents/${SOUBOR}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
    text = await raw.text();
  }
  return { obsah: JSON.parse(text), sha: j.sha };
}

async function nahraj(repo, obsah, sha) {
  const r = await gh(`/repos/${repo}/contents/${SOUBOR}`, {
    method: 'PUT',
    body: JSON.stringify({ message: `Synchronizace ${new Date().toISOString()}`, content: b64(JSON.stringify(obsah)), ...(sha ? { sha } : {}) }),
  });
  if (r.status === 409 || r.status === 422) return false; // mezitím nahrálo jiné zařízení
  if (!r.ok) throw new Error(`Nahrání se nepovedlo (${r.status}).`);
  return true;
}

// ---------- Snímek a slučování ----------
function snimek() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (jeLokalni(k)) continue;
      out[k] = JSON.parse(localStorage.getItem(k));
    }
  } catch { /* nic */ }
  if (out.settings) out.settings = Object.fromEntries(Object.entries(out.settings).filter(([k]) => !TAJNE_NASTAVENI.includes(k)));
  return out;
}

const poKlicich = (a = {}, b = {}, vyber) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = k in o ? vyber(o[k], v) : v; return o; };
const maxKazde = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = typeof v === 'number' ? Math.max(o[k] || 0, v) : (o[k] ?? v); return o; };
const sjednot = (a = [], b = [], klic) => { const m = new Map(); for (const x of [...a, ...b]) if (!m.has(klic(x))) m.set(klic(x), x); return [...m.values()]; };
const posledniD = h => Math.max(0, ...(h || []).map(m => m.d || 0));

const SLUC = {
  srs: (a, b) => poKlicich(a, b, (x, y) => ((y.upd || 0) > (x.upd || 0) ? y : x)),
  newToday: (a, b) => (a.date === b.date ? { ...maxKazde(a, b), date: a.date } : (a.date > b.date ? a : b)),
  stats: (a, b) => ({ days: poKlicich(a.days, b.days, maxKazde) }),
  drillStats: (a, b) => poKlicich(a, b, (x, y) => ((y.last || 0) > (x.last || 0) ? y : x)),
  opravy: (a, b) => sjednot(a, b, o => `${o.d}|${o.user}`).sort((x, y) => x.d - y.d).slice(-300),
  preklady: (a, b) => sjednot(a, b, x => x.datum).sort((x, y) => (y.datum || '').localeCompare(x.datum || '')).slice(0, 30),
  upravy: (a, b) => sjednot(a, b, x => x.datum).sort((x, y) => (y.datum || '').localeCompare(x.datum || '')).slice(0, 30),
  prani: (a, b) => sjednot(a, b, x => x.t),
  moje: (a, b) => sjednot(a, b, x => x.it),
  mista: (a, b) => { const m = new Map(); for (const x of [...a, ...b]) { const p = m.get(x.id); if (!p || (x.upd || 0) > (p.upd || 0)) m.set(x.id, x); } return [...m.values()]; },
  mistaSmazana: (a, b) => [...new Set([...a, ...b])],
  mojeSmazane: (a, b) => [...new Set([...a, ...b])],
  profil: (a, b) => ((b.aktualizovano || 0) > (a.aktualizovano || 0) ? b : a),
  souhrny: (a, b) => poKlicich(a, b, (x, y) => ((y.d || 0) > (x.d || 0) ? y : x)),
  settings: (a, b) => ((b._upd || 0) > (a._upd || 0) ? b : a),
  onboarded: (a, b) => a || b,
  posledniOtevreni: (a, b) => Math.max(a || 0, b || 0),
};

function sluc(L, R) {
  const out = {};
  for (const k of new Set([...Object.keys(L), ...Object.keys(R)])) {
    const a = L[k], b = R[k];
    if (a === undefined) out[k] = b;
    else if (b === undefined || b === null) out[k] = a;
    else if (SLUC[k]) out[k] = SLUC[k](a, b);
    else if (k.startsWith('chat:')) out[k] = posledniD(b) > posledniD(a) ? b : a;
    else out[k] = a;
  }
  // Smazané položky se nesmí vrátit z druhého zařízení.
  if (out.mista && out.mistaSmazana) out.mista = out.mista.filter(m => !out.mistaSmazana.includes(m.id));
  if (out.moje && out.mojeSmazane) out.moje = out.moje.filter(m => !out.mojeSmazane.includes(m.it));
  return out;
}

let aplikuji = false;
function zapisLokalne(data) {
  const tajne = Object.fromEntries(TAJNE_NASTAVENI.map(k => [k, settings()[k]]).filter(([, v]) => v !== undefined));
  let zmena = false;
  aplikuji = true;
  try {
    for (const [k, v] of Object.entries(data)) {
      if (jeLokalni(k)) continue;
      const nova = k === 'settings' ? { ...v, ...tajne } : v;
      const s = JSON.stringify(nova);
      if (localStorage.getItem(k) !== s) { localStorage.setItem(k, s); zmena = true; }
    }
  } catch { /* plné úložiště */ } finally { aplikuji = false; }
  return zmena;
}

// ---------- Synchronizace ----------
let bezi = null, spinave = false, casovac = null;

export function synchronizuj() {
  const cfg = syncNastaveni();
  if (!cfg?.token || !navigator.onLine) return Promise.resolve(null);
  if (bezi) return bezi;
  bezi = (async () => {
    spinave = false;
    for (let pokus = 0; pokus < 3; pokus++) {
      const { obsah, sha } = await stahni(cfg.repo);
      const L = snimek();
      const M = obsah?.data ? sluc(L, obsah.data) : L;
      const zmenaLokalne = zapisLokalne(M);
      const zmenaVzdalene = !obsah?.data || JSON.stringify(M) !== JSON.stringify(obsah.data);
      if (zmenaVzdalene && !(await nahraj(cfg.repo, { app: 'paolo-italiano', verze: 1, cas: new Date().toISOString(), data: M }, sha))) continue;
      save('syncStav', { cas: Date.now(), ok: true });
      return { zmenaLokalne };
    }
    throw new Error('Data se mezitím měnila na jiném zařízení, zkus to znovu.');
  })().catch(e => { save('syncStav', { ...syncStav(), chyba: e.message, chybaCas: Date.now() }); throw e; })
    .finally(() => { bezi = null; });
  return bezi;
}

// Změna dat → za chvíli nahrát. Návrat do aplikace → stáhnout.
window.addEventListener('paolo-save', e => {
  if (aplikuji || jeLokalni(e.detail) || !syncNastaveni()) return;
  spinave = true;
  clearTimeout(casovac);
  casovac = setTimeout(() => synchronizuj().catch(() => {}), 15000);
});
document.addEventListener('visibilitychange', () => {
  if (!syncNastaveni()) return;
  if (document.visibilityState === 'hidden' && spinave) synchronizuj().catch(() => {});
  if (document.visibilityState === 'visible') synchronizuj().then(r => r?.zmenaLokalne && window.dispatchEvent(new Event('paolo-sync'))).catch(() => {});
});
window.addEventListener('online', () => synchronizuj().catch(() => {}));
