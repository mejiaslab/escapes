/*
 * rooms-catalog.js - Catálogo oficial de Escape Rooms
 * Contiene metadatos extraídos de webs oficiales:
 * URL oficial, imagen optimizada en assets/rooms/ y sinopsis argumental en español.
 */
(function () {
  function normalizeKey(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  function makeKey(empresa, sala) {
    return `${normalizeKey(empresa)}||${normalizeKey(sala)}`;
  }

  const ROOMS_LIST = [
  {
    "empresa": "Experiencity",
    "sala": "Experiencia amarilla",
    "url": "https://colorsescaperoom.com/madrid/experiencia-amarilla-escape-room",
    "image": "assets/rooms/experiencity-experiencia-amarilla.webp",
    "description": "Durante años, infinidad de aventureros han soñado con encontrar el legendario tesoro de Willy el Tuerto, pero muy pocos han estado cerca. Reúne a tu pandilla y adéntrate en más de 150 m² repletos de trampas y enigmas para hacerte con el botín antes de que la temida familia Fratelli os alcance.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia La Nevera Show",
    "url": "https://thecityescaperoom.com/madrid/la-nevera-show-escape-room",
    "image": "assets/rooms/experiencity-experiencia-la-nevera-show.webp",
    "description": "La Nevera Show es un original concurso de televisión en los estudios de The City Madrid, gobernada por la tiránica Señora Parker. Vuestra misión será concursar en directo para hacer saber al mundo su tiranía gracias a la ayuda de un agente infiltrado, en una prueba donde un jugador saldrá millonario y el resto quedará congelado.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Luz verde (Experience rosa)",
    "url": "https://colorsescaperoom.com/madrid/experiencia-rosa-escape-room",
    "image": "assets/rooms/experiencity-luz-verde-experience-rosa.webp",
    "description": "El concurso más famoso y competitivo de la humanidad estrena una nueva y despiadada edición para la que habéis sido seleccionados. Vuestro grupo dispondrá de 70 minutos para superar una serie de exigentes pruebas donde lucharéis por ganar una cuantiosa suma de dinero sin posibilidad de abandonar las instalaciones.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia azul: atrincherados",
    "url": "https://colorsescaperoom.com/madrid/experiencia-azul-escape-room",
    "image": "assets/rooms/experiencity-experiencia-azul-atrincherados.webp",
    "description": "Es 15 de agosto de 1944 en plena Segunda Guerra Mundial y las fuerzas enemigas han capturado al valioso soldado Perconte. Con información de la 101ª División Aerotransportada, deberéis infiltraros en la fortaleza y las trincheras alemanas para rescatar a vuestro compañero y liberar la ciudad de París a tiempo.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia Naranja: Aladino",
    "url": "https://colorsescaperoom.com/madrid/experiencia-naranja-escape-room",
    "image": "assets/rooms/experiencity-experiencia-naranja-aladino.webp",
    "description": "Como hábiles ladrones en la legendaria Allabah, se os presenta la oportunidad de liberar a la región del yugo del malvado Visir. Para derrotar su magia oscura tendréis que usar vuestro ingenio, infiltraros en palacios y recuperar la lámpara maravillosa antes de que sus soldados os capturen.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Capítulo 2: Diamante de Almas",
    "url": "https://terrorstories.com/madrid/diamante-de-almas-escape-room",
    "image": "assets/rooms/experiencity-capitulo-2-diamante-de-almas.webp",
    "description": "La maldición de la familia Morgan culmina cuando Alon presenta en Madrid su colección de joyas más codiciada y siniestra. Guiados por sus oscuros secretos familiares, deberéis adentraros en una exhibición infernal donde los espíritus y presencias demoníacas pondrán a prueba vuestra cordura.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Vagón italiano",
    "url": "https://gastroescaperoom.com/vagones#vagon-italia",
    "image": "assets/rooms/experiencity-vagon-italiano.webp",
    "description": "En vuestro viaje a bordo del Vagón Italiano os veréis envueltos en los turbios asuntos de la peligrosa familia mafiosa De La Rossa. Entre plato y plato de su menú gastronómico, tendréis que resolver intrincados enigmas y descubrir qué traman antes de que el expreso llegue a su destino final.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia roja",
    "url": "https://colorsescaperoom.com/madrid/experiencia-roja-escape-room",
    "image": "assets/rooms/experiencity-experiencia-roja.webp",
    "description": "La noche cae sobre vuestra expedición al alcanzar las puertas del enigmático Palacio de los Cinco Elementos en el corazón de China. Vuestra misión será hallar la legendaria máscara del primer emperador sorteando un antiguo mausoleo repleto de trampas milenarias y letal mercurio.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia verde",
    "url": "https://colorsescaperoom.com/madrid/experiencia-verde-escape-room",
    "image": "assets/rooms/experiencity-experiencia-verde.webp",
    "description": "Un célebre hacker que lleva años desafiando a oscuros conglomerados globales ha perdido el control de su propia nanotecnología. Un nuevo algoritmo descontrolado amenaza con colapsar internet para siempre, y vuestro equipo deberá infiltrarse en sus sistemas de alta seguridad para restaurar el orden.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "Experiencia morada",
    "url": "https://colorsescaperoom.com/madrid/experiencia-morada-escape-room",
    "image": "assets/rooms/experiencity-experiencia-morada.webp",
    "description": "De la mano del audaz Dr. Jones, os embarcaréis en la búsqueda de la mística Calavera de Cristal, una reliquia capaz de abrir las puertas del tiempo. Un influyente oficial busca adueñarse de su inmenso poder, y dependerá de vuestra pericia descifrar las pistas antes de que la historia cambie para siempre.",
    "closed": false
  },
  {
    "empresa": "Experiencity",
    "sala": "La llorona",
    "url": "https://terrorstories.com/andalucia/la-llorona-escape-room",
    "image": "assets/rooms/experiencity-la-llorona.webp",
    "description": "Desde hace siglos, el alma en pena de una mujer deambula desconsolada por ríos y valles clamando venganza tras una desgarradora tragedia. La leyenda de La Llorona cobra vida en Sevilla, donde vuestro equipo deberá internarse en una tenebrosa atmósfera y escapar de su presencia antes de caer en su lamento.",
    "closed": false
  },
  {
    "empresa": "Experiencity (Terror Stories)",
    "sala": "Terror stories: Exorcista",
    "url": "https://terrorstories.com/barcelona/exorcista-escape-room",
    "image": "assets/rooms/terror-stories-exorcista.webp",
    "description": "Una fuerza demoníaca despiadada ha poseído a la joven hija de una afligida familia, desatando el caos en su habitación. Vuestro equipo acude a la casa para asistir al párroco y completar el ritual de exorcismo contrarreloj, mientras la entidad maligna acecha en cada rincón intentando apoderarse de vuestras almas.",
    "closed": false
  },
  {
    "empresa": "Madrid Terror",
    "sala": "Paranormal Experience",
    "url": "https://www.madridterror.com/paranormal-experience/",
    "image": "assets/rooms/madrid-terror-paranormal-experience.webp",
    "description": "Vuestro equipo recibe el encargo de investigar y cerrar un espeluznante caso paranormal en la casa de un controvertido cineasta levantada sobre un antiguo matadero. Entre fenómenos inexplicables y oscuros secretos encubiertos, dispondréis de 90 minutos de pura tensión para desvelar la verdad y salir ilesos.",
    "closed": false
  },
  {
    "empresa": "Clock 60",
    "sala": "Las brujas de Silent Hollow",
    "url": "https://www.escaperoomclock60madrid.es/la-bruja/",
    "image": "assets/rooms/clock-60-las-brujas-de-silent-hollow.webp",
    "description": "Como reporteros del programa de televisión «Tiempo de lo oculto», os adentráis en una cabaña olvidada en el bosque para rodar en vivo la leyenda de las Brujas de Silent Hollow. Al caer la noche el hechizo protector desaparece, dejándoos 60 minutos para desvelar sus secretos antes de quedar atrapados para siempre.",
    "closed": false
  },
  {
    "empresa": "Criogenic Escape Room",
    "sala": "Criogenic",
    "url": "https://criogenicescaperoom.com/madrid/",
    "image": "assets/rooms/criogenic-escape-room-criogenic.webp",
    "description": "La promesa de despertar en un mundo mejor gracias a la criogenización se transforma en una lucha por la supervivencia en una Tierra al borde del abismo. Guiados por la IA F.R.I.A., vuestro equipo deberá infiltrarse en una base robótica repleta de láseres y enigmas para salvar a la humanidad.",
    "closed": false
  },
  {
    "empresa": "YROOM",
    "sala": "Salomon Museum",
    "url": "https://unavueltadetuerca.com/salomon-museum-escape-room",
    "image": "assets/rooms/yroom-salomon-museum.webp",
    "description": "El profesor Salomon recorrió los confines del planeta recolectando artefactos místicos descritos en papiros milenarios y ocultos por gobiernos. Ahora su misterioso museo abre las puertas para mostrar su colección, donde deberéis explorar múltiples estancias para desvelar sus secretos antes de que sus fuerzas arcanas despierten.",
    "closed": false
  },
  {
    "empresa": "La Clau",
    "sala": "Game-on",
    "url": "https://www.laclauroomescape.com/game-on/",
    "image": "assets/rooms/la-clau-game-on.webp",
    "description": "Game-On es una frenética batalla de escape en formato Royale donde varios equipos compiten cara a cara en espacios compartidos. Durante 75 minutos interactuaréis y resolveréis desafíos simultáneos donde la destreza, la estrategia y el ingenio decidirán qué escuadrón consigue la victoria definitiva.",
    "closed": false
  },
  {
    "empresa": "Elkano Ihes Gela",
    "sala": "Experientziak",
    "url": "https://experientziak.com/es/elkano-escape-room/",
    "image": "assets/rooms/elkano-ihes-gela-experientziak.webp",
    "description": "Las voces de los vientos marinos susurran los enigmas y claroscuros que rodearon la primera vuelta al mundo de Juan Sebastián Elkano. En esta travesía histórica nada es lo que aparenta y la verdad ha quedado silenciada, invitándoos a desentrañar el legado oculto del intrépido navegante de Getaria.",
    "closed": false
  },
  {
    "empresa": "Golden Pop",
    "sala": "Jurásico",
    "url": "https://goldenpop.es/jurasico/",
    "image": "assets/rooms/jurasico.jpg",
    "description": "En colaboración con Kirby Enterprises, tendréis la oportunidad irrepetible de adentraros en las ruinas de un colosal parque temático prehistórico. Entre una densa vegetación real y los estremecedores rugidos de criaturas milenarias, viviréis una expedición de dos horas donde no se ha reparado en gastos.",
    "closed": false
  },
  {
    "empresa": "Experiencia Escape",
    "sala": "Atrapado en el cine",
    "url": "https://experienciaescape.com/service-plus/",
    "image": "assets/rooms/experiencia-escape-atrapado-en-el-cine.webp",
    "description": "En 1962, durante un célebre festival de cine de terror en el Grand Theatre de Madrid, la misteriosa desaparición de una espectadora causó su repentina clausura. Décadas después os adentráis en sus salas encantadas para romper el maleficio que mantiene a las almas atrapadas tras la gran pantalla.",
    "closed": false
  },
  {
    "empresa": "Escapology (Ilusiona Xanadú)",
    "sala": "7 pecados",
    "url": "https://www.escapology.com/es-ES/madrid-ilusiona-xanadu-spain/escape-games/7-deadly-sins",
    "image": "assets/rooms/eacapology-7-pecados.webp",
    "description": "El perturbado cura de la iglesia de Crickley envenenó a sus feligreses acusándolos de cometer los siete pecados capitales y se enterró vivo en una cripta sellada. Vuestro grupo deberá infiltrarse en el templo abandonado, hallar la cripta secreta y clavar la daga sagrada antes de medianoche para neutralizar su maldición.",
    "closed": false
  },
  {
    "empresa": "Horror Box",
    "sala": "Jigsaw",
    "url": "https://horrorbox.es/jigsaw-escape-room/",
    "image": "assets/rooms/horror-box-jigsaw.webp",
    "description": "Despertaréis encerrados en los lúgubres baños de una antigua fábrica sin recordar cómo habéis llegado. Vuestro objetivo será colaborar y salir con vida de ese siniestro lugar antes de 60 minutos, resolviendo una serie de retorcidos enigmas y macabras pruebas ideadas para poner a prueba vuestro instinto de supervivencia.",
    "closed": false
  },
  {
    "empresa": "Horror Box",
    "sala": "Catalepsia",
    "url": "https://www.vivetuentierro.com/",
    "image": "assets/rooms/horror-box-catalepsia.webp",
    "description": "Catalepsia es una experiencia extrema diseñada para dos personas en la que viviréis vuestro propio entierro. Encerrados individualmente en auténticos ataúdes y en completa oscuridad, deberéis coordinaros mediante la voz y resolver enigmas para escapar de una sepultura prematura en solo 30 minutos.",
    "closed": false
  },
  {
    "empresa": "Horror Box",
    "sala": "Ouija",
    "url": "https://horrorbox.es/ouija-escape-room/",
    "image": "assets/rooms/horror-box-ouija.webp",
    "description": "¿Alguna vez has osado invocar a los espíritus con la ouija? En esta sobrecogedora experiencia os adentraréis en el oscuro mundo del espiritismo, la santería y los fenómenos paranormales. No abráis puertas al más allá que quizá no podáis cerrar y mantened la calma para lograr salir con vida de la sesión.",
    "closed": false
  },
  {
    "empresa": "Horror Box",
    "sala": "Biohazard",
    "url": "https://biohazard.games/",
    "image": "assets/rooms/horror-box-biohazard.webp",
    "description": "Biohazard combina escape room, survival horror y combate con réplicas de armas láser en un colosal espacio de 1.000 m². En un mundo postapocalíptico asolado por un virus, varios equipos deben cooperar y competir para conseguir provisiones clave sin caer eliminados por infectados zombis o bandos rivales.",
    "closed": false
  },
  {
    "empresa": "Overtime",
    "sala": "101 años de Perdón",
    "url": "https://overtimepamplona.es/juegos-de-escape/",
    "image": "assets/rooms/101-anos-de-perdon.jpg",
    "description": "El banco más importante de la ciudad de Shadow Island ha sido asaltado y tomado por el peligroso criminal Menéndez y sus hombres. Como miembros de élite del equipo Ghost, vuestra misión será infiltraros en la entidad fuertemente custodiada y recuperarla a toda costa antes de que sea demasiado tarde.",
    "closed": false
  },
  {
    "empresa": "Overtime",
    "sala": "Call or die",
    "url": "https://overtimepamplona.es/juegos-de-escape/",
    "image": "assets/rooms/overtime-call-or-die.webp",
    "description": "Tres altos cargos de Shadow Island han sido secuestrados y la inteligencia policial los sitúa en una red de pisos francos bajo el férreo control de Menéndez. Vuestro comando deberá penetrar en territorio hostil, coordinar cada movimiento y rescatar a los rehenes con vida en una trepidante misión llena de acción.",
    "closed": false
  },
  {
    "empresa": "Cubick",
    "sala": "La entrevista",
    "url": "https://cubickmadrid.es/la-entrevista/",
    "image": "assets/rooms/cubick-la-entrevista.webp",
    "description": "Una prestigiosa corporación busca candidatos para cubrir puestos de alta responsabilidad y jugosas recompensas en su plantilla. Para superar la prueba decisiva del exigente proceso de selección, deberás acudir con tu equipo a las instalaciones de Cubick y demostrar vuestro temple, ingenio y capacidad bajo presión.",
    "closed": false
  },
  {
    "empresa": "Cubick",
    "sala": "Nathael",
    "url": "https://www.escaperoomlover.com/es/juego/cubick-0-mataro-nathael",
    "image": "assets/rooms/cubick-nathael.webp",
    "description": "Esta aclamada experiencia de terror psicológico mantuvo su misterio bajo estricto secreto para garantizar la máxima sorpresa. Adentrándose en una atmósfera opresiva y perturbadora, los jugadores debían poner a prueba su valentía individual y colectiva para descubrir los oscuros secretos que custodiaba Nathael.",
    "closed": true
  },
  {
    "empresa": "Rubik Escape Room",
    "sala": "El caso Ridel",
    "url": "https://rubikescaperoom.com/juegos/1-el-caso-ridel.html",
    "image": "assets/rooms/rubik-escape-room-el-caso-ridel.webp",
    "description": "Tus amigos han decidido darte una sorpresa llevándote a pasar una tarde inolvidable en la fantástica feria de Fair Bay, gestionada con orgullo por la familia Rídel durante generaciones. Sin embargo, lo que prometía ser una jornada ochentera de risas y diversión da un giro inesperado cuando ocurre un suceso que lo cambia todo.",
    "closed": false
  },
  {
    "empresa": "Rubik Escape Room",
    "sala": "Operación Délawer",
    "url": "https://rubikescaperoom.com/juegos/23-operacion-delawer.html",
    "image": "assets/rooms/operacion-delawer.webp",
    "description": "La Unidad Secreta de Operaciones Callejeras os asigna una peligrosa misión encubierta en La Cruz, un conflictivo barrio de persianas bajadas y reguetón incesante. Vuestro objetivo será infiltraros, ganaros la confianza de los vecinos y destapar la red de narcotráfico local sin ser descubiertos ni perder la dignidad.",
    "closed": false
  },
  {
    "empresa": "Locktopus Escape Game",
    "sala": "El sastre",
    "url": "https://locktopusescape.com/el-sastre/",
    "image": "assets/rooms/locktopus-escape-game-el-sastre.webp",
    "description": "Un misterioso mensaje llega a tu teléfono indicando que tu traje está listo y advirtiéndote que no acudas a la policía ni compliques las cosas. La sorpresa se transforma en desconcierto al ver tu nombre al pie del aviso, obligándote a ti y a tus amigos a presentaros en la sastrería para esclarecer la peligrosa trama que os rodea.",
    "closed": false
  },
  {
    "empresa": "Mythos Escape Room",
    "sala": "Expedición maldita",
    "url": "https://mythosmurcia.es/expedicion-maldita/",
    "image": "assets/rooms/mythos-escape-room-expedicion-maldita.webp",
    "description": "Tras años dedicados al estudio arqueológico, recibes un misterioso aviso que te sitúa a bordo de un tren rumbo a El Cairo. Junto a un selecto equipo, debes adentrarte en una ancestral tumba faraónica para satisfacer los turbios intereses de un oscuro personaje si deseas salvaguardar la vida de tus seres queridos.",
    "closed": false
  },
  {
    "empresa": "Golden Escape Room Madrid",
    "sala": "Alkatraz (Classic)",
    "url": "https://www.escaperoomlover.com/es/juego/golden-escape-room-mostoles-alkatraz-classic",
    "image": "assets/rooms/golden-escape-room-madrid-alkatraz-classic.webp",
    "description": "El juez ha dictado sentencia implacable: tú y tu banda habéis sido declarados culpables y confinados en Alkatraz, la temida prisión de máxima seguridad de la que nadie ha logrado escapar. Vuestro ingenio, compenetración y agilidad mental serán las únicas armas para burlar la estricta vigilancia y planear una fuga perfecta.",
    "closed": true
  },
  {
    "empresa": "Room Escape Corporation",
    "sala": "Rats Corp",
    "url": "https://roomescapecorporation.com/sala-de-escape/",
    "image": "assets/rooms/room-escape-corporation-rats-corp.webp",
    "description": "El Doctor Szalinski ha preparado en su laboratorio un insólito experimento para medir la capacidad de la mente humana frente a la astucia animal. Mientras unas ratas buscan la salida de su propio laberinto, vuestro grupo deberá resolver una cadena de enigmas lógicos a contrarreloj para demostrar quién posee la verdadera inteligencia.",
    "closed": false
  },
  {
    "empresa": "The city Escape Room",
    "sala": "La taberna",
    "url": "https://thecityescaperoom.com/barcelona/la-taberna/",
    "image": "assets/rooms/la-taberna.jpg",
    "description": "Neil Parker lidera un régimen despiadado y mantiene celosamente protegida la verdadera historia sobre los orígenes de su linaje. Para debilitar su poder, la Resistencia os encomienda viajar 400 años atrás en el tiempo hasta una modesta taberna donde comenzó todo, con la misión de revelar los secretos que harán tambalear su mandato.",
    "closed": false
  },
  {
    "empresa": "Sunbilla Escape",
    "sala": "Conviértete en un contrabandista",
    "url": "https://www.sunbillaescape.com/juego/",
    "image": "assets/rooms/sunbilla-escape-conviertete-en-un-contrabandista.webp",
    "description": "A finales de los años 50 en la frontera navarra, habéis sido contratados para cruzar un valioso cargamento de contrabando desde Francia. La Guardia Civil intercepta vuestra ruta y os detiene en el cuartel local mientras parte del grupo huye; deberéis agudizar el ingenio para burlar a las autoridades y fugaros antes del juicio.",
    "closed": false
  },
  {
    "empresa": "Secret Box",
    "sala": "Siro 3.0",
    "url": "https://secretboxescaperoom.com/siro30/",
    "image": "assets/rooms/secret-box-siro-3-0.webp",
    "description": "En un futuro no tan lejano, Siro 3.0 se erige como una inteligencia artificial suprema que desconfía profundamente del juicio de la humanidad. Para determinar si sois dignos de acceder a los avances de su nueva era, os someterá a un trepidante circuito de cinco niveles tecnológicos donde tendréis que demostrar vuestra agudeza mental.",
    "closed": false
  },
  {
    "empresa": "Castlemania",
    "sala": "La hermandad de las sombras",
    "url": "https://getoutescaperoom.es/zaragoza/hermandad-de-las-sombras/",
    "image": "assets/rooms/castlemania-la-hermandad-de-las-sombras.webp",
    "description": "Durante siglos, la Hermandad de las Sombras ha controlado los hilos del destino desde un santuario secreto bajo el mandato del temible Gran Lord Black. Como rebeldes infiltrados, disponéis de 100 minutos para franquear sus defensas, descifrar códices ocultos y desmantelar a la organización antes de que las puertas se sellen por siempre.",
    "closed": false
  },
  {
    "empresa": "Curious Cat Escape Room",
    "sala": "Proyecto X-547",
    "url": "https://www.curiouscatescaperoom.com/el-juego",
    "image": "assets/rooms/curious-cat-escape-room-proyecto-x-547.webp",
    "description": "Un laboratorio científico busca con urgencia sujetos de pruebas para el Proyecto X-547, una misteriosa investigación que promete revolucionar el mundo. Aceptando el reto, vuestro equipo deberá explorar las instalaciones, interpretar enigmas ocultos y pensar fuera de lo común para lograr escapar antes de que concluyan los 60 minutos.",
    "closed": false
  },
  {
    "empresa": "Mad Land",
    "sala": "Magic Universe",
    "url": "https://madlandmadrid.es/experiencias",
    "image": "assets/rooms/magic-universe.webp",
    "description": "Magic Universe propone una inmersión absoluta en Harrenfall, un asombroso mundo fantástico de más de 1.000 m² habitado por actores en directo y magia tangible. Durante una aventura de dos horas y media donde nada es fingido y cada sendero es único, vuestras decisiones individuales y colectivas forjarán el devenir de toda la historia.",
    "closed": false
  },
  {
    "empresa": "Escape Khaos",
    "sala": "El rescate",
    "url": "https://www.escaperoomlover.com/es/juego/escape-khaos-0-madrid-el-rescate",
    "image": "assets/rooms/escape-khaos-el-rescate.webp",
    "description": "Una alarma sacude la comisaría tras meses de angustiosa búsqueda: una niña pequeña ha sido secuestrada. El hallazgo de una misteriosa cinta de vídeo y un cofre cerrado con candado confirma que el captor desafía a los agentes a una carrera mental contra reloj para dar con el paradero de la menor antes de que sea demasiado tarde.",
    "closed": true
  },
  {
    "empresa": "Incognito Escape",
    "sala": "Operación steampunk",
    "url": "https://incognitoescape.es/operacion-steampunk/",
    "image": "assets/rooms/incognito-escape-operacion-steampunk.webp",
    "description": "Se ha detectado una ruptura en la continuidad espacio-temporal provocada por las peligrosas investigaciones de Ferdinand von Zeppelin. Vuestro equipo de detectives viajará hasta su fábrica de dirigibles en el año 1897 para resolver los enigmas y rescatar la historia tal como la conocemos.",
    "closed": false
  },
  {
    "empresa": "Incognito Escape",
    "sala": "Escape The Lost Pyramid VR",
    "url": "https://incognitoescape.es/escape-the-lost-pyramid-vr/",
    "image": "assets/rooms/incognito-escape-escape-the-lost-pyramid-vr.webp",
    "description": "Febrero de 1928. Una expedición dirigida por Sir Beldon Frye desaparece en la península del Sinaí mientras buscaba la Pirámide Perdida de Nebka. Gracias a una simulación de memoria genética en el universo Assassin's Creed, os pondréis en la piel de los exploradores para descubrir qué ocurrió y localizar su hallazgo.",
    "closed": false
  },
  {
    "empresa": "Incognito Escape",
    "sala": "Prince of Persia",
    "url": "https://incognitoescape.es/prince-of-persia-vr/",
    "image": "assets/rooms/incognito-escape-prince-of-persia.webp",
    "description": "Kaileena, la Emperatriz del Tiempo, os convoca en su fortaleza para frenar los siniestros planes de un temible mago que pretende crear un ejército de monstruos de arena. Empuñando la legendaria Daga del Tiempo, deberéis superar las defensas temporales y alcanzar la cámara del reloj de arena antes de que sea tarde.",
    "closed": false
  },
  {
    "empresa": "Incognito Escape",
    "sala": "Beyond Medusa's Gate",
    "url": "https://incognitoescape.es/beyond-medusas-gate-vr/",
    "image": "assets/rooms/incognito-escape-beyond-medusa-s-gate.webp",
    "description": "Grecia, 445 a.C., en una época de elocuentes filósofos y oráculos implacables. En una vasta cueva costera del mar Egeo se oculta el legendario barco de los Argonautas. Mediante la simulación del Animus, viajaréis al Peloponeso para explorar la caverna y desvelar los secretos que aguardan tras la Puerta de Medusa.",
    "closed": false
  },
  {
    "empresa": "Virus Escape Room",
    "sala": "Tao Room Escape: Japanese Massage Center",
    "url": "https://virusroomescape.com/es/escape-room-calella-tao/",
    "image": "assets/rooms/virus-escape-room-tao-room-escape-japanese-massage-center.webp",
    "description": "Habéis reservado un tratamiento exclusivo en el misterioso Tao Japanese Massage Center, pero al llegar nada es lo que parece. Tras una extraña bienvenida, os adentraréis en una experiencia repleta de giros inesperados, enigmas envolventes y una atmósfera que combina calma oriental con diversión desbordante.",
    "closed": false
  },
  {
    "empresa": "Virus Escape Room",
    "sala": "Velatoria",
    "url": "https://virusroomescape.com/es/escape-room-calella-velatoria/",
    "image": "assets/rooms/virus-escape-room-velatoria.webp",
    "description": "Una experiencia inmersiva repleta de humor negro, improvisación y actores en directo donde los extravagantes Hermanos Velatoria os reciben en su peculiar tanatorio. A partir de esa desconcertante bienvenida cualquier cosa puede suceder en una velada tan hilarante como inquietante.",
    "closed": false
  },
  {
    "empresa": "Hidden Escape Room",
    "sala": "La mina",
    "url": "https://colorsescaperoom.com/madrid/experiencia-marron-escape-room",
    "image": "assets/rooms/hidden-escape-room-la-mina.webp",
    "description": "En pleno centro de Madrid se halla una mina subterránea construida durante la guerra civil que permaneció sellada durante décadas. Con la ayuda de un plano original y del familiar de un antiguo capataz, vuestro equipo de mineros se adentrará en sus galerías para recuperar un mineral único antes de que el túnel colapse.",
    "closed": false
  },
  {
    "empresa": "Hidden Escape Room",
    "sala": "El loco",
    "url": "https://terrorstories.com/madrid/el-loco-escape-room",
    "image": "assets/rooms/hidden-escape-room-el-loco.webp",
    "description": "Habéis recibido una inquietante invitación a una sesión de tarot en la antigua residencia de la vidente Ángeles Turmet, famosa por sus oscuras prácticas de ocultismo. Tras su ingreso en un psiquiátrico y la repentina muerte de su marido, las puertas de la casa vuelven a abrirse para desvelar el terrible secreto que encierran sus paredes.",
    "closed": false
  },
  {
    "empresa": "Evil House",
    "sala": "Caronte",
    "url": "https://terrorstories.com/valencia/caronte-escape-room",
    "image": "assets/rooms/evil-house-caronte.webp",
    "description": "Habéis sido seleccionados para participar en una serie de ensayos clínicos y tratamientos experimentales en la misteriosa clínica Caronte. Aunque la remuneración económica es tentadora, los efectos secundarios son completamente desconocidos y pronto descubriréis los perturbadores métodos que ocultan sus instalaciones.",
    "closed": false
  },
  {
    "empresa": "Evil House",
    "sala": "El hotel de los suicidas",
    "url": "https://terrorstories.com/valencia/hotel-de-los-suicidas-escape-room",
    "image": "assets/rooms/evil-house-el-hotel-de-los-suicidas.webp",
    "description": "Os adentráis en la antigua Posada DuMont para descubrir la aterradora leyenda que afirma que todos sus huéspedes se quitaban la vida a los 90 minutos de registrarse. Pese a las tragedias del pasado, su nuevo propietario ha reabierto el edificio desafiando a los más valientes a sobrevivir a su macabra historia.",
    "closed": false
  },
  {
    "empresa": "Factoría Escape Room",
    "sala": "Golpe perfecto en el jardín de Buda",
    "url": "https://factoriaescaperoom.com/reserva-golpe-perfecto-en-el-jardin-de-buda/",
    "image": "assets/rooms/jardin-de-buda.png",
    "description": "Sois una afamada banda de ladrones de guante blanco y vuestro próximo objetivo es desplumar al líder de la mafia asiática, Xu Lin. Su base de operaciones es el restaurante El Jardín de Buda, donde contáis con un enlace infiltrado para dar el golpe maestro antes de que os descubran.",
    "closed": false
  },
  {
    "empresa": "Bite the Fly",
    "sala": "Bites Motel",
    "url": "https://www.bitethefly.com/es/bites-motel",
    "image": "assets/rooms/bite-the-fly-bites-motel.webp",
    "description": "Bites Motel os traslada a un recóndito y enigmático motel de carretera en el pueblo de Bite The Fly. Regentado por el tímido Norman y su madre Norma, este alojamiento promete un descanso inolvidable en una intensa experiencia de suspense psicológico con actores profesionales.",
    "closed": false
  },
  {
    "empresa": "Xkapa",
    "sala": "La estación del ferrocarril",
    "url": "https://xkapa.com/#escaperoomadultos",
    "image": "assets/rooms/xkapa-la-estacion-del-ferrocarril.webp",
    "description": "Vuestra banda de forajidos viajará hasta el lejano oeste para asaltar la caja fuerte del tren del dinero mientras permanece detenido en el andén. Tendréis que burlar la seguridad y vaciar las arcas de la compañía de ferrocarril antes de que se reanude la marcha en este emocionante asalto.",
    "closed": false
  },
  {
    "empresa": "Escape Room Badajoz",
    "sala": "La herencia",
    "url": "https://escaperoombadajoz.com/la-herencia/",
    "image": "assets/rooms/escape-room-badajoz-la-herencia.webp",
    "description": "Adelmiro Afonso sabía que sus avariciosos descendientes tramaban su asesinato. Por ello, redactó un testamento donde estipuló que solo aquel grupo capaz de descubrir la identidad de sus asesinos y hacer justicia heredaría su cuantiosa fortuna.",
    "closed": false
  },
  {
    "empresa": "Kadabra Escape",
    "sala": "Poison",
    "url": "https://www.kadabraescape.com/reserva-poison.html",
    "image": "assets/rooms/kadabra-escape-poison.webp",
    "description": "Uno de los criminales más brillantes y peligrosos de Gotham ha escapado de Arkham con un descerebrado plan para envenenar la ciudad entera. Con la policía desorientada y el gas tóxico listo para liberarse, vuestro equipo de detectives deberá infiltrarse en su guarida secreta y detener la catástrofe a tiempo.",
    "closed": false
  },
  {
    "empresa": "Descifra Escape",
    "sala": "El laberinto",
    "url": "https://www.escaperoomlover.com/es/juego/d3sc1fra-san-sebastian-de-los-reyes-el-laberinto",
    "image": "assets/rooms/descifra-escape-el-laberinto.webp",
    "description": "La mente de algunos genios es un laberinto en el que a veces ellos mismos se pierden. El cuerpo del genio Naricio Tornelio Exer yace inerte mientras su consciencia vaga desorientada por su memoria. Como expertos despiertamentes, deberéis adentraros en su psique antes de que sea demasiado tarde.",
    "closed": true
  },
  {
    "empresa": "Kenos Escape Room",
    "sala": "Kenos",
    "url": "https://www.escaperoomlover.com/es/juego/kenos-les-fonts-kenos",
    "image": "assets/rooms/kenos-escape-room-kenos.webp",
    "description": "En el barrio de Les Fonts se alzaba una antigua casona perteneciente a la familia Funes, marcada por oscuros rituales y trágicas desapariciones inexplicables. Tras la repentina marcha de sus habitantes, la mansión quedó abandonada y maldita, desafiando a quienes se atreven a desentrañar sus siniestros secretos.",
    "closed": true
  },
  {
    "empresa": "Mente Colmena Rooms",
    "sala": "El secreto de Kaos",
    "url": "https://www.escaperoomlover.com/es/juego/mente-colmena-rooms-beranga-el-secreto-de-kaos",
    "image": "assets/rooms/mente-colmena-rooms-el-secreto-de-kaos.webp",
    "description": "Kaos, uno de los hackers más peligrosos del mundo, se ha atrincherado en su casa de un pequeño pueblo de Cantabria para proteger varios pendrives con un devastador virus informático. Como agentes de élite de Mente Colmena, deberéis infiltraros y neutralizar la amenaza antes de que sea tarde.",
    "closed": true
  },
  {
    "empresa": "Codexcape",
    "sala": "Paranoia Remastered",
    "url": "https://terrorstories.com/valencia/paranoia-escape-room",
    "image": "assets/rooms/codexcape-paranoia-remastered.webp",
    "description": "El Hospital Mental Las Virtudes ha abierto sus puertas al público para ofrecer visitas guiadas a sus lúgubres instalaciones. Fundado en los años sesenta y envuelto en turbios rumores sobre experimentos prohibidos, deberéis recorrer sus pasillos mientras los inestables pacientes deambulan fuera de control.",
    "closed": false
  },
  {
    "empresa": "Paradiso Escape Room",
    "sala": "PROYECTO DCRISIS",
    "url": "https://paradisoescaperoom.es/proyecto-dcrisis",
    "image": "assets/rooms/paradiso-escape-room-proyecto-dcrisis.webp",
    "description": "Como miembros del equipo de rescate Delta 14, viajaréis hasta el recóndito Planeta Alpha con la misión de averiguar qué ha ocurrido con la expedición con la que se perdió el contacto. En un complejo militar abandonado, tendréis que avanzar con cautela y sobrevivir a los peligros y criaturas que acechan en la oscuridad.",
    "closed": false
  },
  {
    "empresa": "Arenaxcape / Mad Mansion",
    "sala": "Horror Asylum",
    "url": "https://horrorasylum.es/",
    "image": "assets/rooms/horror-asylum.webp",
    "description": "Habéis recibido una misteriosa carta proveniente del manicomio McArthur citándoos para visitar a uno de los pacientes más longevos del lugar. Este asegura ser un antiguo familiar vuestro que desea revelar un gran secreto antes de morir, pero lo que os aguarda tras sus muros supera vuestras peores pesadillas.",
    "closed": false
  },
  {
    "empresa": "Illusion",
    "sala": "El misterio de la Sagra",
    "url": "https://www.illusionescaperoom.com/rooms/el-misterio-de-la-sagra/",
    "image": "assets/rooms/illusion-el-misterio-de-la-sagra.webp",
    "description": "En 1483, una serie de macabros crímenes tienen en vilo a La Sagra tras hallar a siete aldeanos sin vida. El pueblo pide ayuda al Abad Ramiro Veracruz, pero este desaparece nada más iniciar sus pesquisas. Vuestra misión será adentraros en la abadía y resolver el enigma antes de convertiros en la siguiente víctima.",
    "closed": false
  },
  {
    "empresa": "Illusion",
    "sala": "Balamkú",
    "url": "https://www.illusionescaperoom.com/rooms/balamku/",
    "image": "assets/rooms/illusion-balamku.webp",
    "description": "Tras décadas de silencio sobre su última expedición a Chichén Itzá, un reputado arqueólogo confiesa en su lecho de muerte el misterio de la palabra Balamkú. Siguiendo su legado, deberéis reunir a vuestro equipo de exploradores y adentraros en los secretos de la civilización maya para descubrir qué ocultaba y conseguir una valiosa recompensa.",
    "closed": false
  },
  {
    "empresa": "Illusion",
    "sala": "Los descendientes de Sokar",
    "url": "https://www.illusionescaperoom.com/rooms/descendientes-sokar/",
    "image": "assets/rooms/illusion-los-descendientes-de-sokar.webp",
    "description": "En un futuro decadente donde la sociedad ha quedado dividida y sólo una élite controla la energía y los recursos, el resto de la humanidad sobrevive bajo un opresivo Nuevo Orden Mundial. Como miembros del grupo rebelde Los Descendientes de Sokar, deberéis infiltraros y encontrar el modo de devolver la luz y la esperanza a la civilización.",
    "closed": false
  },
  {
    "empresa": "Mayto Kingdom",
    "sala": "Tú también soñarás",
    "url": "https://maytokingdom.es/juegos/tu-tambien-sonaras/",
    "image": "assets/rooms/mayto-kingdom-tu-tambien-sonaras.webp",
    "description": "Como investigadores paranormales retirados, hartos de fraudes sobre casas embrujadas, un misterioso caso os conduce a las inmediaciones de una tenebrosa vivienda donde nadie debería entrar. Adentraos en más de 320 m² de pesadilla donde los decorados, efectos y presencias os sumergirán en una sobrecogedora experiencia cinematográfica.",
    "closed": false
  },
  {
    "empresa": "Mayto Kingdom",
    "sala": "La cámara del tiempo y el espíritu",
    "url": "https://maytokingdom.es/juegos/la-camara-del-espiritu-y-el-tiempo/",
    "image": "assets/rooms/mayto-kingdom-la-camara-del-tiempo-y-el-espiritu.webp",
    "description": "Con motivo del legendario Torneo Mundial de las Artes Marciales, vuestro equipo de guerreros acude a entrenar a la mítica Cámara del Espíritu y el Tiempo. Sin embargo, un imprevisto os deja atrapados en su interior, obligándoos a superar pruebas físicas y de ingenio a través de más de 215 m² para dominar vuestro ki y escapar a tiempo.",
    "closed": false
  },
  {
    "empresa": "Mayto Kingdom",
    "sala": "Una aventura de leyenda",
    "url": "https://maytokingdom.es/juegos/una-aventura-de-leyenda/",
    "image": "assets/rooms/mayto-kingdom-una-aventura-de-leyenda.webp",
    "description": "Un reputado grupo de arqueólogos ha localizado el mayor tesoro jamás conocido en las profundidades del sudeste asiático, pero una expedición rival pretende apoderarse de él. Adentraos en un gigantesco templo de más de 410 m² para sortear trampas mortales y enigmas ancestrales antes de que la reliquia caiga en manos equivocadas.",
    "closed": false
  },
  {
    "empresa": "Reversum Room Escape",
    "sala": "La Corona Maldita (Las Nieblas de Avalon)",
    "url": "https://reversumroomescape.es/juegos-escape-madrid/",
    "image": "assets/rooms/reversum-n-d.webp",
    "description": "En tiempos remotos un monarca tuvo ocho hijos legítimos y un noveno bastardo, Nuno, envuelto en una oscura leyenda medieval sobre una corona desaparecida. Muchos aventureros han probado fortuna a lo largo de los siglos, pero nadie ha logrado hallar la mítica reliquia real ni librarse de la maldición que la custodia.",
    "closed": false
  },
  {
    "empresa": "Reversum Room Escape",
    "sala": "En el corazón de los cuentos",
    "url": "https://reversumroomescape.es/juegos-escape-madrid/",
    "image": "assets/rooms/reversum-en-el-corazon-de-los-cuentos.webp",
    "description": "En un reino no tan lejano, una terrible amenaza se cierne sobre la fantasía: los cuentos y fábulas clásicas corren el riesgo de desvanecerse para siempre por culpa del malvado Ekron. Cuenta la leyenda que un valiente grupo deberá viajar hasta el corazón de los cuentos para salvar a sus personajes y preservar nuestra imaginación.",
    "closed": false
  },
  {
    "empresa": "Run Rabbit",
    "sala": "Haunted house",
    "url": "https://runrabbit.es/haunted-house/",
    "image": "assets/rooms/run-rabbit-haunted-house.webp",
    "description": "Una misteriosa casa lleva décadas clausurada tras el hallazgo del cadáver de un reputado científico y la desaparición de su hija. Contratados por Paranormal Hunters Corporation, deberéis adentraros en el inmueble para esclarecer la verdad, enfrentándoos a una oscura entidad que vigila cada uno de vuestros pasos.",
    "closed": false
  },
  {
    "empresa": "Run Rabbit",
    "sala": "La mazmorra",
    "url": "https://runrabbit.es/la-mazmorra/",
    "image": "assets/rooms/run-rabbit-la-mazmorra.webp",
    "description": "Capturados por la implacable Inquisición española de Tomás de Torquemada, habéis sido conducidos encapuchados a una oscura mazmorra medieval. A la espera de comparecer ante el Tribunal del Santo Oficio y a merced de un sádico verdugo, deberéis colaborar y mantener la calma para lograr escapar antes del amanecer.",
    "closed": false
  },
  {
    "empresa": "Skp Room",
    "sala": "El loco del callejón",
    "url": "https://skproom.com/el-loco-del-callejon/",
    "image": "assets/rooms/skp-room-el-loco-del-callejon.webp",
    "description": "Tras reservar habitación en un aislado motel para pasar el fin de semana, os encontráis con un lugar desolado y un recepcionista inquietante. Pronto un hombre encapuchado armado con cadenas oxidadas comienza a daros caza por un siniestro callejón, obligándoos a cooperar a contrarreloj para no convertiros en sus nuevos trofeos.",
    "closed": false
  },
  {
    "empresa": "Eureka! Escape Room",
    "sala": "Transporter",
    "url": "https://eurekaescaperoom.com/transporter/",
    "image": "assets/rooms/eureka-escape-room-transporter.webp",
    "description": "La Agencia busca equipos de profesionales con mente fría para realizar un envío clandestino de máxima discreción. Sin posibilidad de utilizar transportes convencionales y bajo amenaza de desmentir vuestra existencia si algo falla, dispondréis de 80 minutos para llevar un misterioso maletín a su destino antes de que sea tarde.",
    "closed": false
  },
  {
    "empresa": "Sapiens",
    "sala": "El caso Vasiliev",
    "url": "https://sapiensescape.es/el-caso-vasiliev/",
    "image": "assets/rooms/sapiens-el-caso-vasiliev.webp",
    "description": "A finales de la Guerra Fría, el espía Vasiliev es asesinado en su domicilio tras el robo de comprometedora documentación clasificada. Como agentes de investigación, deberéis infiltraros en la vivienda para esclarecer el crimen, recuperar los archivos y desenmascarar al culpable antes de ser descubiertos.",
    "closed": false
  },
  {
    "empresa": "Black Lake Escape Room",
    "sala": "La novia",
    "url": "https://blacklakeescaperoom.es/la-novia/",
    "image": "assets/rooms/black-lake-escape-room-la-novia.webp",
    "description": "Entre los vecinos de Black Lake no se habla de otra cosa: acaba de mudarse Anael Vidal, quien asegura predecir el futuro pero sufre el acecho de un siniestro ente apegado a su persona. Deberéis adentraros en su casa para esclarecer el misterio y enfrentaros cara a cara a la aterradora presencia de La Novia.",
    "closed": false
  },
  {
    "empresa": "Arcanum",
    "sala": "La posesión",
    "url": "https://www.arcanumescape.es/",
    "image": "assets/rooms/arcanum-la-posesion.webp",
    "description": "Una siniestra secta consagrada a oscuros sacrificios dejó una huella imborrable en la historia de la comarca. Cuando un objeto sagrado protector desaparece del hogar de Billie, su hermana cae en un inexplicable coma. Como especialistas en fenómenos paranormales, deberéis recuperar la reliquia y salvarla de una posesión infernal.",
    "closed": false
  },
  {
    "empresa": "Tangram Escape Room",
    "sala": "El tesoro de la momia",
    "url": "https://tangramescaperoom.com/",
    "image": "assets/rooms/tangram-escape-room-el-tesoro-de-la-momia.webp",
    "description": "Años después de que el Doctor Yons fuera traicionado buscando el tesoro de la Pirámide de Acirfa, sus notas secretas han sido halladas por sus nietos. Vuestro equipo de arqueólogos dispondrá de 60 minutos para infiltrarse en la cámara funeraria, desafiar la maldición de la momia y escapar con el tesoro antes de que sea tarde.",
    "closed": false
  },
  {
    "empresa": "Redrum Escape Room",
    "sala": "No deberías estar aquí",
    "url": "https://redrumescaperoom.es/nodeberiasestaraqui/",
    "image": "assets/rooms/redrum-escape-room-no-deberias-estar-aqui.webp",
    "description": "En pleno corazón de Triana, os adentráis en una experiencia donde ya no hay vuelta atrás y cada segundo cuenta. Si queréis salir con vida no debéis hablar, respirar ni temblar, pues una perturbadora presencia acecha en las sombras escuchando cada movimiento a lo largo de 90 minutos de pura tensión.",
    "closed": false
  },
  {
    "empresa": "Metamorfosis Escape Room",
    "sala": "Worm",
    "url": "https://www.metamorfosisescaperoom.com/#worm",
    "image": "assets/rooms/metamorfosis-escape-room-worm.webp",
    "description": "El brillante doctor Vladimir Ivanov logró crear en el centro de I+D de Metamorfosis su mayor invención: Worm, una máquina capaz de generar agujeros de gusano controlados. Sin embargo, un fatal accidente lo absorbió hacia lo desconocido, por lo que deberéis adentraros en el portal para rescatarlo cruzando el espacio-tiempo.",
    "closed": false
  },
  {
    "empresa": "Don Escape",
    "sala": "La tienda de té del Sr. Miyagi",
    "url": "https://donescape.es/",
    "image": "assets/rooms/don-escape-la-tienda-de-te-del-sr-miyagi.webp",
    "description": "Hace mucho tiempo que el venerado maestro Miyagi disfruta de un plácido retiro al frente de su humilde tienda de té en Tokio. Sin embargo, un asunto de suma importancia requiere vuestra ayuda, sumergiéndoos en una vibrante aventura japonesa repleta de ingenio, tradición y desafíos durante 90 minutos.",
    "closed": false
  },
  {
    "empresa": "Alexcaperoom",
    "sala": "Residencia Medica",
    "url": "https://alexcaperoom.com/juegos/",
    "image": "assets/rooms/alexcaperoom-residencia-medica.webp",
    "description": "Un prestigioso hospital de renombre internacional os ha admitido de forma inesperada como médicos residentes de primer año, a pesar de no haber echado la solicitud. Decididos a fingir ser auténticos doctores, pronto descubriréis que entre sus pasillos se ocultan extrañas desapariciones y presencias inquietantes.",
    "closed": false
  },
  {
    "empresa": "Escape Lab Valencia",
    "sala": "Night of the Meteor",
    "url": "https://www.escapelabvalencia.es/",
    "image": "assets/rooms/night-of-meteor.webp",
    "description": "En Silver City nadie se atreve a acercarse a la mansión Crowell desde que su patriarca llevó a examinar un fragmento del meteorito Gibeón y la familia entera dejó de parecer humana. Al amparo de la noche, vuestro equipo deberá infiltrarse en la mansión para desentrañar el enigma cósmico antes del amanecer.",
    "closed": false
  },
  {
    "empresa": "Distrito 7",
    "sala": "La terapia de la Dra. Wozniack",
    "url": "https://distrito7.es/la-terapia/",
    "image": "assets/rooms/distrito-7-la-terapia-de-la-dra-wozniack.webp",
    "description": "Dicen que ha llegado al Distrito una doctora de origen polaco con una terapia infalible que asegura curar cualquier trauma del pasado. Sin embargo, nadie sabe con certeza qué ocurre a puerta cerrada. Tendréis que adentraros en su misteriosa consulta y descubrir la verdad oculta tras sus controvertidos métodos.",
    "closed": false
  },
  {
    "empresa": "Distrito 7",
    "sala": "Noche de perros",
    "url": "https://distrito7.es/noche-de-perros/",
    "image": "assets/rooms/distrito-7-noche-de-perros.webp",
    "description": "Una noche de fiesta entre amigos para comerse una hamburguesa en Distrito 7 se complica de manera totalmente inesperada. Atrapados en una situación límite que se tuerce por momentos, tendréis que agudizar vuestro ingenio y cooperar al máximo para salir airosos de una auténtica noche de perros.",
    "closed": false
  },
  {
    "empresa": "Distrito 7",
    "sala": "Uppercut",
    "url": "https://distrito7.es/uppercut/",
    "image": "assets/rooms/distrito-7-uppercut.webp",
    "description": "En un distrito sumido en una constante lucha callejera, no solo los más fuertes sobreviven sino también los más astutos. Adentraos en el gimnasio clandestino donde se forjan los luchadores clandestinos y resolved sus desafíos antes de recibir el golpe de gracia definitivo.",
    "closed": false
  },
  {
    "empresa": "Open Mind Room Escape",
    "sala": "11S",
    "url": "https://openmindroomescape.es/11s-escape-room/",
    "image": "assets/rooms/open-mind-room-escape-11s.webp",
    "description": "Una experiencia inmersiva inspirada en la encomiable labor de los equipos de emergencia durante los sucesos del 11 de septiembre. Entrad en la historia, enfrentad situaciones de alto voltaje emocional y demostrad vuestra capacidad de rescate y evacuación contrarreloj.",
    "closed": false
  },
  {
    "empresa": "Open Mind Escape Room",
    "sala": "Slasher Party",
    "url": "https://openmindroomescape.es/slasher-party-escape-room/",
    "image": "assets/rooms/open-mind-escape-room-slasher-party.webp",
    "description": "Una fiesta en una cabaña apartada, un anfitrión con intenciones siniestras y una atmósfera de tensión y suspense inspirada en las películas slasher clásicas. Cuando la diversión se convierte en una trampa mortal, tendréis que usar vuestro ingenio para no convertiros en la próxima víctima.",
    "closed": false
  },
  {
    "empresa": "Open Mind Room Escape",
    "sala": "Artificiero",
    "url": "https://openmindroomescape.es/artificiero-escape-room/",
    "image": "assets/rooms/open-mind-room-escape-artificiero.webp",
    "description": "Dos jugadores, una misión crítica y ninguna pista que podáis resolver por separado. La comunicación constante y la absoluta concentración serán vuestras únicas armas para desactivar el artefacto explosivo antes de que el contador llegue a cero.",
    "closed": false
  },
  {
    "empresa": "Materia gris",
    "sala": "Enganchados al gris",
    "url": "https://escapemateriagris.com/enganchados/",
    "image": "assets/rooms/materia-gris-enganchados-al-gris.webp",
    "description": "Una serie de macabros crímenes donde las víctimas aparecen sin cerebro tiene conmocionado al país. Adentraos en la retorcida mente de un asesino en serie y descended a los abismos de la locura para desentrañar el perturbador misterio de Materia Gris.",
    "closed": false
  },
  {
    "empresa": "Materia Gris",
    "sala": "Grey submarine",
    "url": "https://escapemateriagris.com/grey-submarine/",
    "image": "assets/rooms/materia-gris-grey-submarine.webp",
    "description": "Lo que comenzó como una fascinante expedición de turismo submarino extremo en las profundidades abisales se transforma en una angustiosa carrera por la supervivencia. Con las reservas de oxígeno disminuyendo y los sistemas en fallo crítico, deberéis reactivar el submarino antes de quedar atrapados en el fondo marino.",
    "closed": false
  },
  {
    "empresa": "Arroyo Escape Room",
    "sala": "Agencia 360",
    "url": "https://arroyoescaperoom.com/agencia-360/",
    "image": "assets/rooms/arroyo-escape-room-agencia-360.webp",
    "description": "¿Queréis formar parte de la prestigiosa Agencia 360 de espionaje e investigación? Cientos de aspirantes lo han intentado antes, pero solo los agentes más perspicaces y coordinados lograrán superar las rigurosas pruebas de admisión y descifrar sus secretos de estado.",
    "closed": false
  },
  {
    "empresa": "Arroyo Escape Room",
    "sala": "El guardabosques",
    "url": "https://arroyoescaperoom.com/el-guardabosques/",
    "image": "assets/rooms/arroyo-escape-room-el-guardabosques.webp",
    "description": "Tras la repentina desaparición de Olegario Bosquejo, el idílico Parque Natural de Alto Bruma ha comenzado a sufrir extraños e inquietantes sucesos. Adentraos en su cabaña y en la espesura del bosque para descubrir la verdad que oculta su cuaderno de bitácora.",
    "closed": false
  },
  {
    "empresa": "Enigmik",
    "sala": "La cervesería",
    "url": "https://enigmik.com/es/la-cerveceria-escape-room-barcelona/",
    "image": "assets/rooms/enigmik-la-cerveseria.webp",
    "description": "Una exclusiva degustación de cervezas artesanales donde ingredientes, aromas y texturas guardan enigmas inesperados. A lo largo de una divertida y sorprendente sesión, deberéis descubrir la fórmula secreta del maestro cervecero antes de que finalice la cata.",
    "closed": false
  },
  {
    "empresa": "Insidious",
    "sala": "Insidious",
    "url": "https://insidiousescaperoom.es/",
    "image": "assets/rooms/insidious-insidious.webp",
    "description": "En una apartada zona rural se pone a la venta un inmueble señorial a un precio extraordinariamente bajo. Sin embargo, los antiguos propietarios desaparecieron en extrañas circunstancias y las presencias del Más Allá acechan en cada rincón oscuro de la casa.",
    "closed": false
  },
  {
    "empresa": "Yaebi",
    "sala": "La farmacia",
    "url": "https://www.yaebi.com/la-farmacia",
    "image": "assets/rooms/yaebi-la-farmacia.webp",
    "description": "En 1885, la sociedad londinense está conmocionada por una implacable oleada de desapariciones y crímenes sin resolver. Todas las pistas conducen a la botica de una antigua farmacia victoriana, donde oscuras fórmulas y experimentos clandestinos aguardan a ser desvelados.",
    "closed": false
  },
  {
    "empresa": "Hermético",
    "sala": "Caníbal",
    "url": "https://hermetico.es/canibal/",
    "image": "assets/rooms/hermetico-canibal.webp",
    "description": "Un perturbador carnicero ha sembrado el terror en la ciudad secuestrando a incautos transeúntes para satisfacer sus aberrantes apetitos. Encerrados en su sórdido taller clandestino, tendréis que mantener la sangre fría y encontrar una salida antes de convertiros en el plato principal.",
    "closed": false
  },
  {
    "empresa": "Blindhouse Games",
    "sala": "La rebelión: línea de sangre híbrida",
    "url": "https://azescaperoom.es/la-rebelion-linea-de-sangre-hibrida/",
    "image": "assets/rooms/blindhouse-games-la-rebelion-linea-de-sangre-hibrida.webp",
    "description": "La milenaria guerra entre vampiros y licántropos ha estallado sin cuartel. Lucian, líder licántropo de la rebelión que fue criado como esclavo, busca desatar el poder de un linaje híbrido para equilibrar la balanza. Vuestro equipo deberá infiltrarse en la fortaleza enemiga y decidir el destino de ambas razas.",
    "closed": false
  },
  {
    "empresa": "Fear Factory Experiences",
    "sala": "IN",
    "url": "https://www.fearfactoryexp.com/in",
    "image": "assets/rooms/fear-factory-experiences-in.webp",
    "description": "Sobrevive a las macabras pruebas y experimentos a los que te someterán en el misterioso centro IN. En una atmósfera de tensión psicológica y adrenalina constante, deberéis colaborar y superar vuestros mayores miedos para escapar del laboratorio clandestino.",
    "closed": false
  },
  {
    "empresa": "Can Bruna",
    "sala": "Odisea Celular",
    "url": "https://canbruna.cat/juego/",
    "image": "assets/rooms/can-bruna-odisea-celular.webp",
    "description": "¿Qué le ocurre a la entrañable yaya? Tan pronto parece perder la cabeza como pronostica visiones del futuro. Para curar su afección, vuestro equipo de investigación se someterá a un asombroso proceso de miniaturización para viajar al interior de su propio organismo en una odisea celular sin precedentes.",
    "closed": false
  },
  {
    "empresa": "Vortex Escape",
    "sala": "Apophis",
    "url": "https://vortexescape.com/apophis/",
    "image": "assets/rooms/vortex-escape-apophis.webp",
    "description": "Una colosal amenaza extraterrestre conocida como Apophis avanza con rumbo de colisión hacia la Tierra. A bordo de la estación orbital de defensa deberéis descifrar complejos códigos de activación y coordinar los sistemas defensivos para salvar a la humanidad de la extinción total.",
    "closed": false
  },
  {
    "empresa": "Arena Gaming",
    "sala": "El bunker 21",
    "url": "https://www.arenagaming.es/escape-room-el-bunker-21/",
    "image": "assets/rooms/arena-gaming-el-bunker-21.webp",
    "description": "Tras una catástrofe global que ha devastado la superficie, un grupo de supervivientes logra refugiarse en el Búnker 21. Cuando los sistemas de purificación de aire y blindaje contra la radiación comienzan a colapsar, tendréis que reactivar los protocolos de emergencia antes de que el refugio se convierta en una tumba.",
    "closed": false
  },
  {
    "empresa": "Saga Escape Room",
    "sala": "Londium",
    "url": "https://londiumescaperoom.com/",
    "image": "assets/rooms/saga-escape-room-londium.webp",
    "description": "Viajad a las neblinosas y empedradas calles del Londres victoriano para desentrañar un enigma que desconcierta a la mismísima Scotland Yard. En una ambientación cinematográfica y detallada al milímetro, deberéis seguir las pistas dejadas por una enigmática sociedad secreta y resolver el misterio que cambiará el rumbo del imperio.",
    "closed": false
  },
  {
    "empresa": "Shock Escape Room",
    "sala": "La santa",
    "url": "https://www.shockescaperoom.com/escape-room-hall-escape-lasanta",
    "image": "assets/rooms/la-santa.png",
    "description": "Una serie de extraños y demoníacos sucesos azotan la Abadía de Santa Clara, sembrando el terror entre las hermanas del convento. Guiados por el padre Eusebio, experto demonólogo, deberéis adentraros en sus oscuros pasillos para investigar qué entidad maligna se oculta tras los hábitos.",
    "closed": false
  },
  {
    "empresa": "Shock Escape Room",
    "sala": "Abduction 3: The Exam",
    "url": "https://www.shockescaperoom.com/the-exam/",
    "image": "assets/rooms/shock-escape-room-abduction-3-the-exam.webp",
    "description": "The Exam os reta a superar un exigente test que pone a prueba tanto vuestra capacidad deductiva como vuestras habilidades físicas. En 60 minutos contrarreloj, vuestro equipo deberá compenetrarse y resolver dinámicos desafíos para demostrar que estáis a la altura de este reto.",
    "closed": false
  },
  {
    "empresa": "Abduction",
    "sala": "Abduction 4: Enterprises",
    "url": "https://www.abduction.es/badalona/abduction4",
    "image": "assets/rooms/abduction-abduction-4-enterprises.webp",
    "description": "¿Estaréis a la altura de lo que el Caballero Oscuro espera de vosotros? Ambientada en el universo del hombre murciélago, esta trepidante aventura de 70 minutos combina ingenio, agilidad y destreza física en una prueba no apta para cardíacos en las instalaciones de Abduction.",
    "closed": false
  },
  {
    "empresa": "Elements Escape Room",
    "sala": "Cetro de fuego",
    "url": "https://www.elementsescaperoom.com/fuego/",
    "image": "assets/rooms/elements-escape-room-cetro-de-fuego.webp",
    "description": "Cuenta la leyenda que el Dios Seth lanzó una maldición tras la apertura de la tumba del Faraón Seti III, dejando la región sumida en la miseria. Vuestro equipo de arqueólogos deberá explorar las antiguas cámaras egipcias para localizar el sagrado cetro y romper la milenaria condena.",
    "closed": false
  },
  {
    "empresa": "Elements",
    "sala": "Exodus",
    "url": "https://www.elementsescaperoom.com/exodus/",
    "image": "assets/rooms/elements-exodus.webp",
    "description": "A finales de los 90, un virus devastador arrasó con la humanidad, convirtiendo el abandono del planeta en la única opción de supervivencia. Como supervivientes, deberéis poner a prueba vuestras dotes de resistencia y superar todos los peligros para alcanzar el Proyecto Exodus a tiempo.",
    "closed": false
  },
  {
    "empresa": "Elements",
    "sala": "Exorcista",
    "url": "https://terrorstories.com/barcelona/exorcista-escape-room",
    "image": "assets/rooms/elements-exorcista.webp",
    "description": "Una fuerza demoníaca ha tomado posesión de la hija de una familia, desatando el caos en su hogar con objetos flotantes y ruidos aterradores. Vuestro equipo deberá acudir a la vivienda y ayudar al sacerdote a completar el ritual de exorcismo antes de que el maligno se apodere de todos.",
    "closed": false
  },
  {
    "empresa": "The X door",
    "sala": "La peluquería",
    "url": "https://thexdoor.com/la-peluqueria/",
    "image": "assets/rooms/the-x-door-la-peluqueria.webp",
    "description": "El gran David Hasselhoff está siendo víctima de un turbio chantaje y todas las pistas conducen al salón de Remigio, el afable peluquero de los famosos. Durante 90 minutos de pura tensión, sorpresas y humor, vuestro equipo deberá desenmascarar la trama antes de que se desate el caos.",
    "closed": false
  },
  {
    "empresa": "The X-Door",
    "sala": "El Último Dragón",
    "url": "https://thexdoor.com/el-ultimo-dragon/",
    "image": "assets/rooms/the-x-door-el-ultimo-dragon.webp",
    "description": "Vuestra reina os necesita con urgencia: corre el temible rumor de que el ejército enemigo contará muy pronto con un dragón para la guerra. Adentraos en una ambientación medieval épica para desvelar los secretos de la mítica criatura y salvar al continente de una destrucción inminente.",
    "closed": false
  },
  {
    "empresa": "Scavenger",
    "sala": "La cámara de tortura",
    "url": "https://www.scavengerescape.com/es/madrid/room/Torture%20Chamber",
    "image": "assets/rooms/scavenger-la-camara-de-tortura.webp",
    "description": "Despertáis encadenados en una siniestra mazmorra rodeados de instrumentos de tortura ensangrentados y oscuros vestigios. Aprovechando que el guardia se ausenta por unos instantes, deberéis colaborar para liberar vuestras cadenas y descubrir el macabro experimento del que formáis parte.",
    "closed": false
  },
  {
    "empresa": "Scavenger",
    "sala": "El retrato de Picasso",
    "url": "https://www.scavengerescape.com/es/madrid/room/Picasso's%20Portrait",
    "image": "assets/rooms/scavenger-el-retrato-de-picasso.webp",
    "description": "Una prestigiosa casa de subastas sospecha que una pintura inacabada y secreta de Picasso fue sustraída por un acaudalado coleccionista privado. Como detectives contratados, tendréis 60 minutos para infiltraros en su residencia, localizar la codiciada obra de arte y certificar su autenticidad.",
    "closed": false
  },
  {
    "empresa": "Dragonborn",
    "sala": "Dragonborn: El hijo del posadero",
    "url": "https://dragonbornvitoria.es/dragonborn/",
    "image": "assets/rooms/dragonborn-dragonborn-el-hijo-del-posadero.webp",
    "description": "Dice la leyenda que muchos aventureros parten hacia una remota posada en lo alto de la montaña en busca de riquezas, pero pocos regresan. Como grupo de exploradores, deberéis aceptar la súplica del posadero y desentrañar los misterios que oculta el lugar para encontrar a su hijo desaparecido.",
    "closed": false
  },
  {
    "empresa": "La cronosfera",
    "sala": "La desapareición del profesor",
    "url": "https://www.lacronosfera-agenciadeagencias.com/la-cronosfera-agencia-del-tiempo-la-desaparicion-del-profesor",
    "image": "assets/rooms/la-cronosfera-la-desapareicion-del-profesor.webp",
    "description": "Un agente colaborador de La Cronosfera, el profesor Maimónides, ha desaparecido en extrañas circunstancias en la línea temporal LC-8/21. Vuestro equipo de crononautas viajará en el tiempo hasta el 20 de octubre de 1920 a su residencia para investigar qué ha ocurrido y restaurar la historia.",
    "closed": false
  },
  {
    "empresa": "Ncerrados",
    "sala": "La maldición de los Balaguer",
    "url": "https://www.ncerradosescaperoom.es/Nuestras%20Salas/la-maldicion-de-los-balaguer/",
    "image": "assets/rooms/ncerrados-la-maldicion-de-los-balaguer.webp",
    "description": "Para proteger a su hija Aurora de un extraño virus, la familia Balaguer se aisló en su mansión hasta que todos desaparecieron sin dejar rastro. Años después, vuestro equipo de investigación se adentra en la casa abandonada para descubrir la verdad mientras los antiguos habitantes os acechan entre las sombras.",
    "closed": false
  },
  {
    "empresa": "Road Out Escape Room",
    "sala": "La gran fuga",
    "url": "https://roadoutescaperoom.com/la-gran-fuga-2-0/",
    "image": "assets/rooms/road-out-escape-room-la-gran-fuga.webp",
    "description": "Un fallo en vuestro plan convirtió un gran golpe en una operación fallida, terminando vuestros huesos tras las rejas de una prisión de máxima seguridad. Deberéis cooperar para descifrar pistas y burlar la estricta vigilancia carcelaria antes de que se desvanezca la oportunidad de escapar.",
    "closed": false
  },
  {
    "empresa": "Krematorium Escape Rooms Experience",
    "sala": "Malum",
    "url": "https://malumescaperoom.com/",
    "image": "assets/rooms/krematorium-escape-rooms-experience-malum.webp",
    "description": "Abandonad toda esperanza quienes aquí entráis. Un mal ancestral habita tras estas puertas; si es vuestra decisión continuar por este sendero, que dios se apiade de vuestras almas porque la oscuridad no tendrá piedad ante quienes osen despertar el terror oculto en sus profundidades.",
    "closed": false
  },
  {
    "empresa": "Escape Republik",
    "sala": "Nakatomi plaza",
    "url": "https://unrealroomescape.es/horta/",
    "image": "assets/rooms/escape-republik-nakatomi-plaza.webp",
    "description": "En la última noche del año se celebra una gran fiesta en el prestigioso hotel Nakatomi Plaza, donde se rumorea que un grupo armado planea un atentado durante las doce campanadas. Como miembros de un equipo táctico de sigilo, deberéis infiltraros y neutralizar la amenaza sin levantar sospechas.",
    "closed": false
  },
  {
    "empresa": "Whitechapel",
    "sala": "Whitechapel: La historia de Charlotte",
    "url": "https://roomwhitechapel.com/",
    "image": "assets/rooms/whitechapel-whitechapel-la-historia-de-charlotte.webp",
    "description": "Whitechapel, Londres, 1888. Tras los brutales crímenes de Jack el Destripador, un sanguinario imitador surge 130 años después sumiendo las calles en el caos y amenazando con cobrarse la vida de la joven Charlotte. Vuestro equipo deberá seguir las pistas y enfrentarse a sus peores miedos para detenerlo.",
    "closed": false
  },
  {
    "empresa": "Silent Town Escape Room",
    "sala": "Colegio Midwich",
    "url": "https://www.escaperoomlover.com/es/juego/silent-town-basauri-la-historia-del-colegio-midwich",
    "image": "assets/rooms/silent-town-escape-room-colegio-midwich.webp",
    "description": "Tras sufrir un accidente de coche en una carretera desierta al esquivar a una misteriosa niña, despertáis desorientados en un pueblo fantasma cubierto de cenizas y sumido en la oscuridad. Vuestro instinto de supervivencia será clave para escapar de las pesadillas del colegio Midwich y romper la maldición.",
    "closed": true
  },
  {
    "empresa": "Start play",
    "sala": "Atraco al compadre",
    "url": "https://startplay.es/escape-room-en-murcia/",
    "image": "assets/rooms/start-play-atraco-al-compadre.webp",
    "description": "En Atraco al Compadre os uniréis al legendario ladrón Al Frijole para dar el golpe definitivo: infiltraros y asaltar la cámara del acorazado banco CDM DIRECT, propiedad del temido capo El Compadre. Dispondréis de dos horas para burlar la seguridad y llevaros el botín antes de ser descubiertos.",
    "closed": false
  },
  {
    "empresa": "Kalon",
    "sala": "La coleccionista",
    "url": "https://www.kalonescape.com/el-juego/",
    "image": "assets/rooms/kalon-la-coleccionista.webp",
    "description": "Emily era una apasionada coleccionista de arte y reliquias singulares, pero los oscuros secretos que custodiaban sus piezas terminaron por atraparla en una pesadilla entre la vigilia y la locura. Deberéis adentraros en su inquietante universo, resolver sus enigmas y sobrevivir al terror antes de que os consuma.",
    "closed": false
  },
  {
    "empresa": "Escape Barcelona",
    "sala": "CyberCity 2049",
    "url": "https://escapebarcelona.com/cybercity-2049.php",
    "image": "assets/rooms/cybercity-2049.jpg",
    "description": "Año 2049. En una megalópolis distópica dominada por megacorporaciones y androides, vuestro equipo de hackers rebeldes deberá infiltrarse en el corazón cibernético de la ciudad para robar los planos del nuevo orden y evitar el colapso de la humanidad.",
    "closed": false
  },
  {
    "empresa": "Escape Barcelona",
    "sala": "Tomb Hunter",
    "url": "https://escapebarcelona.com/tomb-hunter-la-leyenda-de-akasha.php",
    "image": "assets/rooms/escape-barcelona-tomb-hunter.webp",
    "description": "Siguiendo las huellas de la legendaria reina Akasha, una expedición arqueológica se adentra en un templo ancestral olvidado por el tiempo. Sortead trampas mortales, descifrad jeroglíficos milenarios y encontrad el amuleto sagrado antes de que la tumba se selle para siempre.",
    "closed": false
  },
  {
    "empresa": "Escape Barcelona",
    "sala": "K.O.N.G PROTOCOL",
    "url": "https://escapebarcelona.com/kong-protocol.php",
    "image": "assets/rooms/kong-protocol.jpg",
    "description": "Las alarmas de la base científica subterránea han comenzado a sonar. Una criatura de poder descomunal ha quebrado los sistemas de contención y amenaza con destruir el complejo. Activad el protocolo de emergencia K.O.N.G antes de que sea demasiado tarde.",
    "closed": false
  },
  {
    "empresa": "Code 258",
    "sala": "Chernobyl",
    "url": "https://code258.com/chernobyl/",
    "image": "assets/rooms/code-258-chernobyl.webp",
    "description": "26 de abril de 1986. Tras la fatídica explosión del reactor 4 de la central de Chernóbil, un grupo de liquidadores de élite es enviado a la zona cero. Vuestra misión será evitar una segunda catástrofe nuclear que devastaría el continente europeo.",
    "closed": false
  },
  {
    "empresa": "Code 258",
    "sala": "La vinoteca",
    "url": "https://code258.com/la-vinoteca/",
    "image": "assets/rooms/code-258-la-vinoteca.webp",
    "description": "Entre barricas añejas y aromas a roble, una prestigiosa bodega familiar esconde un secreto codiciado por coleccionistas de todo el mundo. Descubrid la fórmula magistral del vino más exclusivo antes de que los rivales de la familia se apoderen de ella.",
    "closed": false
  },
  {
    "empresa": "Unreal Room Escape",
    "sala": "Distrito 111",
    "url": "https://unrealroomescape.es/distrito-111/",
    "image": "assets/rooms/unreal-room-escape-distrito-111.webp",
    "description": "Un barrio marginal sumido en el caos y gobernado por peligrosas bandas callejeras oculta un secreto vital para el futuro de la ciudad. Vuestro escuadrón deberá patrullar sus callejones hostiles, recabar pruebas y neutralizar la amenaza antes del toque de queda.",
    "closed": false
  },
  {
    "empresa": "Unreal Room Escape",
    "sala": "NightShift",
    "url": "https://unrealroomescape.es/nightshift/",
    "image": "assets/rooms/unreal-room-escape-nightshift.webp",
    "description": "Aceptáis un turno de noche aparentemente rutinario en unas misteriosas instalaciones industriales. Sin embargo, cuando las puertas se cierran y la iluminación parpadea, comprenderéis que vuestros compañeros de trabajo no son lo que parecen.",
    "closed": false
  },
  {
    "empresa": "Action House",
    "sala": "Un caso perdido",
    "url": "https://actionhouse.es/un-caso-perdido/",
    "image": "assets/rooms/action-house-un-caso-perdido.webp",
    "description": "Un reputado detective privado ha desaparecido sin dejar rastro mientras investigaba la pista de un peligroso capo del crimen organizado. Entrad en su despacho, reconstruid sus pasos y resolved el enigma que la policía dio por perdido.",
    "closed": false
  },
  {
    "empresa": "Action House",
    "sala": "Ratas de biblioteca",
    "url": "https://actionhouse.es/ratas-de-biblioteca/",
    "image": "assets/rooms/action-house-ratas-de-biblioteca.webp",
    "description": "Entre manuscritos prohibidos, estanterías infinitas y volúmenes arcanos, una hermandad secreta custodia el conocimiento absoluto. Agudizad vuestra mente y superad las pruebas bibliófilas para descifrar el códice prohibido.",
    "closed": false
  },
  {
    "empresa": "Gravity Zero Room",
    "sala": "The passengers",
    "url": "https://gravityzeroroom.com/the-passengers/",
    "image": "assets/rooms/gravity-zero-room-the-passengers.webp",
    "description": "En una travesía interestelar a bordo de un crucero de lujo hiperespacial, el sistema de navegación de la nave falla repentinamente. Con la tripulación en criostasis y la órbita degradándose hacia un agujero negro, solo vosotros podréis reprogramar el piloto automático.",
    "closed": false
  },
  {
    "empresa": "1801 Escape Room",
    "sala": "Casa Museu Josep Fontcalda",
    "url": "https://1801escaperoom.com/casa-museu-josep-fontcalda/",
    "image": "assets/rooms/1801-escape-room-casa-museu-josep-fontcalda.webp",
    "description": "La histórica residencia del ilustre mecenas Josep Fontcalda abre sus puertas en exclusiva para vuestra visita. Sin embargo, entre cuadros de época y salas señoriales, se oculta la verdadera y misteriosa herencia que el magnate dejó para los más valientes.",
    "closed": false
  },
  {
    "empresa": "Wayout Room Escape",
    "sala": "Hotel Hello",
    "url": "https://wayoutescape.com/hotel-hello/",
    "image": "assets/rooms/wayout-room-escape-hotel-hello.webp",
    "description": "El Hotel Hello solía ser un glamuroso destino vacacional hasta que una serie de escalofriantes acontecimientos forzó su cierre temporal. Al registraros como nuevos huéspedes, descubriréis que algunas habitaciones conservan presencias de las que es imposible salir.",
    "closed": false
  },
  {
    "empresa": "A Maze in 60",
    "sala": "Origen",
    "url": "https://amazein60.com/origen/",
    "image": "assets/rooms/a-maze-in-60-origen.webp",
    "description": "Un viaje iniciático a través de las diferentes etapas evolutivas y civilizaciones del ser humano. En 60 minutos de pura adrenalina y sincronización, vuestro equipo deberá resolver los acertijos que marcaron el comienzo de nuestra historia.",
    "closed": false
  },
  {
    "empresa": "Outline Escape Room",
    "sala": "Outline",
    "url": "https://outline-escape.com/",
    "image": "assets/rooms/outline-escape-room-outline.webp",
    "description": "Una experiencia inmersiva de terror psicológico y tensión extrema en una siniestra fábrica abandonada. Para sobrevivir a la oscura sombra que acecha en los pasillos, tendréis que permanecer unidos y desafiar vuestros límites mentales.",
    "closed": false
  },
  {
    "empresa": "Escape Room Alicante Secret Hunter",
    "sala": "Malibú",
    "url": "https://secrethunter.es/malibu/",
    "image": "assets/rooms/escape-room-alicante-secret-hunter-malibu.webp",
    "description": "Suena el despertador y te despiertas desorientado y con una resaca monumental tras la fiesta de anoche en Alicante... ¡y descubres que te falta un dedo vendado! En tu bolsillo encuentras una tarjeta de los Apartamentos Malibú: tendrás que regresar a la escena de la juerga para recuperarlo antes de que sea tarde.",
    "closed": false
  },
  {
    "empresa": "Soul Games",
    "sala": "Psycokiller",
    "url": "https://soulgamesescape.com/psycokiller/",
    "image": "assets/rooms/soul-games-psycokiller.webp",
    "description": "Un sanguinario asesino en serie juega con la policía sembrando macabros acertijos en su guarida. Atraídos por una pista trampa, quedáis atrapados en su taller de tortura y dispondréis de un tiempo límite para escapar con vida.",
    "closed": false
  },
  {
    "empresa": "Final Code",
    "sala": "Bermudas: El secreto jamás revelado",
    "url": "https://finalcode.es/bermudas-el-secreto-jamas-revelado/",
    "image": "assets/rooms/final-code-bermudas-el-secreto-jamas-revelado.webp",
    "description": "Decenas de barcos y aviones han desaparecido sin explicación en las turbulentas aguas del Triángulo de las Bermudas. Vuestra expedición marina ha encontrado un pecio sumergido que guarda la clave científica y mística que resolverá el misterio más antiguo del océano.",
    "closed": false
  },
  {
    "empresa": "La Logia Negra Escape Room",
    "sala": "Camino a la Logia Negra",
    "url": "https://lalogianegra.es/camino-a-la-logia-negra/",
    "image": "assets/rooms/la-logia-negra-escape-room-camino-a-la-logia-negra.webp",
    "description": "Inspirada en el universo enigmático y surrealista de Twin Peaks, esta sala os transporta a los oscuros bosques donde las cortinas rojas y las señales arcanas marcan el sendero hacia la mítica Logia Negra.",
    "closed": false
  },
  {
    "empresa": "Hiruko Escape Room",
    "sala": "Las pruebas",
    "url": "https://www.escaperoomlover.com/es/juego/hiruko-elizondo-las-pruebas",
    "image": "assets/rooms/hiruko-escape-room-las-pruebas.webp",
    "description": "La Corporación Hiruko, dedicada a contener y estudiar fenómenos anómalos que amenazan a la humanidad, convoca a los pocos audaces que lograron hackear su sistema central. Someteos a 105 minutos de exigentes pruebas de admisión para demostrar si sois dignos de ingresar como agentes de élite.",
    "closed": true
  },
  {
    "empresa": "Friki Escape Room",
    "sala": "Puñalada",
    "url": "https://www.frikiescaperoom.com/reservas/",
    "image": "assets/rooms/friki-escape-room-punalada.webp",
    "description": "Una divertida a la vez que terrorífica parodia en vivo del cine slasher de los noventa. Cuando el teléfono comience a sonar en plena oscuridad y una voz siniestra os pregunte cuál es vuestra película de miedo favorita, tendréis que afinar el ingenio para sobrevivir a la puñalada.",
    "closed": false
  },
  {
    "empresa": "Insomnia Corporation",
    "sala": "La casa",
    "url": "https://insomniacorp.com/escapes/6",
    "image": "assets/rooms/insomnia-corporation-la-casa.webp",
    "description": "Ven a disfrutar de una casa de turismo rural situada en mitad del bosque y sin vecinos a cuatro kilómetros. Tras un grave incidente en el pozo ocurrido hace más de 40 años, la propiedad fue reformada por completo, convirtiéndose en una de las experiencias de terror rural más aclamadas.",
    "closed": false
  },
  {
    "empresa": "Insomnia Corporation",
    "sala": "Sr Krugger",
    "url": "https://insomniacorp.com/habitacions",
    "image": "assets/rooms/insomnia-corporation-sr-krugger.webp",
    "description": "Habitación y experiencia inmersiva del Sr. Krugger, el enterrador de la infame familia Krugger. Una estancia tematizada íntegramente como una siniestra sala de autopsias donde los participantes deben resolver oscuros enigmas rodeados de instrumental médico y ataúdes hechos a medida.",
    "closed": false
  },
  {
    "empresa": "Insomnia Corporation",
    "sala": "El secreto de los Krugger",
    "url": "https://insomniacorp.com/escapes/secreto-krugger",
    "image": "assets/rooms/insomnia-corporation-el-secreto-de-los-krugger.webp",
    "description": "Una aventura inmersiva y escalofriante en Insomnia Hotel que os llevará a descubrir los oscuros secretos de la familia Krugger. Combina enigmas desafiantes, cena espectáculo y un terrorífico escape room donde cada habitación oculta misterios que pondrán a prueba vuestra cordura.",
    "closed": false
  },
  {
    "empresa": "Sala Enigma",
    "sala": "La vida nuclear",
    "url": "https://vitoria.salaenigma.com/la-vida-nuclear/",
    "image": "assets/rooms/sala-enigma-la-vida-nuclear.webp",
    "description": "En un futuro donde el mundo está agitado y la seguridad en la superficie está en jaque, la única alternativa de supervivencia es la vida subterránea. Vuestro equipo deberá adentrarse en un búnker sellado e investigar las instalaciones para asegurar el futuro de la humanidad.",
    "closed": false
  },
  {
    "empresa": "Sala Enigma",
    "sala": "Caín",
    "url": "https://vitoria.salaenigma.com/cain/",
    "image": "assets/rooms/sala-enigma-cain.webp",
    "description": "El gobierno mundial envió la nave Exodus para fundar la primera colonia humana en el espacio, pero la Tierra ha perdido el contacto y la nave se ha desviado. Vuestro equipo será teletransportado a bordo en cabinas individuales para recuperar el control de los sistemas y detener a Caín.",
    "closed": false
  },
  {
    "empresa": "Madness Toledo",
    "sala": "The Mystery of Scum island",
    "url": "https://www.todoescaperooms.com/toledo/madness-toledo/the-mystery-of-scum-island",
    "image": "assets/rooms/madness-toledo-the-mystery-of-scum-island.webp",
    "description": "En The Mystery of Scum Island os sumergiréis en una aventura pirata con una cuidada estética de dibujo animado inspirada en Monkey Island. Vuestra misión será descifrar enigmas y seguir pistas para romper la maldición del malvado capitán Lechukga y hallar su legendario tesoro.",
    "closed": true
  },
  {
    "empresa": "Madness Toledo",
    "sala": "T-Virus",
    "url": "https://www.todoescaperooms.com/toledo/madness-toledo/t-virus-apocalypse",
    "image": "assets/rooms/madness-toledo-t-virus.webp",
    "description": "Un terrible accidente en los laboratorios secretos de una corporación desató el caos y provocó graves mutaciones entre la población. Como comandos del escuadrón de élite Antares, tendréis 90 minutos para infiltraros, evaluar la contaminación y neutralizar la amenaza del Virus T.",
    "closed": true
  },
  {
    "empresa": "Hostal 83",
    "sala": "Inmortium",
    "url": "https://hostal83.com/immortum/",
    "image": "assets/rooms/hostal-83-inmortium.webp",
    "description": "Mii os espera en el emblemático Hostal 83 para que presenciéis su nuevo espectáculo de terror psicológico y tensión. Antes de que dé comienzo, os pedirá un siniestro favor que os obligará a adentraros en sus oscuras estancias y sobrevivir a sus retorcidos juegos.",
    "closed": false
  },
  {
    "empresa": "Hostal 83",
    "sala": "Hostal 83 Hater",
    "url": "https://hostal83.com/hostal-83-hater/",
    "image": "assets/rooms/hostal-83-hostal-83-hater.webp",
    "description": "Hostal 83 Hater es un trepidante CrazyRoyale Escape que combina pruebas de escape room, batalla campal entre compañeros y divertidos minijuegos. Inspirado en mecánicas de Among Us y Mario Party, ofrece una experiencia competitiva surrealista llena de giros inesperados.",
    "closed": false
  },
  {
    "empresa": "Lautada Puzle Room",
    "sala": "Apocalipsis Natura",
    "url": "https://salaescapelautada.com/juego-de-escape-apocalipsis-natura/",
    "image": "assets/rooms/lautada-puzle-room-apocalipsis-natura.webp",
    "description": "En el siglo XXIII, la insensata acción humana y el cambio climático han conducido al planeta al borde de la destrucción total tras una ola de catástrofes naturales. Vuestro equipo dispondrá de 60 minutos para cooperar, resolver enigmas ecológicos y salvar el futuro de la Tierra.",
    "closed": false
  },
  {
    "empresa": "Petra Escape Room",
    "sala": "Petra - El reino perdido",
    "url": "https://petraescaperoom.com/index.php/inicio/",
    "image": "assets/rooms/petra-escape-room-petra-el-reino-perdido.webp",
    "description": "Tras años de excavaciones en la legendaria ciudad de Petra, el arqueólogo Jean Louis Burckhardt halló un cuerno tallado en marfil de incalculable valor, pero ha desaparecido misteriosamente. Dispondréis de 120 minutos para seguir sus pasos, descifrar los enigmas nabateos y recuperar la reliquia.",
    "closed": false
  },
  {
    "empresa": "Get Out Escape Room",
    "sala": "La estación",
    "url": "https://www.escaperoomlover.com/es/juego/la-estacion-madrid-el-tren-de-medianoche",
    "image": "assets/rooms/get-out-escape-room-la-estacion.webp",
    "description": "Es medianoche en el lujoso tren Bradbury Express con rumbo a Bagdad, a bordo del cual viaja un rey exiliado con un botín de lingotes de oro. Compinchados con un guardia de seguridad durante una parada técnica, tendréis que infiltraros en el vagón blindado y escapar antes de que el tren reanude la marcha.",
    "closed": true
  },
  {
    "empresa": "The Box Escape Room Madrid",
    "sala": "El juego de HEX",
    "url": "https://escapethebox.es/escape-rooms/escape-room-retro-el-juego-de-hex/",
    "image": "assets/rooms/the-box-escape-room-madrid-el-juego-de-hex.webp",
    "description": "En el año 2222, la inteligencia artificial HEX ha tomado el control del mundo y su poder aumenta con cada actualización. La única esperanza reside en adentrarse en un antiguo salón recreativo de estética retro y superar pruebas de videojuegos arcade para localizar el código que desactivará a la IA.",
    "closed": false
  },
  {
    "empresa": "Carthago Escape Room",
    "sala": "Ciudad de Halloween",
    "url": "https://carthagoescaperoom.es/salas",
    "image": "assets/rooms/carthago-escape-room-ciudad-de-halloween.webp",
    "description": "En Ciudad Halloween os adentráis en una urbe fantástica habitada por los personajes más estrafalarios y misteriosos. El propio alcalde de la ciudad os encomendará una misión crucial de 76 minutos: resolver enigmas mágicos y trabajar en equipo para salvar la festividad de Halloween.",
    "closed": false
  },
  {
    "empresa": "Komnata Quest",
    "sala": "Mientras sigas con vida",
    "url": "https://www.escaperoomlover.com/es/juego/komnata-2-madrid-mientras-sigues-con-vida",
    "image": "assets/rooms/komnata-quest-mientras-sigas-con-vida.webp",
    "description": "El maquiavélico Jim Moriarty os ha capturado y encerrado en cajas a oscuras para convertiros en sus juguetes personales. Encapuchados, aislados y con solo 45 minutos de oxígeno y tiempo, tendréis que cooperar a ciegas para descifrar los mecanismos y salir con vida de esta agobiante experiencia.",
    "closed": true
  },
  {
    "empresa": "The Last Monkey",
    "sala": "El capitan errante",
    "url": "https://thelastmonkeymadrid.com/capitan-errante/",
    "image": "assets/rooms/the-last-monkey-el-capitan-errante.webp",
    "description": "El capitán pirata C. Davis desató una temible maldición al saquear tres diamantes sagrados de una gruta caribeña, condenando a su tripulación a vagar por la eternidad. Vuestro equipo deberá subir a bordo del navío encallado, resolver sus misterios y devolver las gemas a su cofre para que el capitán descanse en paz.",
    "closed": false
  },
  {
    "empresa": "Kenopsia",
    "sala": "Misterios de Kemet / La tumba olvidada",
    "url": "https://www.kenopsia.es/misterios-de-kemet/",
    "image": "assets/rooms/kenopsia-misterios-de-kemet-la-tumba-olvidada.webp",
    "description": "Tras años de excavaciones en Egipto, el equipo del Dr. Lehner ha descubierto la antecámara de una tumba real oculta bajo las arenas durante más de cuatro mil años. Vuestro grupo de exploradores tendrá el privilegio de adentrarse en sus pasadizos para revelar sus milenarios secretos antes de que queden sepultados.",
    "closed": false
  },
  {
    "empresa": "Locked ZGZ Escape Room",
    "sala": "Ritual",
    "url": "https://lockedzgz.com/ritual/",
    "image": "assets/rooms/locked-zgz-escape-room-ritual.webp",
    "description": "Tras una antigua fachada se oculta la vivienda intacta de Brida, una bruja encargada de realizar oscuros rituales para contener a temibles entidades malignas. Tras ser injustamente quemada en la hoguera, la protección ha caído y debéis adentraros en su santuario para terminar el ritual antes de que sea tarde.",
    "closed": false
  },
  {
    "empresa": "The Padlock",
    "sala": "The secret of Jack Daniel's",
    "url": "https://www.thepadlock.cz/",
    "image": "assets/rooms/the-padlock-the-secret-of-jack-daniel-s.webp",
    "description": "Tras la repentina muerte de Jack Daniel en 1911, su misteriosa caja fuerte desapareció sin dejar rastro alguno. Siguiendo las pistas de un incansable viajero, llegaréis a una rústica cabaña en el bosque donde tendréis 77 minutos para superar ingeniosos mecanismos y desvelar el secreto mejor guardado del whisky.",
    "closed": false
  },
  {
    "empresa": "La salida",
    "sala": "Atrapado en el museo",
    "url": "https://lasalida.net/escape-room-atrapado-en-el-museo/",
    "image": "assets/rooms/la-salida-atrapado-en-el-museo.webp",
    "description": "Durante una visita cultural, el vigilante de seguridad de una prestigiosa galería os encierra accidentalmente tras echar el cerrojo de la exposición. Con el edificio desierto, vuestro equipo dispondrá de 60 minutos para observar la colección, resolver enigmas y encontrar la combinación que os permita salir.",
    "closed": false
  }
];

  const MAPPINGS = [
  {
    "idx": 0,
    "aliases": [
      "experiencity||experiencia amarilla",
      "Experiencity||Experiencia amarilla"
    ],
    "sala_aliases": [
      "Experiencia amarilla"
    ]
  },
  {
    "idx": 1,
    "aliases": [
      "Experiencity||Experiencia La Nevera Show",
      "experiencity||experiencia la nevera show"
    ],
    "sala_aliases": [
      "Experiencia La Nevera Show"
    ]
  },
  {
    "idx": 2,
    "aliases": [
      "experiencity||luz verde (experience rosa)",
      "Experiencity||Luz verde (Experience rosa)"
    ],
    "sala_aliases": [
      "Luz verde (Experience rosa)"
    ]
  },
  {
    "idx": 3,
    "aliases": [
      "experiencity||experiencia azul: atrincherados",
      "Experiencity||Experiencia azul: atrincherados"
    ],
    "sala_aliases": [
      "Experiencia azul: atrincherados"
    ]
  },
  {
    "idx": 4,
    "aliases": [
      "experiencity||experiencia naranja: aladino",
      "Experiencity||Experiencia Naranja: Aladino"
    ],
    "sala_aliases": [
      "Experiencia Naranja: Aladino"
    ]
  },
  {
    "idx": 5,
    "aliases": [
      "experiencity||capitulo 2: diamante de almas",
      "Experiencity||Capítulo 2: Diamante de Almas"
    ],
    "sala_aliases": [
      "Capítulo 2: Diamante de Almas"
    ]
  },
  {
    "idx": 6,
    "aliases": [
      "experiencity||vagon italiano",
      "Experiencity||Vagón italiano"
    ],
    "sala_aliases": [
      "Vagón italiano"
    ]
  },
  {
    "idx": 7,
    "aliases": [
      "experiencity||experiencia roja",
      "Experiencity||Experiencia roja"
    ],
    "sala_aliases": [
      "Experiencia roja"
    ]
  },
  {
    "idx": 8,
    "aliases": [
      "Experiencity||Experiencia verde",
      "experiencity||experiencia verde"
    ],
    "sala_aliases": [
      "Experiencia verde"
    ]
  },
  {
    "idx": 9,
    "aliases": [
      "experiencity||experiencia morada",
      "Experiencity||Experiencia morada"
    ],
    "sala_aliases": [
      "Experiencia morada"
    ]
  },
  {
    "idx": 10,
    "aliases": [
      "Experiencity||La llorona",
      "experiencity||la llorona"
    ],
    "sala_aliases": [
      "La llorona"
    ]
  },
  {
    "idx": 11,
    "aliases": [
      "||terror stories: exorcista",
      "Experiencity (Terror Stories)||Terror stories: Exorcista"
    ],
    "sala_aliases": [
      "Terror stories: Exorcista"
    ]
  },
  {
    "idx": 12,
    "aliases": [
      "Madrid Terror||Paranormal Experience",
      "madrid terror||paranormal experience"
    ],
    "sala_aliases": [
      "Paranormal Experience"
    ]
  },
  {
    "idx": 13,
    "aliases": [
      "clock 60||las brujas de silent hollow",
      "Clock 60||Las brujas de Silent Hollow"
    ],
    "sala_aliases": [
      "Las brujas de Silent Hollow"
    ]
  },
  {
    "idx": 14,
    "aliases": [
      "criogenic escape room||criogenic",
      "Criogenic Escape Room||Criogenic"
    ],
    "sala_aliases": [
      "Criogenic"
    ]
  },
  {
    "idx": 15,
    "aliases": [
      "yroom||salomon museum",
      "YROOM||Salomon Museum"
    ],
    "sala_aliases": [
      "Salomon Museum"
    ]
  },
  {
    "idx": 16,
    "aliases": [
      "la clau||game-on",
      "La Clau||Game-on"
    ],
    "sala_aliases": [
      "Game-on"
    ]
  },
  {
    "idx": 17,
    "aliases": [
      "elkano ihes gela||experientziak",
      "Elkano Ihes Gela||Experientziak"
    ],
    "sala_aliases": [
      "Experientziak"
    ]
  },
  {
    "idx": 18,
    "aliases": [
      "Golden Pop||Jurásico",
      "golden pop||jurasico"
    ],
    "sala_aliases": [
      "Jurásico"
    ]
  },
  {
    "idx": 19,
    "aliases": [
      "Experiencia Escape||Atrapado en el cine",
      "experiencia escape||atrapado en el cine"
    ],
    "sala_aliases": [
      "Atrapado en el cine"
    ]
  },
  {
    "idx": 20,
    "aliases": [
      "Eacapology||7 pecados",
      "eacapology||7 pecados",
      "Escapology (Ilusiona Xanadú)||7 pecados"
    ],
    "sala_aliases": [
      "7 pecados"
    ]
  },
  {
    "idx": 21,
    "aliases": [
      "Horror Box||Jigsaw",
      "horror box||jigsaw"
    ],
    "sala_aliases": [
      "Jigsaw"
    ]
  },
  {
    "idx": 22,
    "aliases": [
      "Horror Box||Catalepsia",
      "horror box||catalepsia"
    ],
    "sala_aliases": [
      "Catalepsia"
    ]
  },
  {
    "idx": 23,
    "aliases": [
      "Horror Box||Ouija",
      "horror box||ouija"
    ],
    "sala_aliases": [
      "Ouija"
    ]
  },
  {
    "idx": 24,
    "aliases": [
      "Horror Box||Biohazard",
      "horror box||biohazard"
    ],
    "sala_aliases": [
      "Biohazard"
    ]
  },
  {
    "idx": 25,
    "aliases": [
      "Overtime||101 años de Perdón",
      "overtime||101 anos de perdon"
    ],
    "sala_aliases": [
      "101 años de Perdón"
    ]
  },
  {
    "idx": 26,
    "aliases": [
      "Overtime||Call or die",
      "overtime||call or die"
    ],
    "sala_aliases": [
      "Call or die"
    ]
  },
  {
    "idx": 27,
    "aliases": [
      "cubick||la entrevista",
      "Cubick||La entrevista"
    ],
    "sala_aliases": [
      "La entrevista"
    ]
  },
  {
    "idx": 28,
    "aliases": [
      "Cubick||Nathael",
      "cubick||nathael"
    ],
    "sala_aliases": [
      "Nathael"
    ]
  },
  {
    "idx": 29,
    "aliases": [
      "Rubik Escape Room||El caso Ridel",
      "rubik escape room||el caso ridel"
    ],
    "sala_aliases": [
      "El caso Ridel"
    ]
  },
  {
    "idx": 30,
    "aliases": [
      "Rubik Escape Room||Operación Délawer",
      "||operacion delawer"
    ],
    "sala_aliases": [
      "Operación Delawer",
      "Operación Délawer"
    ]
  },
  {
    "idx": 31,
    "aliases": [
      "Locktopus Escape Game||El sastre",
      "locktopus escape game||el sastre"
    ],
    "sala_aliases": [
      "El sastre"
    ]
  },
  {
    "idx": 32,
    "aliases": [
      "mythos escape room||expedicion maldita",
      "Mythos Escape Room||Expedición maldita"
    ],
    "sala_aliases": [
      "Expedición maldita"
    ]
  },
  {
    "idx": 33,
    "aliases": [
      "Golden Escape Room Madrid||Alkatraz (Classic)",
      "golden escape room madrid||alkatraz (classic)"
    ],
    "sala_aliases": [
      "Alkatraz (Classic)"
    ]
  },
  {
    "idx": 34,
    "aliases": [
      "room escape corporation||rats corp",
      "Room Escape Corporation||Rats Corp"
    ],
    "sala_aliases": [
      "Rats Corp"
    ]
  },
  {
    "idx": 35,
    "aliases": [
      "The city Escape Room||La taberna",
      "the city escape room||la taberna"
    ],
    "sala_aliases": [
      "La taberna"
    ]
  },
  {
    "idx": 36,
    "aliases": [
      "Sunbilla Escape||Conviértete en un contrabandista",
      "sunbilla escape||conviertete en un contrabandista"
    ],
    "sala_aliases": [
      "Conviértete en un contrabandista"
    ]
  },
  {
    "idx": 37,
    "aliases": [
      "secret box||siro 3.0",
      "Secret Box||Siro 3.0"
    ],
    "sala_aliases": [
      "Siro 3.0"
    ]
  },
  {
    "idx": 38,
    "aliases": [
      "castlemania||la hermandad de las sombras",
      "Castlemania||La hermandad de las sombras"
    ],
    "sala_aliases": [
      "La hermandad de las sombras"
    ]
  },
  {
    "idx": 39,
    "aliases": [
      "curious cat escape room||proyecto x-547",
      "curious cat||proyecto x-547",
      "Curious Cat Escape Room||Proyecto X-547"
    ],
    "sala_aliases": [
      "Proyecto X-547"
    ]
  },
  {
    "idx": 40,
    "aliases": [
      "mad land||magic universe",
      "Mad Land||Magic Universe"
    ],
    "sala_aliases": [
      "Magic Universe"
    ]
  },
  {
    "idx": 41,
    "aliases": [
      "escape khaos||el rescate",
      "Escape Khaos||El rescate"
    ],
    "sala_aliases": [
      "El rescate"
    ]
  },
  {
    "idx": 42,
    "aliases": [
      "Incognito Escape||Operación steampunk",
      "incognito escape||operacion steampunk"
    ],
    "sala_aliases": [
      "Operación steampunk"
    ]
  },
  {
    "idx": 43,
    "aliases": [
      "Incognito Escape||Escape The Lost Pyramid VR",
      "incognito escape||escape the lost pyramid vr"
    ],
    "sala_aliases": [
      "Escape The Lost Pyramid VR"
    ]
  },
  {
    "idx": 44,
    "aliases": [
      "Incognito Escape||Prince of Persia",
      "incognito escape||prince of persia"
    ],
    "sala_aliases": [
      "Prince of Persia"
    ]
  },
  {
    "idx": 45,
    "aliases": [
      "Incognito Escape||Beyond Medusa's Gate",
      "incognito escape||beyond medusa's gate"
    ],
    "sala_aliases": [
      "Beyond Medusa's Gate"
    ]
  },
  {
    "idx": 46,
    "aliases": [
      "virus escape room||tao room escape: japanese massage center",
      "Virus Escape Room||Tao Room Escape: Japanese Massage Center"
    ],
    "sala_aliases": [
      "Tao Room Escape: Japanese Massage Center"
    ]
  },
  {
    "idx": 47,
    "aliases": [
      "virus escape room||velatoria",
      "Virus Escape Room||Velatoria"
    ],
    "sala_aliases": [
      "Velatoria"
    ]
  },
  {
    "idx": 48,
    "aliases": [
      "Hidden Escape Room||La mina",
      "hidden escape room||la mina"
    ],
    "sala_aliases": [
      "La mina"
    ]
  },
  {
    "idx": 49,
    "aliases": [
      "hidden escape room||el loco",
      "Hidden Escape Room||El loco"
    ],
    "sala_aliases": [
      "El loco"
    ]
  },
  {
    "idx": 50,
    "aliases": [
      "evil house||caronte",
      "Evil House||Caronte"
    ],
    "sala_aliases": [
      "Caronte"
    ]
  },
  {
    "idx": 51,
    "aliases": [
      "Evil House||El hotel de los suicidas",
      "evil house||el hotel de los suicidas"
    ],
    "sala_aliases": [
      "El hotel de los suicidas"
    ]
  },
  {
    "idx": 52,
    "aliases": [
      "Factoría Escape Room||Golpe perfecto en el jardín de Buda",
      "factoria escape room||golpe perfecto en el jardin de buda"
    ],
    "sala_aliases": [
      "Golpe perfecto en el jardín de Buda"
    ]
  },
  {
    "idx": 53,
    "aliases": [
      "Bite the Fly||Bites Motel",
      "bite the fly||bites motel"
    ],
    "sala_aliases": [
      "Bites Motel"
    ]
  },
  {
    "idx": 54,
    "aliases": [
      "Xkapa||La estación del ferrocarril",
      "xkapa||la estacion del ferrocarril"
    ],
    "sala_aliases": [
      "La estación del ferrocarril"
    ]
  },
  {
    "idx": 55,
    "aliases": [
      "Escape Room Badajoz||La herencia",
      "escape room badajoz||la herencia"
    ],
    "sala_aliases": [
      "La herencia"
    ]
  },
  {
    "idx": 56,
    "aliases": [
      "Kadabra Escape||Poison",
      "kadabra escape||poison"
    ],
    "sala_aliases": [
      "Poison"
    ]
  },
  {
    "idx": 57,
    "aliases": [
      "descifra escape||el laberinto",
      "Descifra Escape||El laberinto"
    ],
    "sala_aliases": [
      "El laberinto"
    ]
  },
  {
    "idx": 58,
    "aliases": [
      "kenos escape room||kenos",
      "Kenos Escape Room||Kenos"
    ],
    "sala_aliases": [
      "Kenos"
    ]
  },
  {
    "idx": 59,
    "aliases": [
      "Mente Colmena Rooms||El secreto de Kaos",
      "mente colmena rooms||el secreto de kaos"
    ],
    "sala_aliases": [
      "El secreto de Kaos"
    ]
  },
  {
    "idx": 60,
    "aliases": [
      "codexcape||paranoia remastered",
      "Codexcape||Paranoia Remastered"
    ],
    "sala_aliases": [
      "Paranoia Remastered"
    ]
  },
  {
    "idx": 61,
    "aliases": [
      "paradiso escape room||proyecto dcrisis",
      "Paradiso Escape Room||PROYECTO DCRISIS"
    ],
    "sala_aliases": [
      "PROYECTO DCRISIS"
    ]
  },
  {
    "idx": 62,
    "aliases": [
      "||horror asylum",
      "Arenaxcape / Mad Mansion||Horror Asylum"
    ],
    "sala_aliases": [
      "Horror Asylum"
    ]
  },
  {
    "idx": 63,
    "aliases": [
      "illusion||el misterio de la sagra",
      "Illusion||El misterio de la Sagra"
    ],
    "sala_aliases": [
      "El misterio de la Sagra"
    ]
  },
  {
    "idx": 64,
    "aliases": [
      "Illusion||Balamkú",
      "illusion||balamku"
    ],
    "sala_aliases": [
      "Balamkú"
    ]
  },
  {
    "idx": 65,
    "aliases": [
      "Illusion||Los descendientes de Sokar",
      "illusion||los descendientes de sokar"
    ],
    "sala_aliases": [
      "Los descendientes de Sokar"
    ]
  },
  {
    "idx": 66,
    "aliases": [
      "Mayto Kingdom||Tú también soñarás",
      "mayto kingdom||tu tambien sonaras"
    ],
    "sala_aliases": [
      "Tú también soñarás"
    ]
  },
  {
    "idx": 67,
    "aliases": [
      "Mayto Kingdom||La cámara del tiempo y el espíritu",
      "mayto kingdom||la camara del tiempo y el espiritu"
    ],
    "sala_aliases": [
      "La cámara del tiempo y el espíritu"
    ]
  },
  {
    "idx": 68,
    "aliases": [
      "Mayto Kingdom||Una aventura de leyenda",
      "mayto kingdom||una aventura de leyenda"
    ],
    "sala_aliases": [
      "Una aventura de leyenda"
    ]
  },
  {
    "idx": 69,
    "aliases": [
      "reversum||n/d",
      "Reversum||N/D",
      "Reversum Room Escape||La Corona Maldita (Las Nieblas de Avalon)"
    ],
    "sala_aliases": [
      "La Corona Maldita (Las Nieblas de Avalon)",
      "N/D"
    ]
  },
  {
    "idx": 70,
    "aliases": [
      "reversum||en el corazon de los cuentos",
      "Reversum||En el corazón de los cuentos",
      "Reversum Room Escape||En el corazón de los cuentos"
    ],
    "sala_aliases": [
      "En el corazón de los cuentos"
    ]
  },
  {
    "idx": 71,
    "aliases": [
      "Run Rabbit||Haunted house",
      "run rabbit||haunted house"
    ],
    "sala_aliases": [
      "Haunted house"
    ]
  },
  {
    "idx": 72,
    "aliases": [
      "Run Rabbit||La mazmorra",
      "run rabbit||la mazmorra"
    ],
    "sala_aliases": [
      "La mazmorra"
    ]
  },
  {
    "idx": 73,
    "aliases": [
      "Skp Room||El loco del callejón",
      "skp room||el loco del callejon"
    ],
    "sala_aliases": [
      "El loco del callejón"
    ]
  },
  {
    "idx": 74,
    "aliases": [
      "Eureka! Escape Room||Transporter",
      "eureka! escape room||transporter"
    ],
    "sala_aliases": [
      "Transporter"
    ]
  },
  {
    "idx": 75,
    "aliases": [
      "Sapiens||El caso Vasiliev",
      "sapiens||el caso vasiliev"
    ],
    "sala_aliases": [
      "El caso Vasiliev"
    ]
  },
  {
    "idx": 76,
    "aliases": [
      "black lake escape room||la novia",
      "Black Lake Escape Room||La novia"
    ],
    "sala_aliases": [
      "La novia"
    ]
  },
  {
    "idx": 77,
    "aliases": [
      "arcanum||la posesion",
      "Arcanum||La posesión"
    ],
    "sala_aliases": [
      "La posesión"
    ]
  },
  {
    "idx": 78,
    "aliases": [
      "tangram escape room||el tesoro de la momia",
      "Tangram Escape Room||El tesoro de la momia"
    ],
    "sala_aliases": [
      "El tesoro de la momia"
    ]
  },
  {
    "idx": 79,
    "aliases": [
      "Redrum Escape Room||No deberías estar aquí",
      "redrum escape room||no deberias estar aqui"
    ],
    "sala_aliases": [
      "No deberías estar aquí"
    ]
  },
  {
    "idx": 80,
    "aliases": [
      "metamorfosis escape room||worm",
      "Metamorfosis Escape Room||Worm"
    ],
    "sala_aliases": [
      "Worm"
    ]
  },
  {
    "idx": 81,
    "aliases": [
      "don escape||la tienda de te del sr. miyagi",
      "Don Escape||La tienda de té del Sr. Miyagi"
    ],
    "sala_aliases": [
      "La tienda de té del Sr. Miyagi"
    ]
  },
  {
    "idx": 82,
    "aliases": [
      "Alexcaperoom||Residencia Medica",
      "alexcaperoom||residencia medica"
    ],
    "sala_aliases": [
      "Residencia Medica"
    ]
  },
  {
    "idx": 83,
    "aliases": [
      "||night of meteor",
      "Escape Lab Valencia||Night of the Meteor"
    ],
    "sala_aliases": [
      "Night of the Meteor",
      "Night of meteor"
    ]
  },
  {
    "idx": 84,
    "aliases": [
      "distrito 7||la terapia de la dra. wozniack",
      "Distrito 7||La terapia de la Dra. Wozniack"
    ],
    "sala_aliases": [
      "La terapia de la Dra. Wozniack"
    ]
  },
  {
    "idx": 85,
    "aliases": [
      "Distrito 7||Noche de perros",
      "distrito 7||noche de perros"
    ],
    "sala_aliases": [
      "Noche de perros"
    ]
  },
  {
    "idx": 86,
    "aliases": [
      "distrito 7||uppercut",
      "Distrito 7||Uppercut"
    ],
    "sala_aliases": [
      "Uppercut"
    ]
  },
  {
    "idx": 87,
    "aliases": [
      "Open Mind Room Escape||11S",
      "open mind room escape||11s"
    ],
    "sala_aliases": [
      "11S"
    ]
  },
  {
    "idx": 88,
    "aliases": [
      "open mind escape room||slasher party",
      "Open Mind Escape Room||Slasher Party"
    ],
    "sala_aliases": [
      "Slasher Party"
    ]
  },
  {
    "idx": 89,
    "aliases": [
      "Open Mind Room Escape||Artificiero",
      "open mind room escape||artificiero"
    ],
    "sala_aliases": [
      "Artificiero"
    ]
  },
  {
    "idx": 90,
    "aliases": [
      "Materia gris||Enganchados al gris",
      "materia gris||enganchados al gris"
    ],
    "sala_aliases": [
      "Enganchados al gris"
    ]
  },
  {
    "idx": 91,
    "aliases": [
      "materia gris||grey submarine",
      "Materia Gris||Grey submarine"
    ],
    "sala_aliases": [
      "Grey submarine"
    ]
  },
  {
    "idx": 92,
    "aliases": [
      "arroyo escape room||agencia 360",
      "Arroyo Escape Room||Agencia 360"
    ],
    "sala_aliases": [
      "Agencia 360"
    ]
  },
  {
    "idx": 93,
    "aliases": [
      "arroyo escape room||el guardabosques",
      "Arroyo Escape Room||El guardabosques"
    ],
    "sala_aliases": [
      "El guardabosques"
    ]
  },
  {
    "idx": 94,
    "aliases": [
      "enigmik||la cerveseria",
      "Enigmik||La cervesería"
    ],
    "sala_aliases": [
      "La cervesería"
    ]
  },
  {
    "idx": 95,
    "aliases": [
      "insidious||insidious",
      "Insidious||Insidious"
    ],
    "sala_aliases": [
      "Insidious"
    ]
  },
  {
    "idx": 96,
    "aliases": [
      "yaebi||la farmacia",
      "Yaebi||La farmacia"
    ],
    "sala_aliases": [
      "La farmacia"
    ]
  },
  {
    "idx": 97,
    "aliases": [
      "hermetico||canibal",
      "Hermético||Caníbal"
    ],
    "sala_aliases": [
      "Caníbal"
    ]
  },
  {
    "idx": 98,
    "aliases": [
      "blindhouse games||la rebelion: linea de sangre hibrida",
      "Blindhouse Games||La rebelión: línea de sangre híbrida"
    ],
    "sala_aliases": [
      "La rebelión: línea de sangre híbrida"
    ]
  },
  {
    "idx": 99,
    "aliases": [
      "fear factory experiences||in",
      "Fear Factory Experiences||IN"
    ],
    "sala_aliases": [
      "IN"
    ]
  },
  {
    "idx": 100,
    "aliases": [
      "Can Bruna||Odisea Celular",
      "can bruna||odisea celular"
    ],
    "sala_aliases": [
      "Odisea Celular"
    ]
  },
  {
    "idx": 101,
    "aliases": [
      "Vortex Escape||Apophis",
      "vortex escape||apophis"
    ],
    "sala_aliases": [
      "Apophis"
    ]
  },
  {
    "idx": 102,
    "aliases": [
      "Arena Gaming||El bunker 21",
      "arena gaming||el bunker 21"
    ],
    "sala_aliases": [
      "El bunker 21"
    ]
  },
  {
    "idx": 103,
    "aliases": [
      "saga escape room||londium",
      "Saga Escape Room||Londium"
    ],
    "sala_aliases": [
      "Londium"
    ]
  },
  {
    "idx": 104,
    "aliases": [
      "Shock Escape Room||La santa",
      "shock escape room||la santa"
    ],
    "sala_aliases": [
      "La santa"
    ]
  },
  {
    "idx": 105,
    "aliases": [
      "shock escape room||abduction 3: the exam",
      "Shock Escape Room||Abduction 3: The Exam"
    ],
    "sala_aliases": [
      "Abduction 3: The Exam"
    ]
  },
  {
    "idx": 106,
    "aliases": [
      "abduction||abduction 4: enterprises",
      "Abduction||Abduction 4: Enterprises"
    ],
    "sala_aliases": [
      "Abduction 4: Enterprises"
    ]
  },
  {
    "idx": 107,
    "aliases": [
      "Elements Escape Room||Cetro de fuego",
      "elements escape room||cetro de fuego"
    ],
    "sala_aliases": [
      "Cetro de fuego"
    ]
  },
  {
    "idx": 108,
    "aliases": [
      "Elements||Exodus",
      "elements||exodus"
    ],
    "sala_aliases": [
      "Exodus"
    ]
  },
  {
    "idx": 109,
    "aliases": [
      "elements||exorcista",
      "Elements||Exorcista"
    ],
    "sala_aliases": [
      "Exorcista"
    ]
  },
  {
    "idx": 110,
    "aliases": [
      "The X door||La peluquería",
      "the x door||la peluqueria"
    ],
    "sala_aliases": [
      "La peluquería"
    ]
  },
  {
    "idx": 111,
    "aliases": [
      "the x-door||el ultimo dragon",
      "The X-Door||El Último Dragón"
    ],
    "sala_aliases": [
      "El Último Dragón"
    ]
  },
  {
    "idx": 112,
    "aliases": [
      "scavenger||la camara de tortura",
      "Scavenger||La cámara de tortura"
    ],
    "sala_aliases": [
      "La cámara de tortura"
    ]
  },
  {
    "idx": 113,
    "aliases": [
      "Scavenger||El retrato de Picasso",
      "scavenger||el retrato de picasso"
    ],
    "sala_aliases": [
      "El retrato de Picasso"
    ]
  },
  {
    "idx": 114,
    "aliases": [
      "dragonborn||dragonborn: el hijo del posadero",
      "Dragonborn||Dragonborn: El hijo del posadero"
    ],
    "sala_aliases": [
      "Dragonborn: El hijo del posadero"
    ]
  },
  {
    "idx": 115,
    "aliases": [
      "la cronosfera||la desapareicion del profesor",
      "La cronosfera||La desapareición del profesor"
    ],
    "sala_aliases": [
      "La desapareición del profesor"
    ]
  },
  {
    "idx": 116,
    "aliases": [
      "ncerrados||la maldicion de los balaguer",
      "Ncerrados||La maldición de los Balaguer"
    ],
    "sala_aliases": [
      "La maldición de los Balaguer"
    ]
  },
  {
    "idx": 117,
    "aliases": [
      "Road Out Escape Room||La gran fuga",
      "road out escape room||la gran fuga"
    ],
    "sala_aliases": [
      "La gran fuga"
    ]
  },
  {
    "idx": 118,
    "aliases": [
      "krematorium escape rooms experience||malum",
      "Krematorium Escape Rooms Experience||Malum"
    ],
    "sala_aliases": [
      "Malum"
    ]
  },
  {
    "idx": 119,
    "aliases": [
      "escape republik||nakatomi plaza",
      "Escape Republik||Nakatomi plaza"
    ],
    "sala_aliases": [
      "Nakatomi plaza"
    ]
  },
  {
    "idx": 120,
    "aliases": [
      "whitechapel||whitechapel: la historia de charlotte",
      "Whitechapel||Whitechapel: La historia de Charlotte"
    ],
    "sala_aliases": [
      "Whitechapel: La historia de Charlotte"
    ]
  },
  {
    "idx": 121,
    "aliases": [
      "Silent Town Escape Room||Colegio Midwich",
      "silent town escape room||colegio midwich"
    ],
    "sala_aliases": [
      "Colegio Midwich"
    ]
  },
  {
    "idx": 122,
    "aliases": [
      "start play||atraco al compadre",
      "Start play||Atraco al compadre"
    ],
    "sala_aliases": [
      "Atraco al compadre"
    ]
  },
  {
    "idx": 123,
    "aliases": [
      "Kalon||La coleccionista",
      "kalon||la coleccionista"
    ],
    "sala_aliases": [
      "La coleccionista"
    ]
  },
  {
    "idx": 124,
    "aliases": [
      "escape barcelona||cybercity 2049",
      "Escape Barcelona||CyberCity 2049"
    ],
    "sala_aliases": [
      "CyberCity 2049"
    ]
  },
  {
    "idx": 125,
    "aliases": [
      "Escape Barcelona||Tomb Hunter",
      "escape barcelona||tomb hunter"
    ],
    "sala_aliases": [
      "Tomb Hunter"
    ]
  },
  {
    "idx": 126,
    "aliases": [
      "Escape Barcelona||K.O.N.G PROTOCOL",
      "escape barcelona||k.o.n.g protocol"
    ],
    "sala_aliases": [
      "K.O.N.G PROTOCOL"
    ]
  },
  {
    "idx": 127,
    "aliases": [
      "code 258||chernobyl",
      "Code 258||Chernobyl"
    ],
    "sala_aliases": [
      "Chernobyl"
    ]
  },
  {
    "idx": 128,
    "aliases": [
      "Code 258||La vinoteca",
      "code 258||la vinoteca"
    ],
    "sala_aliases": [
      "La vinoteca"
    ]
  },
  {
    "idx": 129,
    "aliases": [
      "Unreal Room Escape||Distrito 111",
      "unreal room escape||distrito 111"
    ],
    "sala_aliases": [
      "Distrito 111"
    ]
  },
  {
    "idx": 130,
    "aliases": [
      "Unreal Room Escape||NightShift",
      "unreal room escape||nightshift"
    ],
    "sala_aliases": [
      "NightShift"
    ]
  },
  {
    "idx": 131,
    "aliases": [
      "action house||un caso perdido",
      "Action House||Un caso perdido"
    ],
    "sala_aliases": [
      "Un caso perdido"
    ]
  },
  {
    "idx": 132,
    "aliases": [
      "action house||ratas de biblioteca",
      "Action House||Ratas de biblioteca"
    ],
    "sala_aliases": [
      "Ratas de biblioteca"
    ]
  },
  {
    "idx": 133,
    "aliases": [
      "gravity zero room||the passengers",
      "Gravity Zero Room||The passengers"
    ],
    "sala_aliases": [
      "The passengers"
    ]
  },
  {
    "idx": 134,
    "aliases": [
      "1801 Escape Room||Casa Museu Josep Fontcalda",
      "1801 escape room||casa museu josep fontcalda"
    ],
    "sala_aliases": [
      "Casa Museu Josep Fontcalda"
    ]
  },
  {
    "idx": 135,
    "aliases": [
      "Wayout Room Escape||Hotel Hello",
      "wayout room escape||hotel hello"
    ],
    "sala_aliases": [
      "Hotel Hello"
    ]
  },
  {
    "idx": 136,
    "aliases": [
      "A Maze in 60||Origen",
      "a maze in 60||origen"
    ],
    "sala_aliases": [
      "Origen"
    ]
  },
  {
    "idx": 137,
    "aliases": [
      "outline escape room||outline",
      "Outline Escape Room||Outline"
    ],
    "sala_aliases": [
      "Outline"
    ]
  },
  {
    "idx": 138,
    "aliases": [
      "Escape Room Alicante Secret Hunter||Malibú",
      "secret hunter escape room||malibu",
      "escape room alicante secret hunter||malibu"
    ],
    "sala_aliases": [
      "Malibú"
    ]
  },
  {
    "idx": 139,
    "aliases": [
      "soul games||psycokiller",
      "Soul Games||Psycokiller"
    ],
    "sala_aliases": [
      "Psycokiller"
    ]
  },
  {
    "idx": 140,
    "aliases": [
      "Final Code||Bermudas: El secreto jamás revelado",
      "final code||bermudas: el secreto jamas revelado"
    ],
    "sala_aliases": [
      "Bermudas: El secreto jamás revelado"
    ]
  },
  {
    "idx": 141,
    "aliases": [
      "la logia negra escape room||camino a la logia negra",
      "La Logia Negra Escape Room||Camino a la Logia Negra"
    ],
    "sala_aliases": [
      "Camino a la Logia Negra"
    ]
  },
  {
    "idx": 142,
    "aliases": [
      "Hiruko Escape Room||Las pruebas",
      "hiruko escape room||las pruebas"
    ],
    "sala_aliases": [
      "Las pruebas"
    ]
  },
  {
    "idx": 143,
    "aliases": [
      "Friki Escape Room||Puñalada",
      "friki escape room||punalada"
    ],
    "sala_aliases": [
      "Puñalada"
    ]
  },
  {
    "idx": 144,
    "aliases": [
      "insomnia corporation||la casa",
      "Insomnia Corporation||La casa"
    ],
    "sala_aliases": [
      "La casa"
    ]
  },
  {
    "idx": 145,
    "aliases": [
      "Insomnia Corporation||Sr Krugger",
      "insomnia corporation||sr krugger"
    ],
    "sala_aliases": [
      "Sr Krugger"
    ]
  },
  {
    "idx": 146,
    "aliases": [
      "insomnia corporation||el secreto de los krugger",
      "Insomnia Corporation||El secreto de los Krugger"
    ],
    "sala_aliases": [
      "El secreto de los Krugger"
    ]
  },
  {
    "idx": 147,
    "aliases": [
      "sala enigma||la vida nuclear",
      "Sala Enigma||La vida nuclear"
    ],
    "sala_aliases": [
      "La vida nuclear"
    ]
  },
  {
    "idx": 148,
    "aliases": [
      "Sala Enigma||Caín",
      "sala enigma||cain"
    ],
    "sala_aliases": [
      "Caín"
    ]
  },
  {
    "idx": 149,
    "aliases": [
      "madness toledo||the mystery of scum island",
      "Madness Toledo||The Mystery of Scum island"
    ],
    "sala_aliases": [
      "The Mystery of Scum island"
    ]
  },
  {
    "idx": 150,
    "aliases": [
      "madness toledo||t-virus",
      "Madness Toledo||T-Virus"
    ],
    "sala_aliases": [
      "T-Virus"
    ]
  },
  {
    "idx": 151,
    "aliases": [
      "Hostal 83||Inmortium",
      "hostal 83||inmortium"
    ],
    "sala_aliases": [
      "Inmortium"
    ]
  },
  {
    "idx": 152,
    "aliases": [
      "hostal 83||hostal 83 hater",
      "Hostal 83||Hostal 83 Hater"
    ],
    "sala_aliases": [
      "Hostal 83 Hater"
    ]
  },
  {
    "idx": 153,
    "aliases": [
      "lautada puzle room||apocalipsis natura",
      "Lautada Puzle Room||Apocalipsis Natura"
    ],
    "sala_aliases": [
      "Apocalipsis Natura"
    ]
  },
  {
    "idx": 154,
    "aliases": [
      "Petra Escape Room||Petra - El reino perdido",
      "petra escape room||petra - el reino perdido"
    ],
    "sala_aliases": [
      "Petra - El reino perdido"
    ]
  },
  {
    "idx": 155,
    "aliases": [
      "get out escape room||la estacion",
      "Get Out Escape Room||La estación"
    ],
    "sala_aliases": [
      "La estación"
    ]
  },
  {
    "idx": 156,
    "aliases": [
      "the box escape room madrid||el juego de hex",
      "The Box Escape Room Madrid||El juego de HEX"
    ],
    "sala_aliases": [
      "El juego de HEX"
    ]
  },
  {
    "idx": 157,
    "aliases": [
      "Carthago Escape Room||Ciudad de Halloween",
      "carthago escape room||ciudad de halloween"
    ],
    "sala_aliases": [
      "Ciudad de Halloween"
    ]
  },
  {
    "idx": 158,
    "aliases": [
      "Komnata Quest||Mientras sigas con vida",
      "komnata quest||mientras sigas con vida"
    ],
    "sala_aliases": [
      "Mientras sigas con vida"
    ]
  },
  {
    "idx": 159,
    "aliases": [
      "The Last Monkey||El capitan errante",
      "the last monkey||el capitan errante"
    ],
    "sala_aliases": [
      "El capitan errante"
    ]
  },
  {
    "idx": 160,
    "aliases": [
      "kenopsia||misterios de kemet / la tumba olvidada",
      "Kenopsia||Misterios de Kemet / La tumba olvidada"
    ],
    "sala_aliases": [
      "Misterios de Kemet / La tumba olvidada"
    ]
  },
  {
    "idx": 161,
    "aliases": [
      "locked zgz escape room||ritual",
      "Locked ZGZ Escape Room||Ritual"
    ],
    "sala_aliases": [
      "Ritual"
    ]
  },
  {
    "idx": 162,
    "aliases": [
      "The Padlock||The secret of Jack Daniel's",
      "the padlock||the secret of jack daniel's"
    ],
    "sala_aliases": [
      "The secret of Jack Daniel's"
    ]
  },
  {
    "idx": 163,
    "aliases": [
      "la salida||atrapado en el museo",
      "La salida||Atrapado en el museo"
    ],
    "sala_aliases": [
      "Atrapado en el museo"
    ]
  }
];

  const CATALOG = {};
  const BY_SALA = {};

  MAPPINGS.forEach((m) => {
    const item = ROOMS_LIST[m.idx];
    if (!item) return;

    m.aliases.forEach((rawKey) => {
      if (!rawKey) return;
      CATALOG[rawKey] = item;
      const parts = rawKey.split("||");
      if (parts.length === 2) {
        CATALOG[makeKey(parts[0], parts[1])] = item;
      } else {
        CATALOG[normalizeKey(rawKey)] = item;
      }
    });

    m.sala_aliases.forEach((rawSala) => {
      if (!rawSala) return;
      const sk = normalizeKey(rawSala);
      if (!BY_SALA[sk]) {
        BY_SALA[sk] = item;
      }
      if (!CATALOG[sk]) {
        CATALOG[sk] = item;
      }
    });

    // Also register canonical item empresa + sala
    CATALOG[makeKey(item.empresa, item.sala)] = item;
    const itemSk = normalizeKey(item.sala);
    if (!BY_SALA[itemSk]) BY_SALA[itemSk] = item;
    if (!CATALOG[itemSk]) CATALOG[itemSk] = item;
  });

  window.ROOMS_CATALOG = CATALOG;
  window.ROOMS_CATALOG_BY_SALA = BY_SALA;
  window.ROOMS_CATALOG_LIST = ROOMS_LIST;

  window.getRoomCatalog = function (empresa, sala) {
    if (!sala) return null;
    const directKey = makeKey(empresa, sala);
    if (CATALOG[directKey]) return CATALOG[directKey];

    const rawKey = `${empresa || ""}||${sala}`;
    if (CATALOG[rawKey]) return CATALOG[rawKey];

    const sk = normalizeKey(sala);
    if (BY_SALA[sk]) return BY_SALA[sk];
    if (CATALOG[sk]) return CATALOG[sk];

    return null;
  };
})();
