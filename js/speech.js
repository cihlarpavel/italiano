// Hlas (předčítání) i rozpoznání řeči zajišťuje přímo iPhone – zdarma a bez API.
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
  // Kvalitnější hlasy (Enhanced / Premium) dopředu.
  return [...voicesCache].sort((a, b) => score(b) - score(a));
}
const score = v => (/premium/i.test(v.name) ? 3 : 0) + (/enhanced|vylepšen/i.test(v.name) ? 2 : 0) + (/alice|federica|emma/i.test(v.name) ? 1 : 0);

function pickVoice() {
  const want = settings().voice;
  const list = italianVoices();
  return list.find(v => v.voiceURI === want) || list[0] || null;
}

// iOS pustí zvuk až po prvním dotyku – tohle se volá z obsluhy kliknutí.
let unlocked = false;
export function unlockSpeech() {
  if (unlocked || !synth) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
  unlocked = true;
}

const listeners = new Set();
export function onSpeechActivity(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = (type, data) => listeners.forEach(fn => fn(type, data));

// Přidá text do fronty předčítání. Promise se splní, až dočte.
export function speak(text, { rate } = {}) {
  return new Promise(resolve => {
    if (!synth || !text.trim()) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate ?? settings().rate;
    u.onstart = () => emit('start');
    u.onboundary = () => emit('boundary');
    u.onend = u.onerror = () => { emit('end'); resolve(); };
    synth.speak(u);
  });
}

export function stopSpeaking() { synth?.cancel(); emit('end'); }
export const isSpeaking = () => !!synth?.speaking;

// ---- Rozpoznání řeči ----
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
