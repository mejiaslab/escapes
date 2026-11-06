/**
 * Pending rooms & confirmed upcoming reservations view with mutually exclusive
 * province and multi-theme faceted filters.
 */

import { DEFAULT_ROOM_IMAGE } from "../../config.js";
import { resolveRoomCatalog } from "../../services/catalog.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  getThemeClass,
  normalizeKey
} from "../../utils/formatters.js";
import { openRoomModal } from "../modals.js";
import { bindAccessibleActivate, navigateToSection } from "../navigation.js";

/**
 * Renders the upcoming confirmed reservations banner if future-dated rooms exist.
 */
export function renderUpcomingSection() {
  const wrap = document.getElementById("upcoming-section-wrap");
  if (!wrap) return;

  if (state.upcomingRooms.length === 0) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }

  wrap.hidden = false;
  wrap.innerHTML = `
    <span class="section-kicker kicker-emerald">AGENDA CONFIRMADA</span>
    <h4 class="upcoming-heading">📅 Próximas reservas con fecha (${formatInteger(
      state.upcomingRooms.length
    )})</h4>
    <div class="upcoming-cards-row">
      ${state.upcomingRooms
        .map((room) => {
          const catalog = resolveRoomCatalog(room);
          const imageSrc = catalog?.image || DEFAULT_ROOM_IMAGE;
          return `
            <div class="upcoming-mini-card" data-room-id="${
              room.id
            }" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHtml(room.name)}">
              <img src="${escapeHtml(imageSrc)}" class="upcoming-thumb" alt="${escapeHtml(
            room.name
          )}" loading="lazy" />
              <div class="upcoming-card-body">
                <div class="upcoming-date-city">${escapeHtml(room.displayDate)} · ${escapeHtml(
            room.city
          )}</div>
                <div class="upcoming-title-row">
                  <span>${escapeHtml(room.name)}</span>
                  ${
                    catalog?.url
                      ? `<a href="${escapeHtml(
                          catalog.url
                        )}" target="_blank" rel="noopener noreferrer" class="table-room-link" title="Visitar web oficial" aria-label="Visitar web oficial de ${escapeHtml(
                          room.name
                        )}">↗</a>`
                      : ""
                  }
                </div>
                <div class="upcoming-company">${escapeHtml(room.company)}</div>
                ${
                  catalog?.description
                    ? `<p class="pending-desc pending-desc-compact">${escapeHtml(
                        catalog.description
                      )}</p>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  wrap.querySelectorAll(".upcoming-mini-card[data-room-id]").forEach((cardEl) => {
    bindAccessibleActivate(cardEl, () => {
      openRoomModal(Number(cardEl.getAttribute("data-room-id")));
    });
  });
}

/**
 * Populates faceted province and multi-theme filter controls for pending rooms.
 */
export function populatePendingFilters() {
  if (!Array.isArray(state.pendingFilter.themes)) {
    state.pendingFilter.themes = [];
  }

  // 1. Theme facet restricted by currently selected province
  let themeFacetRooms = state.pendingRooms;
  if (state.pendingFilter.province && state.pendingFilter.province !== "ALL") {
    themeFacetRooms = state.pendingRooms.filter(
      (room) => room.province === state.pendingFilter.province
    );
  }

  const themeCounts = {};
  themeFacetRooms.forEach((room) => {
    if (room.theme) {
      themeCounts[room.theme] = (themeCounts[room.theme] || 0) + 1;
    }
  });

  state.pendingFilter.themes = state.pendingFilter.themes.filter((theme) =>
    Boolean(themeCounts[theme])
  );

  // 2. Province facet restricted by currently selected theme(s)
  let provFacetRooms = state.pendingRooms;
  if (state.pendingFilter.themes.length > 0) {
    provFacetRooms = state.pendingRooms.filter((room) =>
      state.pendingFilter.themes.includes(room.theme)
    );
  }

  const provCounts = {};
  provFacetRooms.forEach((room) => {
    if (room.province) {
      provCounts[room.province] = (provCounts[room.province] || 0) + 1;
    }
  });

  // Reset province to "ALL" if current province has zero matches for active themes
  if (state.pendingFilter.province !== "ALL" && !provCounts[state.pendingFilter.province]) {
    state.pendingFilter.province = "ALL";
    themeFacetRooms = state.pendingRooms;
    Object.keys(themeCounts).forEach((key) => delete themeCounts[key]);
    themeFacetRooms.forEach((room) => {
      if (room.theme) {
        themeCounts[room.theme] = (themeCounts[room.theme] || 0) + 1;
      }
    });
  }

  const provList = Object.entries(provCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
  );
  const themeList = Object.entries(themeCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")
  );

  const provSelect = document.getElementById("pending-province-select");
  if (provSelect) {
    provSelect.innerHTML =
      `<option value="ALL">Todas las provincias (${formatInteger(
        provFacetRooms.length
      )})</option>` +
      provList
        .map(
          ([prov, count]) =>
            `<option value="${escapeHtml(prov)}">${escapeHtml(prov)} (${formatInteger(
              count
            )})</option>`
        )
        .join("");
    provSelect.value = state.pendingFilter.province;
  }

  const selectedThemes = state.pendingFilter.themes;

  const themeOptionsContainer = document.getElementById("pending-theme-options");
  if (themeOptionsContainer) {
    const allSelected = selectedThemes.length === 0;
    let optionsHtml = `
      <label class="multiselect-option ${allSelected ? "is-selected" : ""}" data-theme-val="ALL">
        <input type="checkbox" class="multiselect-checkbox" value="ALL" ${
          allSelected ? "checked" : ""
        } />
        <span class="multiselect-option-label">
          <span><strong>Todas las temáticas</strong></span>
          <span class="multiselect-count">${formatInteger(themeFacetRooms.length)}</span>
        </span>
      </label>
    `;

    optionsHtml += themeList
      .map(([theme, count]) => {
        const isChecked = selectedThemes.includes(theme);
        return `
          <label class="multiselect-option ${
            isChecked ? "is-selected" : ""
          }" data-theme-val="${escapeHtml(theme)}">
            <input type="checkbox" class="multiselect-checkbox" value="${escapeHtml(theme)}" ${
          isChecked ? "checked" : ""
        } />
            <span class="multiselect-option-label">
              <span class="theme-tag ${getThemeClass(theme)}">${escapeHtml(theme)}</span>
              <span class="multiselect-count">${formatInteger(count)}</span>
            </span>
          </label>
        `;
      })
      .join("");

    themeOptionsContainer.innerHTML = optionsHtml;
  }

  const trigger = document.getElementById("pending-theme-trigger");
  const labelEl = document.getElementById("pending-theme-label");
  const badgeEl = document.getElementById("pending-theme-badge");

  if (trigger && labelEl && badgeEl) {
    if (selectedThemes.length === 0) {
      labelEl.textContent = "Todas las temáticas";
      badgeEl.hidden = true;
      trigger.classList.remove("has-active-selection");
    } else if (themeList.length > 0 && selectedThemes.length === themeList.length) {
      labelEl.textContent = `Todas (${formatInteger(selectedThemes.length)})`;
      badgeEl.textContent = formatInteger(selectedThemes.length);
      badgeEl.hidden = false;
      trigger.classList.add("has-active-selection");
    } else if (selectedThemes.length === 1) {
      labelEl.textContent = selectedThemes[0];
      badgeEl.textContent = "1";
      badgeEl.hidden = false;
      trigger.classList.add("has-active-selection");
    } else {
      labelEl.textContent = `${formatInteger(selectedThemes.length)} temáticas`;
      badgeEl.textContent = formatInteger(selectedThemes.length);
      badgeEl.hidden = false;
      trigger.classList.add("has-active-selection");
    }
  }

  const activeThemesBar = document.getElementById("pending-active-themes");
  if (activeThemesBar) {
    if (selectedThemes.length === 0) {
      activeThemesBar.hidden = true;
      activeThemesBar.innerHTML = "";
    } else {
      activeThemesBar.hidden = false;
      activeThemesBar.innerHTML = `
        <span class="active-themes-title">Temáticas:</span>
        ${selectedThemes
          .map(
            (theme) => `
              <span class="active-theme-chip ${getThemeClass(theme)}">
                ${escapeHtml(theme)}
                <button type="button" class="btn-chip-remove" data-remove-theme="${escapeHtml(
                  theme
                )}" aria-label="Quitar ${escapeHtml(theme)}">×</button>
              </span>
            `
          )
          .join("")}
        <button type="button" class="btn-clear-all-themes" id="pending-clear-all-themes">Quitar todas (${formatInteger(
          selectedThemes.length
        )})</button>
      `;
    }
  }

  const chipsContainer = document.getElementById("pending-province-chips");
  if (chipsContainer) {
    const isAllProv = state.pendingFilter.province === "ALL";
    chipsContainer.innerHTML =
      `<button type="button" class="prov-chip ${
        isAllProv ? "active" : ""
      }" aria-pressed="${isAllProv}" data-prov="ALL">Todas <b>${formatInteger(
        provFacetRooms.length
      )}</b></button>` +
      provList
        .map(([prov, count]) => {
          const isActive = state.pendingFilter.province === prov;
          return `<button type="button" class="prov-chip ${
            isActive ? "active" : ""
          }" aria-pressed="${isActive}" data-prov="${escapeHtml(prov)}">${escapeHtml(
            prov
          )} <b>${formatInteger(count)}</b></button>`;
        })
        .join("");

    chipsContainer.querySelectorAll(".prov-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prov = chip.getAttribute("data-prov");
        state.pendingFilter.province = prov;
        if (provSelect) provSelect.value = prov;
        populatePendingFilters();
        renderPendingList();
      });
    });
  }
}

/**
 * Renders the pending escape room cards matching active province, theme, and search filters.
 */
export function renderPendingList() {
  const { search, province, themes } = state.pendingFilter;
  const activeThemes = Array.isArray(themes) ? themes : [];
  const query = normalizeKey(search);

  const hasActiveFilter = Boolean(query) || province !== "ALL" || activeThemes.length > 0;
  const resetBtn = document.getElementById("pending-reset-btn");
  if (resetBtn) resetBtn.hidden = !hasActiveFilter;

  const filtered = state.pendingRooms.filter((room) => {
    if (province !== "ALL" && room.province !== province) return false;
    if (activeThemes.length > 0 && !activeThemes.includes(room.theme)) return false;
    if (query) {
      const catalog = resolveRoomCatalog(room);
      const synopsis = catalog?.description ? normalizeKey(catalog.description) : "";
      const haystack = normalizeKey(
        `${room.name} ${room.company} ${room.city} ${room.province} ${room.awards} ${room.theme} ${synopsis}`
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const countPill = document.getElementById("pending-count-pill");
  if (countPill) countPill.textContent = formatInteger(filtered.length);

  const grid = document.getElementById("pending-grid");
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="panel-card empty-grid-card">No hay salas pendientes con estos filtros.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((room) => {
      const catalog = resolveRoomCatalog(room);
      const imageSrc = catalog?.image || DEFAULT_ROOM_IMAGE;
      const playersText =
        room.minPlayers && room.maxPlayers
          ? `${room.minPlayers}–${room.maxPlayers} jug.${
              room.recommendedPlayers ? ` (rec. ${room.recommendedPlayers})` : ""
            }`
          : room.minPlayers || "—";
      const durationText = room.maxTime
        ? /^\d+$/.test(room.maxTime)
          ? `${room.maxTime} min`
          : room.maxTime
        : "—";

      return `
        <article class="pending-card" data-room-id="${
          room.id
        }" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHtml(room.name)}">
          <div class="pending-card-media" style="background-image:url('${escapeHtml(imageSrc)}')">
            <div class="pending-card-top">
              <span class="pending-prov">📍 ${escapeHtml(room.province)} · ${escapeHtml(
        room.city
      )}</span>
              <span class="theme-tag ${getThemeClass(room.theme)}">${escapeHtml(
        room.theme
      )}</span>
            </div>
          </div>
          <div class="pending-card-body">
            <div class="pending-title">${escapeHtml(room.name)}</div>
            <div class="pending-company">${escapeHtml(room.company)}</div>
            ${
              room.awards
                ? `<span class="award-badge">🏆 ${escapeHtml(room.awards)}</span>`
                : ""
            }
            ${
              catalog?.description
                ? `<p class="pending-desc">${escapeHtml(catalog.description)}</p>`
                : ""
            }
            <div class="pending-specs">
              <div class="pending-specs-meta">
                <span>👥 ${escapeHtml(playersText)}</span>
                <span>⏱️ ${escapeHtml(durationText)}</span>
              </div>
              ${
                catalog?.url
                  ? `<a href="${escapeHtml(
                      catalog.url
                    )}" target="_blank" rel="noopener noreferrer" class="pending-web-link">
                      ${catalog.closed ? "📁 Ficha ↗" : "🌐 Web ↗"}
                    </a>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll(".pending-card[data-room-id]").forEach((cardEl) => {
    bindAccessibleActivate(cardEl, () => {
      openRoomModal(Number(cardEl.getAttribute("data-room-id")));
    });
  });
}

/**
 * Selects a pending province filter and navigates directly to the Pending section.
 * @param {string} provinceName
 */
export function filterPendingByProvinceAndOpen(provinceName) {
  state.pendingFilter.province = provinceName;
  populatePendingFilters();
  renderPendingList();
  navigateToSection("pending");
}

/**
 * Binds event listeners for pending search, province selector, and multi-select theme popover.
 */
export function bindPendingFilterEvents() {
  document.getElementById("pending-search")?.addEventListener("input", (event) => {
    state.pendingFilter.search = event.target.value;
    renderPendingList();
  });

  document.getElementById("pending-province-select")?.addEventListener("change", (event) => {
    state.pendingFilter.province = event.target.value;
    populatePendingFilters();
    renderPendingList();
  });

  const themeDropdown = document.getElementById("pending-theme-dropdown");
  const themeTrigger = document.getElementById("pending-theme-trigger");
  const themePanel = document.getElementById("pending-theme-panel");
  const themeSearchInput = document.getElementById("pending-theme-search");
  const themeSelectAllBtn = document.getElementById("pending-theme-select-all");
  const themeClearBtn = document.getElementById("pending-theme-clear");
  const activeThemesBar = document.getElementById("pending-active-themes");

  function closeThemeDropdown() {
    if (themePanel && !themePanel.hidden) {
      themePanel.hidden = true;
      themeTrigger?.setAttribute("aria-expanded", "false");
      themeTrigger?.classList.remove("is-open");
    }
  }

  function filterThemeOptions(searchTerm) {
    const query = normalizeKey(searchTerm);
    const options = document.querySelectorAll("#pending-theme-options .multiselect-option");
    options.forEach((optionEl) => {
      const val = optionEl.getAttribute("data-theme-val");
      if (val === "ALL") {
        optionEl.hidden = Boolean(query);
        return;
      }
      optionEl.hidden = Boolean(query && !normalizeKey(val).includes(query));
    });
  }

  if (themeTrigger && themePanel) {
    themeTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willClose = !themePanel.hidden;
      themePanel.hidden = willClose;
      themeTrigger.setAttribute("aria-expanded", String(!willClose));
      themeTrigger.classList.toggle("is-open", !willClose);
      if (willClose === false && themeSearchInput) {
        themeSearchInput.value = "";
        filterThemeOptions("");
        setTimeout(() => themeSearchInput.focus(), 60);
      }
    });

    themePanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (themeDropdown && !themeDropdown.contains(event.target)) {
        closeThemeDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && themePanel && !themePanel.hidden) {
        closeThemeDropdown();
        themeTrigger?.focus();
      }
    });
  }

  themeSearchInput?.addEventListener("input", (event) => {
    filterThemeOptions(event.target.value);
  });

  themeSelectAllBtn?.addEventListener("click", () => {
    let availableRooms = state.pendingRooms;
    if (state.pendingFilter.province && state.pendingFilter.province !== "ALL") {
      availableRooms = state.pendingRooms.filter(
        (room) => room.province === state.pendingFilter.province
      );
    }
    state.pendingFilter.themes = Array.from(
      new Set(availableRooms.map((room) => room.theme).filter(Boolean))
    );
    populatePendingFilters();
    if (themeSearchInput?.value) {
      filterThemeOptions(themeSearchInput.value);
    }
    renderPendingList();
  });

  themeClearBtn?.addEventListener("click", () => {
    state.pendingFilter.themes = [];
    populatePendingFilters();
    if (themeSearchInput?.value) {
      filterThemeOptions(themeSearchInput.value);
    }
    renderPendingList();
  });

  document.getElementById("pending-theme-options")?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("input.multiselect-checkbox");
    if (!checkbox) return;

    const val = checkbox.value;
    if (val === "ALL") {
      state.pendingFilter.themes = [];
    } else {
      if (!Array.isArray(state.pendingFilter.themes)) {
        state.pendingFilter.themes = [];
      }
      if (checkbox.checked) {
        if (!state.pendingFilter.themes.includes(val)) {
          state.pendingFilter.themes.push(val);
        }
      } else {
        state.pendingFilter.themes = state.pendingFilter.themes.filter((item) => item !== val);
      }
    }
    populatePendingFilters();
    if (themeSearchInput?.value) {
      filterThemeOptions(themeSearchInput.value);
    }
    renderPendingList();
  });

  activeThemesBar?.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-theme]");
    if (removeBtn) {
      const themeToRemove = removeBtn.getAttribute("data-remove-theme");
      state.pendingFilter.themes = (state.pendingFilter.themes || []).filter(
        (item) => item !== themeToRemove
      );
      populatePendingFilters();
      renderPendingList();
      return;
    }

    if (event.target.closest("#pending-clear-all-themes")) {
      state.pendingFilter.themes = [];
      populatePendingFilters();
      renderPendingList();
    }
  });

  document.getElementById("pending-reset-btn")?.addEventListener("click", () => {
    state.pendingFilter = { search: "", province: "ALL", themes: [] };
    const pendingSearchEl = document.getElementById("pending-search");
    if (pendingSearchEl) pendingSearchEl.value = "";
    populatePendingFilters();
    renderPendingList();
  });
}
