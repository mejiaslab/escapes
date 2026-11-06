/**
 * Top 10 Hall of Fame ranking section supporting global average, general score,
 * and individual team member rankings.
 */

import { CORE_MEMBERS } from "../../config.js";
import { getPosterOrCatalogImage } from "../../services/catalog.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatScore,
  getFallbackGradient,
  normalizeKey
} from "../../utils/formatters.js";
import { openRoomModal } from "../modals.js";
import { bindAccessibleActivate, renderTeamDotsHtml } from "../navigation.js";

function getScoreForRankMode(room, mode) {
  if (mode === "general") return room.average.general;
  const memberMatch = CORE_MEMBERS.find(
    (member) => member.key === mode || normalizeKey(member.name) === normalizeKey(mode)
  );
  if (memberMatch) {
    return room.ratings[memberMatch.key]?.average ?? null;
  }
  return room.average.score;
}

/**
 * Renders the Top 10 rooms grid for the currently selected ranking criterion.
 */
export function renderTop10() {
  const mode = state.rankMode;
  const candidates = state.visitedRooms
    .map((room) => ({
      room,
      primary: getScoreForRankMode(room, mode),
      tie1: room.average.general ?? 0,
      tie2: room.average.score ?? 0
    }))
    .filter((entry) => entry.primary !== null);

  candidates.sort(
    (a, b) =>
      b.primary - a.primary ||
      b.tie1 - a.tie1 ||
      b.tie2 - a.tie2 ||
      a.room.id - b.room.id
  );

  const top10 = candidates.slice(0, 10);
  const grid = document.getElementById("top10-grid");
  if (!grid) return;

  if (top10.length === 0) {
    const criterionLabel =
      mode === "average"
        ? "Media global"
        : mode === "general"
        ? "Nota general"
        : CORE_MEMBERS.find((member) => member.key === mode)?.name || mode;
    grid.innerHTML = `<div class="panel-card empty-grid-card">Todavía no hay salas valoradas para el criterio <strong>${escapeHtml(
      criterionLabel
    )}</strong>.</div>`;
    return;
  }

  grid.innerHTML = top10
    .map((entry, idx) => {
      const room = entry.room;
      const position = idx + 1;
      const podiumClass = position <= 3 ? `rank-podium-${position}` : "";
      const medal =
        position === 1
          ? "🥇 #1"
          : position === 2
          ? "🥈 #2"
          : position === 3
          ? "🥉 #3"
          : `#${position}`;
      const posterUrl = getPosterOrCatalogImage(room);
      const bgStyle = posterUrl
        ? `background-image:url('${escapeHtml(posterUrl)}')`
        : `background:${getFallbackGradient(room.theme)}`;

      return `
        <article class="rank-card ${podiumClass}" data-room-id="${room.id}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeHtml(
        room.name
      )}">
          <div class="rank-poster" style="${bgStyle}">
            <span class="rank-pos-badge">${medal}</span>
            <span class="rank-score-float">★ ${formatScore(entry.primary)}</span>
            <span class="rank-theme-over">${escapeHtml(room.theme)}</span>
          </div>
          <div class="rank-body">
            <div class="rank-title">${escapeHtml(room.name)}</div>
            <div class="rank-company">${escapeHtml(room.company)} · 📍 ${escapeHtml(
        room.city
      )} (${escapeHtml(room.province)})</div>

            <div class="rank-mini-bars">
              <div class="mini-stat"><span>Ambientación</span><strong>${formatScore(
                room.average.dimensions[3]
              )}</strong></div>
              <div class="mini-stat"><span>Originalidad</span><strong>${formatScore(
                room.average.dimensions[5]
              )}</strong></div>
              <div class="mini-stat"><span>General</span><strong>${formatScore(
                room.average.general
              )}</strong></div>
            </div>

            <div class="rank-footer">
              <span>🗓️ ${escapeHtml(room.displayDate)} · ${formatInteger(
        room.average.ratersCount
      )} val.</span>
              <span>${renderTeamDotsHtml(room.teamCode)}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll(".rank-card[data-room-id]").forEach((cardEl) => {
    bindAccessibleActivate(cardEl, () => {
      openRoomModal(Number(cardEl.getAttribute("data-room-id")));
    });
  });
}
