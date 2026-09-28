// Hlas: buď přirozený neuronový hlas ElevenLabs (s klíčem), nebo hlas iPhonu (zdarma, offline).
// Rozpoznání řeči zajišťuje vždy iPhone.
import { settings } from './store.js';

const synth = window.speechSynthesis;
let voicesCache = [];

function refreshVoices() {
  voicesCache = synth ? synth.getVoices().filter(v => v.lang.replace('_', '-').startsWith('it')) : [];
}
if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
}

export function italianVoices() {
  refreshVoices();
  // Kvalitnější hlasy (Premium / Enhanced) dopředu.
  return [...voicesCache].sort((a, b) => score(b) - score(a));
}
const score = v => (/premium|prémiov/i.test(v.name) ? 3 : 0) + (/enhanced|vylepšen/i.test(v.name) ? 2 : 0) + (/alice|federica|emma/i.test(v.name) ? 1 : 0);

function pickVoice() {
  const want = settings().voice;
  const list = italianVoices();
  return list.find(v => v.voiceURI === want) || list[0] || null;
}

const listeners = new Set();
export function onSpeechActivity(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = (type, data) => listeners.forEach(fn => fn(type, data));

// ---------- ElevenLabs ----------
const EL = 'https://api.elevenlabs.io/v1';
const player = new Audio();
let playing = false;
let queue = Promise.resolve();
let generation = 0; // stopSpeaking() zneplatní vše, co čeká ve frontě
let warned = false;

export const useEleven = () => { const s = settings(); return s.hlas === 'eleven' && !!s.elKey && !!s.elVoice; };

export class ElevenError extends Error {}
export function elevenErrorText(status, detail) {
  if (status === 401) return 'klíč k ElevenLabs je neplatný';
  if (status === 402 || /quota|credits/i.test(detail || '')) return 'došel kredit ElevenLabs na tento měsíc';
  if (status === 429) return 'příliš mnoho požadavků najednou';
  return `chyba ElevenLabs (${status || 'síť'})`;
}

export async function elevenFetch(path, init = {}) {
  let res;
  try {
    res = await fetch(EL + path, { ...init, headers: { 'xi-api-key': settings().elKey, ...(init.headers || {}) } });
  } catch { throw new ElevenError(elevenErrorText(0)); }
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { /* bez detailu */ }
    throw new ElevenError(elevenErrorText(res.status, detail));
  }
  return res;
}

const elSpeed = rate => Math.min(1.2, Math.max(0.7, rate));

// Každá věta se generuje jen jednou – pak se hraje z mezipaměti (šetří kredit, funguje i offline).
async function elevenAudio(text, rate) {
  const s = settings();
  const speed = elSpeed(rate);
  const key = new Request(`https://tts.cache/${s.elVoice}/${s.elModel}/${speed}/${encodeURIComponent(text)}`);
  let cache = null;
  try { cache = await caches.open('pablo-hlas'); } catch { /* bez mezipaměti */ }
  const hit = cache && await cache.match(key);
  if (hit) return URL.createObjectURL(await hit.blob());
  const res = await elevenFetch(`/text-to-speech/${encodeURIComponent(s.elVoice)}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: s.elModel,
      language_code: 'it',
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, speed, use_speaker_boost: true },
    }),
  });
  const blob = await res.blob();
  cache?.put(key, new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } })).catch(() => {});
  return URL.createObjectURL(blob);
}

function playUrl(url) {
  return new Promise(resolve => {
    const done = () => { playing = false; URL.revokeObjectURL(url); emit('end'); resolve(); };
    player.onended = done;
    player.onerror = done;
    player.src = url;
    playing = true;
    emit('start');
    player.play().catch(done);
  });
}

// ---------- Hlas iPhonu ----------
function speakNative(text, rate) {
  return new Promise(resolve => {
    if (!synth || !text.trim()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.onstart = () => emit('start');
    u.onboundary = () => emit('boundary');
    u.onend = u.onerror = () => { emit('end'); resolve(); };
    synth.speak(u);
  });
}

// iOS pustí zvuk až po prvním dotyku – tohle se volá z obsluhy kliknutí.
let unlocked = false;
export function unlockSpeech() {
  if (unlocked) return;
  unlocked = true;
  if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); }
  player.src = silentWav();
  player.play().catch(() => {});
}

function silentWav() {
  const n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  let bin = ''; new Uint8Array(buf).forEach(b => (bin += String.fromCharCode(b)));
  return 'data:audio/wav;base64,' + btoa(bin);
}

// Přidá text do fronty předčítání. Promise se splní, až dočte.
export function speak(text, { rate } = {}) {
  text = (text || '').trim();
  if (!text) return Promise.resolve();
  const r = rate ?? settings().rate;
  if (!useEleven()) return speakNative(text, r);
  const gen = generation;
  const audio = elevenAudio(text, r); // stahování začne hned, přehraje se až na řadě
  audio.catch(() => {});
  queue = queue.then(async () => {
    if (gen !== generation) return;
    let url;
    try { url = await audio; } catch (e) {
      if (!warned) { warned = true; import('./ui.js').then(m => m.toast(`Hlas ElevenLabs nejde (${e.message}), mluvím hlasem iPhonu`)); }
      return speakNative(text, r);
    }
    if (gen !== generation) return URL.revokeObjectURL(url);
    await playUrl(url);
  });
  return queue;
}

export function stopSpeaking() {
  generation++;
  queue = Promise.resolve();
  player.pause();
  playing = false;
  synth?.cancel();
  emit('end');
}
export const isSpeaking = () => playing || !!synth?.speaking;

// ---------- Rozpoznání řeči ----------
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!Recognition;

export function listen({ onInterim, lang = 'it-IT' } = {}) {
  let rec;
  const promise = new Promise((resolve, reject) => {
    rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      onInterim?.((finalText + ' ' + interim).trim());
    };
    rec.onerror = e => (e.error === 'no-speech' || e.error === 'aborted') ? resolve(finalText.trim()) : reject(e.error);
    rec.onend = () => resolve(finalText.trim());
    rec.start();
  });
  return { promise, stop: () => rec?.stop() };
}
