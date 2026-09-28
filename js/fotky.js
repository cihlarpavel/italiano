// Fotky k místům: ukládají se v IndexedDB (localStorage by na obrázky nestačil). Zůstávají jen v telefonu.
const DB = 'paolo', STORE = 'fotky';
let dbP = null;

function db() {
  return dbP ||= new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function tx(mode, fn) {
  return db().then(d => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => res(out?.result ?? out);
    t.onerror = () => rej(t.error);
  }));
}

export const ulozFoto = (id, blob) => tx('readwrite', s => s.put(blob, id));
export const nactiFoto = id => tx('readonly', s => s.get(id));
export const smazFoto = id => tx('readwrite', s => s.delete(id));

export async function vsechnyFotky() {
  const d = await db();
  return new Promise((res, rej) => {
    const out = {};
    const r = d.transaction(STORE).objectStore(STORE).openCursor();
    r.onsuccess = () => { const c = r.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
    r.onerror = () => rej(r.error);
  });
}

// Zmenší fotku z iPhonu (klidně 12 Mpx) na rozumnou velikost.
export async function zmensi(file, max = 1600, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', q));
  } finally { URL.revokeObjectURL(url); }
}

export const blobNaDataUrl = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
export const dataUrlNaBlob = async url => (await fetch(url)).blob();
