/**
 * Section hash routing, mobile drawer sidebar controls, topbar header status,
 * notification banner, and shared team badge helpers.
 */

import { HASH_ALIASES, MEMBERS, SECTIONS } from "../config.js";
import { state } from "../state.js";
import {
  escapeHtml,
  formatInteger,
  formatTime24h,
  normalizeKey
} from "../utils/formatters.js";

let sectionActivatedCallback = null;

/**
 * Registers a callback executed on the next animation frame whenever the active section changes.
 * @param {() => void} callback
 */
export function onSectionActivated(callback) {
  sectionActivatedCallback = callback;
}

/**
 * Resolves the active section ID from the current URL hash, supporting legacy Spanish aliases.
 * @returns {string}
 */
export function resolveSectionFromHash() {
  const rawHash = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();
  if (!rawHash) return "dashboard";
  if (SECTIONS[rawHash]) return rawHash;
  if (HASH_ALIASES[rawHash]) return HASH_ALIASES[rawHash];
  return "dashboard";
}

/**
 * Opens the off-canvas navigation drawer on mobile and tablet viewports.
 */
export function openMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const openBtn = document.getElementById("sidebar-open-btn");
  if (sidebar) sidebar.classList.add("is-open");
  if (backdrop) backdrop.hidden = false;
  if (openBtn) openBtn.setAttribute("aria-expanded", "true");
}

/**
 * Closes the off-canvas navigation drawer on mobile and tablet viewports.
 */
export function closeMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const openBtn = document.getElementById("sidebar-open-btn");
  if (sidebar) sidebar.classList.remove("is-open");
  if (backdrop) backdrop.hidden = true;
  if (openBtn) openBtn.setAttribute("aria-expanded", "false");
}

/**
 * Switches the visible section view, updates sidebar active state, and syncs URL hash.
 * @param {string} sectionId
 * @param {{ updateHash?: boolean, scrollTop?: boolean }} [options]
 */
export function navigateToSection(sectionId, options = {}) {
  const { updateHash = true, scrollTop = true } = options;
  const target = SECTIONS[sectionId] ? sectionId : "dashboard";
  state.activeSection = target;

  document.querySelectorAll(".app-view[data-section]").forEach((sectionEl) => {
    sectionEl.hidden = sectionEl.getAttribute("data-section") !== target;
  });

  document.querySelectorAll(".sidebar-link[data-section-link]").forEach((linkEl) => {
    const isMatch = linkEl.getAttribute("data-section-link") === target;
    linkEl.classList.toggle("active", isMatch);
    if (isMatch) {
      linkEl.setAttribute("aria-current", "page");
    } else {
      linkEl.removeAttribute("aria-current");
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
    if (typeof sectionActivatedCallback === "function") {
      sectionActivatedCallback();
    }
  });
}

/**
 * Updates numeric counter pills in the sidebar navigation.
 */
export function updateSidebarBadges() {
  const uniqueCities = new Set(state.visitedRooms.map((room) => normalizeKey(room.city))).size;
  const visitedBadge = document.getElementById("nav-badge-visited");
  const pendingBadge = document.getElementById("nav-badge-pending");
  const mapBadge = document.getElementById("nav-badge-map");
  const teamBadge = document.getElementById("nav-badge-team");

  if (visitedBadge) visitedBadge.textContent = formatInteger(state.visitedRooms.length);
  if (pendingBadge) pendingBadge.textContent = formatInteger(state.pendingRooms.length);
  if (mapBadge) mapBadge.textContent = formatInteger(uniqueCities);
  if (teamBadge) teamBadge.textContent = formatInteger(MEMBERS.length);

  const personalBadge = document.getElementById("nav-badge-personal");
  if (personalBadge) {
    if (state.currentMember) {
      const myRooms = state.visitedRooms.filter((room) =>
        room.teamCode.includes(state.currentMember.key)
      );
      const unratedCount = myRooms.filter(
        (room) => !room.ratings[state.currentMember.key]?.hasAnyScore
      ).length;
      personalBadge.textContent =
        unratedCount > 0
          ? `${state.currentMember.name} · ${formatInteger(unratedCount)}`
          : state.currentMember.name;
    } else {
      personalBadge.textContent = "Personal";
    }
  }

  const quickStats = document.getElementById("sidebar-quick-stats");
  if (quickStats) {
    quickStats.textContent = `${formatInteger(state.visitedRooms.length)} visitadas · ${formatInteger(
      state.pendingRooms.length
    )} pendientes`;
  }
}

/**
 * Updates the topbar user profile chip, live sync timestamp (24h HH:mm), and footer info.
 * @param {{ updatedAt?: string } | null} dataSourceInfo
 */
export function updateUserHeader(dataSourceInfo) {
  const user = state.user || { name: "Usuario", email: "", picture: "" };
  const member = state.currentMember;
  const avatarEl = document.getElementById("user-avatar");
  const initialsEl = document.getElementById("user-initials");
  const nameEl = document.getElementById("user-name");

  if (nameEl) {
    nameEl.textContent = member ? `${user.name} · ${member.name}` : user.name;
    nameEl.title = user.email ? `${user.name} (${user.email})` : user.name;
  }

  if (avatarEl && initialsEl) {
    if (user.picture) {
      avatarEl.src = user.picture;
      avatarEl.hidden = false;
      initialsEl.hidden = true;
    } else {
      avatarEl.hidden = true;
      initialsEl.hidden = false;
      initialsEl.textContent = (member ? member.key : (user.name || "U").trim().charAt(0)).toUpperCase();
    }
  }

  const badge = document.getElementById("data-source-badge");
  const footerInfo = document.getElementById("footer-sync-info");
  const timeText = formatTime24h(dataSourceInfo?.updatedAt);

  if (badge) {
    badge.textContent = timeText ? `● En vivo (${timeText})` : "● En vivo";
  }
  if (footerInfo) {
    const memberText = member ? ` · Miembro: ${member.name} (hoja ${member.sheet})` : "";
    footerInfo.textContent = `Acceso verificado (${user.email || user.name})${memberText}`;
  }
}

/**
 * Displays a temporary feedback banner below the topbar.
 * @param {string} htmlText
 * @param {"success" | "error" | "info"} [variant="success"]
 * @param {number} [autoHideMs=4800]
 */
export function showSyncBanner(htmlText, variant = "success", autoHideMs = 4800) {
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

/**
 * Renders color-coded team member initial badges for a room's team attendance string.
 * @param {string} teamCode
 * @returns {string}
 */
export function renderTeamDotsHtml(teamCode) {
  if (!teamCode) return '<span class="date-unknown">—</span>';
  const order = ["S", "M", "R", "A", "J", "+"];
  return `<span class="team-dots">${order
    .filter((code) => teamCode.includes(code))
    .map((code) => {
      const dotClass = code === "+" ? "dot-plus" : `dot-${code}`;
      const memberName = MEMBERS.find((member) => member.key === code)?.name || code;
      return `<span class="team-dot ${dotClass}" title="${escapeHtml(memberName)}" aria-label="${escapeHtml(
        memberName
      )}">${code}</span>`;
    })
    .join("")}</span>`;
}

/**
 * Attaches keyboard activation (Enter / Space) to interactive non-button elements (cards, rows).
 * Ignores events originating from nested links or buttons.
 * @param {HTMLElement} element
 * @param {() => void} onActivate
 */
export function bindAccessibleActivate(element, onActivate) {
  element.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    onActivate();
  });
  element.addEventListener("keydown", (event) => {
    if (event.target !== element) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  });
}
