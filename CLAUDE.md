# Pablo italiano – výuková aplikace italštiny (osobní projekt)

Statická PWA pro iPhone, bez build kroku. Uživatel je Čech, začátečník (A1–A2). Rozhraní i vysvětlivky česky.
Popis a nasazení viz README.md.

- Obsah je jen v `js/data.js`. Časování se generuje funkcí `tvary()` z kmenů. Po změně ho ověř výpisem všech tvarů.
- Konverzace volá Claude API přímo z prohlížeče (`dangerouslyAllowBrowser`). Klíč zadává uživatel v aplikaci, nikdy ho nevkládej do kódu.
- Service worker je „nejdřív síť“. Kdyby byl „nejdřív mezipaměť“, po aktualizaci by se smíchaly nové a staré moduly a import by spadl. Po změně souborů zvyš `CACHE` v `sw.js`.
- Lokální test: server s `Cache-Control: no-store`. Prostý `http.server` nechá prohlížeč držet staré moduly. Service worker při testování maže mezipaměť, jinak se ukazují staré soubory.
- Laditelné parametry jsou v `PARAMS` (`js/prizpusobit.js`) a jejich výchozí hodnoty v `DEFAULT_SETTINGS` (`js/store.js`). Nový parametr = obojí + použití v kódu. Hodnoty od modelu se vždy validují.
- Uživatel posílá „přání na další verzi“ z obrazovky Přizpůsobit. To jsou požadavky na nové funkce.
- Nasazení: GitHub Pages z větve `main` (repo cihlarpavel/italiano, https://cihlarpavel.github.io/italiano/). Aktualizace = zvýšit `CACHE` v `sw.js`, commit, `git push`; Pages se sestaví samy do ~1 min. `gh` je v `~/.local/bin/gh`.
- Hlas: `speech.js` → ElevenLabs (klíč zadává uživatel v Nastavení, volání přímo z prohlížeče, CORS povoluje), při chybě automaticky hlas iPhonu. Vygenerované věty se ukládají do Cache Storage `pablo-hlas` (SW ji nemaže).
