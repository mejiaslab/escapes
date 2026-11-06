/**
 * Global configuration constants, team member definitions, rating dimensions,
 * navigation metadata, and map viewport presets.
 */

export const GOOGLE_CLIENT_ID =
  "719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com";
export const SPREADSHEET_ID = "1riZ1aM8txI27Zpm11VJzVv1mqGuCvDvZKilcs2n_Djg";
export const MAIN_SHEET_RANGE = "Datos!A1:P1000";
export const CARTO_API_KEY = "cb1_51u6_1_8cba597fff672cc3c6e07753";

export const SESSION_STORAGE_KEY = "escapes_oauth_session_v3";
export const INTRO_SESSION_KEY = "escapes_intro_seen";
export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const OAUTH_SCOPES = `openid email profile ${SHEETS_SCOPE}`;

export const DEFAULT_ROOM_IMAGE = "./assets/hero-bg.jpg";

/**
 * Core group members with dedicated personal rating tabs in Google Sheets.
 */
export const CORE_MEMBERS = [
  {
    key: "S",
    name: "Sara",
    sheet: "Sara",
    aliases: ["sara"],
    color: "#f472b6",
    bg: "rgba(244, 114, 182, 0.18)"
  },
  {
    key: "M",
    name: "Miguel",
    sheet: "Miguel",
    aliases: ["miguel"],
    color: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.18)"
  },
  {
    key: "R",
    name: "Rafa",
    sheet: "Rafa",
    aliases: ["rafa", "rafael"],
    color: "#34d399",
    bg: "rgba(52, 211, 153, 0.18)"
  },
  {
    key: "A",
    name: "Antonio",
    sheet: "Antonio",
    aliases: ["antonio"],
    color: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.18)"
  },
  {
    key: "J",
    name: "Joan",
    sheet: "Joan",
    aliases: ["joan"],
    color: "#a78bfa",
    bg: "rgba(167, 139, 250, 0.18)"
  }
];

export const MEMBERS = [
  ...CORE_MEMBERS,
  {
    key: "+",
    name: "Con invitados (+)",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.18)"
  }
];

/**
 * User-facing Spanish rating criteria (index 0 = Difficulty, excluded from overall average).
 */
export const DIMENSIONS = [
  "Dificultad",
  "Variedad",
  "Game máster",
  "Ambientación",
  "Automatización",
  "Originalidad",
  "General"
];

/**
 * Expected column headers in each member's Google Sheet tab.
 */
export const MEMBER_SHEET_HEADERS = ["Empresa", "Sala", ...DIMENSIONS, "Media"];

export const QUICK_SCORES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/**
 * Navigation sections metadata (user-facing texts in Spanish es-ES).
 */
export const SECTIONS = {
  dashboard: { kicker: "VISTA GENERAL", title: "Panel principal · Resumen" },
  personal: { kicker: "ZONA PERSONAL", title: "Mi espacio · Estadísticas y valoraciones" },
  visited: { kicker: "CATÁLOGO DE SALAS", title: "Salas visitadas" },
  pending: { kicker: "CATÁLOGO DE SALAS", title: "Salas pendientes" },
  ranking: { kicker: "SALÓN DE LA FAMA", title: "Clasificación Top 10" },
  map: { kicker: "CARTOGRAFÍA ESCAPISTA", title: "Mapa de conquistas" },
  team: { kicker: "ANÁLISIS Y GRUPO", title: "Equipo y alineaciones" },
  stats: { kicker: "LABORATORIO ESTADÍSTICO", title: "Estadísticas" }
};

/**
 * Backwards-compatible URL hash aliases mapped to canonical English section IDs.
 */
export const HASH_ALIASES = {
  resumen: "dashboard",
  inicio: "dashboard",
  "mi-espacio": "personal",
  valoraciones: "personal",
  valorar: "personal",
  visitadas: "visited",
  pendientes: "pending",
  mapa: "map",
  "evolucion-mapa": "map",
  equipo: "team",
  estadisticas: "stats",
  miguel: "ranking",
  sara: "ranking"
};

export const MAP_VIEWPORTS = {
  spain: { center: [40.25, -3.5], zoom: 6 },
  all: { center: [44.2, 4.5], zoom: 4 },
  madrid: { center: [40.38, -3.72], zoom: 10 },
  barcelona: { center: [41.44, 2.18], zoom: 10 },
  north: { center: [42.98, -2.45], zoom: 8 },
  valencia: { center: [39.47, -0.37], zoom: 12 }
};
