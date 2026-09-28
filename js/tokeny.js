// Rozdělení italského textu na slova pro klepací slovníček.
// Elize se dělí za apostrofem: „l’acqua“ → „l’“ + „acqua“, „Dov’è“ → „Dov’“ + „è“.
export const RE_SLOVO = /[A-Za-zÀ-ÖØ-öø-ÿ]+[’']?/g;

export function tokeny(text) {
  return (text.match(RE_SLOVO) || []);
}

// Klíč věty ve slovníčku: sjednocené apostrofy a mezery.
export const klicVety = s => s.replace(/'/g, '’').replace(/\s+/g, ' ').trim();
