// Obsah kurzu – úroveň A1–A2. Podstatná jména se učí se členem.

import { load } from './store.js';

const t = (topic, pairs) => pairs.map(([it, cs]) => ({ it, cs, topic }));

export const VOCAB = [
  ...t('Základy', [
    ['ciao', 'ahoj / čau'], ['buongiorno', 'dobrý den'], ['buonasera', 'dobrý večer'],
    ['buonanotte', 'dobrou noc'], ['arrivederci', 'na shledanou'], ['per favore', 'prosím (když něco chci)'],
    ['grazie', 'děkuji'], ['prego', 'prosím / není zač'], ['scusi', 'promiňte (vykání)'],
    ['scusa', 'promiň (tykání)'], ['sì', 'ano'], ['no', 'ne'], ['va bene', 'dobře, v pořádku'],
    ['forse', 'možná'], ['certo', 'jistě'], ['allora', 'tak / takže'], ['anche', 'také'],
    ['ma', 'ale'], ['perché', 'proč / protože'], ['quando', 'kdy'], ['dove', 'kde'],
    ['come', 'jak'], ['che cosa', 'co'], ['chi', 'kdo'], ['quanto', 'kolik'],
    ['molto', 'velmi / hodně'], ['poco', 'málo'], ['sempre', 'vždy'], ['mai', 'nikdy (se záporem: non bevo mai)'],
    ['oggi', 'dnes'], ['domani', 'zítra'], ['ieri', 'včera'], ['adesso', 'teď'],
    ['dopo', 'potom'], ['prima', 'předtím / nejdřív'], ['qui', 'tady'], ['lì', 'tam'],
  ]),
  ...t('Čísla', [
    ['uno', '1'], ['due', '2'], ['tre', '3'], ['quattro', '4'], ['cinque', '5'],
    ['sei', '6'], ['sette', '7'], ['otto', '8'], ['nove', '9'], ['dieci', '10'],
    ['undici', '11'], ['dodici', '12'], ['venti', '20'], ['trenta', '30'],
    ['cinquanta', '50'], ['cento', '100'], ['mille', '1000'],
  ]),
  ...t('Jídlo a pití', [
    ['il pane', 'chléb'], ["l'acqua", 'voda'], ['il vino', 'víno'], ['la birra', 'pivo'],
    ['il caffè', 'káva (v baru = espresso)'], ['il latte', 'mléko'], ['lo zucchero', 'cukr'], ['il sale', 'sůl'],
    ["l'olio", 'olej'], ['il formaggio', 'sýr'], ['la carne', 'maso'], ['il pesce', 'ryba'],
    ['il pollo', 'kuře'], ['la verdura', 'zelenina'], ['la frutta', 'ovoce'], ['la mela', 'jablko'],
    ['il pomodoro', 'rajče'], ["l'uovo", 'vejce (mn. č. le uova)'], ['la pasta', 'těstoviny'],
    ['il gelato', 'zmrzlina'], ['la colazione', 'snídaně'], ['il pranzo', 'oběd'], ['la cena', 'večeře'],
    ['il conto', 'účet'], ['il cameriere', 'číšník'], ['il menù', 'jídelní lístek'],
    ['buono', 'dobrý'], ['caldo', 'teplý / horký'], ['freddo', 'studený'], ['dolce', 'sladký'],
  ]),
  ...t('Rodina a lidé', [
    ['la famiglia', 'rodina'], ['la madre', 'matka'], ['il padre', 'otec'], ['il fratello', 'bratr'],
    ['la sorella', 'sestra'], ['il figlio', 'syn'], ['la figlia', 'dcera'], ['il marito', 'manžel'],
    ['la moglie', 'manželka'], ['il nonno', 'dědeček'], ['la nonna', 'babička'],
    ["l'amico", 'kamarád'], ["l'amica", 'kamarádka'], ['il ragazzo', 'kluk / přítel'],
    ['la ragazza', 'holka / přítelkyně'], ['il bambino', 'dítě (chlapec)'], ['la gente', 'lidé (it. jednotné číslo: la gente è…)'],
    ["l'uomo", 'muž (mn. č. gli uomini)'], ['la donna', 'žena'],
  ]),
  ...t('Město a cestování', [
    ['la città', 'město'], ['la strada', 'ulice / silnice'], ['la piazza', 'náměstí'],
    ['la stazione', 'nádraží'], ['il treno', 'vlak'], ["l'autobus", 'autobus'], ['la macchina', 'auto'],
    ["l'aereo", 'letadlo'], ["l'aeroporto", 'letiště'], ['il biglietto', 'lístek / jízdenka'],
    ["l'albergo", 'hotel'], ['la camera', 'pokoj'], ['la chiave', 'klíč'], ['il negozio', 'obchod'],
    ['il mercato', 'trh'], ['la farmacia', 'lékárna'], ["l'ospedale", 'nemocnice'], ['la chiesa', 'kostel'],
    ['il museo', 'muzeum'], ['la spiaggia', 'pláž'], ['il mare', 'moře'], ['la montagna', 'hora / hory'],
    ['a destra', 'vpravo'], ['a sinistra', 'vlevo'], ['dritto', 'rovně'], ['vicino', 'blízko'], ['lontano', 'daleko'],
  ]),
  ...t('Čas', [
    ['il giorno', 'den'], ['la settimana', 'týden'], ['il mese', 'měsíc'], ["l'anno", 'rok'],
    ["l'ora", 'hodina'], ['il minuto', 'minuta'], ['la mattina', 'ráno / dopoledne'],
    ['il pomeriggio', 'odpoledne'], ['la sera', 'večer'], ['la notte', 'noc'],
    ['lunedì', 'pondělí'], ['martedì', 'úterý'], ['mercoledì', 'středa'], ['giovedì', 'čtvrtek'],
    ['venerdì', 'pátek'], ['sabato', 'sobota'], ['domenica', 'neděle'], ['presto', 'brzy'], ['tardi', 'pozdě'],
  ]),
  ...t('Doma', [
    ['la casa', 'dům / domov'], ["l'appartamento", 'byt'], ['la cucina', 'kuchyně'], ['il bagno', 'koupelna / WC'],
    ['la porta', 'dveře'], ['la finestra', 'okno'], ['il letto', 'postel'], ['il tavolo', 'stůl'], ['la sedia', 'židle'],
  ]),
  ...t('Popis', [
    ['grande', 'velký'], ['piccolo', 'malý'], ['bello', 'hezký'], ['brutto', 'ošklivý'],
    ['nuovo', 'nový'], ['vecchio', 'starý'], ['giovane', 'mladý'], ['caro', 'drahý'],
    ['economico', 'levný'], ['facile', 'snadný'], ['difficile', 'těžký (obtížný)'], ['stanco', 'unavený'],
    ['contento', 'spokojený'], ['felice', 'šťastný'], ['triste', 'smutný'], ['pronto', 'připravený'],
    ['libero', 'volný'], ['occupato', 'obsazený / zaneprázdněný'],
    ['rosso', 'červený'], ['bianco', 'bílý'], ['nero', 'černý'], ['verde', 'zelený'],
    ['giallo', 'žlutý'], ['blu', 'modrý (tmavě)'], ['azzurro', 'blankytně modrý'],
  ]),
  ...t('Slovesa', [
    ['essere', 'být'], ['avere', 'mít'], ['fare', 'dělat'], ['andare', 'jít / jet'], ['venire', 'přijít / přijet'],
    ['stare', 'být (stav), zůstat'], ['parlare', 'mluvit'], ['mangiare', 'jíst'], ['bere', 'pít'],
    ['dormire', 'spát'], ['lavorare', 'pracovat'], ['abitare', 'bydlet'], ['capire', 'rozumět'],
    ['sapere', 'vědět / umět'], ['conoscere', 'znát'], ['volere', 'chtít'], ['potere', 'moci'],
    ['dovere', 'muset'], ['prendere', 'vzít / dát si'], ['vedere', 'vidět'], ['sentire', 'slyšet / cítit'],
    ['pagare', 'platit'], ['comprare', 'kupovat'], ['aspettare', 'čekat'], ['cercare', 'hledat'],
    ['trovare', 'najít'], ['chiamarsi', 'jmenovat se'], ['piacere', 'líbit se / chutnat'],
    ['uscire', 'vyjít / jít ven'], ['tornare', 'vrátit se'], ['aprire', 'otevřít'], ['chiudere', 'zavřít'],
  ]),
];

export const VAZBY = [
  ...t('fare', [
    ['fare colazione', 'snídat'], ['fare la spesa', 'nakupovat (potraviny)'],
    ['fare una passeggiata', 'jít na procházku'], ['fare la doccia', 'sprchovat se'],
    ['fare una domanda', 'položit otázku'], ['fa caldo', 'je horko'], ['fa freddo', 'je zima (počasí)'],
    ['fare una foto', 'vyfotit'], ['fare attenzione', 'dávat pozor'], ['fare la fila', 'stát ve frontě'],
  ]),
  ...t('avere', [
    ['avere fame', 'mít hlad'], ['avere sete', 'mít žízeň'], ['avere sonno', 'být ospalý'],
    ['avere freddo', 'být (někomu) zima – ho freddo'], ['avere caldo', 'být (někomu) horko – ho caldo'], ['avere fretta', 'spěchat'],
    ['avere ragione', 'mít pravdu'], ['avere torto', 'nemít pravdu'], ['avere bisogno di', 'potřebovat'],
    ['avere voglia di', 'mít chuť na'], ['avere paura di', 'bát se'], ["ho trent'anni", 'je mi třicet let'],
  ]),
  ...t('prendere / andare / stare', [
    ['prendere il treno', 'jet vlakem'], ['prendere un caffè', 'dát si kávu'], ['prendere il sole', 'opalovat se'],
    ['prendere una decisione', 'rozhodnout se'], ['andare a casa', 'jít domů'], ['andare in vacanza', 'jet na dovolenou'],
    ['andare a piedi', 'jít pěšky'], ['andare in macchina', 'jet autem'], ["andare d'accordo", 'vycházet spolu, rozumět si'],
    ['stare bene', 'mít se dobře'], ['stare per', 'právě se chystat (něco udělat)'], ['stare zitto', 'mlčet (shoda: stai zitta, state zitti)'],
  ]),
  ...t('další', [
    ['dare una mano', 'pomoct'], ['dare fastidio', 'obtěžovat, vadit'], ["essere d'accordo", 'souhlasit'],
    ['essere in ritardo', 'mít zpoždění'], ['mi piace', 'líbí se mi / chutná mi (jedna věc)'],
    ['mi piacciono', 'líbí se mi / chutnají mi (více věcí)'], ["ci vuole un'ora", 'trvá to hodinu'],
    ['avere a che fare con', 'mít co do činění s'], ['vale la pena', 'stojí to za to'],
  ]),
];

export const FRAZE = [
  ...t('Seznámení', [
    ['Come ti chiami?', 'Jak se jmenuješ?'], ['Mi chiamo Marco.', 'Jmenuji se Marco.'],
    ['Piacere!', 'Těší mě!'], ['Di dove sei?', 'Odkud jsi?'], ['Sono ceco. / Sono ceca.', 'Jsem Čech. / Jsem Češka.'],
    ['Come stai?', 'Jak se máš?'], ['Come sta?', 'Jak se máte? (vykání)'], ['Bene, grazie, e tu?', 'Dobře, díky, a ty?'],
    ["Parlo un po' di italiano.", 'Mluvím trochu italsky.'], ['Non capisco.', 'Nerozumím.'],
    ['Può ripetere, per favore?', 'Můžete to zopakovat, prosím?'], ['Più piano, per favore.', 'Pomaleji, prosím.'],
    ['Come si dice … in italiano?', 'Jak se řekne … italsky?'], ['Che cosa significa?', 'Co to znamená?'],
  ]),
  ...t('Kavárna a restaurace', [
    ['Un caffè, per favore.', 'Jedno espresso, prosím.'], ['Vorrei un cappuccino.', 'Dal(a) bych si cappuccino.'],
    ['Il conto, per favore.', 'Účet, prosím.'], ['Quanto costa?', 'Kolik to stojí?'],
    ['Avete un tavolo per due?', 'Máte stůl pro dva?'], ['Cosa mi consiglia?', 'Co mi doporučíte?'],
    ['Sono vegetariano. / Sono vegetariana.', 'Jsem vegetarián. / Jsem vegetariánka.'],
    ['È buonissimo!', 'Je to vynikající!'], ['Posso pagare con la carta?', 'Můžu platit kartou?'],
  ]),
  ...t('Na cestě', [
    ["Dov'è la stazione?", 'Kde je nádraží?'], ['Scusi, come arrivo in centro?', 'Promiňte, jak se dostanu do centra?'],
    ['A che ora parte il treno per Roma?', 'V kolik odjíždí vlak do Říma?'],
    ['Un biglietto per Firenze, andata e ritorno.', 'Jednu jízdenku do Florencie, zpáteční.'],
    ['È lontano?', 'Je to daleko?'], ['Posso andarci a piedi?', 'Můžu tam dojít pěšky?'],
    ["Dov'è il bagno?", 'Kde je toaleta?'], ['Mi sono perso. / Mi sono persa.', 'Ztratil jsem se. / Ztratila jsem se.'],
  ]),
  ...t('Hotel a obchod', [
    ['Ho una prenotazione a nome Novák.', 'Mám rezervaci na jméno Novák.'],
    ['Una camera doppia, per favore.', 'Dvoulůžkový pokoj, prosím.'], ['La colazione è inclusa?', 'Je snídaně v ceně?'],
    ['Sto solo guardando, grazie.', 'Jen se dívám, díky.'], ["Ce l'ha in un'altra taglia?", 'Máte to v jiné velikosti?'],
    ['Lo prendo.', 'Vezmu si to.'], ['È troppo caro.', 'Je to moc drahé.'],
  ]),
  ...t('Hovorové', [
    ['Che bello!', 'To je krása!'], ['Dai!', 'No tak! / Ale jdi!'], ['Magari!', 'Kéž by!'],
    ['Figurati!', 'To nic! / Není zač!'], ['Non fa niente.', 'To nevadí.'], ['Meno male!', 'Ještě že tak!'],
    ['Ci vediamo!', 'Uvidíme se!'], ['A dopo!', 'Zatím! (uvidíme se později)'], ['Buona giornata!', 'Hezký den!'],
    ['In bocca al lupo! – Crepi!', 'Zlom vaz! – Ať chcípne! (ustálená odpověď, „grazie“ se neříká)'], ['Che ne dici?', 'Co ty na to?'],
    ["Non vedo l'ora!", 'Nemůžu se dočkat!'], ['Mi dispiace.', 'Je mi líto.'],
    ['Tutto a posto?', 'Všechno v pořádku?'], ['Ho capito.', 'Rozumím. / Chápu.'], ['Non lo so.', 'Nevím.'],
    ['Aspetta un attimo.', 'Počkej chvilku.'],
  ]),
];

export const DECKS = {
  slovicka: { name: 'Slovíčka', items: VOCAB },
  vazby: { name: 'Vazby', items: VAZBY },
  fraze: { name: 'Fráze', items: FRAZE },
};
// Vlastní balíček z Překladače (tlačítko „Do kartiček“), čte se vždy čerstvě.
Object.defineProperty(DECKS, 'moje', { enumerable: true, get: () => ({ name: 'Moje slovíčka', items: load('moje', []) }) });

// ---- Slovesa a časy ----

export const OSOBY = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];

export const CASY = {
  presente: {
    name: 'Přítomný čas (presente)',
    info: 'Co se děje teď nebo pravidelně. Často i blízká budoucnost: „Domani vado a Roma.“',
  },
  passato: {
    name: 'Minulý čas (passato prossimo)',
    info: 'Dokončený děj v minulosti: „Ieri ho mangiato la pizza.“ Tvoří se pomocným slovesem avere/essere + příčestím. Essere berou většina sloves pohybu a změny stavu (andare, venire, uscire, tornare), dále essere, stare, piacere a všechna zvratná slovesa (mi sono chiamato). Pak se příčestí shoduje v rodě a čísle: sono andato / andata. Pozor, ne každé sloveso pohybu: ho camminato, ho viaggiato.',
  },
  imperfetto: {
    name: 'Minulý čas průběhový (imperfetto)',
    info: 'Popis, zvyk nebo pozadí v minulosti: „Da bambino giocavo a calcio.“ Kombinuje se s passato prossimo: „Mentre dormivo, è arrivato Marco.“',
  },
  futuro: {
    name: 'Budoucí čas (futuro semplice)',
    info: 'Budoucnost a také odhad: „Domani pioverà.“ – „Sarà stanco.“ (Asi je unavený.)',
  },
};

const AVERE = ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'];
const ESSERE = ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'];
const IMPF = ['vo', 'vi', 'va', 'vamo', 'vate', 'vano'];
const FUT = ['ò', 'ai', 'à', 'emo', 'ete', 'anno'];

// pres: přítomný čas; impf: kmen imperfekta; fut: kmen budoucího času;
// aux + part: passato prossimo
const SLOVESA = [
  { inf: 'essere', cs: 'být', pres: ESSERE, impfForms: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'], fut: 'sar', aux: 'essere', part: 'stato' },
  { inf: 'avere', cs: 'mít', pres: AVERE, impf: 'ave', fut: 'avr', aux: 'avere', part: 'avuto' },
  { inf: 'fare', cs: 'dělat', pres: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'], impf: 'face', fut: 'far', aux: 'avere', part: 'fatto' },
  { inf: 'andare', cs: 'jít / jet', pres: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'], impf: 'anda', fut: 'andr', aux: 'essere', part: 'andato' },
  { inf: 'venire', cs: 'přijít', pres: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'], impf: 'veni', fut: 'verr', aux: 'essere', part: 'venuto' },
  { inf: 'stare', cs: 'být (stav)', pres: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'], impf: 'sta', fut: 'star', aux: 'essere', part: 'stato' },
  { inf: 'potere', cs: 'moci', pres: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'], impf: 'pote', fut: 'potr', aux: 'avere', part: 'potuto' },
  { inf: 'volere', cs: 'chtít', pres: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'], impf: 'vole', fut: 'vorr', aux: 'avere', part: 'voluto' },
  { inf: 'dovere', cs: 'muset', pres: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'], impf: 'dove', fut: 'dovr', aux: 'avere', part: 'dovuto' },
  { inf: 'sapere', cs: 'vědět', pres: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'], impf: 'sape', fut: 'sapr', aux: 'avere', part: 'saputo' },
  { inf: 'dire', cs: 'říct', pres: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'], impf: 'dice', fut: 'dir', aux: 'avere', part: 'detto' },
  { inf: 'bere', cs: 'pít', pres: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'], impf: 'beve', fut: 'berr', aux: 'avere', part: 'bevuto' },
  { inf: 'uscire', cs: 'jít ven', pres: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'], impf: 'usci', fut: 'uscir', aux: 'essere', part: 'uscito' },
  { inf: 'parlare', cs: 'mluvit', pres: ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano'], impf: 'parla', fut: 'parler', aux: 'avere', part: 'parlato' },
  { inf: 'mangiare', cs: 'jíst', pres: ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano'], impf: 'mangia', fut: 'manger', aux: 'avere', part: 'mangiato' },
  { inf: 'lavorare', cs: 'pracovat', pres: ['lavoro', 'lavori', 'lavora', 'lavoriamo', 'lavorate', 'lavorano'], impf: 'lavora', fut: 'lavorer', aux: 'avere', part: 'lavorato' },
  { inf: 'prendere', cs: 'vzít', pres: ['prendo', 'prendi', 'prende', 'prendiamo', 'prendete', 'prendono'], impf: 'prende', fut: 'prender', aux: 'avere', part: 'preso' },
  { inf: 'vedere', cs: 'vidět', pres: ['vedo', 'vedi', 'vede', 'vediamo', 'vedete', 'vedono'], impf: 'vede', fut: 'vedr', aux: 'avere', part: 'visto' },
  { inf: 'dormire', cs: 'spát', pres: ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono'], impf: 'dormi', fut: 'dormir', aux: 'avere', part: 'dormito' },
  { inf: 'capire', cs: 'rozumět', pres: ['capisco', 'capisci', 'capisce', 'capiamo', 'capite', 'capiscono'], impf: 'capi', fut: 'capir', aux: 'avere', part: 'capito' },
];

// Příčestí s essere: jednotné číslo -o/-a, množné -i/-e.
function participio(v, i) {
  if (v.aux !== 'essere') return [v.part];
  const stem = v.part.slice(0, -1);
  return i < 3 ? [stem + 'o', stem + 'a'] : [stem + 'i', stem + 'e'];
}

// Vrací všechny přijatelné tvary; první je ten, který se ukáže jako vzor.
export function tvary(v, cas, i) {
  switch (cas) {
    case 'presente': return [v.pres[i]];
    case 'imperfetto': return [v.impfForms ? v.impfForms[i] : v.impf + IMPF[i]];
    case 'futuro': return [v.fut + FUT[i]];
    case 'passato': {
      const aux = (v.aux === 'essere' ? ESSERE : AVERE)[i];
      const parts = participio(v, i);
      const all = parts.map(p => `${aux} ${p}`);
      if (parts.length > 1) all.unshift(`${aux} ${parts[0]}/${parts[1].slice(-1)}`);
      return all;
    }
  }
}

export { SLOVESA };

export const SCENARE = [
  { id: 'volne', name: 'Volné povídání', desc: 'Giulia se zeptá, jak se máš, a povídáte si.',
    prompt: 'Volný rozhovor. Zeptej se uživatele, jak se má a co dnes dělal, a nech konverzaci plynout.' },
  { id: 'seznameni', name: 'Seznámení', desc: 'Jméno, odkud jsi, práce, koníčky.',
    prompt: 'Právě jste se seznámili na večírku v Boloni. Ptej se na jméno, odkud je, co dělá a co ho baví.' },
  { id: 'kavarna', name: 'V kavárně', desc: 'Giulia je baristka, objednáváš si.',
    prompt: 'Jsi baristka v kavárně v centru Boloně. Uživatel je host a objednává si. Nabídni kávu, cornetto, zeptej se, jestli si sedne, a na konci řekni cenu.' },
  { id: 'nadrazi', name: 'Na nádraží', desc: 'Kupuješ jízdenku do Florencie.',
    prompt: 'Pracuješ u přepážky na nádraží Bologna Centrale. Uživatel chce jízdenku. Ptej se kam, kdy, jednosměrná nebo zpáteční, a řekni nástupiště a cenu.' },
  { id: 'hotel', name: 'V hotelu', desc: 'Check-in a otázky na recepci.',
    prompt: 'Jsi recepční v malém hotelu v Římě. Uživatel přijíždí. Proveď check-in, zeptej se na jméno a rezervaci, vysvětli snídani a wifi.' },
  { id: 'trh', name: 'Na trhu', desc: 'Kupuješ ovoce a zeleninu.',
    prompt: 'Prodáváš ovoce a zeleninu na trhu. Uživatel nakupuje. Nabízej zboží, ptej se kolik, řekni cenu.' },
  { id: 'vcera', name: 'Procvič minulý čas', desc: 'Giulia se ptá, co jsi dělal včera a o víkendu.',
    prompt: 'Procvičuj s uživatelem passato prossimo. Ptej se, co dělal včera, o víkendu, na poslední dovolené. Používej sama passato prossimo.' },
];
