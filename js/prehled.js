// Přehled: statistiky za týden / měsíc, hodnocení od Giulie a profil „Co o tobě vím“.
import { load, save } from './store.js';
import { hasKey, errorText } from './claude.js';
import { CASY } from './data.js';
import { ICON, ic, esc, toast } from './ui.js';
import { speak, stopSpeaking } from './speech.js';
import { profil, ulozProfil, aktivita, drilPrehled, tezkeKarty, aktualizujProfil, hodnoceniObdobi, spustDoporuceni, doporuceni } from './pamet.js';

const DEN = 86400000;

function obdobi(mesic) {
  const now = new Date();
  if (mesic) {
    const od = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const doDne = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12).getTime();
    return { od, doDne, klic: `mesic-${now.toLocaleDateString('sv').slice(0, 7)}`, nazev: now.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }) };
  }
  const d = new Date(now); const dow = (d.getDay() + 6) % 7; // pondělí = 0
  d.setDate(d.getDate() - dow); d.setHours(0, 0, 0, 0);
  return { od: d.getTime(), doDne: d.getTime() + 6 * DEN, klic: `tyden-${d.toLocaleDateString('sv')}`, nazev: `týden od ${d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}` };
}

function statistiky(od, doDne) {
  const dny = aktivita(od, doDne);
  const sum = k => dny.reduce((n, d) => n + (d[k] || 0), 0);
  const srs = Object.values(load('srs', {}));
  const tvary = sum('tvary'), ok = sum('tvaryOk');
  return {
    dny,
    aktivnich_dni: dny.filter(d => d.karty || d.vety || d.tvary).length,
    karticek: sum('karty'),
    novych_slov: srs.filter(s => (s.zalozeno || 0) >= od).length,
    vet_s_giulii: sum('vety'),
    tvaru: tvary,
    uspesnost_tvaru: tvary ? Math.round((ok / tvary) * 100) : null,
    umi_dobre_celkem: srs.filter(s => s.box >= 3).length,
  };
}

export function renderPrehled(app, sub) {
  const mesic = sub === 'mesic';
  const o = obdobi(mesic);
  const st = statistiky(o.od, o.doDne);
  const p = profil();
  const souhrn = load('souhrny', {})[o.klic];
  const max = Math.max(1, ...st.dny.map(d => (d.karty || 0) + (d.vety || 0) + (d.tvary || 0)));
  const drill = drilPrehled();
  const tezke = tezkeKarty(8);

  app.innerHTML = `
    <button class="back" onclick="history.back()">${ICON.back} Zpět</button>
    <header class="page-head"><h1>Přehled</h1><p class="muted">${esc(o.nazev)}</p></header>
    <div class="seg" style="margin-bottom:16px">
      <a class="${mesic ? '' : 'on'}" href="#/prehled">Týden</a>
      <a class="${mesic ? 'on' : ''}" href="#/prehled/mesic">Měsíc</a>
    </div>

    <div class="stat-grid">
      <div class="stat"><b>${st.aktivnich_dni}</b><span>dní s učením</span></div>
      <div class="stat"><b>${st.karticek}</b><span>kartiček</span></div>
      <div class="stat"><b>${st.novych_slov}</b><span>nových slov</span></div>
      <div class="stat"><b>${st.vet_s_giulii}</b><span>vět s Giulií</span></div>
      <div class="stat"><b>${st.uspesnost_tvaru ?? '–'}${st.uspesnost_tvaru != null ? ' %' : ''}</b><span>správně v časech</span></div>
      <div class="stat"><b>${st.umi_dobre_celkem}</b><span>slov umíš dobře</span></div>
    </div>

    <div class="card">
      <span class="label">Aktivita</span>
      <div class="bars ${mesic ? 'month' : ''}">${st.dny.map(d => {
        const k = d.karty || 0, v = d.vety || 0, t = d.tvary || 0;
        const den = new Date(d.den + 'T12:00');
        return `<div class="bar-col" title="${d.den}"><div class="bar-stack" style="height:${((k + v + t) / max) * 100}%">
          <i class="b-karty" style="flex:${k}"></i><i class="b-tvary" style="flex:${t}"></i><i class="b-vety" style="flex:${v}"></i></div>
          <span>${mesic ? (den.getDate() % 5 === 1 ? den.getDate() : '') : den.toLocaleDateString('cs-CZ', { weekday: 'short' }).slice(0, 2)}</span></div>`;
      }).join('')}</div>
      <div class="legend"><span><i class="b-karty"></i>kartičky</span><span><i class="b-tvary"></i>časy</span><span><i class="b-vety"></i>Giulia</span></div>
    </div>

    <div class="card">
      <div class="section-head"><span class="label">Hodnocení od Giulie</span>${souhrn ? `<span class="muted small">${new Date(souhrn.d).toLocaleDateString('cs-CZ')}</span>` : ''}</div>
      <div id="hodnoceni">${souhrn ? hodnoceniHTML(souhrn) : `<p class="muted small" style="margin:0 0 12px">Giulia projde tvoje výsledky a chyby za ${mesic ? 'měsíc' : 'týden'} a napíše, jak ti to jde a co dál.</p>`}</div>
      <button class="btn ${souhrn ? '' : 'primary'} block" id="zhodnotit" ${hasKey() ? '' : 'disabled'}>${souhrn ? 'Zhodnotit znovu' : 'Nechat Giulii zhodnotit'}</button>
      ${hasKey() ? '' : '<p class="muted small" style="margin:8px 0 0">Potřebuje klíč k Claude API (Nastavení).</p>'}
    </div>

    <div class="section-head"><h2>Co o tobě vím</h2><button class="link" id="obnovit" ${hasKey() ? '' : 'disabled'}>Aktualizovat</button></div>
    <p class="muted small" style="margin-top:-6px">${p.aktualizovano ? `Naposledy ${new Date(p.aktualizovano).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}. Aktualizuje se samo po rozhovorech a učení.` : 'Zatím nic. Profil se sestaví sám, až se trochu poučíš (potřebuje klíč k API).'}</p>
    ${p.shrnuti ? `<div class="card"><p style="margin:0">${esc(p.shrnuti)}</p></div>` : ''}
    ${blok('Na čem zapracovat', 'slabiny', p.slabiny.map(s => `<b>${esc(s.oblast)}</b><span>${esc(s.popis)}${s.priklad ? ` <i>(${esc(s.priklad)})</i>` : ''}</span>`), 'amber')}
    ${blok('Co ti jde', 'silne', p.silne.map(s => `<span>${esc(s)}</span>`), 'green')}
    ${blok('Co jsi Giulii řekl o sobě', 'o_mne', p.o_mne.map(s => `<span>${esc(s)}</span>`), 'violet')}
    ${blok('Už jste probírali', 'probrano', p.probrano.map(s => `<span>${esc(s)}</span>`), 'blue')}

    <h2>Doporučeno</h2>
    <div class="card list">${doporuceni().map((d, i) => radekDoporuceni(d, i)).join('')}</div>

    ${drill.casy.length ? `<h2>Časy</h2><div class="card list">${drill.casy.map(x => `
      <div class="list-row"><div class="grow"><b>${esc(CASY[x.k]?.name.split(' (')[0] || x.k)}</b>
        <div class="bar"><i style="width:${x.rate * 100}%"></i></div><span class="muted small">${Math.round(x.rate * 100)} % z ${x.n} odpovědí</span></div></div>`).join('')}</div>` : ''}

    ${tezke.length ? `<h2>Kartičky, které ti nejdou</h2><div class="card list">${tezke.map(t => `
      <div class="list-row"><div class="grow"><b>${esc(t.item.it)}</b><span class="muted small">${esc(t.item.cs)} · Nevím ${t.lapses}×</span></div>
      <button class="icon-btn" data-say="${esc(t.item.it)}" aria-label="Přehrát">${ICON.speaker}</button></div>`).join('')}</div>` : ''}

    <button class="btn block danger" id="smazat" style="margin-top:20px">Smazat paměť (profil a záznamy chyb)</button>
  `;

  const $ = id => app.querySelector('#' + id);
  app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { stopSpeaking(); speak(b.dataset.say); });
  app.querySelectorAll('[data-dop]').forEach(b => b.onclick = () => { location.hash = spustDoporuceni(doporuceni()[+b.dataset.dop]); });
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const [pole, i] = b.dataset.del.split(':');
    const pp = profil(); pp[pole].splice(+i, 1); ulozProfil(pp);
    toast('Smazáno'); renderPrehled(app, sub);
  });
  $('zhodnotit').onclick = async () => {
    const b = $('zhodnotit'); b.disabled = true; b.textContent = 'Giulia přemýšlí…';
    try {
      const { dny, ...bezDni } = st;
      const s = await hodnoceniObdobi(o.klic, o.od, { ...bezDni, obdobi: mesic ? 'měsíc' : 'týden' });
      $('hodnoceni').innerHTML = hodnoceniHTML(s);
      b.textContent = 'Zhodnotit znovu';
    } catch (e) { toast(errorText(e)); b.textContent = 'Nechat Giulii zhodnotit'; }
    b.disabled = false;
  };
  $('obnovit').onclick = async () => {
    const b = $('obnovit'); b.disabled = true; b.textContent = 'Aktualizuji…';
    try { await aktualizujProfil(); toast('Profil aktualizován'); renderPrehled(app, sub); }
    catch (e) { toast(errorText(e)); b.disabled = false; b.textContent = 'Aktualizovat'; }
  };
  $('smazat').onclick = () => {
    if (!confirm('Smazat všechno, co si aplikace o tobě zapamatovala? Postup v kartičkách zůstane.')) return;
    ['profil', 'opravy', 'drillStats', 'souhrny', 'pametNove'].forEach(k => save(k, null));
    try { ['profil', 'opravy', 'drillStats', 'souhrny', 'pametNove'].forEach(k => localStorage.removeItem(k)); } catch { /* nic */ }
    toast('Paměť smazána'); renderPrehled(app, sub);
  };
}

function blok(nadpis, pole, polozky, barva) {
  if (!polozky.length) return '';
  return `<div class="card memory ${barva}"><span class="label">${nadpis}</span>
    ${polozky.map((html, i) => `<div class="mem-row"><div class="grow">${html}</div>
      <button class="icon-btn plain small" data-del="${pole}:${i}" aria-label="Smazat">${ICON.close}</button></div>`).join('')}</div>`;
}

function hodnoceniHTML(s) {
  const seznam = (nadpis, arr) => arr.length ? `<p class="small" style="margin:12px 0 4px"><b>${nadpis}</b></p><ul class="small tight">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  return `<p style="margin:0">${esc(s.hodnoceni)}</p>
    ${seznam('Zlepšil ses', s.zlepseni)}${seznam('Opakující se chyby', s.opakujici_chyby)}${seznam('Plán na příště', s.plan)}<div style="height:12px"></div>`;
}

const DOP_IC = { dril: ['clock', 'amber'], karty: ['cards', 'coral'], giulia: ['chat', 'green'], nove: ['book', 'blue'] };
export function radekDoporuceni(d, i) {
  const [icon, color] = DOP_IC[d.typ] || ['sparkles', 'violet'];
  return `<button class="list-row" data-dop="${i}">${ic(icon, color)}<div class="grow"><b>${esc(d.nazev)}</b><span class="muted small">${esc(d.proc)}</span></div>${ICON.chevron}</button>`;
}
