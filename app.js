/* =========================================================
   EXPEDIENTE ESCAPISTA — LÓGICA PRINCIPAL, NAVEGACIÓN LATERAL,
   MI ESPACIO PERSONAL, VALORACIONES MULTI-MIEMBRO EN SHEETS,
   OAUTH 2.0 Y VISUALIZACIÓN EN VIVO
   ========================================================= */

(function () {
  "use strict";

  const GOOGLE_CLIENT_ID =
    "719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com";
  const SPREADSHEET_ID = "1riZ1aM8txI27Zpm11VJzVv1mqGuCvDvZKilcs2n_Djg";
  const DATOS_RANGE = "Datos!A1:P1000";

  const SESSION_KEY = "escapes_oauth_session_v3";
  const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
  const OAUTH_SCOPES = `openid email profile ${SHEETS_SCOPE}`;

  // Los 5 integrantes principales con hoja de valoraciones propia
  const CORE_MEMBERS = [
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

  const MEMBERS = [
    ...CORE_MEMBERS,
    { key: "+", name: "Con invitados (+)", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.18)" }
  ];

  const DIMENSIONS = [
    "Dificultad",
    "Variedad",
    "Game máster",
    "Ambientación",
    "Automatización",
    "Originalidad",
    "General"
  ];

  const MEMBER_SHEET_HEADERS = ["Empresa", "Sala", ...DIMENSIONS, "Media"];
  const QUICK_SCORES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const SECTIONS = {
    dashboard: { kicker: "VISTA GENERAL", title: "Dashboard · Resumen" },
    personal: { kicker: "ZONA PERSONAL", title: "Mi Espacio · Estadísticas y Valoraciones" },
    visitadas: { kicker: "CATÁLOGO DE SALAS", title: "Salas Visitadas" },
    pendientes: { kicker: "CATÁLOGO DE SALAS", title: "Salas Pendientes" },
    ranking: { kicker: "HALL OF FAME", title: "Ranking Top 10" },
    mapa: { kicker: "CARTOGRAFÍA ESCAPISTA", title: "Mapa de Conquistas" },
    equipo: { kicker: "ANÁLISIS Y GRUPO", title: "Equipo y Alineaciones" },
    estadisticas: { kicker: "LABORATORIO ESTADÍSTICO", title: "Estadísticas" }
  };

  const HASH_ALIASES = {
    resumen: "dashboard",
    inicio: "dashboard",
    "mi-espacio": "personal",
    valoraciones: "personal",
    valorar: "personal",
    "evolucion-mapa": "mapa",
    miguel: "ranking",
    sara: "ranking"
  };

  // Estado global de la aplicación
  const state = {
    user: null,
    currentMember: null,
    tokenClient: null,
    activeSection: "dashboard",
    hasData: false,
    needsMapRender: false,
    needsChartsRender: false,
    needsPersonalChartsRender: false,
    allRooms: [],
    visitedRooms: [],
    pendingRooms: [],
    upcomingRooms: [],
    draftRooms: [],
    memberSheetMeta: {},
    openRoomModalId: null,
    ratingRoomId: null,
    ratingReturnRoomId: null,
    isSavingRating: false,
    bannerTimer: null,
    rankMode: "media",
    visitedFilter: {
      search: "",
      member: "ALL",
      year: "ALL",
      page: 1,
      pageSize: 10
    },
    personalFilter: {
      status: "ALL",
      search: "",
      year: "ALL",
      page: 1,
      pageSize: 10
    },
    pendingFilter: {
      search: "",
      province: "ALL",
      theme: "ALL"
    },
    charts: {
      year: null,
      radar: null,
      themes: null,
      personalRadar: null,
      personalYear: null
    },
    map: null,
    markerCluster: null
  };

  /* ---------------------------------------------------------
     UTILIDADES DE NORMALIZACIÓN, IDENTIDAD Y FORMATO
     --------------------------------------------------------- */

  function normalizeKey(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function makeRoomKey(empresa, sala) {
    return `${normalizeKey(empresa)}||${normalizeKey(sala)}`;
  }

  function resolveRoomCatalog(r) {
    if (!r) return null;
    if (typeof window.getRoomCatalog === "function") {
      const found = window.getRoomCatalog(r.empresa, r.sala);
      if (found) return found;
      if (r.rawEmpresa && r.rawEmpresa !== r.empresa) {
        const foundRaw = window.getRoomCatalog(r.rawEmpresa, r.sala);
        if (foundRaw) return foundRaw;
      }
    }
    if (window.ROOMS_CATALOG) {
      const k1 = makeRoomKey(r.empresa, r.sala);
      if (window.ROOMS_CATALOG[k1]) return window.ROOMS_CATALOG[k1];
      if (r.rawEmpresa) {
        const k2 = makeRoomKey(r.rawEmpresa, r.sala);
        if (window.ROOMS_CATALOG[k2]) return window.ROOMS_CATALOG[k2];
      }
      const sk = normalizeKey(r.sala);
      if (window.ROOMS_CATALOG[sk]) return window.ROOMS_CATALOG[sk];
    }
    return null;
  }

  function resolveCurrentMember(user) {
    if (!user) return null;
    const tokenize = (s) =>
      normalizeKey(s)
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

    const givenTokens = tokenize(user.givenName || "");
    const fullTokens = tokenize(user.name || "");

    if (givenTokens.length > 0) {
      const firstGiven = CORE_MEMBERS.find((m) => m.aliases.includes(givenTokens[0]));
      if (firstGiven) return firstGiven;
      const anyGiven = CORE_MEMBERS.find((m) => givenTokens.some((t) => m.aliases.includes(t)));
      if (anyGiven) return anyGiven;
    }

    if (fullTokens.length > 0) {
      const firstFull = CORE_MEMBERS.find((m) => m.aliases.includes(fullTokens[0]));
      if (firstFull) return firstFull;
      const anyFull = CORE_MEMBERS.find((m) => fullTokens.some((t) => m.aliases.includes(t)));
      if (anyFull) return anyFull;
    }

    return null;
  }

  function canMemberRateRoom(member, room) {
    if (!member || !room) return false;
    return room.status === "visited" && room.deNosotros.includes(member.key);
  }

  function computeMediaExcludingDifficulty(dims) {
    if (!Array.isArray(dims)) return null;
    // Índice 0 = Dificultad (excluida de la media); índices 1..6 = Variedad..General
    const valid = dims.slice(1).filter((v) => v !== null && Number.isFinite(v));
    if (valid.length === 0) return null;
    const avg = valid.reduce((acc, v) => acc + v, 0) / valid.length;
    return Number(avg.toFixed(2));
  }

  function cleanCityName(city) {
    const raw = String(city || "").trim();
    const norm = normalizeKey(raw);
    if (norm === "leganes") return "Leganés";
    if (norm === "terrasa" || norm === "terrassa") return "Terrassa";
    if (norm === "mostoles") return "Móstoles";
    if (norm === "alcorcon") return "Alcorcón";
    return raw;
  }

  function cleanProvinceName(prov) {
    return String(prov || "").trim();
  }

  function parseScore(val) {
    if (val === null || val === undefined) return null;
    const s = String(val).trim().replace(",", ".");
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function fmtScore(num) {
    if (num === null || num === undefined || !Number.isFinite(num)) return "—";
    return num.toFixed(2).replace(".", ",").replace(/,00$/, "");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showSyncBanner(htmlText, variant = "success", autoHideMs = 4800) {
    const banner = document.getElementById("sync-banner");
    if (!banner) return;
    if (state.bannerTimer) {
      clearTimeout(state.bannerTimer);
      state.bannerTimer = null;
    }
    banner.className = "sync-banner";
    if (variant === "success") banner.classList.add("sync-success");
    if (variant === "error") banner.classList.add("sync-error");
    banner.innerHTML = htmlText;
    banner.hidden = false;

    if (autoHideMs > 0) {
      state.bannerTimer = setTimeout(() => {
        banner.hidden = true;
      }, autoHideMs);
    }
  }

  function themeClass(theme) {
    const t = normalizeKey(theme);
    if (t.includes("terror") || t.includes("miedo") || t.includes("tension")) return "theme-terror";
    if (t.includes("aventura")) return "theme-aventuras";
    if (t.includes("misterio") || t.includes("criminal") || t.includes("mafia")) return "theme-misterio";
    if (t.includes("fantasia") || t.includes("medieval") || t.includes("disney")) return "theme-fantasia";
    if (t.includes("futurista") || t.includes("vr") || t.includes("apocaliptico")) return "theme-futurista";
    return "";
  }

  function fallbackGradient(theme) {
    const t = normalizeKey(theme);
    if (t.includes("terror") || t.includes("miedo")) {
      return "linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)";
    }
    if (t.includes("futurista") || t.includes("vr")) {
      return "linear-gradient(135deg, #082f49 0%, #3b0764 100%)";
    }
    if (t.includes("fantasia")) {
      return "linear-gradient(135deg, #422006 0%, #1e1b4b 100%)";
    }
    return "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)";
  }

  function getPosterUrl(roomName) {
    const key = normalizeKey(roomName);
    const posters = (window.ESCAPE_LOCATIONS && window.ESCAPE_LOCATIONS.posters) || {};
    return posters[key] || null;
  }

  function resolveCoordinates(room, collisionCounter) {
    const locs = window.ESCAPE_LOCATIONS || { venues: {}, cities: {}, provinces: {} };
    const empKey = normalizeKey(room.empresa);
    const cityKey = normalizeKey(room.ciudad);
    const provKey = normalizeKey(room.provincia);

    const base =
      locs.venues[`${empKey}|${cityKey}`] ||
      locs.cities[cityKey] ||
      locs.provinces[provKey] ||
      null;

    if (!base) return null;

    const sig = `${base[0].toFixed(4)},${base[1].toFixed(4)}`;
    const idx = collisionCounter[sig] || 0;
    collisionCounter[sig] = idx + 1;

    if (idx === 0) return [base[0], base[1]];

    const angle = idx * 2.399963;
    const radius = 0.0014 * Math.sqrt(idx);
    return [base[0] + radius * Math.cos(angle), base[1] + radius * Math.sin(angle)];
  }

  /* ---------------------------------------------------------
     NAVEGACIÓN POR SECCIONES Y CONTROL DEL MENÚ LATERAL
     --------------------------------------------------------- */

  function resolveSectionFromHash() {
    const raw = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (!raw) return "dashboard";
    if (SECTIONS[raw]) return raw;
    if (HASH_ALIASES[raw]) return HASH_ALIASES[raw];
    return "dashboard";
  }

  function openMobileSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const openBtn = document.getElementById("sidebar-open-btn");
    if (sidebar) sidebar.classList.add("is-open");
    if (backdrop) backdrop.hidden = false;
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const openBtn = document.getElementById("sidebar-open-btn");
    if (sidebar) sidebar.classList.remove("is-open");
    if (backdrop) backdrop.hidden = true;
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
  }

  function refreshActiveSectionVisuals() {
    if (!state.hasData) return;

    if (state.activeSection === "mapa") {
      if (state.needsMapRender || !state.map) {
        renderMap();
        state.needsMapRender = false;
      } else {
        state.map.invalidateSize();
        setTimeout(() => state.map && state.map.invalidateSize(), 180);
      }
    }

    if (state.activeSection === "estadisticas") {
      if (state.needsChartsRender) {
        renderYearChart();
        renderExtraStats();
        state.needsChartsRender = false;
      } else {
        if (state.charts.year) state.charts.year.resize();
        if (state.charts.radar) state.charts.radar.resize();
        if (state.charts.themes) state.charts.themes.resize();
      }
    }

    if (state.activeSection === "personal" && state.currentMember) {
      if (state.needsPersonalChartsRender) {
        renderPersonalCharts();
        state.needsPersonalChartsRender = false;
      } else {
        if (state.charts.personalRadar) state.charts.personalRadar.resize();
        if (state.charts.personalYear) state.charts.personalYear.resize();
      }
    }
  }

  function navigateToSection(sectionId, options = {}) {
    const { updateHash = true, scrollTop = true } = options;
    const target = SECTIONS[sectionId] ? sectionId : "dashboard";
    state.activeSection = target;

    document.querySelectorAll(".app-view[data-section]").forEach((sec) => {
      sec.hidden = sec.getAttribute("data-section") !== target;
    });

    document.querySelectorAll(".sidebar-link[data-section-link]").forEach((link) => {
      const isMatch = link.getAttribute("data-section-link") === target;
      link.classList.toggle("active", isMatch);
      if (isMatch) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const meta = SECTIONS[target];
    const kickerEl = document.getElementById("topbar-section-kicker");
    const titleEl = document.getElementById("topbar-section-title");
    if (kickerEl) kickerEl.textContent = meta.kicker;
    if (titleEl) titleEl.textContent = meta.title;

    closeMobileSidebar();

    if (updateHash) {
      const desiredHash = `#${target}`;
      if (window.location.hash !== desiredHash) {
        history.pushState(null, "", desiredHash);
      }
    }

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    requestAnimationFrame(() => {
      refreshActiveSectionVisuals();
    });
  }

  /* ---------------------------------------------------------
     PARSEADOR DE "DATOS" + LAS 5 HOJAS PERSONALES
     --------------------------------------------------------- */

  function parseMemberSheetValues(values) {
    const byExactKey = new Map();
    const bySalaCounts = new Map();
    const bySalaEntry = new Map();
    const rows = Array.isArray(values) ? values : [];
    let maxRowNumber = rows.length > 0 ? 1 : 0;

    for (let idx = 1; idx < rows.length; idx++) {
      const rawRow = rows[idx] || [];
      const rowNum = idx + 1; // 1-based en Google Sheets
      const r = Array.from({ length: 10 }, (_, i) =>
        rawRow[i] !== undefined && rawRow[i] !== null ? String(rawRow[i]).trim() : ""
      );

      if (r.some((cell) => cell !== "")) {
        maxRowNumber = Math.max(maxRowNumber, rowNum);
      }

      const empresa = r[0];
      const sala = r[1];
      if (!sala) continue;

      const dims = DIMENSIONS.map((_, i) => parseScore(r[2 + i]));
      const media = computeMediaExcludingDifficulty(dims);
      const hasAnyScore = dims.some((v) => v !== null);
      const hasMedia = media !== null;

      const entry = {
        rowNumber: rowNum,
        empresa,
        sala,
        dims,
        general: dims[6],
        media,
        hasAnyScore,
        hasMedia
      };

      const exactKey = makeRoomKey(empresa, sala);
      if (!byExactKey.has(exactKey) || hasAnyScore) {
        byExactKey.set(exactKey, entry);
      }

      const salaKey = normalizeKey(sala);
      bySalaCounts.set(salaKey, (bySalaCounts.get(salaKey) || 0) + 1);
      bySalaEntry.set(salaKey, entry);
    }

    return {
      hasHeader: rows.length > 0 && rows[0] && rows[0].length > 0,
      maxRowNumber,
      byExactKey,
      bySalaCounts,
      bySalaEntry
    };
  }

  function parseSheetDataset(dataset) {
    const datosValues = dataset.datosValues || [];
    const memberValuesByKey = dataset.memberValuesByKey || {};

    const parsedMembers = {};
    state.memberSheetMeta = {};

    CORE_MEMBERS.forEach((m) => {
      const parsed = parseMemberSheetValues(memberValuesByKey[m.key] || []);
      parsedMembers[m.key] = parsed;
      state.memberSheetMeta[m.key] = {
        hasHeader: parsed.hasHeader,
        maxRowNumber: parsed.maxRowNumber
      };
    });

    const allRooms = [];
    const visitedRooms = [];
    const pendingRooms = [];
    const upcomingRooms = [];
    const draftRooms = [];
    const collisionCounter = {};

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const rows = Array.isArray(datosValues) ? datosValues.slice(2) : [];

    // Contar ocurrencias de nombre de sala en Datos para respaldar búsqueda si cambiase Empresa
    const datosSalaCounts = new Map();
    rows.forEach((rawRow) => {
      const sala = rawRow && rawRow[1] ? String(rawRow[1]).trim() : "";
      if (sala) {
        const sk = normalizeKey(sala);
        datosSalaCounts.set(sk, (datosSalaCounts.get(sk) || 0) + 1);
      }
    });

    rows.forEach((rawRow, idx) => {
      const r = Array.from({ length: 16 }, (_, i) =>
        rawRow[i] !== undefined && rawRow[i] !== null ? String(rawRow[i]).trim() : ""
      );

      if (!r[1]) return;

      const rawEmpresa = r[0];
      const sala = r[1];
      const fechaRaw = r[10];
      const deNosotros = r[12].toUpperCase();
      const ciudad = cleanCityName(r[2]);
      const provincia = cleanProvinceName(r[3]);

      const room = {
        id: idx + 3,
        rawEmpresa,
        empresa: rawEmpresa || "Sin empresa",
        sala,
        ciudad: ciudad || "—",
        provincia: provincia || "Sin provincia",
        tematica: r[4] && r[4] !== "-" ? r[4] : "Sin especificar",
        minJug: r[5],
        maxJug: r[6],
        recomJug: r[7],
        tiempoMax: r[8],
        masInfo: r[9],
        fechaRaw,
        fechaDisplay: fechaRaw,
        year: null,
        undated: false,
        sortTimestamp: -Infinity,
        jugadores: r[11],
        deNosotros,
        exito: r[13].toUpperCase(),
        tiempoEmpleado: r[14],
        opinion: r[15],
        ratings: {},
        sheetRowByMember: {},
        media: {
          dims: DIMENSIONS.map(() => null),
          general: null,
          media: null,
          ratersCount: 0,
          raterKeys: [],
          hasAnyScore: false
        },
        status: "draft",
        coords: null
      };

      if (fechaRaw.toUpperCase() === "PENDIENTE") {
        room.status = "pending";
        pendingRooms.push(room);
      } else if (!fechaRaw) {
        room.status = "draft";
        draftRooms.push(room);
      } else {
        const parts = fechaRaw.split("/");
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const mIdx = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const dt = new Date(y, mIdx, d, 12, 0, 0);

          if (y < 1950) {
            room.status = "visited";
            room.undated = true;
            room.fechaDisplay = "Sin fecha exacta";
            room.sortTimestamp = -1e15 + idx;
            room.coords = resolveCoordinates(room, collisionCounter);
            visitedRooms.push(room);
          } else if (dt <= endOfToday || deNosotros.length > 0) {
            room.status = "visited";
            room.year = y;
            room.fechaDisplay = `${String(d).padStart(2, "0")}/${String(mIdx + 1).padStart(2, "0")}/${y}`;
            room.sortTimestamp = dt.getTime();
            room.coords = resolveCoordinates(room, collisionCounter);
            visitedRooms.push(room);
          } else {
            room.status = "upcoming";
            room.year = y;
            room.fechaDisplay = `${String(d).padStart(2, "0")}/${String(mIdx + 1).padStart(2, "0")}/${y}`;
            room.sortTimestamp = dt.getTime();
            upcomingRooms.push(room);
          }
        }
      }

      // Cruzar valoraciones individuales de los 5 miembros (solo si han visitado la sala)
      const exactKey = makeRoomKey(rawEmpresa, sala);
      const salaKey = normalizeKey(sala);
      const isUniqueSalaInDatos = datosSalaCounts.get(salaKey) === 1;

      CORE_MEMBERS.forEach((m) => {
        const pm = parsedMembers[m.key];
        let entry = pm.byExactKey.get(exactKey) || null;
        if (!entry && isUniqueSalaInDatos && pm.bySalaCounts.get(salaKey) === 1) {
          entry = pm.bySalaEntry.get(salaKey) || null;
        }

        room.sheetRowByMember[m.key] = entry ? entry.rowNumber : null;

        if (canMemberRateRoom(m, room) && entry) {
          room.ratings[m.key] = {
            dims: entry.dims.slice(),
            general: entry.general,
            media: entry.media,
            hasAnyScore: entry.hasAnyScore,
            hasMedia: entry.hasMedia
          };
        } else {
          room.ratings[m.key] = {
            dims: DIMENSIONS.map(() => null),
            general: null,
            media: null,
            hasAnyScore: false,
            hasMedia: false
          };
        }
      });

      // Calcular valoración general de la sala como media de TODOS los miembros que la hayan valorado
      const ratersWithMedia = CORE_MEMBERS.filter((m) => room.ratings[m.key].media !== null);
      const anyRaters = CORE_MEMBERS.filter((m) => room.ratings[m.key].hasAnyScore);

      const mediaDims = DIMENSIONS.map((_, i) => {
        const vals = CORE_MEMBERS.map((m) => room.ratings[m.key].dims[i]).filter((v) => v !== null);
        if (vals.length === 0) return null;
        return Number((vals.reduce((acc, v) => acc + v, 0) / vals.length).toFixed(2));
      });

      const globalMedia = ratersWithMedia.length
        ? Number(
            (
              ratersWithMedia.reduce((acc, m) => acc + room.ratings[m.key].media, 0) /
              ratersWithMedia.length
            ).toFixed(2)
          )
        : null;

      room.media = {
        dims: mediaDims,
        general: mediaDims[6],
        media: globalMedia,
        ratersCount: ratersWithMedia.length,
        raterKeys: ratersWithMedia.map((m) => m.key),
        hasAnyScore: anyRaters.length > 0
      };

      allRooms.push(room);
    });

    visitedRooms.sort((a, b) => b.sortTimestamp - a.sortTimestamp || b.id - a.id);

    pendingRooms.sort(
      (a, b) =>
        a.provincia.localeCompare(b.provincia, "es") ||
        a.sala.localeCompare(b.sala, "es")
    );

    upcomingRooms.sort((a, b) => a.sortTimestamp - b.sortTimestamp);

    state.allRooms = allRooms;
    state.visitedRooms = visitedRooms;
    state.pendingRooms = pendingRooms;
    state.upcomingRooms = upcomingRooms;
    state.draftRooms = draftRooms;
    state.hasData = true;
  }

  /* ---------------------------------------------------------
     AUTENTICACIÓN OAUTH 2.0 Y VERIFICACIÓN DE PERMISOS EN SHEETS
     --------------------------------------------------------- */

  function setAuthMessage(htmlMsg, variant = "error") {
    const el = document.getElementById("auth-message");
    el.className = "auth-message";
    if (variant === "info") el.classList.add("auth-info");
    if (variant === "setup") el.classList.add("auth-setup");
    el.innerHTML = htmlMsg;
    el.hidden = false;
  }

  function clearAuthMessage() {
    const el = document.getElementById("auth-message");
    el.innerHTML = "";
    el.hidden = true;
  }

  function setLoginLoading(isLoading, labelText) {
    const btn = document.getElementById("oauth-login-btn");
    const lbl = document.getElementById("oauth-login-label");
    if (btn) btn.disabled = isLoading;
    if (lbl) lbl.textContent = labelText || (isLoading ? "Verificando acceso…" : "Iniciar sesión con Google");
  }

  function saveSession(userObj) {
    state.user = userObj;
    state.currentMember = resolveCurrentMember(userObj);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    } catch (_) {}
  }

  function clearSessionAndData() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem("escapes_oauth_session_v2");
      sessionStorage.removeItem("escapes_oauth_session_v1");
      localStorage.removeItem("escapes_live_sheet_v1");
    } catch (_) {}

    state.currentMember = null;
    state.hasData = false;
    state.needsMapRender = false;
    state.needsChartsRender = false;
    state.needsPersonalChartsRender = false;
    state.allRooms = [];
    state.visitedRooms = [];
    state.pendingRooms = [];
    state.upcomingRooms = [];
    state.draftRooms = [];
    state.memberSheetMeta = {};
    state.openRoomModalId = null;
    state.ratingRoomId = null;
    state.ratingReturnRoomId = null;

    Object.keys(state.charts).forEach((k) => {
      if (state.charts[k]) {
        state.charts[k].destroy();
        state.charts[k] = null;
      }
    });
    if (state.markerCluster) state.markerCluster.clearLayers();

    [
      "hero-kpis",
      "dashboard-podium",
      "dashboard-recent",
      "dashboard-team-summary",
      "dashboard-pulse",
      "personal-hero-copy",
      "personal-kpis",
      "personal-unmatched-card",
      "personal-tbody",
      "personal-pagination",
      "personal-top-list",
      "personal-affinities-list",
      "members-grid",
      "top10-grid",
      "visited-tbody",
      "visited-pagination",
      "upcoming-section-wrap",
      "pending-grid",
      "pending-province-chips",
      "geo-provinces-list",
      "geo-cities-list",
      "squads-list",
      "team-insights-list",
      "companies-list",
      "ratings-dist-list",
      "modal-body",
      "rating-modal-body"
    ].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = "";
    });

    ["nav-badge-visited", "nav-badge-pending", "nav-badge-map"].forEach((id) => {
      const badge = document.getElementById(id);
      if (badge) badge.textContent = "0";
    });
    const pBadge = document.getElementById("nav-badge-personal");
    if (pBadge) pBadge.textContent = "Personal";
  }

  function loadStoredSession() {
    try {
      localStorage.removeItem("escapes_live_sheet_v1");
      sessionStorage.removeItem("escapes_oauth_session_v2");
      sessionStorage.removeItem("escapes_oauth_session_v1");
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.accessToken && parsed.exp && parsed.exp * 1000 > Date.now()) {
        return parsed;
      }
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    return null;
  }

  async function handleOAuthTokenResponse(tokenResponse) {
    setLoginLoading(false);

    if (tokenResponse.error) {
      setAuthMessage(
        `No se completó la autorización con Google (<code>${escapeHtml(tokenResponse.error)}</code>).`
      );
      return;
    }

    if (
      window.google?.accounts?.oauth2?.hasGrantedAllScopes &&
      !window.google.accounts.oauth2.hasGrantedAllScopes(tokenResponse, SHEETS_SCOPE)
    ) {
      if (tokenResponse.access_token) {
        try {
          window.google.accounts.oauth2.revoke(tokenResponse.access_token, () => {});
        } catch (_) {}
      }
      setAuthMessage(
        `<strong>Permiso insuficiente:</strong> debes aceptar el permiso de Google Sheets para poder leer la hoja y guardar tus valoraciones personales.`
      );
      return;
    }

    const accessToken = tokenResponse.access_token;
    const expiresIn = Number(tokenResponse.expires_in || 3500);

    setLoginLoading(true, "Comprobando permisos en la hoja…");
    setAuthMessage("Verificando permisos de tu cuenta sobre la hoja de cálculo <strong>Escapes</strong>…", "info");

    let profile = {
      name: "Usuario Google",
      givenName: "",
      email: "",
      picture: ""
    };

    try {
      const uRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        profile = {
          name: uData.name || uData.email || profile.name,
          givenName: uData.given_name || "",
          email: uData.email || "",
          picture: uData.picture || ""
        };
      }
    } catch (_) {}

    const candidateUser = {
      ...profile,
      accessToken,
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };

    await verifyAndUnlockDashboard(candidateUser);
  }

  function handleOAuthError(err) {
    setLoginLoading(false);
    const type = err?.type || "popup_error";
    if (type === "popup_closed") return;
    setAuthMessage(
      `No se pudo abrir el inicio de sesión OAuth (<code>${escapeHtml(type)}</code>). Verifica que <code>${escapeHtml(
        window.location.origin
      )}</code> esté en los Orígenes de JavaScript autorizados del Client ID.`
    );
  }

  function requestGoogleLogin(promptMode = "select_account") {
    if (state.tokenClient) {
      clearAuthMessage();
      state.tokenClient.requestAccessToken({ prompt: promptMode });
    } else {
      setAuthMessage("Google Identity Services aún se está cargando. Espera un instante y vuelve a pulsar.");
    }
  }

  function initGoogleOAuth() {
    const existing = loadStoredSession();
    if (existing) {
      verifyAndUnlockDashboard(existing);
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        clearInterval(timer);

        state.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: OAUTH_SCOPES,
          callback: handleOAuthTokenResponse,
          error_callback: handleOAuthError
        });
      } else if (attempts > 40) {
        clearInterval(timer);
        setAuthMessage(
          "No se pudo cargar Google Identity Services. Revisa bloqueadores de anuncios o tu conexión."
        );
      }
    }, 200);
  }

  /* ---------------------------------------------------------
     LECTURA Y ESCRITURA DIRECTA EN GOOGLE SHEETS API V4
     --------------------------------------------------------- */

  async function fetchLiveGoogleSheet(accessToken) {
    const ranges = [DATOS_RANGE, ...CORE_MEMBERS.map((m) => `${m.sheet}!A1:J1000`)];
    const qs = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      let reason = "";
      try {
        const errJson = await res.json();
        detail = errJson?.error?.message || detail;
        const info = (errJson?.error?.details || []).find((d) => d.reason);
        reason = info?.reason || errJson?.error?.status || "";
      } catch (_) {}
      const error = new Error(detail);
      error.status = res.status;
      error.reason = reason;
      throw error;
    }

    const data = await res.json();
    const valueRanges = Array.isArray(data.valueRanges) ? data.valueRanges : [];
    const datosValues = valueRanges[0]?.values || [];
    const memberValuesByKey = {};

    CORE_MEMBERS.forEach((m, idx) => {
      memberValuesByKey[m.key] = valueRanges[idx + 1]?.values || [];
    });

    return {
      updatedAt: new Date().toISOString(),
      datosValues,
      memberValuesByKey
    };
  }

  async function putSheetValues(accessToken, range, rowsValues) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: rowsValues
      })
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        detail = errJson?.error?.message || detail;
      } catch (_) {}
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  async function savePersonalRoomRating(roomId, dimsArray) {
    const member = state.currentMember;
    const room = state.allRooms.find((r) => r.id === roomId);

    if (!state.user?.accessToken || !member) {
      throw new Error("Tu cuenta no está identificada como uno de los miembros del grupo.");
    }
    if (!room || !canMemberRateRoom(member, room)) {
      throw new Error("Solo quienes hayan visitado este escape pueden valorarlo.");
    }

    const cleanDims = DIMENSIONS.map((_, i) => {
      const v = dimsArray[i];
      if (v === null || v === undefined || v === "") return "";
      const num = Number(v);
      if (!Number.isFinite(num) || num < 0 || num > 5) {
        throw new Error(`El valor de «${DIMENSIONS[i]}» debe estar entre 0 y 5.`);
      }
      return Number(num.toFixed(2));
    });

    const existingRow = room.sheetRowByMember[member.key];

    if (existingRow && existingRow >= 2) {
      const formula = `=IF(COUNT(D${existingRow}:I${existingRow});ROUND(AVERAGE(D${existingRow}:I${existingRow});2);"")`;
      const range = `${member.sheet}!C${existingRow}:J${existingRow}`;
      await putSheetValues(state.user.accessToken, range, [[...cleanDims, formula]]);
    } else {
      const meta = state.memberSheetMeta[member.key] || { hasHeader: false, maxRowNumber: 0 };
      let targetRow = meta.maxRowNumber + 1;
      if (!meta.hasHeader || targetRow < 2) {
        await putSheetValues(state.user.accessToken, `${member.sheet}!A1:J1`, [MEMBER_SHEET_HEADERS]);
        targetRow = 2;
      }
      const formula = `=IF(COUNT(D${targetRow}:I${targetRow});ROUND(AVERAGE(D${targetRow}:I${targetRow});2);"")`;
      const range = `${member.sheet}!A${targetRow}:J${targetRow}`;
      await putSheetValues(state.user.accessToken, range, [
        [room.rawEmpresa, room.sala, ...cleanDims, formula]
      ]);
    }

    // Recargar en vivo desde Google Sheets para actualizar todas las estadísticas y medias
    const freshDataset = await fetchLiveGoogleSheet(state.user.accessToken);
    parseSheetDataset(freshDataset);
    updateUserHeader(freshDataset);
    renderAll();

    // Si estaba abierta la ficha de detalle de esa sala y no estamos en el modal de valoración, refrescarla también
    const roomModal = document.getElementById("room-modal");
    if (roomModal && !roomModal.hidden && state.openRoomModalId === roomId && !state.ratingRoomId) {
      openRoomModal(roomId);
    }
  }

  function updateUserHeader(dataSourceInfo) {
    const user = state.user || { name: "Usuario", email: "", picture: "" };
    const member = state.currentMember;
    const avatarEl = document.getElementById("user-avatar");
    const initialsEl = document.getElementById("user-initials");
    const nameEl = document.getElementById("user-name");

    nameEl.textContent = member ? `${user.name} · ${member.name}` : user.name;
    nameEl.title = user.email ? `${user.name} (${user.email})` : user.name;

    if (user.picture) {
      avatarEl.src = user.picture;
      avatarEl.hidden = false;
      initialsEl.hidden = true;
    } else {
      avatarEl.hidden = true;
      initialsEl.hidden = false;
      initialsEl.textContent = (member ? member.key : (user.name || "U").trim().charAt(0)).toUpperCase();
    }

    const badge = document.getElementById("data-source-badge");
    const footerInfo = document.getElementById("footer-sync-info");
    const timeText = dataSourceInfo?.updatedAt
      ? new Date(dataSourceInfo.updatedAt).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    badge.textContent = `● En vivo (${timeText})`;
    badge.style.color = "#34d399";
    const memberTxt = member ? ` · Miembro: ${member.name} (hoja ${member.sheet})` : "";
    footerInfo.textContent = `Acceso verificado (${user.email || user.name})${memberTxt}`;
  }

  async function verifyAndUnlockDashboard(candidateUser) {
    setLoginLoading(true, "Verificando permisos…");

    try {
      const dataset = await fetchLiveGoogleSheet(candidateUser.accessToken);

      saveSession(candidateUser);
      clearAuthMessage();
      setLoginLoading(false);

      document.getElementById("auth-gate").hidden = true;
      document.getElementById("app-shell").hidden = false;

      parseSheetDataset(dataset);
      updateUserHeader(dataset);

      const initialSection = resolveSectionFromHash();
      navigateToSection(initialSection, { updateHash: false, scrollTop: false });
      renderAll();
    } catch (err) {
      setLoginLoading(false);
      document.getElementById("app-shell").hidden = true;
      document.getElementById("auth-gate").hidden = false;

      const msg = String(err.message || "");
      const isApiDisabled =
        err.reason === "SERVICE_DISABLED" ||
        msg.includes("sheets.googleapis.com") ||
        msg.includes("has not been used in project");

      if (isApiDisabled) {
        state.user = candidateUser;
        setAuthMessage(
          `⚙️ <strong>Falta activar Google Sheets API en Google Cloud</strong><br>` +
            `Para poder comprobar los permisos de la hoja y leer los datos en tiempo real, activa la API en el proyecto <code>719597836416</code>:<br>` +
            `<a href="https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=719597836416" target="_blank" rel="noopener">Abrir Google Cloud Console y pulsar «Habilitar» ↗</a><br>` +
            `<button type="button" id="retry-sheet-btn" class="auth-inline-btn">🔄 Ya la he activado · Reintentar</button>`,
          "setup"
        );
        const retryBtn = document.getElementById("retry-sheet-btn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => verifyAndUnlockDashboard(candidateUser));
        }
        return;
      }

      if (err.status === 403 || err.status === 404) {
        if (candidateUser.accessToken && window.google?.accounts?.oauth2?.revoke) {
          try {
            window.google.accounts.oauth2.revoke(candidateUser.accessToken, () => {});
          } catch (_) {}
        }
        state.user = null;
        clearSessionAndData();

        const who = candidateUser.email || candidateUser.name || "esta cuenta";
        setAuthMessage(
          `🔒 <strong>Acceso denegado</strong><br>` +
            `La cuenta <strong>${escapeHtml(who)}</strong> no tiene permiso para ver la hoja de cálculo <strong>Escapes</strong>.<br>` +
            `Solo quienes tienen acceso compartido en Google Sheets pueden ver los datos.<br>` +
            `<button type="button" id="switch-account-btn" class="auth-inline-btn">Cambiar de cuenta de Google</button>`
        );
        const switchBtn = document.getElementById("switch-account-btn");
        if (switchBtn) {
          switchBtn.addEventListener("click", () => requestGoogleLogin("select_account"));
        }
        return;
      }

      if (err.status === 401) {
        state.user = null;
        clearSessionAndData();
        setAuthMessage("Tu sesión de Google ha caducado. Vuelve a iniciar sesión para acceder.", "info");
        return;
      }

      clearSessionAndData();
      setAuthMessage(`No se pudo verificar el acceso a la hoja de cálculo: ${escapeHtml(msg)}`);
    }
  }

  /* ---------------------------------------------------------
     RENDERIZADO GENERAL Y CONTADORES DEL MENÚ LATERAL
     --------------------------------------------------------- */

  function renderAll() {
    updateSidebarBadges();
    renderHeroKpis();
    renderDashboardSummary();
    renderPersonalSection();
    renderMembersCount();
    renderTeamSectionExtras();
    renderTop10();
    renderGeoBreakdown();
    populateVisitedFilters();
    renderVisitedTable();
    renderUpcomingSection();
    populatePendingFilters();
    renderPendingList();

    state.needsMapRender = true;
    state.needsChartsRender = true;
    state.needsPersonalChartsRender = true;
    refreshActiveSectionVisuals();
  }

  function updateSidebarBadges() {
    const uniqueCities = new Set(state.visitedRooms.map((r) => normalizeKey(r.ciudad))).size;
    document.getElementById("nav-badge-visited").textContent = String(state.visitedRooms.length);
    document.getElementById("nav-badge-pending").textContent = String(state.pendingRooms.length);
    document.getElementById("nav-badge-map").textContent = `${uniqueCities}`;
    document.getElementById("nav-badge-team").textContent = String(MEMBERS.length);

    const personalBadge = document.getElementById("nav-badge-personal");
    if (personalBadge) {
      if (state.currentMember) {
        const myRooms = state.visitedRooms.filter((r) =>
          r.deNosotros.includes(state.currentMember.key)
        );
        const unrated = myRooms.filter(
          (r) => !r.ratings[state.currentMember.key]?.hasAnyScore
        ).length;
        personalBadge.textContent = unrated > 0 ? `${state.currentMember.name} · ${unrated}` : state.currentMember.name;
      } else {
        personalBadge.textContent = "Personal";
      }
    }

    const quickStats = document.getElementById("sidebar-quick-stats");
    if (quickStats) {
      quickStats.textContent = `${state.visitedRooms.length} visitadas · ${state.pendingRooms.length} pendientes`;
    }
  }

  function renderTeamDotsHtml(deNosotros) {
    if (!deNosotros) return '<span class="date-unknown">—</span>';
    const order = ["S", "M", "R", "A", "J", "+"];
    return `<span class="team-dots">${order
      .filter((ch) => deNosotros.includes(ch))
      .map((ch) => {
        const cls = ch === "+" ? "dot-plus" : `dot-${ch}`;
        const memberName = MEMBERS.find((m) => m.key === ch)?.name || ch;
        return `<span class="team-dot ${cls}" title="${escapeHtml(memberName)}">${ch}</span>`;
      })
      .join("")}</span>`;
  }

  function filterVisitedByMemberAndOpen(memberKey) {
    state.visitedFilter.member = memberKey;
    state.visitedFilter.page = 1;
    const select = document.getElementById("visited-member-filter");
    if (select) select.value = memberKey;
    renderMembersCount();
    renderVisitedTable();
    navigateToSection("visitadas");
  }

  /* ---------------------------------------------------------
     SECCIÓN 1 (PRINCIPAL): DASHBOARD CON RESUMEN EJECUTIVO
     --------------------------------------------------------- */

  function renderHeroKpis() {
    const totalReg = state.allRooms.length;
    const totalVis = state.visitedRooms.length;
    const totalPend = state.pendingRooms.length;

    const rated = state.visitedRooms.filter((r) => r.media.media !== null);
    const globalAvg = rated.length
      ? rated.reduce((acc, r) => acc + r.media.media, 0) / rated.length
      : null;

    const exOk = state.visitedRooms.filter((r) => r.exito === "S").length;
    const exFail = state.visitedRooms.filter((r) => r.exito === "N").length;
    const successPct =
      exOk + exFail > 0 ? ((exOk / (exOk + exFail)) * 100).toFixed(1).replace(".", ",") : "—";

    const uniqueCities = new Set(state.visitedRooms.map((r) => normalizeKey(r.ciudad))).size;
    const uniqueProvs = new Set(state.visitedRooms.map((r) => normalizeKey(r.provincia))).size;

    const upcomingEl = document.getElementById("upcoming-pill");
    if (state.upcomingRooms.length > 0) {
      const next = state.upcomingRooms[0];
      upcomingEl.textContent = `📅 Próxima reserva: ${next.sala} (${next.ciudad}) · ${next.fechaDisplay}`;
      upcomingEl.hidden = false;
    } else {
      upcomingEl.hidden = true;
    }

    const extraNote = state.draftRooms.length
      ? `${totalVis} jugadas · ${totalPend} pendientes · ${state.upcomingRooms.length + state.draftRooms.length} en agenda`
      : `${totalVis} jugadas · ${totalPend} pendientes`;

    const kpisContainer = document.getElementById("hero-kpis");
    kpisContainer.innerHTML = `
      <button type="button" class="kpi-tile kpi-highlight" data-nav-target="estadisticas">
        <div class="kpi-head-row">
          <span class="kpi-label">Salas Registradas</span>
          <span class="kpi-arrow">→</span>
        </div>
        <div class="kpi-value">${totalReg}</div>
        <div class="kpi-sub">${escapeHtml(extraNote)}</div>
      </button>

      <button type="button" class="kpi-tile" data-nav-target="visitadas">
        <div class="kpi-head-row">
          <span class="kpi-label">Salas Visitadas</span>
          <span class="kpi-arrow">→</span>
        </div>
        <div class="kpi-value">${totalVis}</div>
        <div class="kpi-sub">Éxito registrado: <strong>${successPct}%</strong> (${exOk}/${exOk + exFail})</div>
      </button>

      <button type="button" class="kpi-tile" data-nav-target="ranking">
        <div class="kpi-head-row">
          <span class="kpi-label">Valoración Media</span>
          <span class="kpi-arrow">→</span>
        </div>
        <div class="kpi-value">${fmtScore(globalAvg)} <small style="font-size:0.52em;color:var(--gold)">/ 5</small></div>
        <div class="kpi-sub">${rated.length} salas valoradas por el grupo · Top 10</div>
      </button>

      <button type="button" class="kpi-tile" data-nav-target="mapa">
        <div class="kpi-head-row">
          <span class="kpi-label">Mapa Conquistado</span>
          <span class="kpi-arrow">→</span>
        </div>
        <div class="kpi-value">${uniqueCities} <small style="font-size:0.5em;color:var(--text-secondary)">ciudades</small></div>
        <div class="kpi-sub">${uniqueProvs} provincias / países</div>
      </button>
    `;

    kpisContainer.querySelectorAll("[data-nav-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigateToSection(btn.getAttribute("data-nav-target"));
      });
    });
  }

  function renderDashboardSummary() {
    // 1. Podio Top 3 (Media Global de todos los miembros que valoraron)
    const top3 = state.visitedRooms
      .filter((r) => r.media.media !== null)
      .slice()
      .sort(
        (a, b) =>
          (b.media.media ?? 0) - (a.media.media ?? 0) ||
          (b.media.general ?? 0) - (a.media.general ?? 0) ||
          a.id - b.id
      )
      .slice(0, 3);

    const podiumEl = document.getElementById("dashboard-podium");
    podiumEl.innerHTML = top3.length
      ? top3
          .map((r, idx) => {
            const medal = idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : "🥉 #3";
            const poster = getPosterUrl(r.sala);
            const thumbStyle = poster
              ? `background-image:url('${poster}')`
              : `background:${fallbackGradient(r.tematica)}`;

            return `
              <button type="button" class="dash-row" data-room-id="${r.id}">
                <div class="dash-podium-thumb" style="${thumbStyle}">
                  <span class="dash-medal-badge">${medal}</span>
                </div>
                <div class="dash-row-main">
                  <div class="dash-row-title">${escapeHtml(r.sala)}</div>
                  <div class="dash-row-sub">${escapeHtml(r.empresa)} · 📍 ${escapeHtml(r.ciudad)}</div>
                </div>
                <div class="dash-row-right">
                  <span class="score-pill">★ ${fmtScore(r.media.media)}</span>
                  <span class="dash-date-tag">${r.media.ratersCount} val. · ${escapeHtml(r.fechaDisplay)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">No hay salas valoradas todavía.</p>`;

    podiumEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => openRoomModal(Number(btn.getAttribute("data-room-id"))));
    });

    // 2. Actividad reciente (últimas 5 salas visitadas)
    const recent5 = state.visitedRooms.slice(0, 5);
    const recentEl = document.getElementById("dashboard-recent");
    recentEl.innerHTML = recent5.length
      ? recent5
          .map((r) => {
            const statusBadge =
              r.exito === "S"
                ? `<span class="status-ok">✓ Superada</span>`
                : r.exito === "N"
                ? `<span class="status-fail">✕ No superada</span>`
                : "";

            return `
              <button type="button" class="dash-row" data-room-id="${r.id}">
                <div class="dash-row-main">
                  <div class="dash-row-title">${escapeHtml(r.sala)}</div>
                  <div class="dash-row-sub">${escapeHtml(r.empresa)} · ${escapeHtml(r.ciudad)} (${escapeHtml(r.provincia)})</div>
                </div>
                <div class="dash-row-right">
                  ${
                    r.media.media !== null
                      ? `<span class="score-pill">★ ${fmtScore(r.media.media)}</span>`
                      : statusBadge
                  }
                  <span class="dash-date-tag">${escapeHtml(r.fechaDisplay)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">Sin salas visitadas registradas.</p>`;

    recentEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => openRoomModal(Number(btn.getAttribute("data-room-id"))));
    });

    // 3. Resumen compacto del equipo
    const totalVis = state.visitedRooms.length || 1;
    const teamSumEl = document.getElementById("dashboard-team-summary");
    teamSumEl.innerHTML = MEMBERS.map((m) => {
      const rooms = state.visitedRooms.filter((r) => r.deNosotros.includes(m.key));
      const count = rooms.length;
      const pct = Math.round((count / totalVis) * 100);
      const rated = rooms.filter((r) => r.media.media !== null);
      const avg = rated.length ? rated.reduce((s, r) => s + r.media.media, 0) / rated.length : null;

      return `
        <button type="button" class="dash-member-btn" data-dash-member="${m.key}">
          <div class="member-avatar-badge" style="background:${m.bg};color:${m.color}">${m.key}</div>
          <div class="dash-member-info">
            <div class="dash-member-top">
              <span class="dash-member-name">${escapeHtml(m.name)}</span>
              <span class="dash-member-num" style="color:${m.color}">${count}</span>
            </div>
            <div class="member-progress-track" style="margin-top:0.3rem">
              <div class="member-progress-bar" style="width:${Math.min(100, pct)}%;background:${m.color}"></div>
            </div>
            <div class="dash-member-sub">
              <span>${pct}% jugadas</span>
              <span>★ ${fmtScore(avg)}</span>
            </div>
          </div>
        </button>
      `;
    }).join("");

    teamSumEl.querySelectorAll("[data-dash-member]").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterVisitedByMemberAndOpen(btn.getAttribute("data-dash-member"));
      });
    });

    // 4. Hoja de ruta y pulso
    const byYear = {};
    state.visitedRooms.forEach((r) => {
      if (r.year && !r.undated) {
        byYear[r.year] = (byYear[r.year] || 0) + 1;
      }
    });
    const currentYear = new Date().getFullYear();
    const currentYearCount = byYear[currentYear] || 0;

    let peakYear = "—";
    let peakCount = 0;
    Object.entries(byYear).forEach(([y, cnt]) => {
      if (cnt > peakCount) {
        peakCount = cnt;
        peakYear = y;
      }
    });

    const compStats = {};
    state.visitedRooms.forEach((r) => {
      if (!r.empresa || r.empresa === "Sin empresa" || r.media.media === null) return;
      const key = normalizeKey(r.empresa);
      if (!compStats[key]) compStats[key] = { name: r.empresa, scores: [] };
      compStats[key].scores.push(r.media.media);
    });
    const bestComp = Object.values(compStats)
      .filter((c) => c.scores.length >= 2)
      .map((c) => ({
        name: c.name,
        avg: c.scores.reduce((s, v) => s + v, 0) / c.scores.length
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    const provCounts = {};
    let awardedCount = 0;
    state.pendingRooms.forEach((r) => {
      provCounts[r.provincia] = (provCounts[r.provincia] || 0) + 1;
      if (r.masInfo) awardedCount += 1;
    });
    const topPendingProvs = Object.entries(provCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .slice(0, 6);

    const upcomingBoxHtml = state.upcomingRooms.length
      ? `<div class="pulse-upcoming-box">
          <strong>📅 Próxima cita confirmada:</strong> ${escapeHtml(state.upcomingRooms[0].sala)} · ${escapeHtml(
          state.upcomingRooms[0].empresa
        )} (${escapeHtml(state.upcomingRooms[0].ciudad)}) el <strong>${escapeHtml(
          state.upcomingRooms[0].fechaDisplay
        )}</strong>
        </div>`
      : "";

    const pulseEl = document.getElementById("dashboard-pulse");
    pulseEl.innerHTML = `
      ${upcomingBoxHtml}

      <div class="pulse-mini-grid">
        <div class="pulse-stat-box">
          <div class="pulse-stat-label">En ${currentYear}</div>
          <div class="pulse-stat-val">${currentYearCount} salas</div>
          <div class="pulse-stat-hint">jugadas este año</div>
        </div>
        <div class="pulse-stat-box">
          <div class="pulse-stat-label">Año récord</div>
          <div class="pulse-stat-val">${peakYear}</div>
          <div class="pulse-stat-hint">${peakCount} salas superadas</div>
        </div>
        <div class="pulse-stat-box">
          <div class="pulse-stat-label">Sello referente</div>
          <div class="pulse-stat-val" title="${escapeHtml(bestComp?.name || "—")}">${escapeHtml(bestComp?.name || "—")}</div>
          <div class="pulse-stat-hint">${bestComp ? `★ ${fmtScore(bestComp.avg)} media` : "≥ 2 salas"}</div>
        </div>
      </div>

      <div class="pulse-provs-block">
        <div class="pulse-provs-title">
          🎯 Principales destinos pendientes ${awardedCount ? `· <span style="color:var(--gold-bright)">${awardedCount} con mención/premio</span>` : ""}
        </div>
        <div class="province-chips">
          ${topPendingProvs
            .map(
              ([prov, cnt]) =>
                `<button type="button" class="prov-chip" data-dash-prov="${escapeHtml(prov)}">${escapeHtml(
                  prov
                )} <b>${cnt}</b></button>`
            )
            .join("")}
        </div>
      </div>

      <div class="pulse-quick-links">
        <button type="button" class="btn-link-action" data-nav-target="personal">⭐ Valorar mis salas en Mi Espacio →</button>
        <button type="button" class="btn-link-action" data-nav-target="estadisticas">📊 Ver estadísticas avanzadas →</button>
      </div>
    `;

    pulseEl.querySelectorAll("[data-dash-prov]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prov = chip.getAttribute("data-dash-prov");
        state.pendingFilter.province = prov;
        populatePendingFilters();
        renderPendingList();
        navigateToSection("pendientes");
      });
    });

    pulseEl.querySelectorAll("[data-nav-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigateToSection(btn.getAttribute("data-nav-target"));
      });
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN PERSONAL: MI ESPACIO (ESTADÍSTICAS Y VALORACIÓN)
     --------------------------------------------------------- */

  function renderPersonalSection() {
    const member = state.currentMember;
    const heroCopy = document.getElementById("personal-hero-copy");
    const kpisEl = document.getElementById("personal-kpis");
    const unmatchedCard = document.getElementById("personal-unmatched-card");
    const memberContent = document.getElementById("personal-member-content");

    if (!member) {
      const displayName = state.user?.name || state.user?.email || "Usuario";
      heroCopy.innerHTML = `
        <div class="eyebrow">
          <span class="eyebrow-key">👤 ZONA PERSONAL</span>
        </div>
        <h2 id="heading-personal">Hola, <span class="text-gradient">${escapeHtml(displayName)}</span></h2>
        <p class="hero-lead">
          Las valoraciones personales están vinculadas al nombre de tu cuenta de Google con los integrantes del grupo (Sara, Miguel, Rafa/Rafael, Antonio y Joan).
        </p>
      `;
      kpisEl.innerHTML = "";
      unmatchedCard.hidden = false;
      memberContent.hidden = true;
      unmatchedCard.innerHTML = `
        <span class="section-kicker">CUENTA SIN PERFIL DE INTEGRANTE</span>
        <h4>No se ha encontrado hoja personal para «${escapeHtml(displayName)}»</h4>
        <p class="panel-sub" style="font-size:0.9rem;line-height:1.6">
          Solo los miembros registrados del equipo (<strong>Sara, Miguel, Rafa/Rafael, Antonio y Joan</strong>) pueden añadir valoraciones a las salas que hayan visitado. Puedes seguir consultando todas las estadísticas generales del grupo desde el menú lateral.
        </p>
      `;
      return;
    }

    unmatchedCard.hidden = true;
    memberContent.hidden = false;

    const myVisited = state.visitedRooms.filter((r) => r.deNosotros.includes(member.key));
    const myRated = myVisited.filter((r) => r.ratings[member.key]?.hasMedia);
    const myAnyRated = myVisited.filter((r) => r.ratings[member.key]?.hasAnyScore);
    const pendingRateCount = myVisited.length - myAnyRated.length;

    const myAvg = myRated.length
      ? myRated.reduce((acc, r) => acc + r.ratings[member.key].media, 0) / myRated.length
      : null;

    // Comparativa de exigencia/generosidad frente a la media del grupo en esas mismas salas
    const sharedComparison = myRated.filter((r) => r.media.media !== null && r.media.ratersCount >= 2);
    let diffText = "Media sobre 6 criterios (sin Dificultad)";
    if (sharedComparison.length > 0) {
      const delta =
        sharedComparison.reduce(
          (acc, r) => acc + (r.ratings[member.key].media - r.media.media),
          0
        ) / sharedComparison.length;
      const sign = delta > 0.01 ? "+" : "";
      diffText = `${sign}${fmtScore(delta)} frente a la media grupal (${sharedComparison.length} salas compartidas)`;
    }

    const exOk = myVisited.filter((r) => r.exito === "S").length;
    const exFail = myVisited.filter((r) => r.exito === "N").length;
    const winPct =
      exOk + exFail > 0 ? ((exOk / (exOk + exFail)) * 100).toFixed(1).replace(".", ",") : "—";

    const topMyRoom = myRated
      .slice()
      .sort(
        (a, b) =>
          (b.ratings[member.key].media ?? 0) - (a.ratings[member.key].media ?? 0) ||
          (b.ratings[member.key].general ?? 0) - (a.ratings[member.key].general ?? 0) ||
          a.id - b.id
      )[0];

    const attendancePct = state.visitedRooms.length
      ? Math.round((myVisited.length / state.visitedRooms.length) * 100)
      : 0;

    heroCopy.innerHTML = `
      <div class="eyebrow">
        <span class="personal-identity-pill" style="background:${member.bg};color:${member.color};border-color:${member.color}55">
          <span>${member.key}</span> · PERFIL PERSONAL DE ${escapeHtml(member.name.toUpperCase())}
        </span>
        <span class="subtle-badge">📄 Hoja Google Sheets: <strong>${escapeHtml(member.sheet)}</strong></span>
      </div>
      <h2 id="heading-personal">Espacio de <span class="text-gradient">${escapeHtml(member.name)}</span></h2>
      <p class="hero-lead">
        Consulta tus estadísticas individuales y puntúa únicamente las salas que has visitado. La nota media excluye automáticamente <strong>Dificultad</strong> y se guarda en directo en tu hoja <code>${escapeHtml(member.sheet)}</code>.
      </p>
    `;

    kpisEl.innerHTML = `
      <button type="button" class="kpi-tile" data-personal-jump="rooms-all">
        <div class="kpi-head-row">
          <span class="kpi-label">Mis Salas Visitadas</span>
          <span class="kpi-arrow">↓</span>
        </div>
        <div class="kpi-value" style="color:${member.color}">${myVisited.length}</div>
        <div class="kpi-sub">${attendancePct}% del total del grupo · Éxito: <strong>${winPct}%</strong></div>
      </button>

      <button type="button" class="kpi-tile kpi-highlight" data-personal-jump="rooms-unrated">
        <div class="kpi-head-row">
          <span class="kpi-label">Mis Valoraciones</span>
          <span class="kpi-arrow">✍️</span>
        </div>
        <div class="kpi-value">${myAnyRated.length} <small style="font-size:0.52em;color:var(--text-secondary)">/ ${myVisited.length}</small></div>
        <div class="kpi-sub">${
          pendingRateCount > 0
            ? `<strong style="color:var(--gold-bright)">${pendingRateCount} pendientes de valorar</strong> · Filtrar`
            : `<strong style="color:#6ee7b7">¡Todas tus salas están valoradas!</strong>`
        }</div>
      </button>

      <button type="button" class="kpi-tile" data-personal-jump="stats">
        <div class="kpi-head-row">
          <span class="kpi-label">Mi Nota Media</span>
          <span class="kpi-arrow">↓</span>
        </div>
        <div class="kpi-value">${fmtScore(myAvg)} <small style="font-size:0.52em;color:var(--gold)">/ 5</small></div>
        <div class="kpi-sub">${escapeHtml(diffText)}</div>
      </button>

      <button type="button" class="kpi-tile" data-personal-top-room="${topMyRoom ? topMyRoom.id : ""}">
        <div class="kpi-head-row">
          <span class="kpi-label">Mi Favorita (#1)</span>
          <span class="kpi-arrow">★</span>
        </div>
        <div class="kpi-value" style="font-size:1.22rem;line-height:1.25;margin-top:0.4rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${
          topMyRoom ? escapeHtml(topMyRoom.sala) : "Sin valorar aún"
        }</div>
        <div class="kpi-sub">${
          topMyRoom
            ? `★ ${fmtScore(topMyRoom.ratings[member.key].media)} · ${escapeHtml(topMyRoom.empresa)}`
            : "Puntúa tus salas abajo para generar tu ranking"
        }</div>
      </button>
    `;

    kpisEl.querySelectorAll("[data-personal-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-personal-jump");
        if (target === "rooms-unrated") {
          setPersonalStatusFilter("UNRATED");
          document.getElementById("personal-rooms-anchor")?.scrollIntoView({ behavior: "smooth" });
        } else if (target === "rooms-all") {
          setPersonalStatusFilter("ALL");
          document.getElementById("personal-rooms-anchor")?.scrollIntoView({ behavior: "smooth" });
        } else if (target === "stats") {
          document.getElementById("personal-stats-anchor")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    const favBtn = kpisEl.querySelector("[data-personal-top-room]");
    if (favBtn && topMyRoom) {
      favBtn.addEventListener("click", () => openRoomModal(topMyRoom.id));
    }

    populatePersonalFilters(myVisited);
    renderPersonalRoomsTable(myVisited);
    renderPersonalTopAndAffinities(myVisited, myRated);
  }

  function setPersonalStatusFilter(statusVal) {
    state.personalFilter.status = statusVal;
    state.personalFilter.page = 1;
    document.querySelectorAll("[data-personal-status]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-personal-status") === statusVal);
    });
    if (state.currentMember) {
      const myVisited = state.visitedRooms.filter((r) =>
        r.deNosotros.includes(state.currentMember.key)
      );
      renderPersonalRoomsTable(myVisited);
    }
  }

  function populatePersonalFilters(myVisited) {
    const yearSelect = document.getElementById("personal-year-filter");
    if (!yearSelect) return;
    const currentVal = state.personalFilter.year;

    const years = Array.from(new Set(myVisited.filter((r) => r.year).map((r) => r.year))).sort(
      (a, b) => b - a
    );
    const hasUndated = myVisited.some((r) => r.undated);

    yearSelect.innerHTML =
      `<option value="ALL">Todos los años</option>` +
      years.map((y) => `<option value="${y}">${y}</option>`).join("") +
      (hasUndated ? `<option value="UNDATED">Sin fecha exacta</option>` : "");

    yearSelect.value =
      currentVal === "ALL" ||
      (currentVal === "UNDATED" && hasUndated) ||
      years.includes(Number(currentVal))
        ? currentVal
        : "ALL";
    state.personalFilter.year = yearSelect.value;
  }

  function renderPersonalRoomsTable(myVisited) {
    const member = state.currentMember;
    if (!member) return;

    const list =
      myVisited || state.visitedRooms.filter((r) => r.deNosotros.includes(member.key));
    const { status, search, year, pageSize } = state.personalFilter;
    const q = normalizeKey(search);

    const unratedTotal = list.filter((r) => !r.ratings[member.key]?.hasAnyScore).length;
    const ratedTotal = list.length - unratedTotal;

    document.querySelectorAll("[data-personal-status]").forEach((btn) => {
      const st = btn.getAttribute("data-personal-status");
      if (st === "ALL") btn.textContent = `Todas (${list.length})`;
      if (st === "UNRATED") btn.textContent = `Pendientes (${unratedTotal})`;
      if (st === "RATED") btn.textContent = `Valoradas (${ratedTotal})`;
    });

    const filtered = list.filter((r) => {
      const hasScore = Boolean(r.ratings[member.key]?.hasAnyScore);
      if (status === "UNRATED" && hasScore) return false;
      if (status === "RATED" && !hasScore) return false;
      if (year === "UNDATED" && !r.undated) return false;
      if (year !== "ALL" && year !== "UNDATED" && String(r.year) !== year) return false;
      if (q) {
        const hay = normalizeKey(`${r.sala} ${r.empresa} ${r.ciudad} ${r.provincia} ${r.tematica}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById("personal-rooms-count-pill").textContent = String(filtered.length);
    const hasFilter = status !== "ALL" || Boolean(q) || year !== "ALL";
    document.getElementById("personal-reset-btn").hidden = !hasFilter;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (state.personalFilter.page > totalPages) state.personalFilter.page = totalPages;
    const page = state.personalFilter.page;

    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    const tbody = document.getElementById("personal-tbody");
    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No hay salas visitadas por ti que coincidan con este filtro.</td></tr>`;
    } else {
      tbody.innerHTML = slice
        .map((r) => {
          const myR = r.ratings[member.key];
          const myScoreHtml =
            myR?.media !== null
              ? `<span class="score-pill" style="border-color:${member.color}66;color:${member.color};background:${member.bg}">★ ${fmtScore(
                  myR.media
                )}</span>`
              : myR?.hasAnyScore
              ? `<span class="unrated-pill">Solo Dif: ${fmtScore(myR.dims[0])}</span>`
              : `<span class="unrated-pill">Sin valorar</span>`;

          const grpScoreHtml =
            r.media.media !== null
              ? `<span class="score-pill">★ ${fmtScore(r.media.media)}</span><span class="raters-sub">${
                  r.media.ratersCount
                } val.</span>`
              : `<span class="date-unknown">—</span>`;

          const actionBtn = myR?.hasAnyScore
            ? `<button type="button" class="btn-rate-room" data-rate-room-id="${r.id}">✏️ Editar</button>`
            : `<button type="button" class="btn-rate-room is-unrated" data-rate-room-id="${r.id}">✍️ Valorar</button>`;

          const cat = resolveRoomCatalog(r);
          const imgSrc = cat?.image || "assets/hero-bg.jpg";

          return `
            <tr data-room-id="${r.id}">
              <td class="date-cell ${r.undated ? "date-unknown" : ""}">${escapeHtml(r.fechaDisplay)}</td>
              <td>
                <div class="table-room-cell">
                  <img src="${imgSrc}" class="table-room-thumb" alt="" loading="lazy">
                  <div class="table-room-info">
                    <div class="table-room-title">
                      <span>${escapeHtml(r.sala)}</span>
                      ${cat?.url ? `<a href="${cat.url}" target="_blank" rel="noopener noreferrer" class="table-room-link" onclick="event.stopPropagation()" title="Web oficial">↗</a>` : ""}
                    </div>
                    <div class="room-sub-company">${escapeHtml(r.empresa)} · <span class="theme-tag ${themeClass(
            r.tematica
          )}" style="padding:0.1rem 0.4rem;font-size:0.68rem">${escapeHtml(r.tematica)}</span></div>
                  </div>
                </div>
              </td>
              <td>${escapeHtml(r.ciudad)} <span class="room-sub-company">(${escapeHtml(r.provincia)})</span></td>
              <td>${renderTeamDotsHtml(r.deNosotros)}</td>
              <td class="col-num">${grpScoreHtml}</td>
              <td class="col-num">${myScoreHtml}</td>
              <td class="col-num">${actionBtn}</td>
            </tr>
          `;
        })
        .join("");

      tbody.querySelectorAll("button[data-rate-room-id]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openRatingModal(Number(btn.getAttribute("data-rate-room-id")));
        });
      });

      tbody.querySelectorAll("tr[data-room-id]").forEach((tr) => {
        tr.addEventListener("click", () => openRoomModal(Number(tr.getAttribute("data-room-id"))));
      });
    }

    const pagBar = document.getElementById("personal-pagination");
    const fromNum = filtered.length === 0 ? 0 : start + 1;
    const toNum = Math.min(start + pageSize, filtered.length);

    const pageBtns = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
        pageBtns.push(
          `<button type="button" class="page-btn ${p === page ? "active" : ""}" data-p-page="${p}">${p}</button>`
        );
      } else if (
        pageBtns[pageBtns.length - 1] !== `<span style="color:var(--text-muted);padding:0 4px">…</span>`
      ) {
        pageBtns.push(`<span style="color:var(--text-muted);padding:0 4px">…</span>`);
      }
    }

    pagBar.innerHTML = `
      <div class="page-info">Mostrando <strong>${fromNum}–${toNum}</strong> de <strong>${filtered.length}</strong> salas jugadas por ${escapeHtml(
      member.name
    )}</div>
      <div class="page-controls">
        <button type="button" class="page-btn" data-p-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>‹ Ant.</button>
        ${pageBtns.join("")}
        <button type="button" class="page-btn" data-p-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>Sig. ›</button>
      </div>
    `;

    pagBar.querySelectorAll("button[data-p-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = Number(btn.getAttribute("data-p-page"));
        if (target >= 1 && target <= totalPages) {
          state.personalFilter.page = target;
          renderPersonalRoomsTable();
        }
      });
    });
  }

  function renderPersonalTopAndAffinities(myVisited, myRated) {
    const member = state.currentMember;
    if (!member) return;

    // 1. Top 5 Personal
    const top5 = myRated
      .slice()
      .sort(
        (a, b) =>
          (b.ratings[member.key].media ?? 0) - (a.ratings[member.key].media ?? 0) ||
          (b.ratings[member.key].general ?? 0) - (a.ratings[member.key].general ?? 0) ||
          a.id - b.id
      )
      .slice(0, 5);

    const topEl = document.getElementById("personal-top-list");
    topEl.innerHTML = top5.length
      ? top5
          .map((r, idx) => {
            const medal = idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`;
            const poster = getPosterUrl(r.sala);
            const thumbStyle = poster
              ? `background-image:url('${poster}')`
              : `background:${fallbackGradient(r.tematica)}`;

            return `
              <button type="button" class="dash-row" data-room-id="${r.id}">
                <div class="dash-podium-thumb" style="${thumbStyle}">
                  <span class="dash-medal-badge">${medal}</span>
                </div>
                <div class="dash-row-main">
                  <div class="dash-row-title">${escapeHtml(r.sala)}</div>
                  <div class="dash-row-sub">${escapeHtml(r.empresa)} · 📍 ${escapeHtml(r.ciudad)}</div>
                </div>
                <div class="dash-row-right">
                  <span class="score-pill" style="border-color:${member.color}66;color:${member.color};background:${member.bg}">Mi nota: ★ ${fmtScore(
              r.ratings[member.key].media
            )}</span>
                  <span class="dash-date-tag">Grupo: ★ ${fmtScore(r.media.media)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">Aún no has valorado ninguna sala. Usa el botón <strong>✍️ Valorar</strong> en tu tabla superior para estrenar tu ranking personal.</p>`;

    topEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => openRoomModal(Number(btn.getAttribute("data-room-id"))));
    });

    // 2. Compañeros más frecuentes y temáticas favoritas del miembro
    const companionCounts = {};
    MEMBERS.forEach((other) => {
      if (other.key === member.key) return;
      const cnt = myVisited.filter((r) => r.deNosotros.includes(other.key)).length;
      if (cnt > 0) companionCounts[other.key] = { member: other, count: cnt };
    });
    const topCompanions = Object.values(companionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const themeStats = {};
    myVisited.forEach((r) => {
      if (!r.tematica || r.tematica === "Sin especificar") return;
      if (!themeStats[r.tematica]) themeStats[r.tematica] = { count: 0, myScores: [] };
      themeStats[r.tematica].count += 1;
      const sc = r.ratings[member.key]?.media;
      if (sc !== null && sc !== undefined) themeStats[r.tematica].myScores.push(sc);
    });
    const topThemes = Object.entries(themeStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4);

    const maxComp = myVisited.length || 1;
    const maxTheme = topThemes[0]?.[1]?.count || 1;

    const affEl = document.getElementById("personal-affinities-list");
    affEl.innerHTML = `
      <div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--gold);text-transform:uppercase">🤝 Compañeros inseparables</div>
      ${
        topCompanions.length
          ? topCompanions
              .map(({ member: c, count }) => {
                const pct = Math.round((count / maxComp) * 100);
                return `
                  <div class="stat-bar-row">
                    <div class="stat-bar-head">
                      <span><span class="team-dot ${c.key === "+" ? "dot-plus" : `dot-${c.key}`}" style="margin-right:6px">${
                  c.key
                }</span><strong>${escapeHtml(c.name)}</strong></span>
                      <span style="font-family:var(--font-mono);font-size:0.8rem">${count} salas juntos (${pct}%)</span>
                    </div>
                    <div class="stat-bar-track">
                      <div class="stat-bar-fill" style="width:${pct}%;background:${c.color}"></div>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `<span class="panel-sub">Sin compañeros registrados.</span>`
      }
      <div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--cyan);text-transform:uppercase;margin-top:0.5rem">🎭 Mis temáticas más jugadas</div>
      ${topThemes
        .map(([tName, info]) => {
          const avg = info.myScores.length
            ? info.myScores.reduce((s, v) => s + v, 0) / info.myScores.length
            : null;
          return `
            <div class="stat-bar-row">
              <div class="stat-bar-head">
                <span><strong>${escapeHtml(tName)}</strong> <span style="color:var(--text-secondary);font-size:0.78rem">(${
            info.count
          } salas)</span></span>
                <span class="score-pill">${avg !== null ? `Mi media: ★ ${fmtScore(avg)}` : `${info.count} jugadas`}</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width:${Math.round((info.count / maxTheme) * 100)}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    `;
  }

  function renderPersonalCharts() {
    const member = state.currentMember;
    if (!member) return;

    const myVisited = state.visitedRooms.filter((r) => r.deNosotros.includes(member.key));

    // 1. Radar Personal vs Media del Grupo en mis salas
    const myDimAvgs = DIMENSIONS.map((_, i) => {
      const vals = myVisited.map((r) => r.ratings[member.key]?.dims[i] ?? null).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });

    const grpDimAvgsOnMyRooms = DIMENSIONS.map((_, i) => {
      const vals = myVisited.map((r) => r.media.dims[i]).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });

    const pRadarCanvas = document.getElementById("personalRadarChart");
    if (pRadarCanvas) {
      if (state.charts.personalRadar) state.charts.personalRadar.destroy();
      const nonZeroVals = [...myDimAvgs, ...grpDimAvgsOnMyRooms].filter((v) => v > 0);
      const minScale = nonZeroVals.length ? Math.max(0, Math.floor(Math.min(...nonZeroVals) - 0.5)) : 1;

      state.charts.personalRadar = new Chart(pRadarCanvas.getContext("2d"), {
        type: "radar",
        data: {
          labels: DIMENSIONS,
          datasets: [
            {
              label: `Mis notas (${member.name})`,
              data: myDimAvgs,
              borderColor: member.color,
              backgroundColor: member.bg,
              borderWidth: 2.3,
              pointRadius: 3.5
            },
            {
              label: "Media Grupo (en mis salas)",
              data: grpDimAvgsOnMyRooms,
              borderColor: "#f5b038",
              backgroundColor: "rgba(245, 176, 56, 0.14)",
              borderWidth: 2,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: minScale,
              max: 5,
              ticks: { stepSize: 0.5, color: "#64748b", backdropColor: "transparent" },
              grid: { color: "rgba(148,163,184,0.14)" },
              angleLines: { color: "rgba(148,163,184,0.14)" },
              pointLabels: { color: "#e2e8f0", font: { size: 11, weight: "600" } }
            }
          },
          plugins: {
            legend: { labels: { color: "#cbd5e1", boxWidth: 12 } }
          }
        }
      });
    }

    // 2. Evolución anual personal
    const byYear = {};
    myVisited.forEach((r) => {
      if (r.undated || !r.year) return;
      if (!byYear[r.year]) byYear[r.year] = { count: 0, myScores: [] };
      byYear[r.year].count += 1;
      const mySc = r.ratings[member.key]?.media;
      if (mySc !== null && mySc !== undefined) byYear[r.year].myScores.push(mySc);
    });

    const years = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);
    if (years.length >= 2) {
      for (let y = years[0]; y <= years[years.length - 1]; y++) {
        if (!byYear[y]) byYear[y] = { count: 0, myScores: [] };
      }
    }
    const sortedYears = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);
    const counts = sortedYears.map((y) => byYear[y].count);
    const avgs = sortedYears.map((y) => {
      const arr = byYear[y].myScores;
      return arr.length ? Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : null;
    });

    const pYearCanvas = document.getElementById("personalYearChart");
    if (pYearCanvas) {
      if (state.charts.personalYear) state.charts.personalYear.destroy();
      state.charts.personalYear = new Chart(pYearCanvas.getContext("2d"), {
        type: "bar",
        data: {
          labels: sortedYears.map(String),
          datasets: [
            {
              type: "bar",
              label: `Salas jugadas por ${member.name}`,
              data: counts,
              backgroundColor: member.color + "b3",
              borderRadius: 7,
              maxBarThickness: 38,
              yAxisID: "y"
            },
            {
              type: "line",
              label: "Mi nota media",
              data: avgs,
              borderColor: "#ffd166",
              backgroundColor: "#ffd166",
              borderWidth: 2.3,
              pointRadius: 4,
              tension: 0.3,
              spanGaps: true,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#cbd5e1", boxWidth: 12 } }
          },
          scales: {
            x: {
              ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono', monospace" } },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              suggestedMax: Math.max(...counts, 4) + 2,
              ticks: { color: "#94a3b8", precision: 0 },
              grid: { color: "rgba(148,163,184,0.1)" }
            },
            y1: {
              position: "right",
              min: 1,
              max: 5,
              ticks: { color: "#ffd166" },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    }
  }

  /* ---------------------------------------------------------
     MODAL INTERACTIVO DE VALORACIÓN PERSONAL
     --------------------------------------------------------- */

  function openRatingModal(roomId) {
    const member = state.currentMember;
    const room = state.allRooms.find((r) => r.id === roomId);
    if (!member || !room || !canMemberRateRoom(member, room)) return;

    state.ratingRoomId = roomId;
    state.ratingReturnRoomId = state.openRoomModalId === roomId ? roomId : null;

    const roomModal = document.getElementById("room-modal");
    if (roomModal) roomModal.hidden = true;
    const existing = room.ratings[member.key] || { dims: DIMENSIONS.map(() => null), hasAnyScore: false };
    const draftDims = existing.dims.map((v) => (v !== null && Number.isFinite(v) ? v : null));

    const modal = document.getElementById("rating-modal");
    const body = document.getElementById("rating-modal-body");

    const dimsHtml = DIMENSIONS.map((dim, idx) => {
      const isDifficulty = idx === 0;
      const curVal = draftDims[idx];
      const inputStr = curVal !== null ? String(curVal).replace(".", ",") : "";

      const chipsHtml = QUICK_SCORES.map((sc) => {
        const isActive = curVal !== null && Math.abs(curVal - sc) < 0.001 ? "active" : "";
        return `<button type="button" class="rating-chip ${isActive}" data-dim-idx="${idx}" data-chip-val="${sc}">${String(
          sc
        ).replace(".", ",")}</button>`;
      }).join("");

      return `
        <div class="rating-dim-row ${isDifficulty ? "is-excluded" : ""}" data-dim-row="${idx}">
          <div class="rating-dim-head">
            <span class="rating-dim-label">
              ${escapeHtml(dim)}
              ${
                isDifficulty
                  ? `<span class="dim-note-badge">No se incluye en la media</span>`
                  : `<span class="dim-note-badge" style="color:var(--gold-bright)">Cuenta en media</span>`
              }
            </span>
          </div>
          <div class="rating-controls-row">
            <div class="rating-chips">
              ${chipsHtml}
            </div>
            <div class="rating-input-group">
              <input
                type="text"
                inputmode="decimal"
                class="rating-num-input"
                data-dim-input="${idx}"
                placeholder="0–5"
                value="${escapeHtml(inputStr)}"
                aria-label="Nota de ${escapeHtml(dim)}"
              />
              <button type="button" class="rating-clear-btn" data-dim-clear="${idx}" title="Dejar sin valorar">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    body.innerHTML = `
      <span class="section-kicker" style="color:${member.color}">VALORACIÓN DE ${escapeHtml(
      member.name.toUpperCase()
    )} · HOJA «${escapeHtml(member.sheet)}»</span>
      <h3 id="rating-modal-title" style="font-size:1.45rem;margin-bottom:0.25rem">${escapeHtml(room.sala)}</h3>
      <div style="font-size:0.84rem;color:var(--text-secondary)">
        ${escapeHtml(room.empresa)} · 📍 ${escapeHtml(room.ciudad)} (${escapeHtml(room.provincia)}) · 🗓️ ${escapeHtml(
      room.fechaDisplay
    )}
      </div>

      <div class="rating-live-summary">
        <div>
          <div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--gold-bright);text-transform:uppercase">Tu media calculada</div>
          <div style="font-size:0.78rem;color:var(--text-secondary)">Promedio de los 6 criterios (excluyendo Dificultad)</div>
        </div>
        <div id="rating-live-score" class="rating-live-score">★ —</div>
      </div>

      <form id="personal-rating-form" novalidate>
        <div class="rating-dims-list">
          ${dimsHtml}
        </div>

        <div id="rating-form-error" class="rating-form-msg" hidden></div>

        <div class="rating-modal-actions">
          ${
            existing.hasAnyScore
              ? `<button type="button" id="rating-delete-btn" class="btn-danger-ghost">🗑️ Borrar mi valoración</button>`
              : `<span></span>`
          }
          <div class="rating-modal-actions-right">
            <button type="button" id="rating-cancel-btn" class="btn-logout">Cancelar</button>
            <button type="submit" id="rating-save-btn" class="btn-primary-gold">💾 Guardar en Google Sheets</button>
          </div>
        </div>
      </form>
    `;

    function readDraftFromInputs() {
      return DIMENSIONS.map((_, idx) => {
        const inp = body.querySelector(`input[data-dim-input="${idx}"]`);
        return parseScore(inp ? inp.value : "");
      });
    }

    function syncRowUi(idx) {
      const inp = body.querySelector(`input[data-dim-input="${idx}"]`);
      const val = parseScore(inp ? inp.value : "");
      body.querySelectorAll(`.rating-chip[data-dim-idx="${idx}"]`).forEach((chip) => {
        const cVal = Number(chip.getAttribute("data-chip-val"));
        chip.classList.toggle("active", val !== null && Math.abs(val - cVal) < 0.001);
      });
      updateLiveMedia();
    }

    function updateLiveMedia() {
      const currentDims = readDraftFromInputs();
      const media = computeMediaExcludingDifficulty(currentDims);
      const liveEl = document.getElementById("rating-live-score");
      if (liveEl) {
        liveEl.textContent = media !== null ? `★ ${fmtScore(media)}` : "★ —";
      }
    }

    body.querySelectorAll(".rating-chip[data-dim-idx]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const idx = Number(chip.getAttribute("data-dim-idx"));
        const val = chip.getAttribute("data-chip-val").replace(".", ",");
        const inp = body.querySelector(`input[data-dim-input="${idx}"]`);
        if (inp) inp.value = val;
        syncRowUi(idx);
      });
    });

    body.querySelectorAll("input[data-dim-input]").forEach((inp) => {
      inp.addEventListener("input", () => {
        syncRowUi(Number(inp.getAttribute("data-dim-input")));
      });
    });

    body.querySelectorAll("button[data-dim-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-dim-clear"));
        const inp = body.querySelector(`input[data-dim-input="${idx}"]`);
        if (inp) inp.value = "";
        syncRowUi(idx);
      });
    });

    document.getElementById("rating-cancel-btn")?.addEventListener("click", closeRatingModal);

    const errBox = document.getElementById("rating-form-error");
    const saveBtn = document.getElementById("rating-save-btn");
    const delBtn = document.getElementById("rating-delete-btn");

    async function executeSave(dimsToWrite, isDelete = false) {
      if (state.isSavingRating) return;
      state.isSavingRating = true;
      errBox.hidden = true;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = isDelete ? "Borrando…" : "Guardando en Sheet…";
      }
      if (delBtn) delBtn.disabled = true;

      try {
        await savePersonalRoomRating(room.id, dimsToWrite);
        state.isSavingRating = false;
        closeRatingModal(true);
        openRoomModal(room.id);
        showSyncBanner(
          isDelete
            ? `🗑️ Valoración eliminada de la hoja <strong>${escapeHtml(member.sheet)}</strong> para «${escapeHtml(
                room.sala
              )}».`
            : `✓ Valoración de <strong>${escapeHtml(room.sala)}</strong> guardada en tu hoja <strong>${escapeHtml(
                member.sheet
              )}</strong> y estadísticas actualizadas.`,
          "success"
        );
      } catch (err) {
        let friendly = err.message || "Error al guardar en Google Sheets.";
        if (err.status === 403) {
          friendly =
            "Tu cuenta tiene acceso de solo lectura en la hoja «Escapes» o falta permiso de escritura. Asegúrate de tener rol de Editor en Google Sheets.";
        } else if (err.status === 401) {
          friendly = "Tu sesión OAuth ha caducado. Pulsa «Salir» y vuelve a iniciar sesión con Google.";
        }
        errBox.textContent = friendly;
        errBox.hidden = false;
      } finally {
        state.isSavingRating = false;
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "💾 Guardar en Google Sheets";
        }
        if (delBtn) delBtn.disabled = false;
      }
    }

    document.getElementById("personal-rating-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      errBox.hidden = true;

      const rawStrings = DIMENSIONS.map((_, idx) => {
        const inp = body.querySelector(`input[data-dim-input="${idx}"]`);
        return inp ? inp.value.trim() : "";
      });

      const parsedDims = [];
      for (let i = 0; i < DIMENSIONS.length; i++) {
        if (!rawStrings[i]) {
          parsedDims.push(null);
          continue;
        }
        const n = parseScore(rawStrings[i]);
        if (n === null || n < 0 || n > 5) {
          errBox.textContent = `Revisa «${DIMENSIONS[i]}»: introduce un número entre 0 y 5 (ej. 4 o 4,5).`;
          errBox.hidden = false;
          return;
        }
        parsedDims.push(n);
      }

      if (parsedDims.every((v) => v === null)) {
        errBox.textContent =
          "Introduce al menos una puntuación entre 0 y 5 antes de guardar (o usa «Borrar mi valoración»).";
        errBox.hidden = false;
        return;
      }

      await executeSave(parsedDims, false);
    });

    if (delBtn) {
      delBtn.addEventListener("click", async () => {
        if (!window.confirm(`¿Seguro que quieres borrar tu valoración de «${room.sala}»?`)) return;
        await executeSave(
          DIMENSIONS.map(() => null),
          true
        );
      });
    }

    updateLiveMedia();
    modal.hidden = false;
  }

  function closeRatingModal(force = false) {
    if (state.isSavingRating && !force) return;
    const modal = document.getElementById("rating-modal");
    if (modal) modal.hidden = true;
    state.ratingRoomId = null;

    if (!force && state.ratingReturnRoomId) {
      const returnId = state.ratingReturnRoomId;
      state.ratingReturnRoomId = null;
      openRoomModal(returnId);
    } else {
      state.ratingReturnRoomId = null;
    }
  }

  /* ---------------------------------------------------------
     SECCIÓN EQUIPO: TARJETAS DE MIEMBROS Y ALINEACIONES
     --------------------------------------------------------- */

  function renderMembersCount() {
    const totalVis = state.visitedRooms.length || 1;
    const totalReg = state.allRooms.length;
    const activeMember = state.visitedFilter.member;

    const totalCardHtml = `
      <div class="member-card member-card-total">
        <div class="member-top">
          <div class="member-avatar-badge" style="background:rgba(245,176,56,0.22);color:var(--gold-bright)">🗝️</div>
          <span class="member-pct">${state.pendingRooms.length} pendientes</span>
        </div>
        <div class="member-count">${totalReg}</div>
        <div class="member-name-label">Total registradas</div>
        <div class="member-progress-track">
          <div class="member-progress-bar" style="width:${Math.round(
            (state.visitedRooms.length / Math.max(totalReg, 1)) * 100
          )}%;background:var(--gold)"></div>
        </div>
        <div class="member-meta">
          <span>Completadas: <strong>${state.visitedRooms.length}</strong></span>
          <span>${Math.round((state.visitedRooms.length / Math.max(totalReg, 1)) * 100)}% del total</span>
        </div>
      </div>
    `;

    const memberCardsHtml = MEMBERS.map((m) => {
      const rooms = state.visitedRooms.filter((r) => r.deNosotros.includes(m.key));
      const count = rooms.length;
      const pct = ((count / totalVis) * 100).toFixed(1).replace(".", ",");
      const rated = rooms.filter((r) => r.media.media !== null);
      const avg = rated.length ? rated.reduce((s, r) => s + r.media.media, 0) / rated.length : null;

      const isCore = CORE_MEMBERS.some((cm) => cm.key === m.key);
      const ownRatedCount = isCore
        ? rooms.filter((r) => r.ratings[m.key]?.hasAnyScore).length
        : null;

      const themeCounts = {};
      rooms.forEach((r) => {
        if (r.tematica && r.tematica !== "Sin especificar") {
          themeCounts[r.tematica] = (themeCounts[r.tematica] || 0) + 1;
        }
      });
      const favTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      const isActive = activeMember === m.key ? "active-filter" : "";

      return `
        <button type="button" class="member-card ${isActive}" data-member-key="${m.key}">
          <div class="member-top">
            <div class="member-avatar-badge" style="background:${m.bg};color:${m.color}">${m.key}</div>
            <span class="member-pct">${pct}% visitadas</span>
          </div>
          <div class="member-count" style="color:${m.color}">${count}</div>
          <div class="member-name-label">${escapeHtml(m.name)}</div>
          <div class="member-progress-track">
            <div class="member-progress-bar" style="width:${Math.min(100, (count / totalVis) * 100)}%;background:${m.color}"></div>
          </div>
          <div class="member-meta">
            <span>Media salas: <strong>${fmtScore(avg)}★</strong></span>
            <span>${ownRatedCount !== null ? `${ownRatedCount}/${count} val.` : `Top: ${escapeHtml(favTheme)}`}</span>
          </div>
        </button>
      `;
    }).join("");

    const container = document.getElementById("members-grid");
    container.innerHTML = totalCardHtml + memberCardsHtml;

    container.querySelectorAll("button[data-member-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-member-key");
        filterVisitedByMemberAndOpen(key);
      });
    });
  }

  function renderTeamSectionExtras() {
    const squadCounts = {};
    state.visitedRooms.forEach((r) => {
      if (!r.deNosotros) return;
      squadCounts[r.deNosotros] = (squadCounts[r.deNosotros] || 0) + 1;
    });
    const topSquads = Object.entries(squadCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
    const maxSquad = topSquads[0]?.[1] || 1;

    const nameMap = { S: "Sara", M: "Miguel", R: "Rafa", A: "Antonio", J: "Joan", "+": "Invitados" };
    document.getElementById("squads-list").innerHTML = topSquads
      .map(([code, cnt]) => {
        const readable = code
          .split("")
          .map((c) => nameMap[c] || c)
          .join(" + ");
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span>${renderTeamDotsHtml(code)} <span style="color:var(--text-secondary);font-size:0.8rem;margin-left:6px">${escapeHtml(
          readable
        )}</span></span>
              <strong style="font-family:var(--font-mono)">${cnt} salas</strong>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round((cnt / maxSquad) * 100)}%"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const insightsEl = document.getElementById("team-insights-list");
    insightsEl.innerHTML = MEMBERS.map((m) => {
      const rooms = state.visitedRooms.filter((r) => r.deNosotros.includes(m.key));
      const exOk = rooms.filter((r) => r.exito === "S").length;
      const exFail = rooms.filter((r) => r.exito === "N").length;
      const totalEval = exOk + exFail;
      const winPct = totalEval > 0 ? Math.round((exOk / totalEval) * 100) : 0;
      const winLabel = totalEval > 0 ? `${winPct}% éxito (${exOk}/${totalEval})` : "Sin registro";

      const years = {};
      rooms.forEach((r) => {
        if (r.year && !r.undated) years[r.year] = (years[r.year] || 0) + 1;
      });
      const bestYearEntry = Object.entries(years).sort((a, b) => b[1] - a[1])[0];
      const bestYearTxt = bestYearEntry ? `Récord en ${bestYearEntry[0]} (${bestYearEntry[1]})` : "—";

      return `
        <div class="stat-bar-row">
          <div class="stat-bar-head">
            <span>
              <span class="team-dot ${m.key === "+" ? "dot-plus" : `dot-${m.key}`}" style="margin-right:6px">${m.key}</span>
              <strong>${escapeHtml(m.name)}</strong>
              <span style="color:var(--text-secondary);font-size:0.77rem;margin-left:6px">· ${escapeHtml(bestYearTxt)}</span>
            </span>
            <span style="font-family:var(--font-mono);font-size:0.8rem;color:#6ee7b7">${escapeHtml(winLabel)}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${winPct}%;background:${m.color}"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  /* ---------------------------------------------------------
     SECCIÓN RANKING TOP 10
     --------------------------------------------------------- */

  function getScoreForRankMode(room, mode) {
    if (mode === "general") return room.media.general;
    const memberMatch = CORE_MEMBERS.find(
      (m) => m.key === mode || normalizeKey(m.name) === normalizeKey(mode)
    );
    if (memberMatch) {
      return room.ratings[memberMatch.key]?.media ?? null;
    }
    return room.media.media;
  }

  function renderTop10() {
    const mode = state.rankMode;
    const candidates = state.visitedRooms
      .map((r) => ({
        room: r,
        primary: getScoreForRankMode(r, mode),
        tie1: r.media.general ?? 0,
        tie2: r.media.media ?? 0
      }))
      .filter((item) => item.primary !== null);

    candidates.sort(
      (a, b) =>
        b.primary - a.primary ||
        b.tie1 - a.tie1 ||
        b.tie2 - a.tie2 ||
        a.room.id - b.room.id
    );

    const top10 = candidates.slice(0, 10);
    const grid = document.getElementById("top10-grid");

    if (top10.length === 0) {
      const mName = CORE_MEMBERS.find((m) => m.key === mode)?.name || mode;
      grid.innerHTML = `<div class="panel-card" style="grid-column:1/-1;text-align:center;color:var(--text-secondary)">Todavía no hay salas valoradas para el criterio <strong>${escapeHtml(
        mName
      )}</strong>.</div>`;
      return;
    }

    grid.innerHTML = top10
      .map((entry, idx) => {
        const r = entry.room;
        const pos = idx + 1;
        const podiumCls = pos <= 3 ? `rank-podium-${pos}` : "";
        const medal = pos === 1 ? "🥇 #1" : pos === 2 ? "🥈 #2" : pos === 3 ? "🥉 #3" : `#${pos}`;
        const poster = getPosterUrl(r.sala);
        const bgStyle = poster
          ? `background-image:url('${poster}')`
          : `background:${fallbackGradient(r.tematica)}`;

        return `
          <article class="rank-card ${podiumCls}" data-room-id="${r.id}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHtml(
          r.sala
        )}">
            <div class="rank-poster" style="${bgStyle}">
              <span class="rank-pos-badge">${medal}</span>
              <span class="rank-score-Float">★ ${fmtScore(entry.primary)}</span>
              <span class="rank-theme-over">${escapeHtml(r.tematica)}</span>
            </div>
            <div class="rank-body">
              <div class="rank-title">${escapeHtml(r.sala)}</div>
              <div class="rank-company">${escapeHtml(r.empresa)} · 📍 ${escapeHtml(r.ciudad)} (${escapeHtml(
          r.provincia
        )})</div>

              <div class="rank-mini-bars">
                <div class="mini-stat"><span>Ambientación</span><strong>${fmtScore(r.media.dims[3])}</strong></div>
                <div class="mini-stat"><span>Originalidad</span><strong>${fmtScore(r.media.dims[5])}</strong></div>
                <div class="mini-stat"><span>General</span><strong>${fmtScore(r.media.general)}</strong></div>
              </div>

              <div class="rank-footer">
                <span>🗓️ ${escapeHtml(r.fechaDisplay)} · ${r.media.ratersCount} val.</span>
                <span>${renderTeamDotsHtml(r.deNosotros)}</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".rank-card").forEach((card) => {
      const open = () => openRoomModal(Number(card.getAttribute("data-room-id")));
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN MAPA INTERACTIVO Y DESGLOSE GEOGRÁFICO
     --------------------------------------------------------- */

  function renderMap() {
    if (!state.map) {
      state.map = L.map("visited-map", {
        scrollWheelZoom: false
      }).setView([40.35, -3.4], 6);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19
      }).addTo(state.map);

      state.markerCluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 34
      });
      state.map.addLayer(state.markerCluster);
    }

    state.markerCluster.clearLayers();

    let mappedCount = 0;
    state.visitedRooms.forEach((r) => {
      if (!r.coords) return;
      mappedCount += 1;

      const scoreTxt = r.media.media !== null ? fmtScore(r.media.media) : "✓";
      const icon = L.divIcon({
        className: "custom-escape-marker",
        html: `<div class="escape-pin"><span>${escapeHtml(scoreTxt)}</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26]
      });

      const marker = L.marker(r.coords, { icon });
      marker.bindPopup(`
        <div class="map-popup">
          <h5>${escapeHtml(r.sala)}</h5>
          <p><strong>${escapeHtml(r.empresa)}</strong> · ${escapeHtml(r.ciudad)} (${escapeHtml(r.provincia)})</p>
          <p>🗓️ ${escapeHtml(r.fechaDisplay)} · Media grupo: <strong>${fmtScore(r.media.media)}★</strong> (${r.media.ratersCount} val.)</p>
          <p>Equipo: <strong>${escapeHtml(r.deNosotros || "—")}</strong> · ${escapeHtml(r.tematica)}</p>
          <button type="button" class="map-popup-btn" onclick="window.__openEscapeRoomModal(${r.id})">Ver expediente completo</button>
        </div>
      `);
      state.markerCluster.addLayer(marker);
    });

    document.getElementById("map-subtitle").textContent =
      `${mappedCount} salas visitadas geolocalizadas · Haz clic en los círculos para desplegar`;

    setTimeout(() => state.map && state.map.invalidateSize(), 120);
  }

  function renderGeoBreakdown() {
    const provMap = {};
    const cityMap = {};

    state.visitedRooms.forEach((r) => {
      const pKey = normalizeKey(r.provincia);
      if (!provMap[pKey]) provMap[pKey] = { name: r.provincia, count: 0, scores: [] };
      provMap[pKey].count += 1;
      if (r.media.media !== null) provMap[pKey].scores.push(r.media.media);

      if (r.ciudad && r.ciudad !== "—") {
        const cKey = normalizeKey(r.ciudad);
        if (!cityMap[cKey]) cityMap[cKey] = { name: r.ciudad, prov: r.provincia, count: 0 };
        cityMap[cKey].count += 1;
      }
    });

    const topProvs = Object.values(provMap)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
      .slice(0, 8);
    const maxProv = topProvs[0]?.count || 1;

    document.getElementById("geo-provinces-list").innerHTML = topProvs
      .map((p) => {
        const avg = p.scores.length ? p.scores.reduce((s, v) => s + v, 0) / p.scores.length : null;
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span><strong>${escapeHtml(p.name)}</strong> <span style="color:var(--text-secondary);font-size:0.78rem">(${p.count} salas)</span></span>
              <span class="score-pill">★ ${fmtScore(avg)}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round((p.count / maxProv) * 100)}%"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const topCities = Object.values(cityMap)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
      .slice(0, 8);
    const maxCity = topCities[0]?.count || 1;

    const citiesEl = document.getElementById("geo-cities-list");
    citiesEl.innerHTML = topCities
      .map(
        (c) => `
          <button type="button" class="stat-bar-row stat-bar-row-btn" data-geo-city="${escapeHtml(c.name)}">
            <div class="stat-bar-head">
              <span>📍 <strong>${escapeHtml(c.name)}</strong> <span style="color:var(--text-secondary);font-size:0.78rem">(${escapeHtml(
          c.prov
        )})</span></span>
              <strong style="font-family:var(--font-mono);color:var(--cyan)">${c.count} salas →</strong>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round((c.count / maxCity) * 100)}%"></div>
            </div>
          </button>
        `
      )
      .join("");

    citiesEl.querySelectorAll("[data-geo-city]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const city = btn.getAttribute("data-geo-city");
        state.visitedFilter.search = city;
        state.visitedFilter.page = 1;
        document.getElementById("visited-search").value = city;
        renderVisitedTable();
        navigateToSection("visitadas");
      });
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN SALAS VISITADAS CON PAGINACIÓN
     --------------------------------------------------------- */

  function populateVisitedFilters() {
    const yearSelect = document.getElementById("visited-year-filter");
    const currentVal = state.visitedFilter.year;

    const years = Array.from(
      new Set(state.visitedRooms.filter((r) => r.year).map((r) => r.year))
    ).sort((a, b) => b - a);

    const hasUndated = state.visitedRooms.some((r) => r.undated);

    yearSelect.innerHTML =
      `<option value="ALL">Todos los años</option>` +
      years.map((y) => `<option value="${y}">${y}</option>`).join("") +
      (hasUndated ? `<option value="UNDATED">Sin fecha exacta</option>` : "");

    yearSelect.value = currentVal;
  }

  function renderVisitedTable() {
    const { search, member, year, pageSize } = state.visitedFilter;
    const q = normalizeKey(search);

    const filtered = state.visitedRooms.filter((r) => {
      if (member !== "ALL" && !r.deNosotros.includes(member)) return false;
      if (year === "UNDATED" && !r.undated) return false;
      if (year !== "ALL" && year !== "UNDATED" && String(r.year) !== year) return false;
      if (q) {
        const hay = normalizeKey(`${r.sala} ${r.empresa} ${r.ciudad} ${r.provincia} ${r.tematica}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById("visited-count-pill").textContent = String(filtered.length);

    const hasActiveFilter = Boolean(q) || member !== "ALL" || year !== "ALL";
    document.getElementById("visited-reset-btn").hidden = !hasActiveFilter;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (state.visitedFilter.page > totalPages) state.visitedFilter.page = totalPages;
    const page = state.visitedFilter.page;

    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    const tbody = document.getElementById("visited-tbody");
    if (slice.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No hay salas visitadas que coincidan con el filtro seleccionado.</td></tr>`;
    } else {
      tbody.innerHTML = slice
        .map((r) => {
          const exitoHtml =
            r.exito === "S"
              ? `<span class="status-ok">✓ Superada${r.tiempoEmpleado ? ` (${escapeHtml(r.tiempoEmpleado)})` : ""}</span>`
              : r.exito === "N"
              ? `<span class="status-fail">✕ No superada</span>`
              : `<span class="date-unknown">—</span>`;

          const scoreHtml =
            r.media.media !== null
              ? `<span class="score-pill">★ ${fmtScore(r.media.media)}</span><span class="raters-sub">${
                  r.media.ratersCount
                } ${r.media.ratersCount === 1 ? "miembro" : "miembros"}</span>`
              : `<span class="date-unknown">Sin nota</span>`;

          const cat = resolveRoomCatalog(r);
          const imgSrc = cat?.image || "assets/hero-bg.jpg";

          return `
            <tr data-room-id="${r.id}">
              <td class="date-cell ${r.undated ? "date-unknown" : ""}">${escapeHtml(r.fechaDisplay)}</td>
              <td>
                <div class="table-room-cell">
                  <img src="${imgSrc}" class="table-room-thumb" alt="" loading="lazy">
                  <div class="table-room-info">
                    <div class="table-room-title">
                      <span>${escapeHtml(r.sala)}</span>
                      ${cat?.url ? `<a href="${cat.url}" target="_blank" rel="noopener noreferrer" class="table-room-link" onclick="event.stopPropagation()" title="Web oficial">↗</a>` : ""}
                    </div>
                    <div class="room-sub-company">${escapeHtml(r.empresa)}</div>
                  </div>
                </div>
              </td>
              <td>${escapeHtml(r.ciudad)} <span class="room-sub-company">(${escapeHtml(r.provincia)})</span></td>
              <td><span class="theme-tag ${themeClass(r.tematica)}">${escapeHtml(r.tematica)}</span></td>
              <td>${renderTeamDotsHtml(r.deNosotros)}</td>
              <td>${exitoHtml}</td>
              <td class="col-num">${scoreHtml}</td>
            </tr>
          `;
        })
        .join("");

      tbody.querySelectorAll("tr[data-room-id]").forEach((tr) => {
        tr.addEventListener("click", () => openRoomModal(Number(tr.getAttribute("data-room-id"))));
      });
    }

    const pagBar = document.getElementById("visited-pagination");
    const fromNum = filtered.length === 0 ? 0 : start + 1;
    const toNum = Math.min(start + pageSize, filtered.length);

    const pageBtns = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
        pageBtns.push(
          `<button type="button" class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`
        );
      } else if (pageBtns[pageBtns.length - 1] !== `<span style="color:var(--text-muted);padding:0 4px">…</span>`) {
        pageBtns.push(`<span style="color:var(--text-muted);padding:0 4px">…</span>`);
      }
    }

    pagBar.innerHTML = `
      <div class="page-info">Mostrando <strong>${fromNum}–${toNum}</strong> de <strong>${filtered.length}</strong> salas visitadas (ordenadas por fecha descendiente)</div>
      <div class="page-controls">
        <button type="button" class="page-btn" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Página anterior">‹ Ant.</button>
        ${pageBtns.join("")}
        <button type="button" class="page-btn" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""} aria-label="Página siguiente">Sig. ›</button>
      </div>
    `;

    pagBar.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = Number(btn.getAttribute("data-page"));
        if (target >= 1 && target <= totalPages) {
          state.visitedFilter.page = target;
          renderVisitedTable();
        }
      });
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN SALAS PENDIENTES Y PRÓXIMAS RESERVAS
     --------------------------------------------------------- */

  function renderUpcomingSection() {
    const wrap = document.getElementById("upcoming-section-wrap");
    if (!wrap) return;

    if (state.upcomingRooms.length === 0) {
      wrap.hidden = true;
      wrap.innerHTML = "";
      return;
    }

    wrap.hidden = false;
    wrap.innerHTML = `
      <span class="section-kicker" style="color:#6ee7b7">AGENDA CONFIRMADA</span>
      <h4 style="font-size:1.1rem">📅 Próximas reservas con fecha (${state.upcomingRooms.length})</h4>
      <div class="upcoming-cards-row">
        ${state.upcomingRooms
          .map((r) => {
            const cat = resolveRoomCatalog(r);
            const imgSrc = cat?.image || "assets/hero-bg.jpg";
            return `
              <div class="upcoming-mini-card" data-room-id="${r.id}">
                <img src="${imgSrc}" class="upcoming-thumb" alt="${escapeHtml(r.sala)}" loading="lazy">
                <div style="flex:1;min-width:0">
                  <div style="font-family:var(--font-mono);font-size:0.75rem;color:#6ee7b7">${escapeHtml(r.fechaDisplay)} · ${escapeHtml(
              r.ciudad
            )}</div>
                  <div style="font-weight:700;color:#fff;margin-top:0.15rem;display:flex;align-items:center;gap:0.35rem">
                    <span>${escapeHtml(r.sala)}</span>
                    ${cat?.url ? `<a href="${cat.url}" target="_blank" rel="noopener noreferrer" class="table-room-link" onclick="event.stopPropagation()" title="Web oficial">↗</a>` : ""}
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-secondary)">${escapeHtml(r.empresa)}</div>
                  ${cat?.description ? `<p class="pending-desc" style="-webkit-line-clamp:2;margin-top:0.3rem">${escapeHtml(cat.description)}</p>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    wrap.querySelectorAll(".upcoming-mini-card[data-room-id]").forEach((card) => {
      card.addEventListener("click", () => {
        openRoomModal(Number(card.getAttribute("data-room-id")));
      });
    });
  }

  function populatePendingFilters() {
    const provCounts = {};
    const themeCounts = {};

    state.pendingRooms.forEach((r) => {
      provCounts[r.provincia] = (provCounts[r.provincia] || 0) + 1;
      themeCounts[r.tematica] = (themeCounts[r.tematica] || 0) + 1;
    });

    const provList = Object.entries(provCounts).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
    );
    const themeList = Object.entries(themeCounts).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
    );

    const provSelect = document.getElementById("pending-province-select");
    provSelect.innerHTML =
      `<option value="ALL">Todas las provincias (${state.pendingRooms.length})</option>` +
      provList
        .map(([p, c]) => `<option value="${escapeHtml(p)}">${escapeHtml(p)} (${c})</option>`)
        .join("");
    provSelect.value = state.pendingFilter.province;

    const themeSelect = document.getElementById("pending-theme-select");
    themeSelect.innerHTML =
      `<option value="ALL">Todas las temáticas</option>` +
      themeList
        .map(([t, c]) => `<option value="${escapeHtml(t)}">${escapeHtml(t)} (${c})</option>`)
        .join("");
    themeSelect.value = state.pendingFilter.theme;

    const chipsContainer = document.getElementById("pending-province-chips");
    chipsContainer.innerHTML =
      `<button type="button" class="prov-chip ${state.pendingFilter.province === "ALL" ? "active" : ""}" data-prov="ALL">Todas <b>${
        state.pendingRooms.length
      }</b></button>` +
      provList
        .map(
          ([p, c]) =>
            `<button type="button" class="prov-chip ${state.pendingFilter.province === p ? "active" : ""}" data-prov="${escapeHtml(
              p
            )}">${escapeHtml(p)} <b>${c}</b></button>`
        )
        .join("");

    chipsContainer.querySelectorAll(".prov-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prov = chip.getAttribute("data-prov");
        state.pendingFilter.province = prov;
        provSelect.value = prov;
        populatePendingFilters();
        renderPendingList();
      });
    });
  }

  function renderPendingList() {
    const { search, province, theme } = state.pendingFilter;
    const q = normalizeKey(search);

    const hasActivePendingFilter = Boolean(q) || province !== "ALL" || theme !== "ALL";
    const resetBtn = document.getElementById("pending-reset-btn");
    if (resetBtn) resetBtn.hidden = !hasActivePendingFilter;

    const filtered = state.pendingRooms.filter((r) => {
      if (province !== "ALL" && r.provincia !== province) return false;
      if (theme !== "ALL" && r.tematica !== theme) return false;
      if (q) {
        const cat = resolveRoomCatalog(r);
        const desc = cat?.description ? normalizeKey(cat.description) : "";
        const hay = normalizeKey(`${r.sala} ${r.empresa} ${r.ciudad} ${r.provincia} ${r.masInfo} ${r.tematica} ${desc}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById("pending-count-pill").textContent = String(filtered.length);

    const grid = document.getElementById("pending-grid");
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="panel-card" style="grid-column:1/-1;text-align:center;color:var(--text-secondary)">No hay salas pendientes con estos filtros.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((r) => {
        const cat = resolveRoomCatalog(r);
        const imgSrc = cat?.image || "assets/hero-bg.jpg";
        const playersTxt =
          r.minJug && r.maxJug
            ? `${r.minJug}–${r.maxJug} jug.${r.recomJug ? ` (rec. ${r.recomJug})` : ""}`
            : r.minJug || "—";
        const durTxt = r.tiempoMax
          ? /^\d+$/.test(r.tiempoMax)
            ? `${r.tiempoMax} min`
            : r.tiempoMax
          : "—";

        return `
          <article class="pending-card" data-room-id="${r.id}">
            <div class="pending-card-media" style="background-image:url('${imgSrc}')">
              <div class="pending-card-top">
                <span class="pending-prov">📍 ${escapeHtml(r.provincia)} · ${escapeHtml(r.ciudad)}</span>
                <span class="theme-tag ${themeClass(r.tematica)}">${escapeHtml(r.tematica)}</span>
              </div>
            </div>
            <div class="pending-card-body">
              <div class="pending-title">${escapeHtml(r.sala)}</div>
              <div class="pending-company">${escapeHtml(r.empresa)}</div>
              ${r.masInfo ? `<span class="award-badge">🏆 ${escapeHtml(r.masInfo)}</span>` : ""}
              ${cat?.description ? `<p class="pending-desc">${escapeHtml(cat.description)}</p>` : ""}
              <div class="pending-specs">
                <div class="pending-specs-meta">
                  <span>👥 ${escapeHtml(playersTxt)}</span>
                  <span>⏱️ ${escapeHtml(durTxt)}</span>
                </div>
                ${cat?.url ? `
                  <a href="${cat.url}" target="_blank" rel="noopener noreferrer" class="pending-web-link" onclick="event.stopPropagation()">
                    ${cat.closed ? "📁 Ficha ↗" : "🌐 Web ↗"}
                  </a>
                ` : ""}
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll(".pending-card[data-room-id]").forEach((card) => {
      card.addEventListener("click", () => {
        openRoomModal(Number(card.getAttribute("data-room-id")));
      });
    });
  }

  /* ---------------------------------------------------------
     SECCIÓN ESTADÍSTICAS: EVOLUCIÓN ANUAL Y RADIOGRAFÍA
     --------------------------------------------------------- */

  function renderYearChart() {
    const byYear = {};
    let undatedCount = 0;

    state.visitedRooms.forEach((r) => {
      if (r.undated || !r.year) {
        undatedCount += 1;
        return;
      }
      if (!byYear[r.year]) byYear[r.year] = { count: 0, scores: [] };
      byYear[r.year].count += 1;
      if (r.media.media !== null) byYear[r.year].scores.push(r.media.media);
    });

    const years = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);

    if (years.length >= 2) {
      for (let y = years[0]; y <= years[years.length - 1]; y++) {
        if (!byYear[y]) byYear[y] = { count: 0, scores: [] };
      }
    }

    const sortedYears = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b);

    const counts = sortedYears.map((y) => byYear[y].count);
    const avgs = sortedYears.map((y) => {
      const arr = byYear[y].scores;
      return arr.length ? Number((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : null;
    });

    const undatedEl = document.getElementById("undated-badge");
    if (undatedCount > 0) {
      undatedEl.textContent = `+ ${undatedCount} sin fecha exacta`;
      undatedEl.hidden = false;
    } else {
      undatedEl.hidden = true;
    }

    let peakYear = "—";
    let peakCount = 0;
    sortedYears.forEach((y) => {
      if (byYear[y].count > peakCount) {
        peakCount = byYear[y].count;
        peakYear = y;
      }
    });

    const currentYear = new Date().getFullYear();
    const currentYearCount = byYear[currentYear]?.count || 0;

    document.getElementById("year-summary-strip").innerHTML = `
      <span>🏆 Año récord: <strong>${peakYear}</strong> (${peakCount} salas)</span>
      <span>📆 En ${currentYear}: <strong>${currentYearCount} salas</strong></span>
      <span>💡 Clic en una barra para filtrar ese año en Visitadas</span>
    `;

    const ctx = document.getElementById("yearChart").getContext("2d");
    if (state.charts.year) state.charts.year.destroy();

    const valueLabelsPlugin = {
      id: "barValueLabels",
      afterDatasetsDraw(chart) {
        const { ctx: c } = chart;
        const meta = chart.getDatasetMeta(0);
        c.save();
        c.font = "700 12px 'JetBrains Mono', monospace";
        c.fillStyle = "#f8fafc";
        c.textAlign = "center";
        meta.data.forEach((bar, i) => {
          const val = counts[i];
          if (val > 0) c.fillText(String(val), bar.x, bar.y - 7);
        });
        c.restore();
      }
    };

    state.charts.year = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedYears.map(String),
        datasets: [
          {
            type: "bar",
            label: "Salas visitadas",
            data: counts,
            backgroundColor: sortedYears.map((y) =>
              y === peakYear ? "rgba(245, 176, 56, 0.85)" : "rgba(56, 189, 248, 0.68)"
            ),
            hoverBackgroundColor: "#ffd166",
            borderRadius: 8,
            maxBarThickness: 44,
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Nota media del año",
            data: avgs,
            borderColor: "#f5b038",
            backgroundColor: "#f5b038",
            borderWidth: 2.4,
            pointRadius: 4,
            tension: 0.32,
            spanGaps: true,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_, elements) => {
          if (elements && elements.length > 0) {
            const idx = elements[0].index;
            const clickedYear = String(sortedYears[idx]);
            state.visitedFilter.year = clickedYear;
            state.visitedFilter.page = 1;
            document.getElementById("visited-year-filter").value = clickedYear;
            renderVisitedTable();
            navigateToSection("visitadas");
          }
        },
        plugins: {
          legend: {
            labels: { color: "#cbd5e1", font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
          },
          tooltip: {
            backgroundColor: "#0f172a",
            borderColor: "rgba(245,176,56,0.4)",
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono', monospace" } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(...counts, 5) + 3,
            ticks: { color: "#94a3b8", precision: 0 },
            grid: { color: "rgba(148,163,184,0.1)" }
          },
          y1: {
            position: "right",
            min: 1,
            max: 5,
            ticks: { color: "#f5b038" },
            grid: { drawOnChartArea: false }
          }
        }
      },
      plugins: [valueLabelsPlugin]
    });
  }

  function renderExtraStats() {
    // 1. Radar 7 criterios (Media Global + cada miembro que haya valorado salas)
    const avgMedia = DIMENSIONS.map((_, i) => {
      const vals = state.visitedRooms.map((r) => r.media.dims[i]).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });

    const radarDatasets = [
      {
        label: "Media Global",
        data: avgMedia,
        borderColor: "#f5b038",
        backgroundColor: "rgba(245, 176, 56, 0.22)",
        borderWidth: 2.3,
        pointRadius: 3
      }
    ];

    let allNonZero = avgMedia.filter((v) => v > 0);

    CORE_MEMBERS.forEach((m) => {
      const hasAny = state.visitedRooms.some((r) => r.ratings[m.key]?.hasAnyScore);
      if (!hasAny) return;
      const mData = DIMENSIONS.map((_, i) => {
        const vals = state.visitedRooms
          .map((r) => r.ratings[m.key]?.dims[i] ?? null)
          .filter((v) => v !== null);
        return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
      });
      allNonZero = allNonZero.concat(mData.filter((v) => v > 0));
      radarDatasets.push({
        label: m.name,
        data: mData,
        borderColor: m.color,
        backgroundColor: m.bg.replace("0.18", "0.10"),
        borderWidth: 1.9,
        pointRadius: 2.8
      });
    });

    const minRadar = allNonZero.length ? Math.max(0, Math.floor(Math.min(...allNonZero) - 0.5)) : 2;

    const radarCtx = document.getElementById("radarChart").getContext("2d");
    if (state.charts.radar) state.charts.radar.destroy();
    state.charts.radar = new Chart(radarCtx, {
      type: "radar",
      data: {
        labels: DIMENSIONS,
        datasets: radarDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: minRadar,
            max: 5,
            ticks: { stepSize: 0.5, color: "#64748b", backdropColor: "transparent" },
            grid: { color: "rgba(148,163,184,0.14)" },
            angleLines: { color: "rgba(148,163,184,0.14)" },
            pointLabels: { color: "#e2e8f0", font: { size: 11, weight: "600" } }
          }
        },
        plugins: {
          legend: { labels: { color: "#cbd5e1", boxWidth: 12 } }
        }
      }
    });

    // 2. Temáticas: Visitadas vs Pendientes
    const themeMap = {};
    state.visitedRooms.forEach((r) => {
      if (r.tematica === "Sin especificar") return;
      themeMap[r.tematica] = themeMap[r.tematica] || { vis: 0, pend: 0 };
      themeMap[r.tematica].vis += 1;
    });
    state.pendingRooms.forEach((r) => {
      if (r.tematica === "Sin especificar") return;
      themeMap[r.tematica] = themeMap[r.tematica] || { vis: 0, pend: 0 };
      themeMap[r.tematica].pend += 1;
    });

    const topThemes = Object.entries(themeMap)
      .sort((a, b) => b[1].vis + b[1].pend - (a[1].vis + a[1].pend))
      .slice(0, 7);

    const themesCtx = document.getElementById("themesChart").getContext("2d");
    if (state.charts.themes) state.charts.themes.destroy();
    state.charts.themes = new Chart(themesCtx, {
      type: "bar",
      data: {
        labels: topThemes.map(([t]) => t),
        datasets: [
          {
            label: "Visitadas",
            data: topThemes.map(([, v]) => v.vis),
            backgroundColor: "rgba(56, 189, 248, 0.78)",
            borderRadius: 6
          },
          {
            label: "Pendientes",
            data: topThemes.map(([, v]) => v.pend),
            backgroundColor: "rgba(245, 176, 56, 0.72)",
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#cbd5e1", boxWidth: 12 } }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#94a3b8", precision: 0 },
            grid: { color: "rgba(148,163,184,0.1)" }
          },
          y: {
            stacked: true,
            ticks: { color: "#e2e8f0" },
            grid: { display: false }
          }
        }
      }
    });

    // 3. Empresas con >= 2 salas jugadas ordenadas por nota media
    const compStats = {};
    state.visitedRooms.forEach((r) => {
      if (!r.empresa || r.empresa === "Sin empresa") return;
      const key = normalizeKey(r.empresa);
      if (!compStats[key]) compStats[key] = { name: r.empresa, count: 0, scores: [] };
      compStats[key].count += 1;
      if (r.media.media !== null) compStats[key].scores.push(r.media.media);
    });

    const topCompanies = Object.values(compStats)
      .filter((c) => c.count >= 2 && c.scores.length > 0)
      .map((c) => ({
        ...c,
        avg: c.scores.reduce((s, v) => s + v, 0) / c.scores.length
      }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 7);

    document.getElementById("companies-list").innerHTML = topCompanies
      .map(
        (c) => `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span><strong>${escapeHtml(c.name)}</strong> <span style="color:var(--text-secondary);font-size:0.78rem">(${c.count} salas jugadas)</span></span>
              <span class="score-pill">★ ${fmtScore(c.avg)}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round((c.avg / 5) * 100)}%"></div>
            </div>
          </div>
        `
      )
      .join("");

    // 4. Distribución de notas y tasa de éxito
    const ratedRooms = state.visitedRooms.filter((r) => r.media.media !== null);
    const totalRated = ratedRooms.length || 1;
    const brackets = [
      {
        label: "Obras maestras (4,50 – 5,00★)",
        count: ratedRooms.filter((r) => r.media.media >= 4.5).length,
        color: "#ffd166"
      },
      {
        label: "Sobresalientes (4,00 – 4,49★)",
        count: ratedRooms.filter((r) => r.media.media >= 4.0 && r.media.media < 4.5).length,
        color: "#38bdf8"
      },
      {
        label: "Notables (3,50 – 3,99★)",
        count: ratedRooms.filter((r) => r.media.media >= 3.5 && r.media.media < 4.0).length,
        color: "#34d399"
      },
      {
        label: "Aprobadas / Discretas (< 3,50★)",
        count: ratedRooms.filter((r) => r.media.media < 3.5).length,
        color: "#94a3b8"
      }
    ];

    const exOk = state.visitedRooms.filter((r) => r.exito === "S").length;
    const exFail = state.visitedRooms.filter((r) => r.exito === "N").length;
    const successPct = exOk + exFail > 0 ? Math.round((exOk / (exOk + exFail)) * 100) : 0;

    document.getElementById("ratings-dist-list").innerHTML =
      brackets
        .map((b) => {
          const pct = Math.round((b.count / totalRated) * 100);
          return `
            <div class="stat-bar-row">
              <div class="stat-bar-head">
                <span>${escapeHtml(b.label)}</span>
                <strong style="font-family:var(--font-mono)">${b.count} (${pct}%)</strong>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width:${pct}%;background:${b.color}"></div>
              </div>
            </div>
          `;
        })
        .join("") +
      `
        <div class="stat-bar-row" style="margin-top:0.35rem;padding-top:0.65rem;border-top:1px solid var(--border-subtle)">
          <div class="stat-bar-head">
            <span>🏁 <strong>Tasa global de escape completado</strong></span>
            <strong style="font-family:var(--font-mono);color:#6ee7b7">${successPct}% (${exOk}/${exOk + exFail})</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${successPct}%;background:#10b981"></div>
          </div>
        </div>
      `;
  }

  /* ---------------------------------------------------------
     MODAL DE DETALLE DE SALA (DESGLOSE MULTI-MIEMBRO)
     --------------------------------------------------------- */

  function openRoomModal(roomId) {
    const r = state.allRooms.find((item) => item.id === roomId);
    if (!r) return;

    state.openRoomModalId = roomId;
    const modal = document.getElementById("room-modal");
    const body = document.getElementById("modal-body");

    // Mostrar como columnas los integrantes del grupo que visitaron la sala (o todos si ninguno consta)
    const roomMembers = CORE_MEMBERS.filter(
      (m) => r.deNosotros.includes(m.key) || r.ratings[m.key]?.hasAnyScore
    );
    const colsToShow = roomMembers.length > 0 ? roomMembers : CORE_MEMBERS;

    const headerColsHtml = colsToShow
      .map(
        (m) => `<th class="num" style="color:${m.color}">${escapeHtml(m.name)}</th>`
      )
      .join("");

    const rowsHtml = DIMENSIONS.map((dim, i) => {
      const isDiff = i === 0;
      const memberCells = colsToShow
        .map((m) => `<td class="num">${fmtScore(r.ratings[m.key]?.dims[i])}</td>`)
        .join("");

      return `
        <tr>
          <td>${escapeHtml(dim)}${isDiff ? ` <span class="dim-note-badge">no media</span>` : ""}</td>
          ${memberCells}
          <td class="num"><strong>${fmtScore(r.media.dims[i])}</strong></td>
        </tr>
      `;
    }).join("");

    const finalCellsHtml = colsToShow
      .map((m) => `<td class="num"><strong>${fmtScore(r.ratings[m.key]?.media)}</strong></td>`)
      .join("");

    const canRate = canMemberRateRoom(state.currentMember, r);
    const myHasScore = state.currentMember && r.ratings[state.currentMember.key]?.hasAnyScore;

    const rateActionHtml = canRate
      ? `<button type="button" id="modal-rate-room-btn" class="btn-rate-room ${
          myHasScore ? "" : "is-unrated"
        }">
          ${myHasScore ? "✏️ Editar mi valoración" : "✍️ Añadir mi valoración"} (${escapeHtml(
          state.currentMember.name
        )})
        </button>`
      : r.status === "visited"
      ? `<span class="unrated-pill">🔒 Solo quienes visitaron la sala pueden valorarla</span>`
      : "";

    const cat = resolveRoomCatalog(r);
    const heroImg = cat?.image || "assets/hero-bg.jpg";
    const webBtnHtml = cat?.url
      ? `<a href="${cat.url}" target="_blank" rel="noopener noreferrer" class="btn-room-website ${cat.closed ? "is-archived" : ""}">
          ${cat.closed ? "📁 Ficha histórica / archivada ↗" : "🌐 Visitar web oficial ↗"}
        </a>`
      : "";

    body.innerHTML = `
      <div class="modal-hero" style="background-image:url('${heroImg}')">
        <div class="modal-hero-content">
          <div class="modal-hero-left">
            <span class="section-kicker" style="color:var(--cyan);text-shadow:0 2px 4px rgba(0,0,0,0.85)">
              ${escapeHtml(r.empresa)} · ${escapeHtml(r.ciudad)} (${escapeHtml(r.provincia)})
            </span>
            <h3 id="modal-room-title" style="font-size:1.6rem;margin:0;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.9)">
              ${escapeHtml(r.sala)}
            </h3>
          </div>
          ${webBtnHtml}
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:1rem">
        <span class="theme-tag ${themeClass(r.tematica)}">${escapeHtml(r.tematica)}</span>
        <span class="subtle-badge">🗓️ ${escapeHtml(r.fechaDisplay)}</span>
        ${r.jugadores ? `<span class="subtle-badge">👥 ${escapeHtml(r.jugadores)} jugadores</span>` : ""}
        ${r.tiempoMax ? `<span class="subtle-badge">⏱️ Máx: ${escapeHtml(r.tiempoMax)} min</span>` : ""}
        ${r.tiempoEmpleado ? `<span class="subtle-badge">🏁 Tiempo: ${escapeHtml(r.tiempoEmpleado)}</span>` : ""}
        ${
          r.media.media !== null
            ? `<span class="score-pill">Media (${r.media.ratersCount}): ★ ${fmtScore(r.media.media)}</span>`
            : ""
        }
      </div>

      ${
        cat?.description
          ? `<div class="modal-synopsis">
              <span class="modal-synopsis-label">📖 Sinopsis oficial</span>
              <p>${escapeHtml(cat.description)}</p>
            </div>`
          : ""
      }

      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.9rem">
        <div>
          <span style="font-size:0.82rem;color:var(--text-secondary);margin-right:0.5rem">Participantes del grupo:</span>
          ${renderTeamDotsHtml(r.deNosotros)}
        </div>
        ${rateActionHtml}
      </div>

      ${r.masInfo ? `<p style="margin:0.5rem 0"><span class="award-badge">🏆 ${escapeHtml(r.masInfo)}</span></p>` : ""}
      ${
        r.opinion
          ? `<p style="background:rgba(255,255,255,0.04);padding:0.75rem;border-radius:10px;font-size:0.88rem;margin-bottom:1rem"><strong>Opinión del equipo:</strong> ${escapeHtml(
              r.opinion
            )}</p>`
          : ""
      }

      <div class="modal-table-wrap">
        <table class="modal-scores-table">
          <thead>
            <tr>
              <th>Criterio</th>
              ${headerColsHtml}
              <th class="num" style="color:var(--gold-bright)">Media</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="border-top:2px solid var(--border-gold)">
              <td><strong>Nota Media Final</strong> <span class="dim-note-badge">sin Dificultad</span></td>
              ${finalCellsHtml}
              <td class="num" style="color:var(--gold-bright)"><strong>★ ${fmtScore(r.media.media)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("modal-rate-room-btn")?.addEventListener("click", () => {
      openRatingModal(r.id);
    });

    modal.hidden = false;
  }

  window.__openEscapeRoomModal = openRoomModal;

  /* ---------------------------------------------------------
     EVENTOS DE INTERFAZ Y ENRUTAMIENTO DE SECCIONES
     --------------------------------------------------------- */

  function bindEvents() {
    document.querySelectorAll(".sidebar-link[data-section-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToSection(link.getAttribute("data-section-link"));
      });
    });

    document.querySelectorAll("[data-nav-target]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToSection(el.getAttribute("data-nav-target"));
      });
    });

    document.getElementById("sidebar-open-btn").addEventListener("click", openMobileSidebar);
    document.getElementById("sidebar-close-btn").addEventListener("click", closeMobileSidebar);
    document.getElementById("sidebar-backdrop").addEventListener("click", closeMobileSidebar);

    window.addEventListener("hashchange", () => {
      const target = resolveSectionFromHash();
      if (target !== state.activeSection) {
        navigateToSection(target, { updateHash: false });
      }
    });

    document.getElementById("oauth-login-btn").addEventListener("click", () => {
      requestGoogleLogin("select_account");
    });

    document.getElementById("sync-sheet-btn").addEventListener("click", async () => {
      if (state.user?.accessToken) {
        await verifyAndUnlockDashboard(state.user);
      } else {
        requestGoogleLogin("select_account");
      }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      if (state.user?.accessToken && window.google?.accounts?.oauth2?.revoke) {
        try {
          window.google.accounts.oauth2.revoke(state.user.accessToken, () => {});
        } catch (_) {}
      }
      state.user = null;
      clearSessionAndData();
      clearAuthMessage();
      closeMobileSidebar();
      navigateToSection("dashboard", { updateHash: false, scrollTop: true });
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      document.getElementById("room-modal").hidden = true;
      document.getElementById("rating-modal").hidden = true;
      document.getElementById("app-shell").hidden = true;
      document.getElementById("auth-gate").hidden = false;
    });

    // Selector de modo de Ranking Top 10
    document.querySelectorAll(".seg-btn[data-rank-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".seg-btn[data-rank-mode]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.rankMode = btn.getAttribute("data-rank-mode");
        renderTop10();
      });
    });

    // Filtros de la sección personal (Mi Espacio)
    document.querySelectorAll(".seg-btn[data-personal-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setPersonalStatusFilter(btn.getAttribute("data-personal-status"));
      });
    });

    document.getElementById("personal-search").addEventListener("input", (e) => {
      state.personalFilter.search = e.target.value;
      state.personalFilter.page = 1;
      renderPersonalRoomsTable();
    });

    document.getElementById("personal-year-filter").addEventListener("change", (e) => {
      state.personalFilter.year = e.target.value;
      state.personalFilter.page = 1;
      renderPersonalRoomsTable();
    });

    document.getElementById("personal-page-size").addEventListener("change", (e) => {
      state.personalFilter.pageSize = Number(e.target.value) || 10;
      state.personalFilter.page = 1;
      renderPersonalRoomsTable();
    });

    document.getElementById("personal-reset-btn").addEventListener("click", () => {
      state.personalFilter = {
        status: "ALL",
        search: "",
        year: "ALL",
        page: 1,
        pageSize: state.personalFilter.pageSize
      };
      document.getElementById("personal-search").value = "";
      document.getElementById("personal-year-filter").value = "ALL";
      document.querySelectorAll(".seg-btn[data-personal-status]").forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-personal-status") === "ALL");
      });
      renderPersonalRoomsTable();
    });

    // Botones rápidos de encuadre del mapa
    const mapViews = {
      spain: { center: [40.25, -3.5], zoom: 6 },
      all: { center: [44.2, 4.5], zoom: 4 },
      madrid: { center: [40.38, -3.72], zoom: 10 },
      barcelona: { center: [41.44, 2.18], zoom: 10 },
      norte: { center: [42.98, -2.45], zoom: 8 },
      valencia: { center: [39.47, -0.37], zoom: 12 }
    };

    document.querySelectorAll(".chip-btn[data-map-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".chip-btn[data-map-view]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const v = mapViews[btn.getAttribute("data-map-view")];
        if (v && state.map) state.map.flyTo(v.center, v.zoom, { duration: 0.8 });
      });
    });

    // Filtros de salas visitadas
    document.getElementById("visited-search").addEventListener("input", (e) => {
      state.visitedFilter.search = e.target.value;
      state.visitedFilter.page = 1;
      renderVisitedTable();
    });

    document.getElementById("visited-member-filter").addEventListener("change", (e) => {
      state.visitedFilter.member = e.target.value;
      state.visitedFilter.page = 1;
      renderMembersCount();
      renderVisitedTable();
    });

    document.getElementById("visited-year-filter").addEventListener("change", (e) => {
      state.visitedFilter.year = e.target.value;
      state.visitedFilter.page = 1;
      renderVisitedTable();
    });

    document.getElementById("visited-page-size").addEventListener("change", (e) => {
      state.visitedFilter.pageSize = Number(e.target.value) || 10;
      state.visitedFilter.page = 1;
      renderVisitedTable();
    });

    document.getElementById("visited-reset-btn").addEventListener("click", () => {
      state.visitedFilter = {
        search: "",
        member: "ALL",
        year: "ALL",
        page: 1,
        pageSize: state.visitedFilter.pageSize
      };
      document.getElementById("visited-search").value = "";
      document.getElementById("visited-member-filter").value = "ALL";
      document.getElementById("visited-year-filter").value = "ALL";
      renderMembersCount();
      renderVisitedTable();
    });

    // Filtros de salas pendientes
    document.getElementById("pending-search").addEventListener("input", (e) => {
      state.pendingFilter.search = e.target.value;
      renderPendingList();
    });

    document.getElementById("pending-province-select").addEventListener("change", (e) => {
      state.pendingFilter.province = e.target.value;
      populatePendingFilters();
      renderPendingList();
    });

    document.getElementById("pending-theme-select").addEventListener("change", (e) => {
      state.pendingFilter.theme = e.target.value;
      renderPendingList();
    });

    document.getElementById("pending-reset-btn").addEventListener("click", () => {
      state.pendingFilter = { search: "", province: "ALL", theme: "ALL" };
      document.getElementById("pending-search").value = "";
      populatePendingFilters();
      renderPendingList();
    });

    // Cierre de modales (detalle y valoración) y menú móvil con Escape
    const roomModal = document.getElementById("room-modal");
    const ratingModal = document.getElementById("rating-modal");

    document.getElementById("modal-close-btn").addEventListener("click", () => {
      roomModal.hidden = true;
      state.openRoomModalId = null;
    });
    roomModal.addEventListener("click", (e) => {
      if (e.target === roomModal) {
        roomModal.hidden = true;
        state.openRoomModalId = null;
      }
    });

    document.getElementById("rating-modal-close-btn").addEventListener("click", closeRatingModal);
    ratingModal.addEventListener("click", (e) => {
      if (e.target === ratingModal) closeRatingModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!ratingModal.hidden) {
          closeRatingModal();
        } else if (!roomModal.hidden) {
          roomModal.hidden = true;
          state.openRoomModalId = null;
        } else {
          closeMobileSidebar();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    initGoogleOAuth();
  });
})();
