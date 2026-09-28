// Top 1000 zajímavostí: načítá se až při otevření (soubor je velký), s náhradou za původní Top 100.
import { TOP as TOP100, KATEGORIE as KAT100 } from './italie_top.js';

export const KATEGORIE = {
  mesta: 'Města', pamatky: 'Památky', priroda: 'Příroda', regiony: 'Regiony', historie: 'Historie',
  jidlo: 'Jídlo', napoje: 'Pití', umeni: 'Umění', hudba_film: 'Hudba, film, knihy', kultura: 'Kultura',
  znacky: 'Značky', sport: 'Sport', veda: 'Věda',
};

let p = null;
export function nactiTop() {
  return p ||= fetch('data/top1000.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(list => list.map((x, i) => ({ n: i + 1, ...x })))
    .catch(() => TOP100.map(x => ({ ...x, kat: x.kat in KATEGORIE ? x.kat : 'kultura', lat: null, lon: null, region: '' })));
}

export const nazevKategorie = k => KATEGORIE[k] || KAT100[k] || k;
