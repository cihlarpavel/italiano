# Italiano – aplikace na výuku italštiny

Webová aplikace pro iPhone, která se připne na plochu a pak se chová jako normální aplikace.
Nepotřebuje App Store ani Xcode.

- **Dnešní lekce**: jedno tlačítko na úvodní obrazovce smíchá, co je dnes na řadě ze všech balíčků.
- **Kartičky**: slovíčka (215), vazby (43), fráze (55). Opakují se v intervalech: co nevíš, uvidíš brzy znovu, co umíš, až za dny či týdny.
- **Časy**: dril časování 20 nejčastějších sloves (presente, passato prossimo, imperfetto, futuro), tabulky a vysvětlení.
- **Překladač**: řekneš větu česky nebo italsky a dostaneš ji přeloženou textem; nebo vyfotíš italský text (menu, cedule) a dostaneš překlad i slovíčka. Cokoli jde jedním klepnutím přidat do balíčku Moje slovíčka.
- **Mluvení s Giulií**: konverzace nahlas s avatarkou v 7 situacích. Opraví chyby a přeloží, co řekla.
- **✨ Přizpůsobit**: přání česky („dávej mi častěji opakování“, „Giulia ať mluví delšími větami“). Claude ho převede na změny nastavení nebo na pokyny pro Giulii. Změny se ukážou předem, dají se vrátit a co aplikace neumí, uloží se do seznamu přání pro další verzi.

Postup, slovíčka i nastavení se ukládají jen v telefonu. Kartičky a časy fungují i offline.

## Jak to funguje

| Část | Co ji zajišťuje | Cena |
|---|---|---|
| Předčítání italsky | hlas iPhonu (Web Speech API) | zdarma |
| Rozpoznání řeči | iPhone (Web Speech API), jinak diktování na klávesnici | zdarma |
| Giuliiny odpovědi | Claude API (model Claude Opus 5, v nastavení lze zvolit levnější) | cca 0,3 Kč za odpověď |

Klíč k API se zadává v aplikaci (Nastavení) a uloží se jen do telefonu. Aplikace volá
přímo `api.anthropic.com`, žádný vlastní server nemá. Útratu ukazuje v Nastavení (orientačně).
Na console.anthropic.com doporučuji nastavit měsíční limit útraty.

## Nasazení

Běží na **https://cihlarpavel.github.io/italiano/** (GitHub Pages z větve `main`). Aktualizace: zvýšit `CACHE` v `sw.js`, commit, `git push`.

Obecně:

Aplikace je statická (HTML/CSS/JS bez sestavování). Mikrofon a instalace na plochu vyžadují
HTTPS, takže ji musí servírovat hosting s HTTPS, například **GitHub Pages**:

1. Nahrát obsah složky do repozitáře na GitHubu.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Na iPhonu otevřít adresu v **Safari** → Sdílet → **Přidat na plochu**.

Když změníš soubory, zvyš verzi `CACHE` v `sw.js`. Jinak telefon drží starou verzi z mezipaměti.

Lokální vyzkoušení na Macu:

```bash
python3 -m http.server 8765
```

a otevřít http://localhost:8765.

## Soubory

- `js/data.js` – veškerý obsah (slovíčka, vazby, fráze, slovesa, scénáře konverzace)
- `js/app.js` – obrazovky, kartičky, dril časů, nastavení
- `js/claude.js` – společné volání Claude API (model, útrata, chybové hlášky)
- `js/preklad.js` – překladač hlasem, textem a z fotky; balíček Moje slovíčka
- `js/ui.js` – ikony a sdílené prvky rozhraní
- `js/chat.js` – konverzace s Giulií, avatar, volání Claude API, počítání útraty
- `js/prizpusobit.js` – úpravy aplikace přáním; seznam laditelných parametrů je `PARAMS`
- `js/speech.js` – předčítání a rozpoznání řeči
- `js/store.js` – ukládání v telefonu
- `sw.js` – offline režim
