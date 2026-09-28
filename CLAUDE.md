# Paolo italiano – výuková aplikace italštiny (osobní projekt)

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
- Obsah záložky Itálie je statický: `js/italie_top.js` prošel kontrolou faktů, `js/italie_cesta.js` má u každé sekce zdroje a datum `stav`. Při aktualizaci cen změň i `stav`.
- Stránka (`body`) se nikdy neposouvá, posouvá se jen `#app` (`position: fixed`, `overflow-y: auto`). Na iPhonu jinak „pružení“ stránky posouvalo spodní lištu. Pro posun používej `app.scrollTo`, ne `window.scrollTo`.
- Paměť: `pamet.js`. Lokální záznamy: `opravy`, `drillStats`, `srs[].lapses/zalozeno`, `stats.days`. Profil (`profil`) aktualizuje Claude na pozadí (`mozna()`) po rozhovoru nebo po nasbírání dat. Doporučení od modelu se vždy validují (`validujDoporuceni`), bez klíče se počítají lokálně.
- Mezipaměť hlasu se jmenuje `pablo-hlas` (historický název). Nepřejmenovávat, jinak se ztratí už vygenerované nahrávky.
- Top 1000: zdroj jsou `data/top/*.json` (po kategoriích, každá prošla nezávislou kontrolou faktů). `node tools/sloucit_top.mjs` je spojí do `data/top1000.json` (deduplikace, sjednocení regionů, kontrola souřadnic). Aplikace čte jen `data/top1000.json`.
- Mapa: `js/mapa.js` (Leaflet z cdnjs, dlaždice OSM; CARTO chce klíč). Místa v `localStorage.mista`, fotky v IndexedDB (`js/fotky.js`), záloha fotek volitelně.
- Ikona: `tools/ikona.py` (bílá bublina s velkým P a malým „italiano“ na pozadí vlajky). Barvy: proměnné `--it-green`, `--it-red`, `--tricolore` ve `styles.css`.
- Klepací slovníček: `js/slova.js` + `js/tokeny.js`. Pro obsah kurzu je offline `data/slovnik.json` (klíč = věta, pole slov ve stejném pořadí jako `tokeny()`). Při přidání nových frází ho doplň, jinak se význam dotáže Clauda (Sonnet) a uloží do `slovaCache`. Italský text se klepacím dělá funkcí `klikaci(text)`.
- Synchronizace: `js/sync.js`, soukromý repozitář `<login>/italiano-data`, soubor `paolo-italiano.json` přes GitHub Contents API a fine-grained token (Contents RW) zadaný uživatelem. Slučování po klíčích (`SLUC`): kartičky podle `upd`, místa podle `upd` a náhrobků `mistaSmazana`, statistiky maximem. Klíče k API a nastavení hlasu se nesynchronizují (`TAJNE_NASTAVENI`), stav UI taky ne (`LOKALNI`). Každý nový klíč v localStorage, který se má synchronizovat, potřebuje pravidlo v `SLUC`, jinak vyhrává lokální hodnota.
