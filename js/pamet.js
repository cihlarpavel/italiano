// Paměť aplikace: co uživatel dělal, co mu jde a nejde, a doporučení, co dělat dál.
// Záznamy se ukládají lokálně; profil z nich občas sestaví Claude (jen s klíčem k API).
import { load, save, settings } from './store.js';
import { callJSON, hasKey } from './claude.js';
import { DECKS, SLOVESA, CASY, SCENARE, VOCAB } from './data.js';

const DEN = 86400000;

// ---------- Záznamy ----------
function novaUdalost(n = 1) { save('pametNove', load('pametNove', 0) + n); }

export function zaznamOpravy({ sc, user, fix }) {
  const o = load('opravy', []);
  o.push({ d: Date.now(), sc, user, fix });
  save('opravy', o.slice(-300));
  novaUdalost(3);
}

export function zaznamDril(inf, cas, ok) {
  const st = load('drillStats', {});
  const k = `${inf}|${cas}`;
  const x = st[k] || { ok: 0, bad: 0 };
  ok ? x.ok++ : x.bad++;
  x.last = Date.now();
  st[k] = x;
  save('drillStats', st);
  novaUdalost();
}

export const zaznamKarty = () => novaUdalost();
export const zaznamUdalosti = (n = 1) => novaUdalost(n);

// ---------- Výpočty z lokálních dat ----------
function najdiKartu(id) {
  const [deck, ...rest] = id.split(':');
  const it = rest.join(':');
  const item = DECKS[deck]?.items.find(x => x.it === it);
  return item ? { deck, item } : null;
}

// Kartičky, u kterých uživatel nejčastěji klepl „Nevím“.
export function tezkeKarty(n = 20) {
  return Object.entries(load('srs', {}))
    .filter(([, s]) => (s.lapses || 0) >= 1)
    .sort(([, a], [, b]) => (b.lapses - a.lapses) || (a.box - b.box))
    .map(([id, s]) => ({ ...najdiKartu(id), lapses: s.lapses, box: s.box }))
    .filter(x => x.item)
    .slice(0, n);
}

// Úspěšnost v drilu podle času a podle slovesa.
export function drilPrehled() {
  const cas = {}, sloveso = {};
  for (const [k, x] of Object.entries(load('drillStats', {}))) {
    const [inf, c] = k.split('|');
    for (const [map, key] of [[cas, c], [sloveso, inf]]) {
      map[key] = map[key] || { ok: 0, bad: 0 };
      map[key].ok += x.ok; map[key].bad += x.bad;
    }
  }
  const pct = m => Object.entries(m).map(([k, x]) => ({ k, n: x.ok + x.bad, rate: x.ok / (x.ok + x.bad) }));
  return { casy: pct(cas), slovesa: pct(sloveso) };
}

export function aktivita(od, doDne = Date.now()) {
  const dny = load('stats', { days: {} }).days;
  const out = [];
  const d = new Date(od);
  d.setHours(12, 0, 0, 0);
  while (d.getTime() <= doDne + 12 * 3600000) {
    const key = d.toLocaleDateString('sv');
    out.push({ den: key, ...(dny[key] || {}) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ---------- Profil ----------
const PRAZDNY = { aktualizovano: 0, zpracovano: 0, shrnuti: '', slabiny: [], silne: [], o_mne: [], probrano: [], doporuceni: [] };
export const profil = () => ({ ...PRAZDNY, ...load('profil', {}) });
export function ulozProfil(p) { save('profil', p); }

const TYPY = ['dril', 'karty', 'giulia', 'nove'];
export const TEMATA = [...new Set(VOCAB.map(v => v.topic))];

const SCHEMA = {
  type: 'object',
  properties: {
    shrnuti: { type: 'string' },
    slabiny: { type: 'array', items: { type: 'object', properties: { oblast: { type: 'string' }, popis: { type: 'string' }, priklad: { type: 'string' } }, required: ['oblast', 'popis', 'priklad'], additionalProperties: false } },
    silne: { type: 'array', items: { type: 'string' } },
    o_mne: { type: 'array', items: { type: 'string' } },
    probrano: { type: 'array', items: { type: 'string' } },
    doporuceni: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          typ: { type: 'string', enum: TYPY },
          nazev: { type: 'string' }, proc: { type: 'string' },
          casy: { type: 'array', items: { type: 'string' } },
          slovesa: { type: 'array', items: { type: 'string' } },
          tema: { type: 'string' }, scenar: { type: 'string' }, zamereni: { type: 'string' },
        },
        required: ['typ', 'nazev', 'proc', 'casy', 'slovesa', 'tema', 'scenar', 'zamereni'],
        additionalProperties: false,
      },
    },
  },
  required: ['shrnuti', 'slabiny', 'silne', 'o_mne', 'probrano', 'doporuceni'],
  additionalProperties: false,
};

function systemProfil() {
  return `Jsi zkušený učitel italštiny a vedeš si poznámky o svém studentovi (Čech, začátečník, jméno: ${settings().jmeno || 'neuvedeno'}). Dostaneš jeho dosavadní profil a nová data z aplikace. Vrať AKTUALIZOVANÝ profil – slouč staré s novým, vyřaď, co už neplatí (chyby, které přestal dělat), a drž se faktů z dat. Nic si nevymýšlej.

- shrnuti: 1–2 věty česky, kde student teď je.
- slabiny: nejvýš 6 konkrétních oblastí, které mu nejdou (gramatika, slovíčka). popis česky, priklad = jeho skutečná chyba a oprava, pokud je v datech, jinak prázdné.
- silne: nejvýš 5 věcí, které mu jdou.
- o_mne: nejvýš 12 osobních faktů, které student SÁM řekl o sobě v rozhovorech (práce, rodina, koníčky, cesty, plány). Česky, krátce. Jen z jeho vlastních zpráv.
- probrano: nejvýš 12 témat a situací, které už procvičoval.
- doporuceni: přesně 3 různé, konkrétní kroky na příště, tykej. Typy:
  • "dril" – procvičení časování; casy jen z [${Object.keys(CASY).join(', ')}], slovesa jen z [${SLOVESA.map(v => v.inf).join(', ')}] (prázdné = všechna).
  • "karty" – opakování; tema = "tezke" (kartičky, které mu nejdou) nebo jedno z témat slovíček [${TEMATA.join(', ')}].
  • "giulia" – rozhovor; scenar jen z [${SCENARE.map(s => s.id).join(', ')}], zamereni = krátký pokyn pro Giulii česky, na co se v rozhovoru zaměřit.
  • "nove" – pokračovat v nových kartičkách (když jde všechno dobře).
  Nepoužitá pole vyplň prázdně. nazev nejvýš 6 slov, proc jedna věta s odkazem na konkrétní data.`;
}

function novaData(p) {
  const od = p.zpracovano || 0;
  const zpravy = [];
  for (const s of SCENARE) {
    for (const m of load('chat:' + s.id, [])) {
      if (m.role === 'user' && !m.hidden && (m.d || 0) >= od) zpravy.push(`[${s.name}] ${m.text}`);
    }
  }
  const { casy, slovesa } = drilPrehled();
  const vals = Object.values(load('srs', {}));
  const posledni14 = aktivita(Date.now() - 13 * DEN).filter(d => d.karty || d.vety || d.tvary);
  return {
    opravy_od_minula: load('opravy', []).filter(o => o.d > od).slice(-60).map(o => ({ rekl: o.user, oprava: o.fix })),
    jeho_zpravy_od_minula: zpravy.slice(-60),
    dril_uspesnost_podle_casu: casy.map(x => `${x.k}: ${Math.round(x.rate * 100)} % z ${x.n}`),
    dril_nejslabsi_slovesa: slovesa.filter(x => x.n >= 3).sort((a, b) => a.rate - b.rate).slice(0, 6).map(x => `${x.k}: ${Math.round(x.rate * 100)} % z ${x.n}`),
    tezke_karticky: tezkeKarty(15).map(x => `${x.item.it} = ${x.item.cs} (Nevím ${x.lapses}×)`),
    karticky: { rozpracovano: vals.length, umi_dobre: vals.filter(s => s.box >= 3).length },
    aktivita_14_dni: posledni14.map(d => `${d.den}: kartičky ${d.karty || 0}, věty s Giulií ${d.vety || 0}, tvary ${d.tvary || 0}`),
    preklady_od_minula: load('preklady', []).filter(x => new Date(x.datum).getTime() > od).slice(0, 15).map(x => `${x.text} → ${x.preklad}`),
    pouzite_situace: SCENARE.filter(s => load('chat:' + s.id, []).some(m => !m.hidden)).map(s => s.id),
  };
}

function validujDoporuceni(list) {
  const infs = SLOVESA.map(v => v.inf);
  return (list || []).filter(d => TYPY.includes(d.typ)).map(d => ({
    ...d,
    casy: (d.casy || []).filter(c => c in CASY),
    slovesa: (d.slovesa || []).filter(v => infs.includes(v)),
    tema: d.tema === 'tezke' || TEMATA.includes(d.tema) ? d.tema : '',
    scenar: SCENARE.some(s => s.id === d.scenar) ? d.scenar : '',
  })).filter(d => d.typ !== 'giulia' || d.scenar).filter(d => d.typ !== 'karty' || d.tema).slice(0, 3);
}

let bezi = null;
export function aktualizujProfil() {
  if (bezi) return bezi;
  bezi = (async () => {
    const p = profil();
    const out = await callJSON({
      system: systemProfil(),
      content: `Dosavadní profil:\n${JSON.stringify({ shrnuti: p.shrnuti, slabiny: p.slabiny, silne: p.silne, o_mne: p.o_mne, probrano: p.probrano })}\n\nNová data z aplikace:\n${JSON.stringify(novaData(p))}`,
      schema: SCHEMA,
      effort: 'medium',
    });
    const now = Date.now();
    const novy = { ...p, ...out, doporuceni: validujDoporuceni(out.doporuceni), aktualizovano: now, zpracovano: now };
    ulozProfil(novy);
    save('pametNove', 0);
    return novy;
  })().finally(() => { bezi = null; });
  return bezi;
}
export const aktualizaceBezi = () => !!bezi;

// Aktualizace na pozadí, když se nasbíralo dost nových dat. force = po rozhovoru s Giulií.
export function mozna(force = false) {
  if (!hasKey()) return null;
  const p = profil();
  const nove = load('pametNove', 0);
  const stare = Date.now() - p.aktualizovano > 6 * 3600000;
  if (force ? nove >= 3 : (nove >= 15 && stare) || (nove >= 5 && !p.aktualizovano)) {
    return aktualizujProfil().catch(() => null);
  }
  return null;
}

// Krátký kontext pro Giulii, ať si pamatuje, s kým mluví.
export function kontextProGiulii() {
  const p = profil();
  const casti = [];
  if (p.o_mne.length) casti.push(`Co ti uživatel dříve řekl o sobě (můžeš na to přirozeně navázat): ${p.o_mne.map(x => x.replace(/[.\s]+$/, '')).join('; ')}.`);
  if (p.slabiny.length) casti.push(`Jeho slabiny (nenápadně je procvičuj, dávej mu příležitosti je použít): ${p.slabiny.map(s => `${s.oblast} – ${s.popis.replace(/[.\s]+$/, '')}`).join('; ')}.`);
  if (p.probrano.length) casti.push(`Už jste spolu probírali: ${p.probrano.slice(0, 8).join(', ')}.`);
  return casti.join('\n');
}

// ---------- Doporučení ----------
export function doporuceni() {
  const p = profil();
  if (p.doporuceni.length && Date.now() - p.aktualizovano < 4 * DEN) return p.doporuceni;
  return lokalniDoporuceni();
}

function lokalniDoporuceni() {
  const out = [];
  const tezke = tezkeKarty();
  if (tezke.length >= 3) out.push({ typ: 'karty', tema: 'tezke', nazev: 'Kartičky, které ti nejdou', proc: `${tezke.length} kartiček, u kterých jsi klepl „Nevím“.` });
  const slaby = drilPrehled().casy.filter(x => x.n >= 5 && x.rate < 0.75).sort((a, b) => a.rate - b.rate)[0];
  if (slaby) out.push({ typ: 'dril', casy: [slaby.k], slovesa: [], nazev: `Dril: ${CASY[slaby.k].name.split(' (')[0]}`, proc: `Zatím máš správně ${Math.round(slaby.rate * 100)} % odpovědí.` });
  const nepouzita = SCENARE.find(s => !load('chat:' + s.id, []).some(m => !m.hidden));
  if (nepouzita) out.push({ typ: 'giulia', scenar: nepouzita.id, zamereni: '', nazev: `Giulia: ${nepouzita.name}`, proc: 'Tuhle situaci jste spolu ještě nezkoušeli.' });
  if (out.length < 3) out.push({ typ: 'nove', nazev: 'Nová slovíčka', proc: 'Pokračuj v dnešní lekci.' });
  return out.slice(0, 3);
}

// Připraví zaměření a vrátí adresu obrazovky, kam doporučení vede.
export function spustDoporuceni(d) {
  if (d.typ === 'dril') { save('drillFocus', { casy: d.casy || [], slovesa: d.slovesa || [], nazev: d.nazev }); return '#/dril'; }
  if (d.typ === 'karty') { save('kartyFocus', { tema: d.tema, nazev: d.nazev }); return '#/opakovani'; }
  if (d.typ === 'giulia') { if (d.zamereni) save('chatFocus:' + d.scenar, d.zamereni); return '#/mluveni/' + d.scenar; }
  return '#/lekce';
}

// ---------- Hodnocení období ----------
const HODNOCENI = {
  type: 'object',
  properties: {
    hodnoceni: { type: 'string' },
    zlepseni: { type: 'array', items: { type: 'string' } },
    opakujici_chyby: { type: 'array', items: { type: 'string' } },
    plan: { type: 'array', items: { type: 'string' } },
  },
  required: ['hodnoceni', 'zlepseni', 'opakujici_chyby', 'plan'],
  additionalProperties: false,
};

export async function hodnoceniObdobi(klic, od, stat) {
  const p = profil();
  const out = await callJSON({
    system: `Jsi Giulia, vlídná učitelka italštiny. Napiš studentovi (${settings().jmeno || 'student'}, Čech, začátečník) česky, tykej, krátké hodnocení jeho učení za dané období. Buď konkrétní, opírej se jen o data, povzbuď ho, ale nepřikrášluj. Když dat je málo, řekni to. hodnoceni 2–4 věty; zlepseni, opakujici_chyby a plan po 0–4 bodech (plan = co dělat příští období).`,
    content: JSON.stringify({
      obdobi: klic,
      statistiky: stat,
      opravy_v_obdobi: load('opravy', []).filter(o => o.d >= od).slice(-50).map(o => ({ rekl: o.user, oprava: o.fix })),
      profil: { slabiny: p.slabiny, silne: p.silne },
      tezke_karticky: tezkeKarty(10).map(x => x.item.it),
    }),
    schema: HODNOCENI,
    effort: 'medium',
  });
  const s = load('souhrny', {});
  s[klic] = { ...out, d: Date.now() };
  save('souhrny', s);
  return s[klic];
}
