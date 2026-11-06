/**
 * Team section: per-member attendance cards, iconic squad combinations, and success records.
 */

import { CORE_MEMBERS, MEMBERS } from "../../config.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatOneDecimal,
  formatScore
} from "../../utils/formatters.js";
import { renderTeamDotsHtml } from "../navigation.js";
import { filterVisitedByMemberAndOpen } from "./visited-view.js";

/**
 * Renders the overall registered rooms summary card and interactive member cards.
 */
export function renderMembersCount() {
  const totalVisited = state.visitedRooms.length || 1;
  const totalRegistered = state.allRooms.length;
  const activeMember = state.visitedFilter.member;

  const completedPct = Math.round(
    (state.visitedRooms.length / Math.max(totalRegistered, 1)) * 100
  );

  const totalCardHtml = `
    <div class="member-card member-card-total">
      <div class="member-top">
        <div class="member-avatar-badge member-avatar-gold">🗝️</div>
        <span class="member-pct">${formatInteger(state.pendingRooms.length)} pendientes</span>
      </div>
      <div class="member-count">${formatInteger(totalRegistered)}</div>
      <div class="member-name-label">Total registradas</div>
      <div class="member-progress-track">
        <div class="member-progress-bar member-progress-gold" style="width:${completedPct}%"></div>
      </div>
      <div class="member-meta">
        <span>Completadas: <strong>${formatInteger(state.visitedRooms.length)}</strong></span>
        <span>${formatInteger(completedPct)}% del total</span>
      </div>
    </div>
  `;

  const memberCardsHtml = MEMBERS.map((member) => {
    const rooms = state.visitedRooms.filter((room) => room.teamCode.includes(member.key));
    const count = rooms.length;
    const pct = formatOneDecimal((count / totalVisited) * 100);
    const ratedRooms = rooms.filter((room) => room.average.score !== null);
    const avgScore = ratedRooms.length
      ? ratedRooms.reduce((sum, room) => sum + room.average.score, 0) / ratedRooms.length
      : null;

    const isCore = CORE_MEMBERS.some((core) => core.key === member.key);
    const ownRatedCount = isCore
      ? rooms.filter((room) => room.ratings[member.key]?.hasAnyScore).length
      : null;

    const themeCounts = {};
    rooms.forEach((room) => {
      if (room.theme && room.theme !== "Sin especificar") {
        themeCounts[room.theme] = (themeCounts[room.theme] || 0) + 1;
      }
    });
    const favoriteTheme =
      Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const isActiveClass = activeMember === member.key ? "active-filter" : "";

    return `
      <button type="button" class="member-card ${isActiveClass}" data-member-key="${member.key}">
        <div class="member-top">
          <div class="member-avatar-badge" style="background:${member.bg};color:${member.color}">${
      member.key
    }</div>
          <span class="member-pct">${pct}% visitadas</span>
        </div>
        <div class="member-count" style="color:${member.color}">${formatInteger(count)}</div>
        <div class="member-name-label">${escapeHtml(member.name)}</div>
        <div class="member-progress-track">
          <div class="member-progress-bar" style="width:${Math.min(
            100,
            (count / totalVisited) * 100
          )}%;background:${member.color}"></div>
        </div>
        <div class="member-meta">
          <span>Media salas: <strong>${formatScore(avgScore)}★</strong></span>
          <span>${
            ownRatedCount !== null
              ? `${formatInteger(ownRatedCount)}/${formatInteger(count)} val.`
              : `Favorita: ${escapeHtml(favoriteTheme)}`
          }</span>
        </div>
      </button>
    `;
  }).join("");

  const container = document.getElementById("members-grid");
  if (!container) return;
  container.innerHTML = totalCardHtml + memberCardsHtml;

  container.querySelectorAll("button[data-member-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-member-key");
      filterVisitedByMemberAndOpen(key);
    });
  });
}

/**
 * Renders the top recurring team lineups and individual escape completion records.
 */
export function renderTeamSectionExtras() {
  const squadCounts = {};
  state.visitedRooms.forEach((room) => {
    if (!room.teamCode) return;
    squadCounts[room.teamCode] = (squadCounts[room.teamCode] || 0) + 1;
  });

  const topSquads = Object.entries(squadCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const maxSquadCount = topSquads[0]?.[1] || 1;

  const memberNameByKey = {
    S: "Sara",
    M: "Miguel",
    R: "Rafa",
    A: "Antonio",
    J: "Joan",
    "+": "Invitados"
  };

  const squadsEl = document.getElementById("squads-list");
  if (squadsEl) {
    squadsEl.innerHTML = topSquads
      .map(([code, count]) => {
        const readableNames = code
          .split("")
          .map((char) => memberNameByKey[char] || char)
          .join(" + ");
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span>${renderTeamDotsHtml(code)} <span class="stat-inline-note">${escapeHtml(
          readableNames
        )}</span></span>
              <strong class="mono-strong">${formatInteger(count)} salas</strong>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round(
                (count / maxSquadCount) * 100
              )}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const insightsEl = document.getElementById("team-insights-list");
  if (!insightsEl) return;

  insightsEl.innerHTML = MEMBERS.map((member) => {
    const rooms = state.visitedRooms.filter((room) => room.teamCode.includes(member.key));
    const escapedCount = rooms.filter((room) => room.escapeResult === "S").length;
    const failedCount = rooms.filter((room) => room.escapeResult === "N").length;
    const totalEvaluated = escapedCount + failedCount;
    const winPct = totalEvaluated > 0 ? Math.round((escapedCount / totalEvaluated) * 100) : 0;
    const winLabel =
      totalEvaluated > 0
        ? `${formatInteger(winPct)}% éxito (${formatInteger(escapedCount)}/${formatInteger(
            totalEvaluated
          )})`
        : "Sin registro";

    const yearCounts = {};
    rooms.forEach((room) => {
      if (room.year && !room.undated) {
        yearCounts[room.year] = (yearCounts[room.year] || 0) + 1;
      }
    });
    const bestYearEntry = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0];
    const bestYearText = bestYearEntry
      ? `Récord en ${bestYearEntry[0]} (${formatInteger(bestYearEntry[1])})`
      : "—";

    const dotClass = member.key === "+" ? "dot-plus" : `dot-${member.key}`;

    return `
      <div class="stat-bar-row">
        <div class="stat-bar-head">
          <span>
            <span class="team-dot ${dotClass} team-dot-inline">${member.key}</span>
            <strong>${escapeHtml(member.name)}</strong>
            <span class="stat-inline-note">· ${escapeHtml(bestYearText)}</span>
          </span>
          <span class="stat-win-label">${escapeHtml(winLabel)}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:${winPct}%;background:${member.color}"></div>
        </div>
      </div>
    `;
  }).join("");
}
