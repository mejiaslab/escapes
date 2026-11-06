/**
 * Verified venue, municipality, and province coordinates for the conquest map,
 * along with high-resolution Top 10 poster overrides.
 */

import { normalizeKey } from "../utils/formatters.js";

export const ESCAPE_LOCATIONS = {
  // Specific coordinates for visited venues (normalized key: "company|city")
  venues: {
    "escape barcelona|sta. coloma de gramenet": [41.4516, 2.2081],
    "mayto kingdom|vitoria": [42.8594, -2.6524],
    "mad land|algete": [40.5965, -3.5052],
    "shock escape room|rivas-vaciamadrid": [40.3545, -3.5218],
    "shock escape room|madrid": [40.3982, -3.6709],
    "overtime|pamplona": [42.8286, -1.6528],
    "distrito 7|pamplona": [42.8087, -1.6621],
    "wayout room escape|pamplona": [42.8112, -1.6494],
    "factoria escape room|valencia": [39.4864, -0.3596],
    "skp room|valencia": [39.4659, -0.3837],
    "the x door|valencia": [39.4694, -0.3712],
    "the x-door|valencia": [39.4694, -0.3712],
    "don escape|valencia": [39.4778, -0.3565],
    "golden pop|barcelona": [41.3929, 2.1742],
    "horror box|barcelona": [41.4068, 2.1649],
    "unreal room escape|barcelona": [41.3772, 2.1425],
    "saga escape room|barcelona": [41.4126, 2.1823],
    "the city escape room|terrassa": [41.5522, 2.0249],
    "krematorium escape rooms experience|hospitalet": [41.3638, 2.1129],
    "virus escape room|calella de mar": [41.6138, 2.6579],
    "illusion|fuenlabrada": [40.2869, -3.7942],
    "code 258|fuenlabrada": [40.2814, -3.7998],
    "gravity zero room|fuenlabrada": [40.2902, -3.7886],
    "sala enigma|vitoria": [42.8469, -2.6716],
    "lautada puzle room|audikana": [42.8698, -2.5029],
    "madness toledo|toledo": [39.8685, -4.0226],
    "the padlock|praga": [50.0792, 14.4332],
    "xkapa|santander": [43.4609, -3.8132],
    "arena gaming|granada": [37.1695, -3.6054],
    "escape room badajoz|badajoz": [38.8752, -6.9748],
    "experiencity|madrid": [40.4368, -3.7035],
    "incognito escape|madrid": [40.4052, -3.7024],
    "locktopus escape game|madrid": [40.4316, -3.7118],
    "bite the fly|madrid": [40.4384, -3.6798],
    "la cronosfera|madrid": [40.4021, -3.6948],
    "hidden escape room|madrid": [40.3965, -3.6989],
    "get out escape room|madrid": [40.4258, -3.6745],
    "madrid terror|madrid": [40.3918, -3.7132],
    "yaebi|madrid": [40.4198, -3.6694],
    "ncerrados|madrid": [40.4076, -3.6762],
    "the box escape room madrid|madrid": [40.4014, -3.7104],
    "action house|madrid": [40.4439, -3.6688],
    "road out escape room|madrid": [40.3944, -3.6852],
    "criogenic escape room|madrid": [40.4328, -3.6615],
    "komnata quest|madrid": [40.4222, -3.7082],
    "alexcaperoom|madrid": [40.3886, -3.7031],
    "scavenger|madrid": [40.4158, -3.7019],
    "la salida|madrid": [40.4294, -3.7008],
    "escape khaos|madrid": [40.4112, -3.6928],
    "reversum|mostoles": [40.3238, -3.8647],
    "golden escape room madrid|mostoles": [40.3189, -3.8721],
    "clock 60|mostoles": [40.3264, -3.8588],
    "materia gris|alcorcon": [40.3479, -3.8284],
    "sapiens|alcorcon": [40.3435, -3.8332],
    "arroyo escape room|arroyomolinos": [40.2694, -3.9168],
    "eacapology|arroyomolinos": [40.2896, -3.8992],
    "curious cat|leganes": [40.3292, -3.7654],
    "curious cat escape room|leganes": [40.3292, -3.7654],
    "paradiso escape room|leganes": [40.3348, -3.7712],
    "the last monkey|leganes": [40.3251, -3.7598],
    "black lake escape room|san sebastian de los reyes": [40.5524, -3.6268],
    "descifra escape|san sebastian de los reyes": [40.5468, -3.6312],
    "a maze in 60|boadilla del monte": [40.4058, -3.8769]
  },

  // Municipality coordinates (visited + pending + capitals)
  cities: {
    alcantarilla: [37.9694, -1.2139],
    alcorcon: [40.3458, -3.8249],
    algete: [40.5971, -3.4974],
    alicante: [38.3452, -0.481],
    arroyomolinos: [40.2689, -3.9192],
    audikana: [42.8698, -2.5029],
    badajoz: [38.8794, -6.9707],
    badalona: [41.45, 2.2474],
    barcelona: [41.3874, 2.1686],
    basauri: [43.2366, -2.8889],
    beranga: [43.4158, -3.5624],
    berga: [42.1043, 1.8463],
    bilbao: [43.263, -2.935],
    "boadilla del monte": [40.4053, -3.8783],
    calella: [41.6136, 2.6576],
    "calella de mar": [41.6136, 2.6576],
    cartagena: [37.6057, -0.9913],
    "cornella de llobregat": [41.3557, 2.0704],
    "cuarte de huerva": [41.5944, -0.9317],
    elche: [38.2699, -0.7126],
    elizondo: [43.1469, -1.5173],
    "esplugues de llobregat": [41.3768, 2.0886],
    fuenlabrada: [40.2842, -3.7942],
    getaria: [43.3044, -2.2039],
    gironella: [42.0357, 1.8825],
    granada: [37.1773, -3.5986],
    hospitalet: [41.3597, 2.1003],
    "jerez de la frontera": [36.685, -6.1261],
    leganes: [40.3281, -3.7635],
    "les fonts": [41.5282, 2.0369],
    logrono: [42.4627, -2.445],
    madrid: [40.4168, -3.7038],
    manresa: [41.7252, 1.8235],
    mataro: [41.5381, 2.4447],
    mostoles: [40.3223, -3.8649],
    murcia: [37.9922, -1.1307],
    nalda: [42.3339, -2.4869],
    pamplona: [42.8125, -1.6458],
    parla: [40.236, -3.7675],
    praga: [50.0755, 14.4378],
    "riba-roja del turia": [39.5475, -0.5683],
    ripollet: [41.4981, 2.1564],
    "rivas-vaciamadrid": [40.3519, -3.5356],
    sabadell: [41.5463, 2.1086],
    "san sebastian de los reyes": [40.5475, -3.6261],
    "sant sadurni d'anoia": [41.4258, 1.7872],
    santander: [43.4623, -3.8099],
    sevilla: [37.3891, -5.9845],
    "sta. coloma de gramenet": [41.4515, 2.2081],
    sunbilla: [43.1619, -1.6697],
    telde: [27.9924, -15.4192],
    terrassa: [41.5632, 2.0089],
    terrasa: [41.5632, 2.0089],
    toledo: [39.8628, -4.0273],
    tona: [41.8486, 2.2281],
    valencia: [39.4699, -0.3763],
    "villafranca del penedes": [41.3461, 1.6971],
    vitoria: [42.8467, -2.6716],
    zaragoza: [41.6488, -0.8891]
  },

  // Province/country fallback coordinates
  provinces: {
    alava: [42.8467, -2.6716],
    alicante: [38.3452, -0.481],
    badajoz: [38.8794, -6.9707],
    barcelona: [41.3874, 2.1686],
    cadiz: [36.5271, -6.2886],
    cantabria: [43.4623, -3.8099],
    chequia: [50.0755, 14.4378],
    gipuzkoa: [43.3183, -1.9812],
    "gran canaria": [28.1235, -15.4363],
    granada: [37.1773, -3.5986],
    "la rioja": [42.4627, -2.445],
    madrid: [40.4168, -3.7038],
    murcia: [37.9922, -1.1307],
    navarra: [42.8125, -1.6458],
    sevilla: [37.3891, -5.9845],
    toledo: [39.8628, -4.0273],
    valencia: [39.4699, -0.3763],
    vizcaya: [43.263, -2.935],
    zaragoza: [41.6488, -0.8891]
  },

  // Official posters for historical Top 10 rooms (relative paths)
  posters: {
    "cybercity 2049": "./assets/rooms/cybercity-2049.jpg",
    "una aventura de leyenda": "./assets/rooms/una-aventura-de-leyenda.jpg",
    "magic universe": "./assets/rooms/magic-universe.webp",
    "la santa": "./assets/rooms/la-santa.png",
    "101 anos de perdon": "./assets/rooms/101-anos-de-perdon.jpg",
    "k.o.n.g protocol": "./assets/rooms/kong-protocol.jpg",
    "golpe perfecto en el jardin de buda": "./assets/rooms/jardin-de-buda.png",
    jurasico: "./assets/rooms/jurasico.jpg",
    "tu tambien sonaras": "./assets/rooms/tu-tambien-sonaras.webp",
    "la taberna": "./assets/rooms/la-taberna.jpg"
  }
};

/**
 * Returns a curated poster relative path for top-ranked rooms if available.
 * @param {string} roomName
 * @returns {string | null}
 */
export function getTopPosterPath(roomName) {
  const key = normalizeKey(roomName);
  return ESCAPE_LOCATIONS.posters[key] || null;
}

/**
 * Resolves [latitude, longitude] for a room and applies a golden-angle spiral offset
 * when multiple rooms share the same venue/city coordinates.
 * @param {{ company: string, city: string, province: string }} room
 * @param {Record<string, number>} [collisionCounter={}]
 * @returns {[number, number] | null}
 */
export function resolveRoomCoordinates(room, collisionCounter = {}) {
  const companyKey = normalizeKey(room.company);
  const cityKey = normalizeKey(room.city);
  const provinceKey = normalizeKey(room.province);

  const base =
    ESCAPE_LOCATIONS.venues[`${companyKey}|${cityKey}`] ||
    ESCAPE_LOCATIONS.cities[cityKey] ||
    ESCAPE_LOCATIONS.provinces[provinceKey] ||
    null;

  if (!base) return null;

  const signature = `${base[0].toFixed(4)},${base[1].toFixed(4)}`;
  const index = collisionCounter[signature] || 0;
  collisionCounter[signature] = index + 1;

  if (index === 0) return [base[0], base[1]];

  const angle = index * 2.399963;
  const radius = 0.0014 * Math.sqrt(index);
  return [base[0] + radius * Math.cos(angle), base[1] + radius * Math.sin(angle)];
}
