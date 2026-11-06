/**
 * Visited rooms history section: search/member/year filters, accessible table, and pagination.
 */

import { DEFAULT_ROOM_IMAGE } from "../../config.js";
import { resolveRoomCatalog } from "../../services/catalog.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatScore,
  getThemeClass,
  normalizeKey
} from "../../utils/formatters.js";
import { openRoomModal } from "../modals.js";
import {
  bindAccessibleActivate,
  navigateToSection,
  renderTeamDotsHtml
} from "../navigation.js";

let memberFilterSyncedCallback = null;

/**
 * Registers an optional listener notified when member filter changes (to sync team cards).
 * @param {() => void} callback
 */
export function onVisitedMemberFilterChange(callback) {
  memberFilterSyncedCallback = callback;
}

/**
 * Populates the visited rooms year selector from loaded room dates.
 */
export function populateVisitedFilters() {
  const yearSelect = document.getElementById("visited-year-filter");
  if (!yearSelect) return;
  const currentValue = state.visitedFilter.year;

  const years = Array.from(
    new Set(state.visitedRooms.filter((room) => room.year).map((room) => room.year))
  ).sort((a, b) => b - a);

  const hasUndated = state.visitedRooms.some((room) => room.undated);

  yearSelect.innerHTML =
    `<option value="ALL">Todos los años</option>` +
    years.map((year) => `<option value="${year}">${year}</option>`).join("") +
    (hasUndated ? `<option value="UNDATED">Sin fecha exacta</option>` : "");

  yearSelect.value =
    currentValue === "ALL" ||
    (currentValue === "UNDATED" && hasUndated) ||
    years.includes(Number(currentValue))
      ? currentValue
      : "ALL";
  state.visitedFilter.year = yearSelect.value;
}

/**
 * Renders the paginated visited rooms table and pagination controls.
 */
export function renderVisitedTable() {
  const { search, member, year, pageSize } = state.visitedFilter;
  const query = normalizeKey(search);

  const filtered = state.visitedRooms.filter((room) => {
    if (member !== "ALL" && !room.teamCode.includes(member)) return false;
    if (year === "UNDATED" && !room.undated) return false;
    if (year !== "ALL" && year !== "UNDATED" && String(room.year) !== year) return false;
    if (query) {
      const haystack = normalizeKey(
        `${room.name} ${room.company} ${room.city} ${room.province} ${room.theme}`
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const countPill = document.getElementById("visited-count-pill");
  if (countPill) countPill.textContent = formatInteger(filtered.length);

  const hasActiveFilter = Boolean(query) || member !== "ALL" || year !== "ALL";
  const resetBtn = document.getElementById("visited-reset-btn");
  if (resetBtn) resetBtn.hidden = !hasActiveFilter;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (state.visitedFilter.page > totalPages) state.visitedFilter.page = totalPages;
  const page = state.visitedFilter.page;

  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  const tbody = document.getElementById("visited-tbody");
  if (!tbody) return;

  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty-cell">No hay salas visitadas que coincidan con el filtro seleccionado.</td></tr>`;
  } else {
    tbody.innerHTML = slice
      .map((room) => {
        const resultHtml =
          room.escapeResult === "S"
            ? `<span class="status-ok">✓ Superada${
                room.timeUsed ? ` (${escapeHtml(room.timeUsed)})` : ""
              }</span>`
            : room.escapeResult === "N"
            ? `<span class="status-fail">✕ No superada</span>`
            : `<span class="date-unknown">—</span>`;

        const scoreHtml =
          room.average.score !== null
            ? `<span class="score-pill">★ ${formatScore(
                room.average.score
              )}</span><span class="raters-sub">${formatInteger(room.average.ratersCount)} ${
                room.average.ratersCount === 1 ? "miembro" : "miembros"
              }</span>`
            : `<span class="date-unknown">Sin nota</span>`;

        const catalog = resolveRoomCatalog(room);
        const imageSrc = catalog?.image || DEFAULT_ROOM_IMAGE;

        return `
          <tr data-room-id="${room.id}" tabindex="0" aria-label="Ver detalles de ${escapeHtml(
          room.name
        )}">
            <td class="date-cell ${room.undated ? "date-unknown" : ""}">${escapeHtml(
          room.displayDate
        )}</td>
            <td>
              <div class="table-room-cell">
                <img src="${escapeHtml(imageSrc)}" class="table-room-thumb" alt="" loading="lazy" />
                <div class="table-room-info">
                  <div class="table-room-title">
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
                  <div class="room-sub-company">${escapeHtml(room.company)}</div>
                </div>
              </div>
            </td>
            <td>${escapeHtml(room.city)} <span class="room-sub-company">(${escapeHtml(
          room.province
        )})</span></td>
            <td><span class="theme-tag ${getThemeClass(room.theme)}">${escapeHtml(
          room.theme
        )}</span></td>
            <td>${renderTeamDotsHtml(room.teamCode)}</td>
            <td>${resultHtml}</td>
            <td class="col-num">${scoreHtml}</td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("tr[data-room-id]").forEach((rowEl) => {
      bindAccessibleActivate(rowEl, () => {
        openRoomModal(Number(rowEl.getAttribute("data-room-id")));
      });
    });
  }

  const pagBar = document.getElementById("visited-pagination");
  if (!pagBar) return;

  const fromNum = filtered.length === 0 ? 0 : start + 1;
  const toNum = Math.min(start + pageSize, filtered.length);

  const pageButtons = [];
  const ellipsisHtml = `<span class="page-ellipsis">…</span>`;
  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    if (pageIdx === 1 || pageIdx === totalPages || Math.abs(pageIdx - page) <= 1) {
      pageButtons.push(
        `<button type="button" class="page-btn ${
          pageIdx === page ? "active" : ""
        }" data-page="${pageIdx}">${formatInteger(pageIdx)}</button>`
      );
    } else if (pageButtons[pageButtons.length - 1] !== ellipsisHtml) {
      pageButtons.push(ellipsisHtml);
    }
  }

  pagBar.innerHTML = `
    <div class="page-info">Mostrando <strong>${formatInteger(fromNum)}–${formatInteger(
    toNum
  )}</strong> de <strong>${formatInteger(
    filtered.length
  )}</strong> salas visitadas (ordenadas por fecha descendente)</div>
    <div class="page-controls">
      <button type="button" class="page-btn" data-page="${page - 1}" ${
    page <= 1 ? "disabled" : ""
  } aria-label="Página anterior">‹ Ant.</button>
      ${pageButtons.join("")}
      <button type="button" class="page-btn" data-page="${page + 1}" ${
    page >= totalPages ? "disabled" : ""
  } aria-label="Página siguiente">Sig. ›</button>
    </div>
  `;

  pagBar.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = Number(btn.getAttribute("data-page"));
      if (targetPage >= 1 && targetPage <= totalPages) {
        state.visitedFilter.page = targetPage;
        renderVisitedTable();
      }
    });
  });
}

/**
 * Applies a member filter to visited rooms and navigates to the Visited section.
 * @param {string} memberKey
 */
export function filterVisitedByMemberAndOpen(memberKey) {
  state.visitedFilter.member = memberKey;
  state.visitedFilter.page = 1;
  const select = document.getElementById("visited-member-filter");
  if (select) select.value = memberKey;
  if (typeof memberFilterSyncedCallback === "function") {
    memberFilterSyncedCallback();
  }
  renderVisitedTable();
  navigateToSection("visited");
}

/**
 * Applies a search query (e.g., city name) to visited rooms and navigates to the Visited section.
 * @param {string} searchQuery
 */
export function filterVisitedByQueryAndOpen(searchQuery) {
  state.visitedFilter.search = searchQuery;
  state.visitedFilter.page = 1;
  const searchInput = document.getElementById("visited-search");
  if (searchInput) searchInput.value = searchQuery;
  renderVisitedTable();
  navigateToSection("visited");
}

/**
 * Applies a year filter to visited rooms and navigates to the Visited section.
 * @param {string} yearValue
 */
export function filterVisitedByYearAndOpen(yearValue) {
  state.visitedFilter.year = yearValue;
  state.visitedFilter.page = 1;
  const yearSelect = document.getElementById("visited-year-filter");
  if (yearSelect) yearSelect.value = yearValue;
  renderVisitedTable();
  navigateToSection("visited");
}
