// Vše se ukládá jen v tomto telefonu (localStorage). Každý přístup je v try/catch –
// v anonymním režimu nebo při zablokovaných datech webu může přístup selhat.

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* bez uložení */ }
}

export const today = () => new Date().toLocaleDateString('sv'); // YYYY-MM-DD v místním čase

export const DEFAULT_SETTINGS = {
  jmeno: 'Paolo',
  hlas: 'iphone',          // 'iphone' | 'eleven'
  elKey: '',
  elVoice: '',
  elVoiceName: '',
  elModel: 'eleven_flash_v2_5',
  apiKey: '',
  model: 'claude-opus-5',
  rate: 0.9,
  voice: '',
  showCz: true,
  direction: 'it-cs',
  newPerDay: 10,
  goal: 30,
  // Ladí se přes obrazovku Přizpůsobit (přání v přirozené řeči):
  intervalScale: 1,       // < 1 = karty se vracejí dřív
  extraReview: 0,         // kolik už naučených karet přidat do dnešní lekce navíc
  autoSpeak: true,
  giuliaLevel: 'A1–A2',
  giuliaLength: 'kratke',
  giuliaCorrections: 'vse',
  giuliaHints: true,
  giuliaPokyny: [],       // vlastní pokyny pro Giulii
};

export function settings() {
  const s = { ...DEFAULT_SETTINGS, ...load('settings', {}) };
  if (s.jmeno === 'Pablo') s.jmeno = 'Paolo'; // aplikace se přejmenovala z Pablo na Paolo italiano
  return s;
}

export function setSettings(patch) {
  save('settings', { ...settings(), ...patch });
}

// Denní aktivita pro přehled a sérii dnů.
export function logActivity(kind, n = 1) {
  const s = load('stats', { days: {} });
  const d = today();
  s.days[d] = s.days[d] || {};
  s.days[d][kind] = (s.days[d][kind] || 0) + n;
  save('stats', s);
}

export function streak() {
  const days = load('stats', { days: {} }).days;
  let n = 0;
  const d = new Date();
  if (!days[today()]) d.setDate(d.getDate() - 1); // dnešek se ještě může stihnout
  for (;;) {
    const key = d.toLocaleDateString('sv');
    if (!days[key]) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function todayCount(kind) {
  return (load('stats', { days: {} }).days[today()] || {})[kind] || 0;
}
