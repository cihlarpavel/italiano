// Praktické tipy na cestu do Itálie. Údaje z ověřených zdrojů ke 28. 9. 2026 (zdroje u každé sekce).
// Položka: t = text (smí obsahovat <b>), cena = štítek s cenou, it = užitečná italská fráze k přehrání.
export const CESTA = {
  stav: '28. 9. 2026',
  sekce: [
    {
      id: 'auto', e: '🚗', nazev: 'Půjčení auta',
      body: [
        { t: 'Malé auto na den mimo sezónu (Milán, Neapol, Sicílie).', cena: 'cca 25–30 USD/den' },
        { t: 'V létě ceny rostou zhruba na dvojnásobek (Toskánsko v červenci, Sicílie v srpnu).', cena: 'cca 50–65 USD/den' },
        { t: 'Půjčovna zablokuje na kartě <b>kauci</b>, obvykle několik set až pár tisíc eur. Uvolní se za pár pracovních dní. Kauce není totéž co spoluúčast (<i>franchigia</i>).' },
        { t: 'Počítej s <b>kreditní kartou na jméno řidiče</b>. Debetní berou jen některé půjčovny a s omezeními (vyšší kauce, povinné připojištění).' },
        { t: 'S českým řidičákem mezinárodní průkaz nepotřebuješ.' },
        { t: 'Při převzetí si auto nafoť ze všech stran.', it: 'Vorrei noleggiare una macchina piccola.' },
      ],
      zdroje: [
        { nazev: 'Kayak', url: 'https://www.kayak.com/Italy-Car-Rentals.118.crc.html' },
        { nazev: 'Auto Europe', url: 'https://www.autoeurope.it/travel-blog/carte-di-credito-e-cauzione-in-sei-domande/' },
        { nazev: 'MZV ČR', url: 'https://mzv.gov.cz/rome/cz/viza_a_konzularni_informace/konzularni_informace_pro_italii/' },
      ],
    },
    {
      id: 'dalnice', e: '🛣️', nazev: 'Dálnice a mýtné',
      body: [
        { t: 'Dálniční známka se nekupuje. <b>Při vjezdu si vezmeš lístek, při výjezdu platíš</b> podle ujetých km: hotově nebo kartou.' },
        { t: 'Nejezdi do pruhů označených jen <b>Telepass</b>, jsou pro auta s palubní jednotkou.' },
        { t: 'Orientační sazba pro osobní auto (2026): v nížině 7–9 € na 100 km, v horách 9–14 €.', cena: '0,05–0,12 €/km' },
        { t: 'Milán → Řím', cena: 'cca 43–46 €' },
        { t: 'Bolzano → Verona (A22)', cena: 'cca 13 €' },
        { t: 'Palmanova → Tarvisio (A23)', cena: 'cca 11 €' },
        { t: 'Bologna → Florencie', cena: 'cca 9 €' },
        { t: 'Když u výjezdu nejde zaplatit, dostaneš doklad o nezaplacení. Do 15 dnů ho zaplatíš online bez sankce, potom hrozí pokuta 85–338 €.' },
        { t: 'Cestou přes Rakousko potřebuješ známku (10 dní 12,80 €), přes Slovinsko e-známku (7 dní 16 €).' },
      ],
      zdroje: [
        { nazev: 'Autostrade per l’Italia', url: 'https://www.autostrade.it/en/servizi-al-cliente/pedaggio/metodi-di-pagamento' },
        { nazev: 'Ayvens 2026', url: 'https://www.ayvens.com/it-it/blog/conducenti/costo-autostrada/' },
        { nazev: 'Telepass Moveo', url: 'https://moveo.telepass.com/calcolo-pedaggio/roma-milano-pedaggio-distanza-costi-carburante/' },
        { nazev: 'Cebia', url: 'https://www.cebia.cz/pruvodce/rakouska-dalnicni-znamka' },
      ],
    },
    {
      id: 'palivo', e: '⛽', nazev: 'Pohonné hmoty',
      body: [
        { t: 'Benzín, průměr za Itálii, samoobsluha (28. 9. 2026).', cena: 'cca 2,15 €/l' },
        { t: 'Nafta, průměr, samoobsluha (28. 9. 2026).', cena: 'cca 2,37 €/l' },
        { t: 'Na dálnici je palivo o pár centů dražší (benzín cca 2,21 €, nafta cca 2,42 €).' },
        { t: 'Stojan <b>„Self“</b> = natankuješ sám (levnější), <b>„Servito“</b> = natankuje obsluha (dražší).', it: 'Il pieno, per favore.' },
        { t: 'Benzín = <i>benzina</i>, nafta = <i>gasolio</i> (ne „nafta“!).' },
      ],
      zdroje: [{ nazev: 'MIMIT – průměrné ceny', url: 'https://www.mimit.gov.it/it/prezzi-carburanti-media-nazionale' }],
    },
    {
      id: 'pravidla', e: '🚦', nazev: 'Pravidla a pokuty',
      body: [
        { t: 'Rychlost: <b>dálnice 130</b> (za deště 110), hlavní silnice mimo obec 110 (za deště 90), ostatní silnice 90, <b>obec 50 km/h</b>.' },
        { t: 'Řidiči, kteří mají průkaz méně než 3 roky: dálnice nejvýš 100, hlavní silnice 90 km/h.' },
        { t: 'Alkohol: limit 0,5 ‰. Řidiči do 21 let a v prvních 3 letech řízení 0 ‰. Pokuty začínají na 573 €.' },
        { t: 'Mimo obec se jezdí se <b>světly i ve dne</b>.' },
        { t: 'Povinně: trojúhelník a <b>reflexní vesta</b> pro každého, kdo vystoupí na silnici.' },
        { t: 'Zimní výbava obvykle 15. 11.–15. 4. (zimní pneu nebo řetězy v autě), podle místního značení.' },
        { t: 'Překročení rychlosti o 10–40 km/h.', cena: '173–694 €' },
        { t: 'Většinu pokut zaplatíš o 30 % levněji, když je zaplatíš do 5 dnů. Pokuty chodí i do Česka: plať přímo italskému úřadu, ne vymahačské agentuře.' },
      ],
      zdroje: [
        { nazev: 'ACI – čl. 142', url: 'https://aci.gov.it/codice-della-strada/art-142/' },
        { nazev: 'Portál řidiče', url: 'https://www.portalridice.cz/clanek/co-potrebujete-do-auta-pri-ceste-do-italie-2026-povinna-vybava-a-doklady-ridice' },
        { nazev: 'MZV – pokuty', url: 'https://mzv.gov.cz/jnp/cz/o_ministerstvu/faq/pokuta_v_silnicnim_provozu_v_zahranici.html' },
      ],
    },
    {
      id: 'parkovani', e: '🅿️', nazev: 'Parkování a zóny ZTL',
      body: [
        { t: '<b>Bílé</b> čáry = zdarma (pozor na značku s parkovacím kotoučem), <b>modré</b> = placené (automat nebo aplikace), <b>žluté</b> = vyhrazené, nestát.' },
        { t: '<b>ZTL</b> (<i>Zona a Traffico Limitato</i>) = centra měst, kam smí jen povolená auta. Hlídají je kamery a každý průjezd je samostatná pokuta.', cena: '83–332 €' },
        { t: 'Když bydlíš v hotelu uvnitř ZTL, zeptej se, jestli tvou SPZ nahlásí městu.', it: 'Può registrare la mia targa per la ZTL?' },
        { t: 'Stání na místě pro invalidy.', cena: '165–660 €' },
      ],
      zdroje: [
        { nazev: 'Sicurauto', url: 'https://www.sicurauto.it/news/codice-della-strada/strisce-gialle-parcheggio-regole-e-sanzioni/' },
        { nazev: 'Verti – pokuty ZTL', url: 'https://www.verti.it/blog/multa-ztl/' },
      ],
    },
    {
      id: 'vlaky', e: '🚆', nazev: 'Vlaky a MHD',
      body: [
        { t: 'Rychlovlaky <b>Frecciarossa</b> (Trenitalia) a <b>Italo</b>: Milán → Řím za necelé 3 hodiny. Čím dřív koupíš, tím levněji.', cena: 'od cca 17 €' },
        { t: 'Řím → Neapol: Italo v akci, regionální vlak kolem 12,50 €.', cena: 'od cca 8 €' },
        { t: '<b>Papírovou jízdenku na regionální vlak označ</b> v automatu na nádraží před nástupem, jinak dostaneš pokutu. Elektronická jízdenka se aktivuje sama.', it: 'Un biglietto per Firenze, per favore.' },
        { t: 'Řím, MHD: jízdenka BIT platí 100 minut. Jde platit i bezkontaktní kartou přímo u vstupu.', cena: '1,50 €' },
        { t: 'Řím, celodenní jízdenka.', cena: '8,50 €' },
        { t: 'Milán, MHD: jízdenka na 90 minut, s kartou nejvýš 7,60 € za den. Papírové jízdenky se od 2026 neprodávají.', cena: '2,20 €' },
      ],
      zdroje: [
        { nazev: 'Trenitalia', url: 'https://www.trenitalia.com/it/regionale/viaggiare-con-il-regionale.html' },
        { nazev: 'Italo', url: 'https://www.italotreno.com/en/destinations-timetable/rome-naples-tickets' },
        { nazev: 'ATAC Řím', url: 'https://www.atac.roma.it/biglietti-e-abbonamenti/bit' },
        { nazev: 'ATM Milán', url: 'https://www.omnimilano.it/servizi/biglietti-atm-milano/' },
      ],
    },
    {
      id: 'obchod', e: '🛒', nazev: 'Ceny v obchodě',
      body: [
        { t: 'Chléb 500 g', cena: 'cca 2 €' },
        { t: 'Mléko 1 l', cena: 'cca 1,40 €' },
        { t: 'Těstoviny 500 g (Barilla / levná značka)', cena: '1,35 € / 0,60 €' },
        { t: 'Vejce 12 ks', cena: 'cca 3,70 €' },
        { t: 'Voda 1,5 l', cena: 'cca 0,50 €' },
        { t: 'Místní sýr 1 kg', cena: 'cca 15 €' },
        { t: 'Víno střední třídy, lahev', cena: 'cca 7 €' },
        { t: 'Pivo 0,5 l', cena: 'cca 1,60 €' },
        { t: 'Nejlevnější jsou diskonty (Lidl, Eurospin, MD). V centrech turistických měst je všechno dražší.' },
      ],
      zdroje: [{ nazev: 'Numbeo 9/2026', url: 'https://www.numbeo.com/cost-of-living/country_result.jsp?country=Italy&displayCurrency=EUR' }],
    },
    {
      id: 'restaurace', e: '🍝', nazev: 'Restaurace a bary',
      body: [
        { t: 'Espresso u baru, průměr (Messina 1,06 €, Bolzano 1,51 €). U stolu je dražší, na turistických náměstích klidně i 9 €.', cena: 'cca 1,30 €', it: 'Un caffè, per favore.' },
        { t: 'Cappuccino', cena: 'cca 1,80 €' },
        { t: 'Espresso + cornetto u baru', cena: '1,50–2,50 €' },
        { t: 'Pizza margherita, průměr', cena: 'cca 7 €' },
        { t: 'Polední menu (<i>menu del giorno</i>), často včetně vody nebo čtvrtky vína', cena: '10–18 €' },
        { t: 'Zmrzlina, 2 kopečky', cena: '3–3,50 €' },
        { t: '<b>Coperto</b> = poplatek za chléb a prostírání na osobu, je normální a není to spropitné.', cena: 'cca 1,50–3 €' },
        { t: '<b>Servizio</b> = obsluha 10–15 % připočtená na účtu. Když je na účtu, nic dalšího nedávej.' },
        { t: 'Spropitné není povinné. U baru se zaokrouhluje, v restauraci 5–10 % jen za výbornou obsluhu.' },
        { t: 'V baru často platíš nejdřív u pokladny a s účtenkou si objednáš u pultu.', it: 'Il conto, per favore.' },
      ],
      zdroje: [
        { nazev: 'QuiFinanza – káva 2026', url: 'https://quifinanza.it/lifestyle/food-economy/caffe-bar-prezzi-italia-2026/1012413/' },
        { nazev: 'FIPE – pizza', url: 'https://www.fipe.it/2026/01/16/losservatorio-socio-economico-della-pizza-napoletana-presenta-lindice-pizza-napoletana-margherita-e-offre-un-quadro-del-comparto/' },
        { nazev: 'Coperto 2026', url: 'https://www.ristorazioneitalianamagazine.it/costo-coperto-ristorante-2026/' },
      ],
    },
    {
      id: 'ubytovani', e: '🏨', nazev: 'Ubytování a Benátky',
      body: [
        { t: '<b>Pobytová taxa</b> (<i>tassa di soggiorno</i>) se platí na místě za osobu a noc, podle počtu hvězdiček.' },
        { t: 'Řím (nejvýš 10 nocí)', cena: '4–10 €/noc' },
        { t: 'Florencie (nejvýš 7 nocí)', cena: '3,50–8 €/noc' },
        { t: 'Benátky (nejvýš 5 nocí, děti do 10 let zdarma)', cena: '1–5 €/noc' },
        { t: '<b>Vstupné do Benátek</b> pro jednodenní návštěvníky se v roce 2026 platilo v 60 vybraných dnech (duben–červenec, hlavně víkendy), 5 € předem, jinak 10 €. Pro další sezónu si termíny ověř na webu města.' },
      ],
      zdroje: [
        { nazev: 'Řím', url: 'https://chekin.com/it/blog/tassa-di-soggiorno-roma/' },
        { nazev: 'Florencie', url: 'https://www.ttgitalia.com/incoming/tassa-di-soggiorno-firenze-2026-tariffe-esenzioni-e-come-si-paga-FN25937727' },
        { nazev: 'Comune di Venezia', url: 'https://live.comune.venezia.it/it/2026/03/domani-apre-il-portale-il-contributo-di-accesso-2026-confermata-quota-da-5-10-euro' },
      ],
    },
    {
      id: 'plaze', e: '🏖️', nazev: 'Pláže',
      body: [
        { t: 'Placené pláže (<i>stabilimento balneare</i>): slunečník + 2 lehátka v srpnu v průměru 225 € na týden.' },
        { t: 'Nejlevnější Lignano a Rimini, přepočteno na den.', cena: 'cca 22–23 €/den' },
        { t: 'Nejdražší Alassio, přepočteno na den. Na jeden den bývá tarif vyšší než týdenní průměr.', cena: 'cca 49 €/den' },
        { t: '<b>Spiaggia libera</b> = volná pláž zdarma, s vlastní osuškou a slunečníkem.', it: 'Un ombrellone e due lettini, per favore.' },
      ],
      zdroje: [{ nazev: 'Altroconsumo 2026', url: 'https://www.altroconsumo.it/auto-e-moto/automobili/news/spiagge-prezzi-stabilimenti' }],
    },
    {
      id: 'penize', e: '💳', nazev: 'Peníze, telefon, elektřina',
      body: [
        { t: 'Karty se berou skoro všude, bezkontaktně zaplatíš i mýtné a MHD. Na trhy a do malých barů se hodí trochu hotovosti.' },
        { t: 'Roaming v EU za domácí ceny (platí do roku 2032).' },
        { t: 'Zásuvky 230 V typu C, F a L. Plochá „eurozástrčka“ projde všude, s kulatou českou zástrčkou do úzké zásuvky typu L potřebuješ <b>adaptér</b>.' },
      ],
      zdroje: [
        { nazev: 'Rada EU – roaming', url: 'https://www.consilium.europa.eu/en/press/press-releases/2022/04/04/mobile-roaming-with-no-extra-fees-to-continue-as-council-approves-revised-regulation/' },
        { nazev: 'Zásuvky', url: 'https://www.electricplug.eu/en/list-of-countries/italy/' },
      ],
    },
    {
      id: 'zdravi', e: '🚑', nazev: 'Zdraví a bezpečnost',
      body: [
        { t: 'Tísňová linka <b>112</b>.', it: 'Aiuto! Chiamate un’ambulanza!' },
        { t: 'S <b>kartičkou pojištěnce (EHIC)</b> dostaneš nutnou péči za stejných podmínek jako Italové, včetně spoluúčasti. Zubaři jsou většinou soukromí, proto se vyplatí i cestovní pojištění.' },
        { t: 'Lékárnu (<i>farmacia</i>) poznáš podle zeleného kříže.', it: 'Dov’è la farmacia più vicina?' },
        { t: 'Pozor na <b>kapsáře</b> v MHD, na nádražích a plážích. V Neapoli drž tašku na straně od silnice, zloději ji vytrhávají ze skútrů. Za nákup padělků od pouličních prodejců hrozí pokuta.' },
        { t: 'Před cestou se můžeš zaregistrovat v systému MZV <b>DROZD</b>.' },
      ],
      zdroje: [
        { nazev: 'VZP – EHIC', url: 'https://www.vzp.cz/pojistenci/cestovani-a-pobyt-v-zahranici/evropsky-prukaz-zdravotniho-pojisteni' },
        { nazev: 'MZV – Itálie', url: 'https://mzv.gov.cz/rome/cz/viza_a_konzularni_informace/konzularni_informace_pro_italii/' },
      ],
    },
    {
      id: 'zvyklosti', e: '📅', nazev: 'Zvyklosti a svátky',
      body: [
        { t: 'Státní svátky: 1. 1., 6. 1., Velikonoční pondělí, 25. 4., 1. 5., 2. 6., <b>15. 8. (Ferragosto)</b>, 1. 11., 8. 12., 25. a 26. 12. Od roku 2026 nově i 4. 10. (sv. František).' },
        { t: 'Kolem 15. srpna jsou v Itálii dovolené a mnoho podniků ve městech zavírá.' },
        { t: 'Mimo velká města a na jihu mívají obchody polední pauzu zhruba 13–16 h, v neděli bývají menší obchody zavřené.' },
        { t: 'Do kostelů zakrytá ramena a kolena, ve velkých bazilikách to kontrolují u vstupu.' },
        { t: '„Un caffè“ je espresso. Cappuccino se pije ráno, k obědu je to pro Italy zvláštní.', it: 'Un cappuccino e un cornetto, per favore.' },
      ],
      zdroje: [{ nazev: 'Geopop – 4. října', url: 'https://www.geopop.it/4-ottobre-torna-festa-nazionale-san-francesco-d-assisi-cosa-cambia-perche-abolita/' }],
    },
  ],
};
