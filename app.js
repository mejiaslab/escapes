/* =========================================================
   EXPEDIENTE ESCAPISTA — LÓGICA PRINCIPAL, NAVEGACIÓN LATERAL,
   DASHBOARD RESUMEN, OAUTH 2.0 Y VISUALIZACIÓN EN VIVO
   ========================================================= */

(function () {
  "use strict";

  const GOOGLE_CLIENT_ID =
    "719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com";
  const SPREADSHEET_ID = "1riZ1aM8txI27Zpm11VJzVv1mqGuCvDvZKilcs2n_Djg";
  const SHEET_RANGE = "Datos!A1:AO1000";

  const SESSION_KEY = "escapes_oauth_session_v2";
  const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
  const OAUTH_SCOPES = `openid email profile ${SHEETS_READONLY_SCOPE}`;

  const MEMBERS = [
    { key: "S", name: "Sara", color: "#f472b6", bg: "rgba(244, 114, 182, 0.18)" },
    { key: "M", name: "Miguel", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.18)" },
    { key: "R", name: "Rafa", color: "#34d399", bg: "rgba(52, 211, 153, 0.18)" },
    { key: "A", name: "Antonio", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.18)" },
    { key: "J", name: "Joan", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.18)" },
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

  const SECTIONS = {
    dashboard: { kicker: "VISTA GENERAL", title: "Dashboard · Resumen" },
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
    "evolucion-mapa": "mapa"
  };

  // Estado global de la aplicación
  const state = {
    user: null,
    tokenClient: null,
    activeSection: "dashboard",
    hasData: false,
    needsMapRender: false,
    needsChartsRender: false,
    allRooms: [],
    visitedRooms: [],
    pendingRooms: [],
    upcomingRooms: [],
    draftRooms: [],
    rankMode: "media",
    visitedFilter: {
      search: "",
      member: "ALL",
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
      themes: null
    },
    map: null,
    markerCluster: null
  };

  /* ---------------------------------------------------------
     UTILIDADES DE NORMALIZACIÓN Y FORMATO
     --------------------------------------------------------- */

  function normalizeKey(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
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

    // Pequeño desplazamiento en espiral áurea (~120m) cuando varias salas comparten local/ciudad
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
     PARSEADOR DE LA HOJA "DATOS" DE GOOGLE SHEETS
     --------------------------------------------------------- */

  function parseSheetValues(values) {
    const allRooms = [];
    const visitedRooms = [];
    const pendingRooms = [];
    const upcomingRooms = [];
    const draftRooms = [];
    const collisionCounter = {};

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const rows = Array.isArray(values) ? values.slice(2) : [];

    rows.forEach((rawRow, idx) => {
      const r = Array.from({ length: 41 }, (_, i) =>
        rawRow[i] !== undefined && rawRow[i] !== null ? String(rawRow[i]).trim() : ""
      );

      // Igual que =COUNTA(Salas) en la hoja Resumen: contamos filas con nombre de Sala
      if (!r[1]) return;

      const fechaRaw = r[10];
      const deNosotros = r[12].toUpperCase();
      const ciudad = cleanCityName(r[2]);
      const provincia = cleanProvinceName(r[3]);

      const saraDims = DIMENSIONS.map((_, i) => parseScore(r[16 + i]));
      const miguelDims = DIMENSIONS.map((_, i) => parseScore(r[24 + i]));
      const mediaDims = DIMENSIONS.map((_, i) => parseScore(r[32 + i]));

      const room = {
        id: idx + 3,
        empresa: r[0] || "Sin empresa",
        sala: r[1],
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
        sara: { dims: saraDims, general: saraDims[6], media: parseScore(r[23]) },
        miguel: { dims: miguelDims, general: miguelDims[6], media: parseScore(r[31]) },
        media: { dims: mediaDims, general: mediaDims[6], media: parseScore(r[39]) },
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
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const dt = new Date(y, m, d, 12, 0, 0);

          if (y < 1950) {
            // 30/12/1899 en Google Sheets corresponde a salas antiguas cuya fecha exacta no se anotó
            room.status = "visited";
            room.undated = true;
            room.fechaDisplay = "Sin fecha exacta";
            room.sortTimestamp = -1e15 + idx;
            room.coords = resolveCoordinates(room, collisionCounter);
            visitedRooms.push(room);
          } else if (dt <= endOfToday || deNosotros.length > 0) {
            room.status = "visited";
            room.year = y;
            room.fechaDisplay = `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
            room.sortTimestamp = dt.getTime();
            room.coords = resolveCoordinates(room, collisionCounter);
            visitedRooms.push(room);
          } else {
            room.status = "upcoming";
            room.year = y;
            room.fechaDisplay = `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
            room.sortTimestamp = dt.getTime();
            upcomingRooms.push(room);
          }
        }
      }

      allRooms.push(room);
    });

    // Ordenar visitadas por fecha descendiente
    visitedRooms.sort((a, b) => b.sortTimestamp - a.sortTimestamp || b.id - a.id);

    // Ordenar pendientes alfabéticamente por provincia y sala
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
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    } catch (_) {}
  }

  function clearSessionAndData() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem("escapes_oauth_session_v1");
      localStorage.removeItem("escapes_live_sheet_v1");
    } catch (_) {}

    state.hasData = false;
    state.needsMapRender = false;
    state.needsChartsRender = false;
    state.allRooms = [];
    state.visitedRooms = [];
    state.pendingRooms = [];
    state.upcomingRooms = [];
    state.draftRooms = [];

    if (state.charts.year) { state.charts.year.destroy(); state.charts.year = null; }
    if (state.charts.radar) { state.charts.radar.destroy(); state.charts.radar = null; }
    if (state.charts.themes) { state.charts.themes.destroy(); state.charts.themes = null; }
    if (state.markerCluster) state.markerCluster.clearLayers();

    [
      "hero-kpis",
      "dashboard-podium",
      "dashboard-recent",
      "dashboard-team-summary",
      "dashboard-pulse",
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
      "modal-body"
    ].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = "";
    });

    ["nav-badge-visited", "nav-badge-pending", "nav-badge-map"].forEach((id) => {
      const badge = document.getElementById(id);
      if (badge) badge.textContent = "0";
    });
  }

  function loadStoredSession() {
    try {
      localStorage.removeItem("escapes_live_sheet_v1");
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
      !window.google.accounts.oauth2.hasGrantedAllScopes(tokenResponse, SHEETS_READONLY_SCOPE)
    ) {
      if (tokenResponse.access_token) {
        try { window.google.accounts.oauth2.revoke(tokenResponse.access_token, () => {}); } catch (_) {}
      }
      setAuthMessage(
        `<strong>Permiso insuficiente:</strong> debes aceptar el permiso de lectura de Google Sheets para comprobar si tienes acceso a la hoja de cálculo.`
      );
      return;
    }

    const accessToken = tokenResponse.access_token;
    const expiresIn = Number(tokenResponse.expires_in || 3500);

    setLoginLoading(true, "Comprobando permisos en la hoja…");
    setAuthMessage("Verificando permisos de tu cuenta sobre la hoja de cálculo <strong>Escapes</strong>…", "info");

    let profile = {
      name: "Usuario Google",
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
     LECTURA DIRECTA Y EXCLUSIVA DESDE GOOGLE SHEETS API
     --------------------------------------------------------- */

  async function fetchLiveGoogleSheet(accessToken) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      SHEET_RANGE
    )}?valueRenderOption=FORMATTED_VALUE`;

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
    return {
      updatedAt: new Date().toISOString(),
      values: data.values || []
    };
  }

  function updateUserHeader(dataSourceInfo) {
    const user = state.user || { name: "Usuario", email: "", picture: "" };
    const avatarEl = document.getElementById("user-avatar");
    const initialsEl = document.getElementById("user-initials");
    const nameEl = document.getElementById("user-name");

    nameEl.textContent = user.name;
    nameEl.title = user.email ? `${user.name} (${user.email})` : user.name;

    if (user.picture) {
      avatarEl.src = user.picture;
      avatarEl.hidden = false;
      initialsEl.hidden = true;
    } else {
      avatarEl.hidden = true;
      initialsEl.hidden = false;
      initialsEl.textContent = (user.name || "U").trim().charAt(0).toUpperCase();
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
    footerInfo.textContent = `Acceso verificado (${user.email || user.name}) · Leído en directo de Google Sheets`;
  }

  async function verifyAndUnlockDashboard(candidateUser) {
    setLoginLoading(true, "Verificando permisos…");

    try {
      const dataset = await fetchLiveGoogleSheet(candidateUser.accessToken);

      // Permiso verificado con éxito en Google Sheets
      saveSession(candidateUser);
      clearAuthMessage();
      setLoginLoading(false);

      document.getElementById("auth-gate").hidden = true;
      document.getElementById("app-shell").hidden = false;

      parseSheetValues(dataset.values);
      updateUserHeader(dataset);

      // Mantener sección del hash si el usuario entró con enlace directo, o Dashboard por defecto
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
          try { window.google.accounts.oauth2.revoke(candidateUser.accessToken, () => {}); } catch (_) {}
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
    renderMembersCount();
    renderTeamSectionExtras();
    renderTop10();
    renderGeoBreakdown();
    populateVisitedFilters();
    renderVisitedTable();
    renderUpcomingSection();
    populatePendingFilters();
    renderPendingList();

    // El mapa y las gráficas en canvas se renderizan cuando su vista está visible para garantizar dimensiones exactas
    state.needsMapRender = true;
    state.needsChartsRender = true;
    refreshActiveSectionVisuals();
  }

  function updateSidebarBadges() {
    const uniqueCities = new Set(state.visitedRooms.map((r) => normalizeKey(r.ciudad))).size;
    document.getElementById("nav-badge-visited").textContent = String(state.visitedRooms.length);
    document.getElementById("nav-badge-pending").textContent = String(state.pendingRooms.length);
    document.getElementById("nav-badge-map").textContent = `${uniqueCities}`;
    document.getElementById("nav-badge-team").textContent = String(MEMBERS.length);

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
        <div class="kpi-sub">${rated.length} salas puntuadas · Ver Top 10</div>
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
    // 1. Podio Top 3 (Media Global)
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
                  <span class="dash-date-tag">${escapeHtml(r.fechaDisplay)}</span>
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

    // 4. Hoja de ruta (próximas reservas, pulso anual y provincias pendientes top)
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
        <button type="button" class="btn-link-action" data-nav-target="mapa">🗺️ Abrir mapa interactivo →</button>
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
            <span>Media: <strong>${fmtScore(avg)}★</strong></span>
            <span>Top: ${escapeHtml(favTheme)}</span>
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
    // Alineaciones míticas del equipo
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

    // Efectividad e hitos por integrante
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
    if (mode === "miguel") return room.miguel.media;
    if (mode === "sara") return room.sara.media;
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
                <span>🗓️ ${escapeHtml(r.fechaDisplay)}</span>
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
          <p>🗓️ ${escapeHtml(r.fechaDisplay)} · Nota: <strong>${fmtScore(r.media.media)}★</strong></p>
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
              ? `<span class="score-pill">★ ${fmtScore(r.media.media)}</span>`
              : `<span class="date-unknown">Sin nota</span>`;

          return `
            <tr data-room-id="${r.id}">
              <td class="date-cell ${r.undated ? "date-unknown" : ""}">${escapeHtml(r.fechaDisplay)}</td>
              <td>
                <div class="room-main-title">${escapeHtml(r.sala)}</div>
                <div class="room-sub-company">${escapeHtml(r.empresa)}</div>
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
          .map(
            (r) => `
              <div class="upcoming-mini-card">
                <div style="font-family:var(--font-mono);font-size:0.75rem;color:#6ee7b7">${escapeHtml(r.fechaDisplay)} · ${escapeHtml(
              r.ciudad
            )}</div>
                <div style="font-weight:700;color:#fff;margin-top:0.15rem">${escapeHtml(r.sala)}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary)">${escapeHtml(r.empresa)}</div>
              </div>
            `
          )
          .join("")}
      </div>
    `;
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
        const hay = normalizeKey(`${r.sala} ${r.empresa} ${r.ciudad} ${r.provincia} ${r.masInfo} ${r.tematica}`);
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
          <article class="pending-card">
            <div class="pending-card-top">
              <span class="pending-prov">📍 ${escapeHtml(r.provincia)} · ${escapeHtml(r.ciudad)}</span>
              <span class="theme-tag ${themeClass(r.tematica)}">${escapeHtml(r.tematica)}</span>
            </div>
            <div class="pending-title">${escapeHtml(r.sala)}</div>
            <div class="pending-company">${escapeHtml(r.empresa)}</div>
            ${r.masInfo ? `<span class="award-badge">🏆 ${escapeHtml(r.masInfo)}</span>` : ""}
            <div class="pending-specs">
              <span>👥 ${escapeHtml(playersTxt)}</span>
              <span>⏱️ ${escapeHtml(durTxt)}</span>
            </div>
          </article>
        `;
      })
      .join("");
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
    // 1. Radar 7 criterios (Media vs Sara vs Miguel)
    const avgMedia = DIMENSIONS.map((_, i) => {
      const vals = state.visitedRooms.map((r) => r.media.dims[i]).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });
    const avgSara = DIMENSIONS.map((_, i) => {
      const vals = state.visitedRooms.map((r) => r.sara.dims[i]).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });
    const avgMiguel = DIMENSIONS.map((_, i) => {
      const vals = state.visitedRooms.map((r) => r.miguel.dims[i]).filter((v) => v !== null);
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) : 0;
    });

    const radarCtx = document.getElementById("radarChart").getContext("2d");
    if (state.charts.radar) state.charts.radar.destroy();
    state.charts.radar = new Chart(radarCtx, {
      type: "radar",
      data: {
        labels: DIMENSIONS,
        datasets: [
          {
            label: "Media Global",
            data: avgMedia,
            borderColor: "#f5b038",
            backgroundColor: "rgba(245, 176, 56, 0.22)",
            borderWidth: 2.2,
            pointRadius: 3
          },
          {
            label: "Miguel",
            data: avgMiguel,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.12)",
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: "Sara",
            data: avgSara,
            borderColor: "#f472b6",
            backgroundColor: "rgba(244, 114, 182, 0.12)",
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
            min: 2.5,
            max: 4.5,
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
     MODAL DE DETALLE DE SALA
     --------------------------------------------------------- */

  function openRoomModal(roomId) {
    const r = state.allRooms.find((item) => item.id === roomId);
    if (!r) return;

    const modal = document.getElementById("room-modal");
    const body = document.getElementById("modal-body");

    const rowsHtml = DIMENSIONS.map(
      (dim, i) => `
        <tr>
          <td>${escapeHtml(dim)}</td>
          <td class="num">${fmtScore(r.sara.dims[i])}</td>
          <td class="num">${fmtScore(r.miguel.dims[i])}</td>
          <td class="num"><strong>${fmtScore(r.media.dims[i])}</strong></td>
        </tr>
      `
    ).join("");

    body.innerHTML = `
      <span class="section-kicker">${escapeHtml(r.empresa)} · ${escapeHtml(r.ciudad)} (${escapeHtml(r.provincia)})</span>
      <h3 id="modal-room-title" style="font-size:1.55rem;margin-bottom:0.5rem">${escapeHtml(r.sala)}</h3>

      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;margin-bottom:1rem">
        <span class="theme-tag ${themeClass(r.tematica)}">${escapeHtml(r.tematica)}</span>
        <span class="subtle-badge">🗓️ ${escapeHtml(r.fechaDisplay)}</span>
        ${r.jugadores ? `<span class="subtle-badge">👥 ${escapeHtml(r.jugadores)} jugadores</span>` : ""}
        ${r.tiempoMax ? `<span class="subtle-badge">⏱️ Máx: ${escapeHtml(r.tiempoMax)} min</span>` : ""}
        ${r.tiempoEmpleado ? `<span class="subtle-badge">🏁 Tiempo: ${escapeHtml(r.tiempoEmpleado)}</span>` : ""}
        ${r.media.media !== null ? `<span class="score-pill">Media: ★ ${fmtScore(r.media.media)}</span>` : ""}
      </div>

      <div style="margin-bottom:0.9rem">
        <span style="font-size:0.82rem;color:var(--text-secondary);margin-right:0.5rem">Participantes del grupo:</span>
        ${renderTeamDotsHtml(r.deNosotros)}
      </div>

      ${r.masInfo ? `<p style="margin:0.5rem 0"><span class="award-badge">🏆 ${escapeHtml(r.masInfo)}</span></p>` : ""}
      ${
        r.opinion
          ? `<p style="background:rgba(255,255,255,0.04);padding:0.75rem;border-radius:10px;font-size:0.88rem">${escapeHtml(
              r.opinion
            )}</p>`
          : ""
      }

      <table class="modal-scores-table">
        <thead>
          <tr>
            <th>Criterio</th>
            <th class="num" style="color:var(--col-s)">Sara</th>
            <th class="num" style="color:var(--col-m)">Miguel</th>
            <th class="num" style="color:var(--gold-bright)">Media</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="border-top:2px solid var(--border-gold)">
            <td><strong>Nota Media Final</strong></td>
            <td class="num"><strong>${fmtScore(r.sara.media)}</strong></td>
            <td class="num"><strong>${fmtScore(r.miguel.media)}</strong></td>
            <td class="num" style="color:var(--gold-bright)"><strong>★ ${fmtScore(r.media.media)}</strong></td>
          </tr>
        </tbody>
      </table>
    `;

    modal.hidden = false;
  }

  window.__openEscapeRoomModal = openRoomModal;

  /* ---------------------------------------------------------
     EVENTOS DE INTERFAZ Y ENRUTAMIENTO DE SECCIONES
     --------------------------------------------------------- */

  function bindEvents() {
    // Enlaces del menú lateral
    document.querySelectorAll(".sidebar-link[data-section-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToSection(link.getAttribute("data-section-link"));
      });
    });

    // Botones estáticos de salto rápido a secciones (ej. Ver Top 10, Historial, Marca...)
    document.querySelectorAll("[data-nav-target]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToSection(el.getAttribute("data-nav-target"));
      });
    });

    // Apertura/cierre del menú lateral en pantallas móviles/tablets
    document.getElementById("sidebar-open-btn").addEventListener("click", openMobileSidebar);
    document.getElementById("sidebar-close-btn").addEventListener("click", closeMobileSidebar);
    document.getElementById("sidebar-backdrop").addEventListener("click", closeMobileSidebar);

    // Sincronización con el historial del navegador (#dashboard, #visitadas, etc.)
    window.addEventListener("hashchange", () => {
      const target = resolveSectionFromHash();
      if (target !== state.activeSection) {
        navigateToSection(target, { updateHash: false });
      }
    });

    // Botón principal de inicio de sesión OAuth
    document.getElementById("oauth-login-btn").addEventListener("click", () => {
      requestGoogleLogin("select_account");
    });

    // Botón actualizar datos desde Google Sheet en vivo
    document.getElementById("sync-sheet-btn").addEventListener("click", async () => {
      if (state.user?.accessToken) {
        await verifyAndUnlockDashboard(state.user);
      } else {
        requestGoogleLogin("select_account");
      }
    });

    // Cerrar sesión OAuth, revocar token y limpiar todos los datos en memoria
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

    // Cierre de modal y menú móvil con Escape
    const modal = document.getElementById("room-modal");
    document.getElementById("modal-close-btn").addEventListener("click", () => {
      modal.hidden = true;
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.hidden = true;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modal.hidden) {
          modal.hidden = true;
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
