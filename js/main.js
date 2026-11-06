/**
 * Application entrypoint coordinating section rendering, Google Sheets persistence,
 * event binding, and OAuth initialization.
 */

import {
  initGoogleOAuth,
  logoutUser,
  registerAuthLifecycleHooks,
  requestGoogleLogin,
  verifyAndUnlockDashboard
} from "./services/auth.js";
import { canMemberRateRoom, parseSheetDataset } from "./services/data-parser.js";
import {
  fetchLiveGoogleSheet,
  writeMemberRoomRating
} from "./services/sheets-api.js";
import { state } from "./state.js";
import {
  closeRatingModal,
  closeRoomModal,
  openRoomModal,
  registerSaveRatingHandler
} from "./ui/modals.js";
import {
  closeMobileSidebar,
  navigateToSection,
  onSectionActivated,
  openMobileSidebar,
  resolveSectionFromHash,
  updateSidebarBadges,
  updateUserHeader
} from "./ui/navigation.js";
import { renderDashboardSummary, renderHeroKpis } from "./ui/views/dashboard-view.js";
import { flyToMapPreset, renderGeoBreakdown, renderMap } from "./ui/views/map-view.js";
import {
  bindPendingFilterEvents,
  populatePendingFilters,
  renderPendingList,
  renderUpcomingSection
} from "./ui/views/pending-view.js";
import {
  renderPersonalCharts,
  renderPersonalRoomsTable,
  renderPersonalSection,
  setPersonalStatusFilter
} from "./ui/views/personal-view.js";
import { renderTop10 } from "./ui/views/ranking-view.js";
import { renderExtraStats, renderYearChart } from "./ui/views/stats-view.js";
import { renderMembersCount, renderTeamSectionExtras } from "./ui/views/team-view.js";
import {
  onVisitedMemberFilterChange,
  populateVisitedFilters,
  renderVisitedTable
} from "./ui/views/visited-view.js";

/**
 * Ensures active section interactive visuals (Leaflet map and Chart.js canvases)
 * are rendered or resized once their container is visible.
 */
function refreshActiveSectionVisuals() {
  if (!state.hasData) return;
  const appShell = document.getElementById("app-shell");
  if (appShell && appShell.hidden) return;

  if (state.activeSection === "map") {
    if (state.needsMapRender || !state.map) {
      renderMap();
      state.needsMapRender = false;
    } else {
      state.map.invalidateSize();
      setTimeout(() => state.map && state.map.invalidateSize(), 180);
    }
  }

  if (state.activeSection === "stats") {
    if (state.needsChartsRender) {
      renderYearChart();
      renderExtraStats();
      state.needsChartsRender = false;
    } else {
      state.charts.year?.resize();
      state.charts.radar?.resize();
      state.charts.themes?.resize();
    }
  }

  if (state.activeSection === "personal" && state.currentMember) {
    if (state.needsPersonalChartsRender) {
      renderPersonalCharts();
      state.needsPersonalChartsRender = false;
    } else {
      state.charts.personalRadar?.resize();
      state.charts.personalYear?.resize();
    }
  }
}

/**
 * Re-renders all views and schedules lazy visual updates for map and charts.
 */
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

/**
 * Saves or clears a member's room rating in Google Sheets and reloads live data.
 * @param {number} roomId
 * @param {Array<number | null>} dimensionsArray
 */
async function savePersonalRoomRating(roomId, dimensionsArray) {
  const member = state.currentMember;
  const room = state.allRooms.find((item) => item.id === roomId);

  if (!state.user?.accessToken || !member) {
    const err = new Error("Current Google user is not mapped to a core team member.");
    err.code = "UNIDENTIFIED_MEMBER";
    throw err;
  }

  if (!room || !canMemberRateRoom(member, room)) {
    const err = new Error("Member did not attend this visited room.");
    err.code = "NOT_ELIGIBLE";
    throw err;
  }

  await writeMemberRoomRating({
    accessToken: state.user.accessToken,
    member,
    room,
    dimensions: dimensionsArray,
    sheetMeta: state.memberSheetMeta[member.key]
  });

  const freshDataset = await fetchLiveGoogleSheet(state.user.accessToken);
  parseSheetDataset(freshDataset);
  updateUserHeader(freshDataset);
  renderAll();

  const roomModal = document.getElementById("room-modal");
  if (
    roomModal &&
    !roomModal.hidden &&
    state.openRoomModalId === roomId &&
    !state.ratingRoomId
  ) {
    openRoomModal(roomId);
  }
}

/**
 * Binds global DOM event listeners across navigation, filters, map presets, and modals.
 */
function bindGlobalEvents() {
  document.querySelectorAll(".sidebar-link[data-section-link]").forEach((linkEl) => {
    linkEl.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToSection(linkEl.getAttribute("data-section-link"));
    });
  });

  document.querySelectorAll("[data-nav-target]").forEach((targetEl) => {
    targetEl.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToSection(targetEl.getAttribute("data-nav-target"));
    });
  });

  document.getElementById("sidebar-open-btn")?.addEventListener("click", openMobileSidebar);
  document.getElementById("sidebar-close-btn")?.addEventListener("click", closeMobileSidebar);
  document.getElementById("sidebar-backdrop")?.addEventListener("click", closeMobileSidebar);

  window.addEventListener("hashchange", () => {
    const targetSection = resolveSectionFromHash();
    if (targetSection !== state.activeSection) {
      navigateToSection(targetSection, { updateHash: false });
    }
  });

  document.getElementById("oauth-login-btn")?.addEventListener("click", () => {
    requestGoogleLogin("select_account");
  });

  document.getElementById("sync-sheet-btn")?.addEventListener("click", async () => {
    if (state.user?.accessToken) {
      await verifyAndUnlockDashboard(state.user, { showIntro: false });
    } else {
      requestGoogleLogin("select_account");
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", logoutUser);

  // Top 10 Ranking mode selector
  document.querySelectorAll(".seg-btn[data-rank-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn[data-rank-mode]").forEach((other) => {
        other.classList.remove("active");
        other.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      state.rankMode = btn.getAttribute("data-rank-mode");
      renderTop10();
    });
  });

  // Personal Workspace filters
  document.querySelectorAll(".seg-btn[data-personal-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPersonalStatusFilter(btn.getAttribute("data-personal-status"));
    });
  });

  document.getElementById("personal-search")?.addEventListener("input", (event) => {
    state.personalFilter.search = event.target.value;
    state.personalFilter.page = 1;
    renderPersonalRoomsTable();
  });

  document.getElementById("personal-year-filter")?.addEventListener("change", (event) => {
    state.personalFilter.year = event.target.value;
    state.personalFilter.page = 1;
    renderPersonalRoomsTable();
  });

  document.getElementById("personal-page-size")?.addEventListener("change", (event) => {
    state.personalFilter.pageSize = Number(event.target.value) || 10;
    state.personalFilter.page = 1;
    renderPersonalRoomsTable();
  });

  document.getElementById("personal-reset-btn")?.addEventListener("click", () => {
    state.personalFilter = {
      status: "ALL",
      search: "",
      year: "ALL",
      page: 1,
      pageSize: state.personalFilter.pageSize
    };
    const searchEl = document.getElementById("personal-search");
    const yearEl = document.getElementById("personal-year-filter");
    if (searchEl) searchEl.value = "";
    if (yearEl) yearEl.value = "ALL";
    document.querySelectorAll(".seg-btn[data-personal-status]").forEach((btn) => {
      const isAll = btn.getAttribute("data-personal-status") === "ALL";
      btn.classList.toggle("active", isAll);
      btn.setAttribute("aria-pressed", String(isAll));
    });
    renderPersonalRoomsTable();
  });

  // Map quick viewport buttons
  document.querySelectorAll(".chip-btn[data-map-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip-btn[data-map-view]").forEach((other) => {
        other.classList.remove("active");
        other.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      flyToMapPreset(btn.getAttribute("data-map-view"));
    });
  });

  // Visited rooms filters
  document.getElementById("visited-search")?.addEventListener("input", (event) => {
    state.visitedFilter.search = event.target.value;
    state.visitedFilter.page = 1;
    renderVisitedTable();
  });

  document.getElementById("visited-member-filter")?.addEventListener("change", (event) => {
    state.visitedFilter.member = event.target.value;
    state.visitedFilter.page = 1;
    renderMembersCount();
    renderVisitedTable();
  });

  document.getElementById("visited-year-filter")?.addEventListener("change", (event) => {
    state.visitedFilter.year = event.target.value;
    state.visitedFilter.page = 1;
    renderVisitedTable();
  });

  document.getElementById("visited-page-size")?.addEventListener("change", (event) => {
    state.visitedFilter.pageSize = Number(event.target.value) || 10;
    state.visitedFilter.page = 1;
    renderVisitedTable();
  });

  document.getElementById("visited-reset-btn")?.addEventListener("click", () => {
    state.visitedFilter = {
      search: "",
      member: "ALL",
      year: "ALL",
      page: 1,
      pageSize: state.visitedFilter.pageSize
    };
    const searchEl = document.getElementById("visited-search");
    const memberEl = document.getElementById("visited-member-filter");
    const yearEl = document.getElementById("visited-year-filter");
    if (searchEl) searchEl.value = "";
    if (memberEl) memberEl.value = "ALL";
    if (yearEl) yearEl.value = "ALL";
    renderMembersCount();
    renderVisitedTable();
  });

  // Pending rooms filters & multi-select dropdown
  bindPendingFilterEvents();

  // Modals & Escape key handling
  const roomModal = document.getElementById("room-modal");
  const ratingModal = document.getElementById("rating-modal");

  document.getElementById("modal-close-btn")?.addEventListener("click", closeRoomModal);
  roomModal?.addEventListener("click", (event) => {
    if (event.target === roomModal) {
      closeRoomModal();
    }
  });

  document.getElementById("rating-modal-close-btn")?.addEventListener("click", () => {
    closeRatingModal();
  });
  ratingModal?.addEventListener("click", (event) => {
    if (event.target === ratingModal) {
      closeRatingModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (ratingModal && !ratingModal.hidden) {
        closeRatingModal();
      } else if (roomModal && !roomModal.hidden) {
        closeRoomModal();
      } else {
        closeMobileSidebar();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Chart !== "undefined" && Chart.defaults) {
    Chart.defaults.locale = "es-ES";
  }

  onSectionActivated(refreshActiveSectionVisuals);
  onVisitedMemberFilterChange(renderMembersCount);
  registerSaveRatingHandler(savePersonalRoomRating);
  registerAuthLifecycleHooks({
    onRenderAll: renderAll,
    onRefreshVisuals: refreshActiveSectionVisuals
  });

  bindGlobalEvents();
  initGoogleOAuth();
});
