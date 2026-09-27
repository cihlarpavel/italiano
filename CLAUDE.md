# Italiano – výuková aplikace italštiny (osobní projekt)

Statická PWA pro iPhone, bez build kroku. Uživatel je Čech, začátečník (A1–A2). Rozhraní i vysvětlivky česky.
Popis a nasazení viz README.md.

- Obsah je jen v `js/data.js`. Časování se generuje funkcí `tvary()` z kmenů. Po změně ho ověř výpisem všech tvarů.
- Konverzace volá Claude API přímo z prohlížeče (`dangerouslyAllowBrowser`). Klíč zadává uživatel v aplikaci, nikdy ho nevkládej do kódu.
- Po každé změně souborů zvyš `CACHE` v `sw.js`, jinak telefon drží starou verzi.
- Lokální test: `python3 -m http.server 8765`. Service worker při testování maže mezipaměť, jinak se ukazují staré soubory.
