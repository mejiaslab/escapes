/**
 * Personal member workspace ("Mi espacio"): individual KPIs, filterable/paginated
 * personal rooms rating table, personal Top 5, companions/themes affinities, and charts.
 */

import { DEFAULT_ROOM_IMAGE, DIMENSIONS, MEMBERS } from "../../config.js";
import { getPosterOrCatalogImage, resolveRoomCatalog } from "../../services/catalog.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatOneDecimal,
  formatScore,
  getFallbackGradient,
  getThemeClass,
  normalizeKey
} from "../../utils/formatters.js";
import { openRatingModal, openRoomModal } from "../modals.js";
import { bindAccessibleActivate, renderTeamDotsHtml } from "../navigation.js";

/**
 * Renders the Personal Workspace section according to the matched Google user profile.
 */
export function renderPersonalSection() {
  const member = state.currentMember;
  const heroCopy = document.getElementById("personal-hero-copy");
  const kpisEl = document.getElementById("personal-kpis");
  const unmatchedCard = document.getElementById("personal-unmatched-card");
  const memberContent = document.getElementById("personal-member-content");

  if (!heroCopy || !kpisEl || !unmatchedCard || !memberContent) return;

  if (!member) {
    const displayName = state.user?.name || state.user?.email || "Usuario";
    heroCopy.innerHTML = `
      <div class="eyebrow">
        <span class="eyebrow-key">👤 ZONA PERSONAL</span>
      </div>
      <h2 id="heading-personal">Hola, <span class="text-gradient">${escapeHtml(
        displayName
      )}</span></h2>
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
      <p class="panel-sub panel-sub-relaxed">
        Solo los miembros registrados del equipo (<strong>Sara, Miguel, Rafa/Rafael, Antonio y Joan</strong>) pueden añadir valoraciones a las salas que hayan visitado. Puedes seguir consultando todas las estadísticas generales del grupo desde el menú lateral.
      </p>
    `;
    return;
  }

  unmatchedCard.hidden = true;
  memberContent.hidden = false;

  const myVisited = state.visitedRooms.filter((room) => room.teamCode.includes(member.key));
  const myRated = myVisited.filter((room) => room.ratings[member.key]?.hasAverage);
  const myAnyRated = myVisited.filter((room) => room.ratings[member.key]?.hasAnyScore);
  const pendingRateCount = myVisited.length - myAnyRated.length;

  const myAvg = myRated.length
    ? myRated.reduce((sum, room) => sum + room.ratings[member.key].average, 0) / myRated.length
    : null;

  const sharedComparison = myRated.filter(
    (room) => room.average.score !== null && room.average.ratersCount >= 2
  );
  let diffText = "Media sobre 6 criterios (sin Dificultad)";
  if (sharedComparison.length > 0) {
    const delta =
      sharedComparison.reduce(
        (sum, room) => sum + (room.ratings[member.key].average - room.average.score),
        0
      ) / sharedComparison.length;
    const sign = delta > 0.01 ? "+" : "";
    diffText = `${sign}${formatScore(delta)} frente a la media grupal (${formatInteger(
      sharedComparison.length
    )} salas compartidas)`;
  }

  const escapedCount = myVisited.filter((room) => room.escapeResult === "S").length;
  const failedCount = myVisited.filter((room) => room.escapeResult === "N").length;
  const evaluatedTotal = escapedCount + failedCount;
  const winPct =
    evaluatedTotal > 0 ? formatOneDecimal((escapedCount / evaluatedTotal) * 100) : "—";

  const topMyRoom = myRated
    .slice()
    .sort(
      (a, b) =>
        (b.ratings[member.key].average ?? 0) - (a.ratings[member.key].average ?? 0) ||
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
      <span class="subtle-badge">📄 Hoja Google Sheets: <strong>${escapeHtml(
        member.sheet
      )}</strong></span>
    </div>
    <h2 id="heading-personal">Espacio de <span class="text-gradient">${escapeHtml(
      member.name
    )}</span></h2>
    <p class="hero-lead">
      Consulta tus estadísticas individuales y puntúa únicamente las salas que has visitado. La nota media excluye automáticamente <strong>Dificultad</strong> y se guarda en directo en tu hoja <code>${escapeHtml(
        member.sheet
      )}</code>.
    </p>
  `;

  kpisEl.innerHTML = `
    <button type="button" class="kpi-tile" data-personal-jump="rooms-all">
      <div class="kpi-head-row">
        <span class="kpi-label">Mis salas visitadas</span>
        <span class="kpi-arrow" aria-hidden="true">↓</span>
      </div>
      <div class="kpi-value" style="color:${member.color}">${formatInteger(
    myVisited.length
  )}</div>
      <div class="kpi-sub">${formatInteger(
        attendancePct
      )}% del total del grupo · Éxito: <strong>${winPct}%</strong></div>
    </button>

    <button type="button" class="kpi-tile kpi-highlight" data-personal-jump="rooms-unrated">
      <div class="kpi-head-row">
        <span class="kpi-label">Mis valoraciones</span>
        <span class="kpi-arrow" aria-hidden="true">✍️</span>
      </div>
      <div class="kpi-value">${formatInteger(
        myAnyRated.length
      )} <small class="kpi-unit-muted">/ ${formatInteger(myVisited.length)}</small></div>
      <div class="kpi-sub">${
        pendingRateCount > 0
          ? `<strong class="text-gold-bright">${formatInteger(
              pendingRateCount
            )} pendientes de valorar</strong> · Filtrar`
          : `<strong class="text-emerald-soft">¡Todas tus salas están valoradas!</strong>`
      }</div>
    </button>

    <button type="button" class="kpi-tile" data-personal-jump="stats">
      <div class="kpi-head-row">
        <span class="kpi-label">Mi nota media</span>
        <span class="kpi-arrow" aria-hidden="true">↓</span>
      </div>
      <div class="kpi-value">${formatScore(
        myAvg
      )} <small class="kpi-unit-gold">/ 5</small></div>
      <div class="kpi-sub">${escapeHtml(diffText)}</div>
    </button>

    <button type="button" class="kpi-tile" data-personal-top-room="${
      topMyRoom ? topMyRoom.id : ""
    }">
      <div class="kpi-head-row">
        <span class="kpi-label">Mi favorita (#1)</span>
        <span class="kpi-arrow" aria-hidden="true">★</span>
      </div>
      <div class="kpi-value kpi-value-clamp">${
        topMyRoom ? escapeHtml(topMyRoom.name) : "Sin valorar aún"
      }</div>
      <div class="kpi-sub">${
        topMyRoom
          ? `★ ${formatScore(topMyRoom.ratings[member.key].average)} · ${escapeHtml(
              topMyRoom.company
            )}`
          : "Puntúa tus salas abajo para generar tu clasificación"
      }</div>
    </button>
  `;

  kpisEl.querySelectorAll("[data-personal-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-personal-jump");
      if (target === "rooms-unrated") {
        setPersonalStatusFilter("UNRATED");
        document
          .getElementById("personal-rooms-anchor")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (target === "rooms-all") {
        setPersonalStatusFilter("ALL");
        document
          .getElementById("personal-rooms-anchor")
          ?.scrollIntoView({ behavior: "smooth" });
      } else if (target === "stats") {
        document
          .getElementById("personal-stats-anchor")
          ?.scrollIntoView({ behavior: "smooth" });
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

/**
 * Updates the active rating status filter ("ALL" | "UNRATED" | "RATED") and re-renders.
 * @param {string} statusValue
 */
export function setPersonalStatusFilter(statusValue) {
  state.personalFilter.status = statusValue;
  state.personalFilter.page = 1;
  document.querySelectorAll("[data-personal-status]").forEach((btn) => {
    const isActive = btn.getAttribute("data-personal-status") === statusValue;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  if (state.currentMember) {
    const myVisited = state.visitedRooms.filter((room) =>
      room.teamCode.includes(state.currentMember.key)
    );
    renderPersonalRoomsTable(myVisited);
  }
}

/**
 * Populates the personal rooms year filter selector.
 * @param {Array<object>} myVisited
 */
export function populatePersonalFilters(myVisited) {
  const yearSelect = document.getElementById("personal-year-filter");
  if (!yearSelect) return;
  const currentValue = state.personalFilter.year;

  const years = Array.from(
    new Set(myVisited.filter((room) => room.year).map((room) => room.year))
  ).sort((a, b) => b - a);
  const hasUndated = myVisited.some((room) => room.undated);

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
  state.personalFilter.year = yearSelect.value;
}

/**
 * Renders the paginated table of rooms visited by the authenticated member.
 * @param {Array<object>} [myVisitedInput]
 */
export function renderPersonalRoomsTable(myVisitedInput) {
  const member = state.currentMember;
  if (!member) return;

  const list =
    myVisitedInput ||
    state.visitedRooms.filter((room) => room.teamCode.includes(member.key));
  const { status, search, year, pageSize } = state.personalFilter;
  const query = normalizeKey(search);

  const unratedTotal = list.filter((room) => !room.ratings[member.key]?.hasAnyScore).length;
  const ratedTotal = list.length - unratedTotal;

  document.querySelectorAll("[data-personal-status]").forEach((btn) => {
    const statusKey = btn.getAttribute("data-personal-status");
    if (statusKey === "ALL") btn.textContent = `Todas (${formatInteger(list.length)})`;
    if (statusKey === "UNRATED")
      btn.textContent = `Pendientes (${formatInteger(unratedTotal)})`;
    if (statusKey === "RATED") btn.textContent = `Valoradas (${formatInteger(ratedTotal)})`;
  });

  const filtered = list.filter((room) => {
    const hasScore = Boolean(room.ratings[member.key]?.hasAnyScore);
    if (status === "UNRATED" && hasScore) return false;
    if (status === "RATED" && !hasScore) return false;
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

  const countPill = document.getElementById("personal-rooms-count-pill");
  if (countPill) countPill.textContent = formatInteger(filtered.length);

  const hasFilter = status !== "ALL" || Boolean(query) || year !== "ALL";
  const resetBtn = document.getElementById("personal-reset-btn");
  if (resetBtn) resetBtn.hidden = !hasFilter;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (state.personalFilter.page > totalPages) state.personalFilter.page = totalPages;
  const page = state.personalFilter.page;

  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  const tbody = document.getElementById("personal-tbody");
  if (!tbody) return;

  if (slice.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty-cell">No hay salas visitadas por ti que coincidan con este filtro.</td></tr>`;
  } else {
    tbody.innerHTML = slice
      .map((room) => {
        const myRating = room.ratings[member.key];
        const myScoreHtml =
          myRating?.average !== null
            ? `<span class="score-pill" style="border-color:${member.color}66;color:${member.color};background:${member.bg}">★ ${formatScore(
                myRating.average
              )}</span>`
            : myRating?.hasAnyScore
            ? `<span class="unrated-pill">Solo Dif.: ${formatScore(
                myRating.dimensions[0]
              )}</span>`
            : `<span class="unrated-pill">Sin valorar</span>`;

        const groupScoreHtml =
          room.average.score !== null
            ? `<span class="score-pill">★ ${formatScore(
                room.average.score
              )}</span><span class="raters-sub">${formatInteger(
                room.average.ratersCount
              )} val.</span>`
            : `<span class="date-unknown">—</span>`;

        const actionButton = myRating?.hasAnyScore
          ? `<button type="button" class="btn-rate-room" data-rate-room-id="${room.id}">✏️ Editar</button>`
          : `<button type="button" class="btn-rate-room is-unrated" data-rate-room-id="${room.id}">✍️ Valorar</button>`;

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
                  <div class="room-sub-company">${escapeHtml(
                    room.company
                  )} · <span class="theme-tag theme-tag-xs ${getThemeClass(
          room.theme
        )}">${escapeHtml(room.theme)}</span></div>
                </div>
              </div>
            </td>
            <td>${escapeHtml(room.city)} <span class="room-sub-company">(${escapeHtml(
          room.province
        )})</span></td>
            <td>${renderTeamDotsHtml(room.teamCode)}</td>
            <td class="col-num">${groupScoreHtml}</td>
            <td class="col-num">${myScoreHtml}</td>
            <td class="col-num">${actionButton}</td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll("button[data-rate-room-id]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        openRatingModal(Number(btn.getAttribute("data-rate-room-id")));
      });
    });

    tbody.querySelectorAll("tr[data-room-id]").forEach((rowEl) => {
      bindAccessibleActivate(rowEl, () => {
        openRoomModal(Number(rowEl.getAttribute("data-room-id")));
      });
    });
  }

  const pagBar = document.getElementById("personal-pagination");
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
        }" data-p-page="${pageIdx}">${formatInteger(pageIdx)}</button>`
      );
    } else if (pageButtons[pageButtons.length - 1] !== ellipsisHtml) {
      pageButtons.push(ellipsisHtml);
    }
  }

  pagBar.innerHTML = `
    <div class="page-info">Mostrando <strong>${formatInteger(fromNum)}–${formatInteger(
    toNum
  )}</strong> de <strong>${formatInteger(filtered.length)}</strong> salas jugadas por ${escapeHtml(
    member.name
  )}</div>
    <div class="page-controls">
      <button type="button" class="page-btn" data-p-page="${page - 1}" ${
    page <= 1 ? "disabled" : ""
  } aria-label="Página anterior">‹ Ant.</button>
      ${pageButtons.join("")}
      <button type="button" class="page-btn" data-p-page="${page + 1}" ${
    page >= totalPages ? "disabled" : ""
  } aria-label="Página siguiente">Sig. ›</button>
    </div>
  `;

  pagBar.querySelectorAll("button[data-p-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = Number(btn.getAttribute("data-p-page"));
      if (targetPage >= 1 && targetPage <= totalPages) {
        state.personalFilter.page = targetPage;
        renderPersonalRoomsTable();
      }
    });
  });
}

function renderPersonalTopAndAffinities(myVisited, myRated) {
  const member = state.currentMember;
  if (!member) return;

  // 1. Personal Top 5
  const top5 = myRated
    .slice()
    .sort(
      (a, b) =>
        (b.ratings[member.key].average ?? 0) - (a.ratings[member.key].average ?? 0) ||
        (b.ratings[member.key].general ?? 0) - (a.ratings[member.key].general ?? 0) ||
        a.id - b.id
    )
    .slice(0, 5);

  const topEl = document.getElementById("personal-top-list");
  if (topEl) {
    topEl.innerHTML = top5.length
      ? top5
          .map((room, idx) => {
            const medal =
              idx === 0
                ? "🥇 #1"
                : idx === 1
                ? "🥈 #2"
                : idx === 2
                ? "🥉 #3"
                : `#${idx + 1}`;
            const posterUrl = getPosterOrCatalogImage(room);
            const thumbStyle = posterUrl
              ? `background-image:url('${escapeHtml(posterUrl)}')`
              : `background:${getFallbackGradient(room.theme)}`;

            return `
              <button type="button" class="dash-row" data-room-id="${room.id}">
                <div class="dash-podium-thumb" style="${thumbStyle}">
                  <span class="dash-medal-badge">${medal}</span>
                </div>
                <div class="dash-row-main">
                  <div class="dash-row-title">${escapeHtml(room.name)}</div>
                  <div class="dash-row-sub">${escapeHtml(room.company)} · 📍 ${escapeHtml(
              room.city
            )}</div>
                </div>
                <div class="dash-row-right">
                  <span class="score-pill" style="border-color:${member.color}66;color:${member.color};background:${member.bg}">Mi nota: ★ ${formatScore(
              room.ratings[member.key].average
            )}</span>
                  <span class="dash-date-tag">Grupo: ★ ${formatScore(room.average.score)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">Aún no has valorado ninguna sala. Usa el botón <strong>✍️ Valorar</strong> en tu tabla superior para estrenar tu clasificación personal.</p>`;

    topEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openRoomModal(Number(btn.getAttribute("data-room-id")));
      });
    });
  }

  // 2. Frequent companions and favorite themes
  const companionCounts = {};
  MEMBERS.forEach((other) => {
    if (other.key === member.key) return;
    const count = myVisited.filter((room) => room.teamCode.includes(other.key)).length;
    if (count > 0) companionCounts[other.key] = { member: other, count };
  });
  const topCompanions = Object.values(companionCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const themeStats = {};
  myVisited.forEach((room) => {
    if (!room.theme || room.theme === "Sin especificar") return;
    if (!themeStats[room.theme]) themeStats[room.theme] = { count: 0, myScores: [] };
    themeStats[room.theme].count += 1;
    const score = room.ratings[member.key]?.average;
    if (score !== null && score !== undefined) themeStats[room.theme].myScores.push(score);
  });
  const topThemes = Object.entries(themeStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  const maxComp = myVisited.length || 1;
  const maxTheme = topThemes[0]?.[1]?.count || 1;

  const affEl = document.getElementById("personal-affinities-list");
  if (!affEl) return;

  affEl.innerHTML = `
    <div class="subsection-mono-label subsection-gold">🤝 Compañeros inseparables</div>
    ${
      topCompanions.length
        ? topCompanions
            .map(({ member: companion, count }) => {
              const pct = Math.round((count / maxComp) * 100);
              const dotClass =
                companion.key === "+" ? "dot-plus" : `dot-${companion.key}`;
              return `
                <div class="stat-bar-row">
                  <div class="stat-bar-head">
                    <span><span class="team-dot ${dotClass} team-dot-inline">${
                companion.key
              }</span><strong>${escapeHtml(companion.name)}</strong></span>
                    <span class="mono-note">${formatInteger(count)} salas juntos (${formatInteger(
                pct
              )}%)</span>
                  </div>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width:${pct}%;background:${companion.color}"></div>
                  </div>
                </div>
              `;
            })
            .join("")
        : `<span class="panel-sub">Sin compañeros registrados.</span>`
    }
    <div class="subsection-mono-label subsection-cyan">🎭 Mis temáticas más jugadas</div>
    ${topThemes
      .map(([themeName, info]) => {
        const avg = info.myScores.length
          ? info.myScores.reduce((sum, val) => sum + val, 0) / info.myScores.length
          : null;
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span><strong>${escapeHtml(themeName)}</strong> <span class="stat-inline-note">(${formatInteger(
          info.count
        )} salas)</span></span>
              <span class="score-pill">${
                avg !== null
                  ? `Mi media: ★ ${formatScore(avg)}`
                  : `${formatInteger(info.count)} jugadas`
              }</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round(
                (info.count / maxTheme) * 100
              )}%"></div>
            </div>
          </div>
        `;
      })
      .join("")}
  `;
}

/**
 * Renders the personal 7-dimension radar chart and annual evolution chart using Spanish locale.
 */
export function renderPersonalCharts() {
  const member = state.currentMember;
  if (!member || typeof Chart === "undefined") return;

  const myVisited = state.visitedRooms.filter((room) => room.teamCode.includes(member.key));

  // 1. Personal Radar vs Group Average on member's rooms
  const myDimAvgs = DIMENSIONS.map((_, dimIdx) => {
    const vals = myVisited
      .map((room) => room.ratings[member.key]?.dimensions[dimIdx] ?? null)
      .filter((val) => val !== null);
    return vals.length
      ? Number((vals.reduce((sum, val) => sum + val, 0) / vals.length).toFixed(2))
      : 0;
  });

  const grpDimAvgsOnMyRooms = DIMENSIONS.map((_, dimIdx) => {
    const vals = myVisited
      .map((room) => room.average.dimensions[dimIdx])
      .filter((val) => val !== null);
    return vals.length
      ? Number((vals.reduce((sum, val) => sum + val, 0) / vals.length).toFixed(2))
      : 0;
  });

  const pRadarCanvas = document.getElementById("personalRadarChart");
  if (pRadarCanvas) {
    if (state.charts.personalRadar) state.charts.personalRadar.destroy();
    const nonZeroVals = [...myDimAvgs, ...grpDimAvgsOnMyRooms].filter((val) => val > 0);
    const minScale = nonZeroVals.length
      ? Math.max(0, Math.floor(Math.min(...nonZeroVals) - 0.5))
      : 1;

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
            label: "Media del grupo (en mis salas)",
            data: grpDimAvgsOnMyRooms,
            borderColor: "#f5b038",
            backgroundColor: "rgba(245, 176, 56, 0.14)",
            borderWidth: 2,
            pointRadius: 3
          }
        ]
      },
      options: {
        locale: "es-ES",
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

  // 2. Personal Annual Evolution
  const byYear = {};
  myVisited.forEach((room) => {
    if (room.undated || !room.year) return;
    if (!byYear[room.year]) byYear[room.year] = { count: 0, myScores: [] };
    byYear[room.year].count += 1;
    const myScore = room.ratings[member.key]?.average;
    if (myScore !== null && myScore !== undefined) byYear[room.year].myScores.push(myScore);
  });

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length >= 2) {
    for (let yr = years[0]; yr <= years[years.length - 1]; yr++) {
      if (!byYear[yr]) byYear[yr] = { count: 0, myScores: [] };
    }
  }
  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);
  const counts = sortedYears.map((yr) => byYear[yr].count);
  const avgs = sortedYears.map((yr) => {
    const arr = byYear[yr].myScores;
    return arr.length
      ? Number((arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(2))
      : null;
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
            backgroundColor: `${member.color}b3`,
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
        locale: "es-ES",
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
