/**
 * Google Cloud OAuth 2.0 authentication, session lifecycle, and Google Sheets
 * authorization gatekeeper.
 */

import {
  GOOGLE_CLIENT_ID,
  OAUTH_SCOPES,
  SESSION_STORAGE_KEY,
  SHEETS_SCOPE
} from "../config.js";
import { resetStateData, state } from "../state.js";
import { clearIntroSessionFlag, playIntroSequence } from "../ui/intro.js";
import {
  closeMobileSidebar,
  navigateToSection,
  resolveSectionFromHash,
  updateUserHeader
} from "../ui/navigation.js";
import { escapeHtml } from "../utils/formatters.js";
import { parseSheetDataset, resolveCurrentMember } from "./data-parser.js";
import { fetchLiveGoogleSheet } from "./sheets-api.js";

const CLEARABLE_NODE_IDS = [
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
];

let renderAllHook = null;
let refreshVisualsHook = null;

/**
 * Registers UI rendering callbacks invoked once spreadsheet permissions are verified.
 * @param {{ onRenderAll: () => void, onRefreshVisuals: () => void }} hooks
 */
export function registerAuthLifecycleHooks({ onRenderAll, onRefreshVisuals }) {
  renderAllHook = onRenderAll;
  refreshVisualsHook = onRefreshVisuals;
}

/**
 * Displays a user-facing status/error alert inside the login card (100% Spanish).
 * @param {string} htmlMessage
 * @param {"error" | "info" | "setup"} [variant="error"]
 */
export function setAuthMessage(htmlMessage, variant = "error") {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.className = "auth-message";
  if (variant === "info") el.classList.add("auth-info");
  if (variant === "setup") el.classList.add("auth-setup");
  el.innerHTML = htmlMessage;
  el.hidden = false;
}

/**
 * Hides and clears the login status message box.
 */
export function clearAuthMessage() {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.innerHTML = "";
  el.hidden = true;
}

function setLoginLoading(isLoading, labelText) {
  const btn = document.getElementById("oauth-login-btn");
  const lbl = document.getElementById("oauth-login-label");
  if (btn) btn.disabled = isLoading;
  if (lbl) {
    lbl.textContent =
      labelText || (isLoading ? "Verificando acceso…" : "Iniciar sesión con Google");
  }
}

function saveSession(userObj) {
  state.user = userObj;
  state.currentMember = resolveCurrentMember(userObj);
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userObj));
  } catch (_) {
    // Ignore storage quota or private browsing restrictions
  }
}

/**
 * Clears stored OAuth session tokens, resets in-memory room data, and empties rendered containers.
 */
export function clearSessionAndData() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem("escapes_oauth_session_v2");
    sessionStorage.removeItem("escapes_oauth_session_v1");
    localStorage.removeItem("escapes_live_sheet_v1");
  } catch (_) {
    // Ignore storage errors
  }

  resetStateData();

  CLEARABLE_NODE_IDS.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.innerHTML = "";
  });

  ["nav-badge-visited", "nav-badge-pending", "nav-badge-map"].forEach((id) => {
    const badge = document.getElementById(id);
    if (badge) badge.textContent = "0";
  });

  const personalBadge = document.getElementById("nav-badge-personal");
  if (personalBadge) personalBadge.textContent = "Personal";
}

function loadStoredSession() {
  try {
    localStorage.removeItem("escapes_live_sheet_v1");
    sessionStorage.removeItem("escapes_oauth_session_v2");
    sessionStorage.removeItem("escapes_oauth_session_v1");
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.accessToken && parsed.exp && parsed.exp * 1000 > Date.now()) {
      return parsed;
    }
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (_) {
    // Ignore malformed session payloads
  }
  return null;
}

async function handleOAuthTokenResponse(tokenResponse) {
  setLoginLoading(false);

  if (tokenResponse.error) {
    console.warn("Google OAuth authorization returned error:", tokenResponse.error);
    setAuthMessage(
      "No se completó la autorización con Google. Vuelve a intentarlo cuando quieras."
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
      } catch (_) {
        // Ignore token revocation failures
      }
    }
    setAuthMessage(
      "<strong>Permiso insuficiente:</strong> debes aceptar el permiso de Google Sheets para poder consultar la hoja y guardar tus valoraciones personales."
    );
    return;
  }

  const accessToken = tokenResponse.access_token;
  const expiresIn = Number(tokenResponse.expires_in || 3500);

  setLoginLoading(true, "Comprobando permisos en la hoja…");
  setAuthMessage(
    "Verificando permisos de tu cuenta sobre la hoja de cálculo <strong>Escapes</strong>…",
    "info"
  );

  let profile = {
    name: "Usuario de Google",
    givenName: "",
    email: "",
    picture: ""
  };

  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      profile = {
        name: profileData.name || profileData.email || profile.name,
        givenName: profileData.given_name || "",
        email: profileData.email || "",
        picture: profileData.picture || ""
      };
    }
  } catch (profileErr) {
    console.warn("Could not fetch Google userinfo profile:", profileErr);
  }

  const candidateUser = {
    ...profile,
    accessToken,
    exp: Math.floor(Date.now() / 1000) + expiresIn
  };

  await verifyAndUnlockDashboard(candidateUser, { showIntro: true });
}

function handleOAuthError(err) {
  setLoginLoading(false);
  const errorType = err?.type || "popup_error";
  if (errorType === "popup_closed") return;

  console.error("Google OAuth client error:", err);
  setAuthMessage(
    `No se pudo abrir la ventana de inicio de sesión con Google. Comprueba que <code>${escapeHtml(
      window.location.origin
    )}</code> figure entre los orígenes de JavaScript autorizados del identificador de cliente OAuth.`
  );
}

/**
 * Triggers the Google OAuth 2.0 account consent popup.
 * @param {string} [promptMode="select_account"]
 */
export function requestGoogleLogin(promptMode = "select_account") {
  if (state.tokenClient) {
    clearAuthMessage();
    state.tokenClient.requestAccessToken({ prompt: promptMode });
  } else {
    setAuthMessage(
      "El servicio de autenticación de Google aún se está cargando. Espera un instante y vuelve a pulsar."
    );
  }
}

/**
 * Verifies live read access to the "Escapes" Google Sheet and unlocks the application shell.
 * @param {object} candidateUser
 * @param {{ showIntro?: boolean }} [options]
 */
export async function verifyAndUnlockDashboard(candidateUser, { showIntro = false } = {}) {
  setLoginLoading(true, "Verificando permisos…");

  try {
    const dataset = await fetchLiveGoogleSheet(candidateUser.accessToken);

    saveSession(candidateUser);
    clearAuthMessage();
    setLoginLoading(false);

    const authGate = document.getElementById("auth-gate");
    const appShell = document.getElementById("app-shell");
    if (authGate) authGate.hidden = true;
    if (appShell) appShell.hidden = true;

    parseSheetDataset(dataset);
    updateUserHeader(dataset);

    const initialSection = resolveSectionFromHash();
    navigateToSection(initialSection, { updateHash: false, scrollTop: false });
    if (typeof renderAllHook === "function") {
      renderAllHook();
    }

    if (showIntro) {
      await playIntroSequence();
    } else if (appShell) {
      appShell.hidden = false;
    }

    requestAnimationFrame(() => {
      if (typeof refreshVisualsHook === "function") {
        refreshVisualsHook();
      }
    });
  } catch (err) {
    console.error("Failed to verify Google Sheets access:", err);
    setLoginLoading(false);

    const authGate = document.getElementById("auth-gate");
    const appShell = document.getElementById("app-shell");
    if (appShell) appShell.hidden = true;
    if (authGate) authGate.hidden = false;

    const rawMsg = String(err.message || "");
    const isApiDisabled =
      err.reason === "SERVICE_DISABLED" ||
      rawMsg.includes("sheets.googleapis.com") ||
      rawMsg.includes("has not been used in project");

    if (isApiDisabled) {
      state.user = candidateUser;
      setAuthMessage(
        `⚙️ <strong>Falta activar la API de Google Sheets en Google Cloud</strong><br>` +
          `Para comprobar los permisos de la hoja y leer los datos en tiempo real, activa la API en el proyecto <code>719597836416</code>:<br>` +
          `<a href="https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=719597836416" target="_blank" rel="noopener noreferrer">Abrir la consola de Google Cloud y pulsar «Habilitar» ↗</a><br>` +
          `<button type="button" id="retry-sheet-btn" class="auth-inline-btn">🔄 Ya la he activado · Reintentar</button>`,
        "setup"
      );
      document
        .getElementById("retry-sheet-btn")
        ?.addEventListener("click", () =>
          verifyAndUnlockDashboard(candidateUser, { showIntro })
        );
      return;
    }

    if (err.status === 403 || err.status === 404) {
      if (candidateUser.accessToken && window.google?.accounts?.oauth2?.revoke) {
        try {
          window.google.accounts.oauth2.revoke(candidateUser.accessToken, () => {});
        } catch (_) {
          // Ignore token revocation errors
        }
      }
      state.user = null;
      clearSessionAndData();

      const accountLabel = candidateUser.email || candidateUser.name || "esta cuenta";
      setAuthMessage(
        `🔒 <strong>Acceso denegado</strong><br>` +
          `La cuenta <strong>${escapeHtml(
            accountLabel
          )}</strong> no tiene permiso para ver la hoja de cálculo <strong>Escapes</strong>.<br>` +
          `Solo quienes tienen acceso compartido en Google Sheets pueden visualizar los datos.<br>` +
          `<button type="button" id="switch-account-btn" class="auth-inline-btn">Cambiar de cuenta de Google</button>`
      );
      document
        .getElementById("switch-account-btn")
        ?.addEventListener("click", () => requestGoogleLogin("select_account"));
      return;
    }

    if (err.status === 401) {
      state.user = null;
      clearSessionAndData();
      setAuthMessage(
        "Tu sesión de Google ha caducado. Vuelve a iniciar sesión para acceder.",
        "info"
      );
      return;
    }

    clearSessionAndData();
    if (err.code === "NETWORK_ERROR") {
      setAuthMessage(
        "Error de red al conectar con Google Sheets. Revisa tu conexión a internet e inténtalo de nuevo."
      );
      return;
    }

    setAuthMessage(
      "No se pudo verificar el acceso a la hoja de cálculo en este momento. Inténtalo de nuevo en unos segundos."
    );
  }
}

/**
 * Revokes the active OAuth token, clears in-memory state, and returns to the login gate.
 */
export function logoutUser() {
  if (state.user?.accessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(state.user.accessToken, () => {});
    } catch (_) {
      // Ignore revocation failures
    }
  }

  state.user = null;
  clearIntroSessionFlag();
  clearSessionAndData();
  clearAuthMessage();
  closeMobileSidebar();
  navigateToSection("dashboard", { updateHash: false, scrollTop: true });

  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  const roomModal = document.getElementById("room-modal");
  const ratingModal = document.getElementById("rating-modal");
  const appShell = document.getElementById("app-shell");
  const authGate = document.getElementById("auth-gate");

  if (roomModal) roomModal.hidden = true;
  if (ratingModal) ratingModal.hidden = true;
  if (appShell) appShell.hidden = true;
  if (authGate) authGate.hidden = false;
}

/**
 * Restores any valid stored session and initializes the Google Identity Services token client.
 */
export function initGoogleOAuth() {
  const existingSession = loadStoredSession();
  if (existingSession) {
    verifyAndUnlockDashboard(existingSession, { showIntro: false });
  }

  let attempts = 0;
  const pollTimer = setInterval(() => {
    attempts += 1;
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      clearInterval(pollTimer);
      state.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: OAUTH_SCOPES,
        callback: handleOAuthTokenResponse,
        error_callback: handleOAuthError
      });
    } else if (attempts > 40) {
      clearInterval(pollTimer);
      console.error("Timed out waiting for Google Identity Services client script.");
      setAuthMessage(
        "No se pudo cargar el servicio de autenticación de Google. Revisa posibles bloqueadores de contenido o tu conexión a internet."
      );
    }
  }, 200);
}
