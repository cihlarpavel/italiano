// Top 100 zajímavostí o Itálii: [kategorie, emoji, název česky, název italsky, popis česky, popis italsky]
export const KATEGORIE = {
  mista: 'Místa', historie: 'Historie', priroda: 'Příroda', jidlo: 'Jídlo a pití',
  kultura: 'Kultura', umeni: 'Umění', znacky: 'Značky', sport: 'Sport', zajimavosti: 'Zajímavosti',
};

const R = [
  // ---- Místa ----
  ['mista', '🏟️', 'Koloseum', 'Il Colosseo', 'Největší antický amfiteátr, dokončený roku 80 n. l. Pojal přes 50 000 diváků.', 'Il più grande anfiteatro antico, completato nell’80 d.C. Ospitava oltre 50.000 spettatori.'],
  ['mista', '🛶', 'Benátky', 'Venezia', 'Město na zhruba 120 ostrovech spojených asi 400 mosty. Místo aut jezdí lodě.', 'Città su circa 120 isole collegate da circa 400 ponti. Al posto delle auto ci sono le barche.'],
  ['mista', '🗼', 'Šikmá věž v Pise', 'La Torre di Pisa', 'Zvonice se začala naklánět už při stavbě ve 12. století. Dnes je odkloněná asi o 4 stupně.', 'Il campanile iniziò a pendere già durante la costruzione, nel XII secolo. Oggi è inclinato di circa 4 gradi.'],
  ['mista', '🌸', 'Florencie', 'Firenze', 'Kolébka renesance. Celé historické centrum je na seznamu UNESCO.', 'La culla del Rinascimento. Tutto il centro storico è patrimonio UNESCO.'],
  ['mista', '⛪', 'Vatikán', 'Il Vaticano', 'Nejmenší stát světa (0,49 km²) leží uprostřed Říma.', 'Lo Stato più piccolo del mondo (0,49 km²) si trova nel cuore di Roma.'],
  ['mista', '🌋', 'Pompeje', 'Pompei', 'Římské město zasypané Vesuvem roku 79 n. l. se zachovalo jako časová schránka.', 'Città romana sepolta dal Vesuvio nel 79 d.C., conservata come una capsula del tempo.'],
  ['mista', '🍋', 'Amalfinské pobřeží', 'La Costiera Amalfitana', 'Útesy, barevné vesnice a citronové háje. Celé pobřeží je na seznamu UNESCO.', 'Scogliere, paesi colorati e limoneti. Tutta la costiera è patrimonio UNESCO.'],
  ['mista', '🏘️', 'Cinque Terre', 'Le Cinque Terre', 'Pět vesnic nad mořem v Ligurii, propojených stezkami a vlakem.', 'Cinque borghi sul mare in Liguria, collegati da sentieri e dal treno.'],
  ['mista', '⛲', 'Fontána di Trevi', 'La Fontana di Trevi', 'Kdo hodí minci přes rameno, vrátí se do Říma. Mince se každý rok rozdají na charitu.', 'Chi lancia una moneta oltre la spalla tornerà a Roma. Ogni anno le monete vanno in beneficenza.'],
  ['mista', '⛪', 'Milánský dóm', 'Il Duomo di Milano', 'Gotická katedrála se stavěla skoro 600 let a zdobí ji přes 3 000 soch.', 'La cattedrale gotica è stata costruita in quasi 600 anni ed è decorata da oltre 3.000 statue.'],
  ['mista', '🏛️', 'Pantheon', 'Il Pantheon', 'Jeho přes 1 900 let stará kupole je dodnes největší kupolí z nevyztuženého betonu na světě.', 'La sua cupola, vecchia di oltre 1.900 anni, è ancora la più grande del mondo in calcestruzzo non armato.'],
  ['mista', '🏝️', 'Sicílie', 'La Sicilia', 'Největší ostrov Středomoří s řeckými chrámy a arabsko-normanskými stavbami.', 'La più grande isola del Mediterraneo, con templi greci ed edifici arabo-normanni.'],
  ['mista', '🪨', 'Matera', 'Matera', 'Město domů vytesaných ve skále (Sassi), obývané už od pravěku.', 'Città delle case scavate nella roccia (i Sassi), abitata fin dalla preistoria.'],
  ['mista', '🍷', 'Toskánsko', 'La Toscana', 'Cypřiše, vinice a středověká města jako Siena nebo San Gimignano.', 'Cipressi, vigneti e città e borghi medievali come Siena o San Gimignano.'],
  ['mista', '💘', 'Verona', 'Verona', 'Město Romea a Julie. V římské Aréně se v létě hraje opera.', 'La città di Romeo e Giulietta. Nell’Arena romana d’estate va in scena l’opera.'],
  ['mista', '🛥️', 'Comské jezero', 'Il Lago di Como', 'Jezero ve tvaru obráceného Y, lemované vilami, kde natáčel i Hollywood.', 'Un lago a forma di Y rovesciata, circondato da ville dove ha girato anche Hollywood.'],
  ['mista', '🍕', 'Neapol', 'Napoli', 'Rodiště pizzy s historickým centrem UNESCO a podzemním městem.', 'La patria della pizza, con un centro storico UNESCO e una città sotterranea.'],
  ['mista', '🌊', 'Sardinie', 'La Sardegna', 'Tyrkysové moře a tisíce prastarých kamenných věží, nuraghů.', 'Mare turchese e migliaia di antiche torri di pietra, i nuraghi.'],

  // ---- Historie ----
  ['historie', '🐺', 'Založení Říma', 'La fondazione di Roma', 'Podle legendy založil Řím Romulus roku 753 př. n. l. Jeho a bratra Rema prý kojila vlčice.', 'Secondo la leggenda Romolo fondò Roma nel 753 a.C. Lui e il gemello Remo furono allattati da una lupa.'],
  ['historie', '🦅', 'Římská říše', 'L’Impero romano', 'Na vrcholu ve 2. století sahala od Británie až po Mezopotámii.', 'Al suo apice, nel II secolo, andava dalla Britannia fino alla Mesopotamia.'],
  ['historie', '🗡️', 'Julius Caesar', 'Giulio Cesare', 'Byl zavražděn o březnových idách roku 44 př. n. l.', 'Fu assassinato alle idi di marzo del 44 a.C.'],
  ['historie', '🛣️', 'Via Appia', 'La Via Appia', 'Římská „královna silnic“ z roku 312 př. n. l. Některými úseky se po ní chodí dodnes.', 'La “regina delle strade” romana, del 312 a.C. In alcuni tratti si percorre ancora oggi.'],
  ['historie', '🎨', 'Renesance', 'Il Rinascimento', 'V 15. století ve Florencii vzniklo hnutí, které proměnilo umění i vědu celé Evropy.', 'Nel Quattrocento a Firenze nacque il movimento che trasformò l’arte e la scienza di tutta Europa.'],
  ['historie', '🐫', 'Marco Polo', 'Marco Polo', 'Benátský kupec, který ve 13. století docestoval až do Číny.', 'Mercante veneziano che nel Duecento arrivò fino in Cina.'],
  ['historie', '⛵', 'Kryštof Kolumbus', 'Cristoforo Colombo', 'Janovan, který roku 1492 doplul do Ameriky.', 'Genovese che nel 1492 arrivò in America.'],
  ['historie', '🦁', 'Benátská republika', 'La Serenissima', 'Námořní velmoc, která byla nezávislá přes tisíc let, až do roku 1797.', 'Una potenza marittima rimasta indipendente per oltre mille anni, fino al 1797.'],
  ['historie', '🇮🇹', 'Sjednocení Itálie', 'L’Unità d’Italia', 'Italské království vzniklo teprve roku 1861, Řím se připojil až 1870. Garibaldi je národní hrdina.', 'Il Regno d’Italia nacque solo nel 1861; Roma fu annessa nel 1870. Garibaldi è un eroe nazionale.'],
  ['historie', '🗳️', 'Den republiky', 'La Festa della Repubblica', '2. června 1946 Italové v referendu zrušili monarchii. Je to státní svátek.', 'Il 2 giugno 1946 gli italiani abolirono la monarchia con un referendum. È festa nazionale.'],
  ['historie', '🔭', 'Galileo Galilei', 'Galileo Galilei', 'Otec moderní vědy. Dalekohledem objevil čtyři Jupiterovy měsíce.', 'Il padre della scienza moderna. Con il telescopio scoprì quattro lune di Giove.'],

  // ---- Příroda ----
  ['priroda', '🌋', 'Etna', 'L’Etna', 'Nejvyšší činná sopka Evropy. Soptí tak často, že patří ke krajině Sicílie.', 'Il vulcano attivo più alto d’Europa. Erutta così spesso da far parte del paesaggio siciliano.'],
  ['priroda', '🌋', 'Vesuv', 'Il Vesuvio', 'Sopka nad Neapolí. Naposledy vybuchla roku 1944.', 'Il vulcano che domina Napoli. L’ultima eruzione risale al 1944.'],
  ['priroda', '🔥', 'Stromboli', 'Lo Stromboli', '„Maják Středomoří“ soptí téměř bez přestávky nejméně dva tisíce let.', 'Il “faro del Mediterraneo” erutta quasi senza sosta da almeno duemila anni.'],
  ['priroda', '🏔️', 'Dolomity', 'Le Dolomiti', 'Skalní štíty, které při západu slunce zrůžoví. Od roku 2009 jsou na seznamu UNESCO.', 'Vette che al tramonto si tingono di rosa. Dal 2009 sono patrimonio UNESCO.'],
  ['priroda', '🏞️', 'Gardské jezero', 'Il Lago di Garda', 'Největší italské jezero, mezi Čechy mimořádně oblíbené.', 'Il lago più grande d’Italia, amatissimo dai cechi.'],
  ['priroda', '⛰️', 'Mont Blanc', 'Il Monte Bianco', 'Nejvyšší hora Alp (přes 4 800 m) stojí na hranici s Francií.', 'La vetta più alta delle Alpi (oltre 4.800 m) si trova al confine con la Francia.'],
  ['priroda', '🌾', 'Pád', 'Il Po', 'Nejdelší italská řeka (652 km) protéká úrodnou Pádskou nížinou.', 'Il fiume più lungo d’Italia (652 km) attraversa la fertile Pianura Padana.'],
  ['priroda', '🥾', 'Apeniny', 'Gli Appennini', 'Pohoří, které se táhne celou délkou „italské boty“.', 'La catena montuosa che percorre tutto lo “stivale”.'],
  ['priroda', '🏖️', 'Pobřeží', 'Le coste', 'Itálie má přes 7 000 km pobřeží. Omývá ji Ligurské, Tyrhénské, Jónské a Jaderské moře.', 'L’Italia ha oltre 7.000 km di costa, bagnata dal Mar Ligure, dal Tirreno, dallo Ionio e dall’Adriatico.'],
  ['priroda', '💙', 'Modrá jeskyně', 'La Grotta Azzurra', 'Jeskyně na Capri, kterou světlo prosvítající vodou barví zářivě modře.', 'Una grotta di Capri che la luce filtrata dall’acqua colora di un blu intenso.'],

  // ---- Jídlo a pití ----
  ['jidlo', '🍕', 'Pizza Margherita', 'La pizza Margherita', 'Podle tradice pojmenovaná roku 1889 po královně Markétě. Barvy připomínají vlajku.', 'Secondo la tradizione fu chiamata così nel 1889 in onore della regina Margherita. I colori ricordano la bandiera.'],
  ['jidlo', '🍝', 'Těstoviny', 'La pasta', 'Existují stovky tvarů těstovin a Ital jich v průměru sní přes 20 kg za rok.', 'Esistono centinaia di formati di pasta e un italiano ne mangia in media oltre 20 kg all’anno.'],
  ['jidlo', '🥓', 'Carbonara', 'La carbonara', 'Pravá se dělá jen z guanciale, vajec, pecorina a pepře. Žádná smetana.', 'Quella vera si fa solo con guanciale, uova, pecorino e pepe. Niente panna.'],
  ['jidlo', '☕', 'Espresso', 'Il caffè', '„Un caffè“ znamená espresso. Pije se rychle, ve stoje u baru.', '“Un caffè” è un espresso. Si beve in fretta, in piedi al bancone.'],
  ['jidlo', '🥛', 'Cappuccino', 'Il cappuccino', 'Italové ho pijí hlavně ráno, k obědu nebo po večeři skoro nikdy.', 'Gli italiani lo bevono soprattutto la mattina, quasi mai a pranzo o dopo cena.'],
  ['jidlo', '🍨', 'Gelato', 'Il gelato', 'Má méně tuku a vzduchu než průmyslová zmrzlina, proto je hustší a chuťově výraznější.', 'Ha meno grassi e meno aria del gelato industriale, per questo è più denso e saporito.'],
  ['jidlo', '🧀', 'Parmigiano Reggiano', 'Il Parmigiano Reggiano', 'Zraje nejméně 12 měsíců. Jeden bochník váží kolem 40 kg.', 'Stagiona almeno 12 mesi. Una forma pesa circa 40 kg.'],
  ['jidlo', '🍖', 'Parmská šunka', 'Il Prosciutto di Parma', 'Jen vepřová kýta a mořská sůl. Zraje nejméně 14 měsíců.', 'Solo coscia di maiale e sale marino. Stagiona almeno 14 mesi.'],
  ['jidlo', '🐃', 'Buvolí mozzarella', 'La mozzarella di bufala', 'Mozzarella di Bufala Campana DOP se smí dělat jen z buvolího mléka.', 'La Mozzarella di Bufala Campana DOP si fa solo con latte di bufala.'],
  ['jidlo', '🍰', 'Tiramisu', 'Il tiramisù', 'Název znamená doslova „vytáhni mě nahoru“, tedy „povzbuď mě“. Vzniklo na severovýchodě Itálie.', 'Il nome viene da “tirami su”, cioè “dammi energia”. È nato nel nord-est d’Italia.'],
  ['jidlo', '🍹', 'Spritz', 'Lo spritz', 'Benátský aperitiv z prosecca, Aperolu nebo Camparu a sodovky.', 'Aperitivo veneziano con prosecco, Aperol o Campari e seltz.'],
  ['jidlo', '🍇', 'Víno', 'Il vino', 'Itálie patří k největším producentům vína na světě a má stovky místních odrůd.', 'L’Italia è tra i maggiori produttori di vino al mondo e ha centinaia di vitigni autoctoni.'],
  ['jidlo', '🐓', 'Chianti Classico', 'Il Chianti Classico', 'Toskánské červené víno poznáš podle černého kohouta na hrdle lahve.', 'Il rosso toscano si riconosce dal gallo nero sul collo della bottiglia.'],
  ['jidlo', '🫙', 'Tradiční balsamico z Modeny', 'L’aceto balsamico tradizionale di Modena', 'Tradiční balzamikový ocet zraje v dřevěných sudech nejméně 12 let.', 'L’aceto balsamico tradizionale invecchia almeno 12 anni in botti di legno.'],
  ['jidlo', '🍋', 'Limoncello', 'Il limoncello', 'Citronový likér z jihu Itálie. Pije se ledově vychlazený po jídle.', 'Liquore al limone del Sud Italia. Si beve ghiacciato dopo i pasti.'],
  ['jidlo', '🍄', 'Bílý lanýž z Alby', 'Il tartufo bianco d’Alba', 'Patří k nejdražším potravinám světa. Hledají ho vycvičení psi.', 'È tra i cibi più costosi al mondo. Lo cercano cani addestrati.'],
  ['jidlo', '🍙', 'Arancini', 'Gli arancini', 'Smažené rýžové kuličky ze Sicílie, plněné ragú nebo sýrem.', 'Palline di riso fritte, tipiche della Sicilia, ripiene di ragù o formaggio.'],

  // ---- Kultura ----
  ['kultura', '🤌', 'Gesta', 'I gesti', 'Italové mluví i rukama. Spojené prsty namířené vzhůru znamenají „Co chceš? Co to povídáš?“.', 'Gli italiani parlano anche con le mani. Le dita unite verso l’alto significano “Ma che vuoi?”.'],
  ['kultura', '👋', 'Ciao', 'Ciao', 'Pozdrav pochází z benátského „s-ciào vostro“, doslova „váš otrok“, tedy „jsem vám k službám“.', 'Il saluto viene dal veneziano “s-ciào vostro”, cioè “vostro schiavo”, “al vostro servizio”.'],
  ['kultura', '🎭', 'Opera', 'L’opera', 'Opera vznikla v Itálii kolem roku 1600. Nejslavnějším operním domem je milánská La Scala.', 'L’opera è nata in Italia intorno al 1600. Il teatro d’opera più famoso è la Scala di Milano.'],
  ['kultura', '🎭', 'Karneval v Benátkách', 'Il Carnevale di Venezia', 'Masky a kostýmy v ulicích. Tradice sahá do středověku.', 'Maschere e costumi per le calli. Una tradizione che risale al Medioevo.'],
  ['kultura', '🐎', 'Palio di Siena', 'Il Palio di Siena', 'Divoký dostih bez sedel na náměstí Piazza del Campo, pořádaný dvakrát ročně.', 'Una corsa di cavalli a pelo in Piazza del Campo, due volte l’anno.'],
  ['kultura', '🏖️', 'Ferragosto', 'Il Ferragosto', '15. srpna je celá Itálie na dovolené a města se vyprázdní.', 'Il 15 agosto tutta l’Italia è in vacanza e le città si svuotano.'],
  ['kultura', '🎬', 'La dolce vita', 'La dolce vita', 'Felliniho film z roku 1960 dal světu výraz pro bezstarostný život.', 'Il film di Fellini del 1960 ha dato al mondo un’espressione per la vita spensierata.'],
  ['kultura', '📜', 'Dante Alighieri', 'Dante Alighieri', 'Autor Božské komedie. Jeho florentština se stala základem spisovné italštiny.', 'L’autore della Divina Commedia. Il suo fiorentino è diventato la base dell’italiano.'],
  ['kultura', '🧹', 'Befana', 'La Befana', '6. ledna nosí dětem sladkosti hodná čarodějnice Befana.', 'Il 6 gennaio la Befana, una strega buona, porta i dolci ai bambini.'],
  ['kultura', '🎤', 'Sanremo', 'Il Festival di Sanremo', 'Od roku 1951 se tu vybírá nejlepší italská píseň. Sleduje ho celá země.', 'Dal 1951 qui si sceglie la canzone italiana più bella. Lo guarda tutto il Paese.'],
  ['kultura', '🍀', 'Pověry', 'Le superstizioni', 'Nešťastné číslo v Itálii není 13, ale 17.', 'In Italia il numero sfortunato non è il 13, ma il 17.'],

  // ---- Umění ----
  ['umeni', '🖌️', 'Sixtinská kaple', 'La Cappella Sistina', 'Michelangelo maloval její strop čtyři roky, převážně ve stoje na lešení.', 'Michelangelo dipinse la volta in quattro anni, quasi sempre in piedi sull’impalcatura.'],
  ['umeni', '🗿', 'Michelangelův David', 'Il David di Michelangelo', 'Mramorová socha i s podstavcem měří přes 5 metrů. Originál stojí ve florentské Galleria dell’Accademia.', 'Una statua di marmo che, con la base, supera i 5 metri. L’originale si trova alla Galleria dell’Accademia di Firenze.'],
  ['umeni', '🖼️', 'Leonardo da Vinci', 'Leonardo da Vinci', 'Malíř, vynálezce i vědec. Jeho Poslední večeře je k vidění v Miláně.', 'Pittore, inventore e scienziato. La sua Ultima Cena si può ammirare a Milano.'],
  ['umeni', '🐚', 'Zrození Venuše', 'La nascita di Venere', 'Botticelliho mistrovské dílo visí ve florentské galerii Uffizi.', 'Il capolavoro di Botticelli si trova agli Uffizi di Firenze.'],
  ['umeni', '🔴', 'Brunelleschiho kupole', 'La cupola del Brunelleschi', 'Kupole florentského dómu vznikla bez klasické dřevěné skruže. Nahoru vede 463 schodů.', 'La cupola del Duomo di Firenze fu costruita senza le tradizionali centine. In cima si sale con 463 gradini.'],
  ['umeni', '🕯️', 'Caravaggio', 'Caravaggio', 'Mistr dramatického světla a stínu. Byl to rváč, který musel z Říma uprchnout.', 'Il maestro del chiaroscuro drammatico. Era un attaccabrighe e dovette fuggire da Roma.'],
  ['umeni', '📚', 'Raffael', 'Raffaello', 'Jeho freska Athénská škola zdobí Vatikánské paláce.', 'Il suo affresco “La scuola di Atene” decora i Palazzi Vaticani.'],
  ['umeni', '🏛️', 'Bernini', 'Gian Lorenzo Bernini', 'Autor kolonády na Svatopetrském náměstí a Fontány čtyř řek v Římě.', 'L’autore del colonnato di Piazza San Pietro e della Fontana dei Quattro Fiumi a Roma.'],
  ['umeni', '🎻', 'Vivaldi', 'Antonio Vivaldi', 'Benátčan, který složil Čtvero ročních dob.', 'Il veneziano che compose Le quattro stagioni.'],
  ['umeni', '🌍', 'Památky UNESCO', 'I siti UNESCO', 'Itálie má nejvíce památek UNESCO na světě: od roku 2026 jich je 62.', 'L’Italia ha il maggior numero di siti UNESCO al mondo: dal 2026 sono 62.'],

  // ---- Značky ----
  ['znacky', '🏎️', 'Ferrari', 'La Ferrari', 'Auta z Maranella. Červená „rosso corsa“ byla závodní barvou Itálie.', 'Auto di Maranello. Il “rosso corsa” era il colore delle auto da corsa italiane.'],
  ['znacky', '🐂', 'Lamborghini', 'La Lamborghini', 'Ferruccio Lamborghini vyráběl traktory. Podle legendy začal se sporťáky po sporu s Enzem Ferrarim.', 'Ferruccio Lamborghini produceva trattori. Secondo la leggenda iniziò con le auto sportive dopo una lite con Enzo Ferrari.'],
  ['znacky', '🚗', 'Fiat 500', 'La Fiat 500', '„Cinquecento“ z roku 1957 posadilo Italy za volant.', 'La “Cinquecento” del 1957 ha messo al volante gli italiani.'],
  ['znacky', '🛵', 'Vespa', 'La Vespa', 'Skútr firmy Piaggio z roku 1946. Jméno „vosa“ dostal podle svého tvaru.', 'Lo scooter della Piaggio del 1946. Il nome viene dalla sua forma, che ricorda una vespa.'],
  ['znacky', '🌰', 'Nutella', 'La Nutella', 'Vznikla roku 1964 u firmy Ferrero v Albě, díky piemontským lískovým oříškům.', 'Nata nel 1964 alla Ferrero di Alba, grazie alle nocciole del Piemonte.'],
  ['znacky', '👗', 'Milánská móda', 'La moda milanese', 'Prada, Armani, Versace a další dělají z Milána jedno z hlavních měst módy.', 'Prada, Armani, Versace e altri fanno di Milano una delle capitali della moda.'],
  ['znacky', '☕', 'Moka Bialetti', 'La moka Bialetti', 'Konvičku na kávu moka uvedl na trh Alfonso Bialetti roku 1933.', 'La moka fu lanciata da Alfonso Bialetti nel 1933.'],
  ['znacky', '🍝', 'Barilla', 'La Barilla', 'Největší výrobce těstovin na světě pochází z Parmy.', 'Il più grande produttore di pasta al mondo viene da Parma.'],
  ['znacky', '🔱', 'Maserati', 'La Maserati', 'Trojzubec ve znaku pochází z Neptunovy fontány v Boloni.', 'Il tridente del logo viene dalla Fontana del Nettuno di Bologna.'],
  ['znacky', '🏍️', 'Ducati', 'La Ducati', 'Závodní motorky z Boloně, legenda silničních okruhů.', 'Moto da corsa di Bologna, una leggenda dei circuiti.'],

  // ---- Sport ----
  ['sport', '⚽', 'Fotbal', 'Il calcio', 'Itálie je čtyřnásobným mistrem světa (1934, 1938, 1982, 2006).', 'L’Italia ha vinto quattro Mondiali (1934, 1938, 1982, 2006).'],
  ['sport', '🚴', 'Giro d’Italia', 'Il Giro d’Italia', 'Cyklistický závod od roku 1909. Vedoucí jezdec nosí růžový dres.', 'Corsa ciclistica dal 1909. Il leader indossa la maglia rosa.'],
  ['sport', '🏁', 'Monza', 'Monza', '„Chrám rychlosti“, kde se jezdí Velká cena Itálie formule 1.', 'Il “Tempio della velocità”, dove si corre il Gran Premio d’Italia di Formula 1.'],
  ['sport', '⛷️', 'Milano Cortina 2026', 'Milano Cortina 2026', 'V únoru 2026 Itálie hostila zimní olympijské hry.', 'A febbraio 2026 l’Italia ha ospitato le Olimpiadi invernali.'],

  // ---- Zajímavosti ----
  ['zajimavosti', '🎹', 'Klavír', 'Il pianoforte', 'Vynalezl ho Bartolomeo Cristofori ve Florencii kolem roku 1700.', 'Lo inventò Bartolomeo Cristofori a Firenze intorno al 1700.'],
  ['zajimavosti', '🔋', 'Baterie', 'La pila', 'Alessandro Volta sestrojil první baterii roku 1800. Podle něj se jmenuje volt.', 'Alessandro Volta costruì la prima pila nel 1800. Da lui prende il nome il volt.'],
  ['zajimavosti', '📻', 'Rádio', 'La radio', 'Guglielmo Marconi, průkopník rádia, získal roku 1909 Nobelovu cenu.', 'Guglielmo Marconi, pioniere della radio, vinse il Nobel nel 1909.'],
  ['zajimavosti', '👓', 'Brýle', 'Gli occhiali', 'První brýle vznikly v Itálii koncem 13. století.', 'I primi occhiali nacquero in Italia alla fine del Duecento.'],
  ['zajimavosti', '🎓', 'Boloňská univerzita', 'L’Università di Bologna', 'Založena roku 1088, nejstarší univerzita západního světa.', 'Fondata nel 1088, è la più antica università del mondo occidentale.'],
  ['zajimavosti', '🏰', 'San Marino', 'San Marino', 'Podle tradice nejstarší republika světa (301 n. l.), celá obklopená Itálií.', 'Secondo la tradizione la repubblica più antica del mondo (301 d.C.), tutta circondata dall’Italia.'],
  ['zajimavosti', '👢', 'Italská bota', 'Lo stivale', 'Itálie má tvar boty. Sicílie je míč, do kterého kope.', 'L’Italia ha la forma di uno stivale. La Sicilia è il pallone che calcia.'],
  ['zajimavosti', '🎌', 'Trikolóra', 'Il Tricolore', 'Zelená, bílá a červená. Podle oblíbeného výkladu louky, sníh a oheň.', 'Verde, bianco e rosso. Secondo una lettura popolare: prati, neve e fuoco.'],
  ['zajimavosti', '🤥', 'Pinocchio', 'Pinocchio', 'Pohádku o dřevěné loutce napsal Carlo Collodi, knižně vyšla roku 1883.', 'La fiaba del burattino di legno fu scritta da Carlo Collodi e uscì in volume nel 1883.'],
];

export const TOP = R.map(([kat, e, cs, it, dcs, dit], i) => ({ n: i + 1, kat, e, cs, it, dcs, dit }));
