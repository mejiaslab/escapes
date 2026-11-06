/**
 * Main Dashboard view: hero KPIs, historical Top 3 podium, recent activity,
 * compact team attendance, and upcoming roadmap summary.
 */

import { MEMBERS } from "../../config.js";
import { getPosterOrCatalogImage } from "../../services/catalog.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatOneDecimal,
  formatScore,
  getFallbackGradient,
  normalizeKey
} from "../../utils/formatters.js";
import { openRoomModal } from "../modals.js";
import { navigateToSection } from "../navigation.js";
import { filterPendingByProvinceAndOpen } from "./pending-view.js";
import { filterVisitedByMemberAndOpen } from "./visited-view.js";

/**
 * Renders the 4 interactive executive KPI tiles in the dashboard hero banner.
 */
export function renderHeroKpis() {
  const totalRegistered = state.allRooms.length;
  const totalVisited = state.visitedRooms.length;
  const totalPending = state.pendingRooms.length;

  const ratedRooms = state.visitedRooms.filter((room) => room.average.score !== null);
  const globalAvg = ratedRooms.length
    ? ratedRooms.reduce((sum, room) => sum + room.average.score, 0) / ratedRooms.length
    : null;

  const escapedCount = state.visitedRooms.filter((room) => room.escapeResult === "S").length;
  const failedCount = state.visitedRooms.filter((room) => room.escapeResult === "N").length;
  const evaluatedTotal = escapedCount + failedCount;
  const successPct =
    evaluatedTotal > 0 ? formatOneDecimal((escapedCount / evaluatedTotal) * 100) : "—";

  const uniqueCities = new Set(state.visitedRooms.map((room) => normalizeKey(room.city))).size;
  const uniqueProvs = new Set(
    state.visitedRooms.map((room) => normalizeKey(room.province))
  ).size;

  const upcomingEl = document.getElementById("upcoming-pill");
  if (upcomingEl) {
    if (state.upcomingRooms.length > 0) {
      const nextBooking = state.upcomingRooms[0];
      upcomingEl.textContent = `📅 Próxima reserva: ${nextBooking.name} (${nextBooking.city}) · ${nextBooking.displayDate}`;
      upcomingEl.hidden = false;
    } else {
      upcomingEl.hidden = true;
    }
  }

  const agendaCount = state.upcomingRooms.length + state.draftRooms.length;
  const extraNote = state.draftRooms.length
    ? `${formatInteger(totalVisited)} jugadas · ${formatInteger(
        totalPending
      )} pendientes · ${formatInteger(agendaCount)} en agenda`
    : `${formatInteger(totalVisited)} jugadas · ${formatInteger(totalPending)} pendientes`;

  const kpisContainer = document.getElementById("hero-kpis");
  if (!kpisContainer) return;

  kpisContainer.innerHTML = `
    <button type="button" class="kpi-tile kpi-highlight" data-nav-target="stats">
      <div class="kpi-head-row">
        <span class="kpi-label">Salas registradas</span>
        <span class="kpi-arrow" aria-hidden="true">→</span>
      </div>
      <div class="kpi-value">${formatInteger(totalRegistered)}</div>
      <div class="kpi-sub">${escapeHtml(extraNote)}</div>
    </button>

    <button type="button" class="kpi-tile" data-nav-target="visited">
      <div class="kpi-head-row">
        <span class="kpi-label">Salas visitadas</span>
        <span class="kpi-arrow" aria-hidden="true">→</span>
      </div>
      <div class="kpi-value">${formatInteger(totalVisited)}</div>
      <div class="kpi-sub">Éxito registrado: <strong>${successPct}%</strong> (${formatInteger(
    escapedCount
  )}/${formatInteger(evaluatedTotal)})</div>
    </button>

    <button type="button" class="kpi-tile" data-nav-target="ranking">
      <div class="kpi-head-row">
        <span class="kpi-label">Valoración media</span>
        <span class="kpi-arrow" aria-hidden="true">→</span>
      </div>
      <div class="kpi-value">${formatScore(
        globalAvg
      )} <small class="kpi-unit-gold">/ 5</small></div>
      <div class="kpi-sub">${formatInteger(
        ratedRooms.length
      )} salas valoradas por el grupo · Top 10</div>
    </button>

    <button type="button" class="kpi-tile" data-nav-target="map">
      <div class="kpi-head-row">
        <span class="kpi-label">Mapa conquistado</span>
        <span class="kpi-arrow" aria-hidden="true">→</span>
      </div>
      <div class="kpi-value">${formatInteger(
        uniqueCities
      )} <small class="kpi-unit-muted">ciudades</small></div>
      <div class="kpi-sub">${formatInteger(uniqueProvs)} provincias / países</div>
    </button>
  `;

  kpisContainer.querySelectorAll("[data-nav-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateToSection(btn.getAttribute("data-nav-target"));
    });
  });
}

/**
 * Renders the 2x2 executive Bento cards on the Dashboard view.
 */
export function renderDashboardSummary() {
  // 1. Historical Top 3 Podium
  const top3 = state.visitedRooms
    .filter((room) => room.average.score !== null)
    .slice()
    .sort(
      (a, b) =>
        (b.average.score ?? 0) - (a.average.score ?? 0) ||
        (b.average.general ?? 0) - (a.average.general ?? 0) ||
        a.id - b.id
    )
    .slice(0, 3);

  const podiumEl = document.getElementById("dashboard-podium");
  if (podiumEl) {
    podiumEl.innerHTML = top3.length
      ? top3
          .map((room, idx) => {
            const medal = idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : "🥉 #3";
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
                  <span class="score-pill">★ ${formatScore(room.average.score)}</span>
                  <span class="dash-date-tag">${formatInteger(
                    room.average.ratersCount
                  )} val. · ${escapeHtml(room.displayDate)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">No hay salas valoradas todavía.</p>`;

    podiumEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openRoomModal(Number(btn.getAttribute("data-room-id")));
      });
    });
  }

  // 2. Recent Activity (latest 5 visited rooms)
  const recent5 = state.visitedRooms.slice(0, 5);
  const recentEl = document.getElementById("dashboard-recent");
  if (recentEl) {
    recentEl.innerHTML = recent5.length
      ? recent5
          .map((room) => {
            const statusBadge =
              room.escapeResult === "S"
                ? `<span class="status-ok">✓ Superada</span>`
                : room.escapeResult === "N"
                ? `<span class="status-fail">✕ No superada</span>`
                : "";

            return `
              <button type="button" class="dash-row" data-room-id="${room.id}">
                <div class="dash-row-main">
                  <div class="dash-row-title">${escapeHtml(room.name)}</div>
                  <div class="dash-row-sub">${escapeHtml(room.company)} · ${escapeHtml(
              room.city
            )} (${escapeHtml(room.province)})</div>
                </div>
                <div class="dash-row-right">
                  ${
                    room.average.score !== null
                      ? `<span class="score-pill">★ ${formatScore(room.average.score)}</span>`
                      : statusBadge
                  }
                  <span class="dash-date-tag">${escapeHtml(room.displayDate)}</span>
                </div>
              </button>
            `;
          })
          .join("")
      : `<p class="panel-sub">Sin salas visitadas registradas.</p>`;

    recentEl.querySelectorAll("[data-room-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openRoomModal(Number(btn.getAttribute("data-room-id")));
      });
    });
  }

  // 3. Team Participation Summary
  const totalVisited = state.visitedRooms.length || 1;
  const teamSumEl = document.getElementById("dashboard-team-summary");
  if (teamSumEl) {
    teamSumEl.innerHTML = MEMBERS.map((member) => {
      const rooms = state.visitedRooms.filter((room) => room.teamCode.includes(member.key));
      const count = rooms.length;
      const pct = Math.round((count / totalVisited) * 100);
      const rated = rooms.filter((room) => room.average.score !== null);
      const avg = rated.length
        ? rated.reduce((sum, room) => sum + room.average.score, 0) / rated.length
        : null;

      return `
        <button type="button" class="dash-member-btn" data-dash-member="${member.key}">
          <div class="member-avatar-badge" style="background:${member.bg};color:${member.color}">${
        member.key
      }</div>
          <div class="dash-member-info">
            <div class="dash-member-top">
              <span class="dash-member-name">${escapeHtml(member.name)}</span>
              <span class="dash-member-num" style="color:${member.color}">${formatInteger(
        count
      )}</span>
            </div>
            <div class="member-progress-track dash-member-track">
              <div class="member-progress-bar" style="width:${Math.min(
                100,
                pct
              )}%;background:${member.color}"></div>
            </div>
            <div class="dash-member-sub">
              <span>${formatInteger(pct)}% jugadas</span>
              <span>★ ${formatScore(avg)}</span>
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
  }

  // 4. Roadmap & Annual Pulse
  const byYear = {};
  state.visitedRooms.forEach((room) => {
    if (room.year && !room.undated) {
      byYear[room.year] = (byYear[room.year] || 0) + 1;
    }
  });
  const currentYear = new Date().getFullYear();
  const currentYearCount = byYear[currentYear] || 0;

  let peakYear = "—";
  let peakCount = 0;
  Object.entries(byYear).forEach(([yearStr, count]) => {
    if (count > peakCount) {
      peakCount = count;
      peakYear = yearStr;
    }
  });

  const companyStats = {};
  state.visitedRooms.forEach((room) => {
    if (!room.company || room.company === "Sin empresa" || room.average.score === null) return;
    const key = normalizeKey(room.company);
    if (!companyStats[key]) companyStats[key] = { name: room.company, scores: [] };
    companyStats[key].scores.push(room.average.score);
  });
  const bestCompany = Object.values(companyStats)
    .filter((entry) => entry.scores.length >= 2)
    .map((entry) => ({
      name: entry.name,
      avg: entry.scores.reduce((sum, val) => sum + val, 0) / entry.scores.length
    }))
    .sort((a, b) => b.avg - a.avg)[0];

  const provCounts = {};
  let awardedCount = 0;
  state.pendingRooms.forEach((room) => {
    provCounts[room.province] = (provCounts[room.province] || 0) + 1;
    if (room.awards) awardedCount += 1;
  });
  const topPendingProvs = Object.entries(provCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, 6);

  const upcomingBoxHtml = state.upcomingRooms.length
    ? `<div class="pulse-upcoming-box">
        <strong>📅 Próxima cita confirmada:</strong> ${escapeHtml(
          state.upcomingRooms[0].name
        )} · ${escapeHtml(state.upcomingRooms[0].company)} (${escapeHtml(
        state.upcomingRooms[0].city
      )}) el <strong>${escapeHtml(state.upcomingRooms[0].displayDate)}</strong>
      </div>`
    : "";

  const pulseEl = document.getElementById("dashboard-pulse");
  if (!pulseEl) return;

  pulseEl.innerHTML = `
    ${upcomingBoxHtml}

    <div class="pulse-mini-grid">
      <div class="pulse-stat-box">
        <div class="pulse-stat-label">En ${currentYear}</div>
        <div class="pulse-stat-val">${formatInteger(currentYearCount)} salas</div>
        <div class="pulse-stat-hint">jugadas este año</div>
      </div>
      <div class="pulse-stat-box">
        <div class="pulse-stat-label">Año récord</div>
        <div class="pulse-stat-val">${escapeHtml(String(peakYear))}</div>
        <div class="pulse-stat-hint">${formatInteger(peakCount)} salas superadas</div>
      </div>
      <div class="pulse-stat-box">
        <div class="pulse-stat-label">Sello referente</div>
        <div class="pulse-stat-val" title="${escapeHtml(bestCompany?.name || "—")}">${escapeHtml(
    bestCompany?.name || "—"
  )}</div>
        <div class="pulse-stat-hint">${
          bestCompany ? `★ ${formatScore(bestCompany.avg)} media` : "≥ 2 salas"
        }</div>
      </div>
    </div>

    <div class="pulse-provs-block">
      <div class="pulse-provs-title">
        🎯 Principales destinos pendientes ${
          awardedCount
            ? `· <span class="text-gold-bright">${formatInteger(
                awardedCount
              )} con mención/premio</span>`
            : ""
        }
      </div>
      <div class="province-chips">
        ${topPendingProvs
          .map(
            ([prov, count]) =>
              `<button type="button" class="prov-chip" data-dash-prov="${escapeHtml(
                prov
              )}">${escapeHtml(prov)} <b>${formatInteger(count)}</b></button>`
          )
          .join("")}
      </div>
    </div>

    <div class="pulse-quick-links">
      <button type="button" class="btn-link-action" data-nav-target="personal">⭐ Valorar mis salas en Mi espacio →</button>
      <button type="button" class="btn-link-action" data-nav-target="stats">📊 Ver estadísticas avanzadas →</button>
    </div>
  `;

  pulseEl.querySelectorAll("[data-dash-prov]").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterPendingByProvinceAndOpen(chip.getAttribute("data-dash-prov"));
    });
  });

  pulseEl.querySelectorAll("[data-nav-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateToSection(btn.getAttribute("data-nav-target"));
    });
  });
}
