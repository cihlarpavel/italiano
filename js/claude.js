// Společné volání Claude API z prohlížeče: výběr modelu, parametry, útrata, chybové hlášky.
import Anthropic from 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.128.0/+esm';
import { load, save, settings } from './store.js';

export { Anthropic };

// Ceny v USD za milion tokenů (vstup / výstup).
export const MODELY = {
  'claude-opus-5': { name: 'Opus 5 – nejlepší · ≈ 0,3 Kč', in: 5, out: 25 },
  'claude-sonnet-5': { name: 'Sonnet 5 – levnější · ≈ 0,12 Kč', in: 2, out: 10 },
  'claude-haiku-4-5': { name: 'Haiku 4.5 – nejlevnější, slabší čeština · ≈ 0,06 Kč', in: 1, out: 5 },
};
const KC_ZA_USD = 22;

const month = () => new Date().toLocaleDateString('sv').slice(0, 7);
export function usageThisMonth() {
  const u = load('usage', {});
  const cur = u.month === month() ? u : { usd: 0, turns: 0 };
  return { czk: cur.usd * KC_ZA_USD, turns: cur.turns };
}
export function addUsage(model, usage) {
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

export const hasKey = () => !!settings().apiKey;

export function client() {
  return new Anthropic({ apiKey: settings().apiKey, dangerouslyAllowBrowser: true });
}

// Parametry podle zvoleného modelu: effort jen u modelů, které ho umí; u Opus 5 záložní model při odmítnutí.
// kvalita 'vysoka': úlohy, kde záleží na bezchybné češtině (překlady) – místo Haiku se použije Sonnet 5.
export function modelParams(effort, kvalita) {
  const s = settings();
  let model = s.model in MODELY ? s.model : 'claude-opus-5';
  if (kvalita === 'vysoka' && model === 'claude-haiku-4-5') model = 'claude-sonnet-5';
  const p = { model };
  if (model !== 'claude-haiku-4-5' && effort) p.output_config = { effort };
  if (model === 'claude-opus-5') { p.betas = ['server-side-fallback-2026-07-01']; p.fallbacks = 'default'; }
  return p;
}

// Jedno volání se strukturovaným výstupem (JSON podle schématu).
export async function callJSON({ system, content, schema, effort = 'low', kvalita }) {
  const params = modelParams(effort, kvalita);
  params.output_config = { ...(params.output_config || {}), format: { type: 'json_schema', schema } };
  const msg = await client().beta.messages.create({
    ...params,
    max_tokens: 16000,
    system,
    messages: [{ role: 'user', content }],
  });
  addUsage(msg.model || params.model, msg.usage || {});
  if (msg.stop_reason === 'refusal') throw new Error('Model tento požadavek odmítl.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Odpověď byla příliš dlouhá. Zkus kratší text.');
  return JSON.parse(msg.content.filter(b => b.type === 'text').map(b => b.text).join(''));
}

export function errorText(e) {
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
