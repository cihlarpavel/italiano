// Spojí data/top/*.json do data/top1000.json a zkontroluje je.
// Spuštění: node tools/sloucit_top.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PORADI = ['mesta', 'pamatky', 'priroda', 'regiony', 'historie', 'jidlo', 'napoje', 'umeni', 'hudba_film', 'kultura', 'znacky', 'sport', 'veda', 'doplnky'];
const CIL = 1000;
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(il|lo|la|l’|l'|i|gli|le)\s*/, '').replace(/[^a-z0-9]/g, '');

// Sjednocení názvů regionů na česká jména (agenti občas použili italské).
const REGIONY = {
  "Valle d'Aosta": 'Údolí Aosty', 'Valle d’Aosta': 'Údolí Aosty', 'Piemonte': 'Piemont', 'Lombardia': 'Lombardie',
  'Trentino-Alto Adige': 'Tridentsko-Horní Adiže', 'Trentino': 'Tridentsko-Horní Adiže', 'Tridentsko': 'Tridentsko-Horní Adiže', 'Jižní Tyrolsko': 'Tridentsko-Horní Adiže',
  'Veneto': 'Benátsko', 'Friuli-Venezia Giulia': 'Furlánsko-Julské Benátsko', 'Friuli Venezia Giulia': 'Furlánsko-Julské Benátsko',
  'Liguria': 'Ligurie', 'Emilia-Romagna': 'Emilie-Romaňa', 'Emilia Romagna': 'Emilie-Romaňa', 'Toscana': 'Toskánsko', 'Umbria': 'Umbrie',
  'Campania': 'Kampánie', 'Puglia': 'Apulie', 'Calabria': 'Kalábrie', 'Sicilia': 'Sicílie', 'Sardegna': 'Sardinie', 'Furlansko-Julské Benátsko': 'Furlánsko-Julské Benátsko', 'Emilie-Romagna': 'Emilie-Romaňa',
};
const CESKE = new Set(['Údolí Aosty', 'Piemont', 'Lombardie', 'Tridentsko-Horní Adiže', 'Benátsko', 'Furlánsko-Julské Benátsko', 'Ligurie', 'Emilie-Romaňa', 'Toskánsko', 'Umbrie', 'Marche', 'Lazio', 'Abruzzo', 'Molise', 'Kampánie', 'Apulie', 'Basilicata', 'Kalábrie', 'Sicílie', 'Sardinie', 'Vatikán', 'San Marino']);
const neznameRegiony = new Set();

const vse = [], videno = new Map(), chyby = [], duplicity = [];
for (const kat of PORADI) {
  const f = `data/top/${kat}.json`;
  if (!existsSync(f)) { chyby.push(`chybí ${f}`); continue; }
  let arr;
  try { arr = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { chyby.push(`${f}: neplatný JSON (${e.message})`); continue; }
  for (const x of arr) {
    const id = `${kat}/${x.it}`;
    for (const k of ['cs', 'it', 'dcs', 'dit']) if (!x[k] || typeof x[k] !== 'string') chyby.push(`${id}: prázdné pole ${k}`);
    if (x.lat != null && (x.lat < 35.4 || x.lat > 47.2 || x.lon < 6.5 || x.lon > 18.6)) chyby.push(`${id}: souřadnice mimo Itálii (${x.lat}, ${x.lon})`);
    if ((x.lat == null) !== (x.lon == null)) chyby.push(`${id}: jen jedna souřadnice`);
    const key = (kat === 'regiony' ? 'region:' : '') + norm(x.it); // region Sicílie ≠ ostrov Sicílie
    if (videno.has(key)) { duplicity.push(`${id} = ${videno.get(key)}`); continue; }
    videno.set(key, id);
    let region = REGIONY[x.region] || x.region || '';
    if (region && !CESKE.has(region)) { neznameRegiony.add(region); }
    vse.push({ kat: kat === 'doplnky' ? x.kat : kat, e: x.e || '📍', cs: x.cs, it: x.it, dcs: x.dcs, dit: x.dit, lat: x.lat ?? null, lon: x.lon ?? null, region });
  }
}
if (vse.length > CIL) vse.length = CIL;
writeFileSync('data/top1000.json', JSON.stringify(vse));
const pocty = {};
vse.forEach(x => (pocty[x.kat] = (pocty[x.kat] || 0) + 1));
console.log(`celkem ${vse.length}, se souřadnicemi ${vse.filter(x => x.lat != null).length}`);
console.log(pocty);
if (duplicity.length) console.log(`vyřazené duplicity (${duplicity.length}):\n  ` + duplicity.join('\n  '));
if (neznameRegiony.size) console.log('nesjednocené regiony:', [...neznameRegiony]);
if (chyby.length) console.log(`CHYBY (${chyby.length}):\n  ` + chyby.join('\n  '));
