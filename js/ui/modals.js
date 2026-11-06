/**
 * Room detail modal (multi-member score breakdown) and personal 7-dimension rating modal.
 */

import {
  CORE_MEMBERS,
  DEFAULT_ROOM_IMAGE,
  DIMENSIONS,
  QUICK_SCORES
} from "../config.js";
import { resolveRoomCatalog } from "../services/catalog.js";
import {
  canMemberRateRoom,
  computeAverageExcludingDifficulty
} from "../services/data-parser.js";
import { state } from "../state.js";
import {
  escapeHtml,
  formatInteger,
  formatScore,
  getThemeClass,
  parseScore
} from "../utils/formatters.js";
import { renderTeamDotsHtml, showSyncBanner } from "./navigation.js";

let savePersonalRatingHandler = null;

/**
 * Registers the async persistence handler invoked when saving/deleting a personal rating.
 * @param {(roomId: number, dimensions: Array<number | null>) => Promise<void>} handler
 */
export function registerSaveRatingHandler(handler) {
  savePersonalRatingHandler = handler;
}

function captureTriggerFocus() {
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    !active.closest("#room-modal") &&
    !active.closest("#rating-modal")
  ) {
    state.lastFocusedElement = active;
  }
}

function restoreTriggerFocus() {
  const target = state.lastFocusedElement;
  state.lastFocusedElement = null;
  if (target && target.isConnected && typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
}

/**
 * Opens the detailed escape room modal with synopsis, metadata, and member ratings table.
 * @param {number} roomId
 */
export function openRoomModal(roomId) {
  const room = state.allRooms.find((item) => item.id === roomId);
  if (!room) return;

  captureTriggerFocus();
  state.openRoomModalId = roomId;

  const modal = document.getElementById("room-modal");
  const body = document.getElementById("modal-body");
  if (!modal || !body) return;

  const roomMembers = CORE_MEMBERS.filter(
    (member) => room.teamCode.includes(member.key) || room.ratings[member.key]?.hasAnyScore
  );
  const columnsToShow = roomMembers.length > 0 ? roomMembers : CORE_MEMBERS;

  const headerColsHtml = columnsToShow
    .map(
      (member) =>
        `<th class="num" style="color:${member.color}">${escapeHtml(member.name)}</th>`
    )
    .join("");

  const rowsHtml = DIMENSIONS.map((dimension, dimIdx) => {
    const isDifficulty = dimIdx === 0;
    const memberCells = columnsToShow
      .map(
        (member) =>
          `<td class="num">${formatScore(room.ratings[member.key]?.dimensions[dimIdx])}</td>`
      )
      .join("");

    return `
      <tr>
        <td>${escapeHtml(dimension)}${
      isDifficulty ? ` <span class="dim-note-badge">no media</span>` : ""
    }</td>
        ${memberCells}
        <td class="num"><strong>${formatScore(room.average.dimensions[dimIdx])}</strong></td>
      </tr>
    `;
  }).join("");

  const finalCellsHtml = columnsToShow
    .map(
      (member) =>
        `<td class="num"><strong>${formatScore(room.ratings[member.key]?.average)}</strong></td>`
    )
    .join("");

  const canRate = canMemberRateRoom(state.currentMember, room);
  const myHasScore =
    state.currentMember && room.ratings[state.currentMember.key]?.hasAnyScore;

  const rateActionHtml = canRate
    ? `<button type="button" id="modal-rate-room-btn" class="btn-rate-room ${
        myHasScore ? "" : "is-unrated"
      }">
        ${myHasScore ? "✏️ Editar mi valoración" : "✍️ Añadir mi valoración"} (${escapeHtml(
        state.currentMember.name
      )})
      </button>`
    : room.status === "visited"
    ? `<span class="unrated-pill">🔒 Solo quienes visitaron la sala pueden valorarla</span>`
    : "";

  const catalog = resolveRoomCatalog(room);
  const heroImage = catalog?.image || DEFAULT_ROOM_IMAGE;
  const webButtonHtml = catalog?.url
    ? `<a href="${escapeHtml(catalog.url)}" target="_blank" rel="noopener noreferrer" class="btn-room-website ${
        catalog.closed ? "is-archived" : ""
      }">
        ${catalog.closed ? "📁 Ficha histórica / archivada ↗" : "🌐 Visitar web oficial ↗"}
      </a>`
    : "";

  body.innerHTML = `
    <div class="modal-hero" style="background-image:url('${escapeHtml(heroImage)}')">
      <div class="modal-hero-content">
        <div class="modal-hero-left">
          <span class="section-kicker modal-hero-kicker">
            ${escapeHtml(room.company)} · ${escapeHtml(room.city)} (${escapeHtml(room.province)})
          </span>
          <h3 id="modal-room-title" class="modal-hero-title">
            ${escapeHtml(room.name)}
          </h3>
        </div>
        ${webButtonHtml}
      </div>
    </div>

    <div class="modal-badges-row">
      <span class="theme-tag ${getThemeClass(room.theme)}">${escapeHtml(room.theme)}</span>
      <span class="subtle-badge">🗓️ ${escapeHtml(room.displayDate)}</span>
      ${
        room.playersCount
          ? `<span class="subtle-badge">👥 ${escapeHtml(room.playersCount)} jugadores</span>`
          : ""
      }
      ${
        room.maxTime
          ? `<span class="subtle-badge">⏱️ Máx.: ${escapeHtml(room.maxTime)} min</span>`
          : ""
      }
      ${
        room.timeUsed
          ? `<span class="subtle-badge">🏁 Tiempo: ${escapeHtml(room.timeUsed)}</span>`
          : ""
      }
      ${
        room.average.score !== null
          ? `<span class="score-pill">Media (${formatInteger(
              room.average.ratersCount
            )}): ★ ${formatScore(room.average.score)}</span>`
          : ""
      }
    </div>

    ${
      catalog?.description
        ? `<div class="modal-synopsis">
            <span class="modal-synopsis-label">📖 Sinopsis oficial</span>
            <p>${escapeHtml(catalog.description)}</p>
          </div>`
        : ""
    }

    <div class="modal-participants-bar">
      <div>
        <span class="modal-participants-label">Participantes del grupo:</span>
        ${renderTeamDotsHtml(room.teamCode)}
      </div>
      ${rateActionHtml}
    </div>

    ${
      room.awards
        ? `<p class="modal-award-row"><span class="award-badge">🏆 ${escapeHtml(
            room.awards
          )}</span></p>`
        : ""
    }
    ${
      room.opinion
        ? `<p class="modal-opinion-box"><strong>Opinión del equipo:</strong> ${escapeHtml(
            room.opinion
          )}</p>`
        : ""
    }

    <div class="modal-table-wrap">
      <table class="modal-scores-table">
        <thead>
          <tr>
            <th>Criterio</th>
            ${headerColsHtml}
            <th class="num modal-col-gold">Media</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="modal-total-row">
            <td><strong>Nota media final</strong> <span class="dim-note-badge">sin Dificultad</span></td>
            ${finalCellsHtml}
            <td class="num modal-col-gold"><strong>★ ${formatScore(room.average.score)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("modal-rate-room-btn")?.addEventListener("click", () => {
    openRatingModal(room.id);
  });

  modal.hidden = false;
  document.getElementById("modal-close-btn")?.focus({ preventScroll: true });
}

/**
 * Closes the room detail modal and restores keyboard focus.
 */
export function closeRoomModal() {
  const modal = document.getElementById("room-modal");
  if (modal) modal.hidden = true;
  state.openRoomModalId = null;
  restoreTriggerFocus();
}

/**
 * Opens the interactive 7-dimension personal rating modal for a visited room.
 * @param {number} roomId
 */
export function openRatingModal(roomId) {
  const member = state.currentMember;
  const room = state.allRooms.find((item) => item.id === roomId);
  if (!member || !room || !canMemberRateRoom(member, room)) return;

  captureTriggerFocus();
  state.ratingRoomId = roomId;
  state.ratingReturnRoomId = state.openRoomModalId === roomId ? roomId : null;

  const roomModal = document.getElementById("room-modal");
  if (roomModal) roomModal.hidden = true;

  const existing = room.ratings[member.key] || {
    dimensions: DIMENSIONS.map(() => null),
    hasAnyScore: false
  };
  const draftDimensions = existing.dimensions.map((val) =>
    val !== null && Number.isFinite(val) ? val : null
  );

  const modal = document.getElementById("rating-modal");
  const body = document.getElementById("rating-modal-body");
  if (!modal || !body) return;

  const dimsHtml = DIMENSIONS.map((dimension, dimIdx) => {
    const isDifficulty = dimIdx === 0;
    const currentValue = draftDimensions[dimIdx];
    const inputText = currentValue !== null ? String(currentValue).replace(".", ",") : "";

    const chipsHtml = QUICK_SCORES.map((quickScore) => {
      const isActive =
        currentValue !== null && Math.abs(currentValue - quickScore) < 0.001 ? "active" : "";
      const displayChip = String(quickScore).replace(".", ",");
      return `<button type="button" class="rating-chip ${isActive}" data-dim-idx="${dimIdx}" data-chip-val="${quickScore}">${displayChip}</button>`;
    }).join("");

    return `
      <div class="rating-dim-row ${isDifficulty ? "is-excluded" : ""}" data-dim-row="${dimIdx}">
        <div class="rating-dim-head">
          <span class="rating-dim-label">
            ${escapeHtml(dimension)}
            ${
              isDifficulty
                ? `<span class="dim-note-badge">No se incluye en la media</span>`
                : `<span class="dim-note-badge dim-note-badge-gold">Cuenta en media</span>`
            }
          </span>
        </div>
        <div class="rating-controls-row">
          <div class="rating-chips">
            ${chipsHtml}
          </div>
          <div class="rating-input-group">
            <input
              type="text"
              inputmode="decimal"
              class="rating-num-input"
              data-dim-input="${dimIdx}"
              placeholder="0–5"
              value="${escapeHtml(inputText)}"
              aria-label="Nota de ${escapeHtml(dimension)}"
            />
            <button type="button" class="rating-clear-btn" data-dim-clear="${dimIdx}" title="Dejar sin valorar" aria-label="Borrar nota de ${escapeHtml(
      dimension
    )}">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  body.innerHTML = `
    <span class="section-kicker" style="color:${member.color}">VALORACIÓN DE ${escapeHtml(
    member.name.toUpperCase()
  )} · HOJA «${escapeHtml(member.sheet)}»</span>
    <h3 id="rating-modal-title" class="rating-modal-heading">${escapeHtml(room.name)}</h3>
    <div class="rating-modal-meta">
      ${escapeHtml(room.company)} · 📍 ${escapeHtml(room.city)} (${escapeHtml(
    room.province
  )}) · 🗓️ ${escapeHtml(room.displayDate)}
    </div>

    <div class="rating-live-summary">
      <div>
        <div class="rating-live-kicker">Tu media calculada</div>
        <div class="rating-live-hint">Promedio de los 6 criterios (excluyendo Dificultad)</div>
      </div>
      <div id="rating-live-score" class="rating-live-score">★ —</div>
    </div>

    <form id="personal-rating-form" novalidate>
      <div class="rating-dims-list">
        ${dimsHtml}
      </div>

      <div id="rating-form-error" class="rating-form-msg" role="alert" aria-live="polite" hidden></div>

      <div class="rating-modal-actions">
        ${
          existing.hasAnyScore
            ? `<button type="button" id="rating-delete-btn" class="btn-danger-ghost">🗑️ Borrar mi valoración</button>`
            : `<span></span>`
        }
        <div class="rating-modal-actions-right">
          <button type="button" id="rating-cancel-btn" class="btn-logout">Cancelar</button>
          <button type="submit" id="rating-save-btn" class="btn-primary-gold">💾 Guardar en Google Sheets</button>
        </div>
      </div>
    </form>
  `;

  function readDraftFromInputs() {
    return DIMENSIONS.map((_, dimIdx) => {
      const inputEl = body.querySelector(`input[data-dim-input="${dimIdx}"]`);
      return parseScore(inputEl ? inputEl.value : "");
    });
  }

  function updateLiveAverage() {
    const currentDims = readDraftFromInputs();
    const average = computeAverageExcludingDifficulty(currentDims);
    const liveEl = document.getElementById("rating-live-score");
    if (liveEl) {
      liveEl.textContent = average !== null ? `★ ${formatScore(average)}` : "★ —";
    }
  }

  function syncRowUi(dimIdx) {
    const inputEl = body.querySelector(`input[data-dim-input="${dimIdx}"]`);
    const parsedVal = parseScore(inputEl ? inputEl.value : "");
    body.querySelectorAll(`.rating-chip[data-dim-idx="${dimIdx}"]`).forEach((chip) => {
      const chipVal = Number(chip.getAttribute("data-chip-val"));
      chip.classList.toggle(
        "active",
        parsedVal !== null && Math.abs(parsedVal - chipVal) < 0.001
      );
    });
    updateLiveAverage();
  }

  body.querySelectorAll(".rating-chip[data-dim-idx]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const dimIdx = Number(chip.getAttribute("data-dim-idx"));
      const formattedVal = chip.getAttribute("data-chip-val").replace(".", ",");
      const inputEl = body.querySelector(`input[data-dim-input="${dimIdx}"]`);
      if (inputEl) inputEl.value = formattedVal;
      syncRowUi(dimIdx);
    });
  });

  body.querySelectorAll("input[data-dim-input]").forEach((inputEl) => {
    inputEl.addEventListener("input", () => {
      syncRowUi(Number(inputEl.getAttribute("data-dim-input")));
    });
  });

  body.querySelectorAll("button[data-dim-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dimIdx = Number(btn.getAttribute("data-dim-clear"));
      const inputEl = body.querySelector(`input[data-dim-input="${dimIdx}"]`);
      if (inputEl) inputEl.value = "";
      syncRowUi(dimIdx);
    });
  });

  document.getElementById("rating-cancel-btn")?.addEventListener("click", () => {
    closeRatingModal();
  });

  const errorBox = document.getElementById("rating-form-error");
  const saveBtn = document.getElementById("rating-save-btn");
  const deleteBtn = document.getElementById("rating-delete-btn");

  async function executeSave(dimsToWrite, isDelete = false) {
    if (state.isSavingRating || typeof savePersonalRatingHandler !== "function") return;
    state.isSavingRating = true;
    if (errorBox) errorBox.hidden = true;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = isDelete ? "Borrando…" : "Guardando en Google Sheets…";
    }
    if (deleteBtn) deleteBtn.disabled = true;

    try {
      await savePersonalRatingHandler(room.id, dimsToWrite);
      state.isSavingRating = false;
      closeRatingModal(true);
      openRoomModal(room.id);
      showSyncBanner(
        isDelete
          ? `🗑️ Valoración eliminada de la hoja <strong>${escapeHtml(
              member.sheet
            )}</strong> para «${escapeHtml(room.name)}».`
          : `✓ Valoración de <strong>${escapeHtml(
              room.name
            )}</strong> guardada en tu hoja <strong>${escapeHtml(
              member.sheet
            )}</strong> y estadísticas actualizadas.`,
        "success"
      );
    } catch (err) {
      let friendlyMessage = "No se pudo guardar la valoración en Google Sheets. Inténtalo de nuevo.";
      if (err.code === "INVALID_SCORE" && err.dimensionLabel) {
        friendlyMessage = `El valor de «${err.dimensionLabel}» debe estar entre 0 y 5.`;
      } else if (err.code === "NOT_ELIGIBLE") {
        friendlyMessage = "Solo quienes hayan visitado esta sala pueden valorarla.";
      } else if (err.code === "UNIDENTIFIED_MEMBER") {
        friendlyMessage = "Tu cuenta no está vinculada a ninguno de los integrantes del equipo.";
      } else if (err.code === "NETWORK_ERROR") {
        friendlyMessage =
          "Error de conexión al guardar en Google Sheets. Revisa tu conexión a internet.";
      } else if (err.status === 403) {
        friendlyMessage =
          "Tu cuenta tiene acceso de solo lectura en la hoja «Escapes» o falta permiso de escritura. Asegúrate de tener rol de Editor en Google Sheets.";
      } else if (err.status === 401) {
        friendlyMessage =
          "Tu sesión ha caducado. Pulsa «Salir» y vuelve a iniciar sesión con Google.";
      }

      if (errorBox) {
        errorBox.textContent = friendlyMessage;
        errorBox.hidden = false;
      }
    } finally {
      state.isSavingRating = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Guardar en Google Sheets";
      }
      if (deleteBtn) deleteBtn.disabled = false;
    }
  }

  document.getElementById("personal-rating-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.hidden = true;

    const rawStrings = DIMENSIONS.map((_, dimIdx) => {
      const inputEl = body.querySelector(`input[data-dim-input="${dimIdx}"]`);
      return inputEl ? inputEl.value.trim() : "";
    });

    const parsedDimensions = [];
    for (let idx = 0; idx < DIMENSIONS.length; idx++) {
      if (!rawStrings[idx]) {
        parsedDimensions.push(null);
        continue;
      }
      const numeric = parseScore(rawStrings[idx]);
      if (numeric === null || numeric < 0 || numeric > 5) {
        if (errorBox) {
          errorBox.textContent = `Revisa «${DIMENSIONS[idx]}»: introduce un número entre 0 y 5 (por ejemplo, 4 o 4,5).`;
          errorBox.hidden = false;
        }
        return;
      }
      parsedDimensions.push(numeric);
    }

    if (parsedDimensions.every((val) => val === null)) {
      if (errorBox) {
        errorBox.textContent =
          "Introduce al menos una puntuación entre 0 y 5 antes de guardar (o usa «Borrar mi valoración»).";
        errorBox.hidden = false;
      }
      return;
    }

    await executeSave(parsedDimensions, false);
  });

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!window.confirm(`¿Seguro que quieres borrar tu valoración de «${room.name}»?`)) return;
      await executeSave(
        DIMENSIONS.map(() => null),
        true
      );
    });
  }

  updateLiveAverage();
  modal.hidden = false;
  document.getElementById("rating-modal-close-btn")?.focus({ preventScroll: true });
}

/**
 * Closes the rating modal, returning to the room detail modal if opened from it.
 * @param {boolean} [skipReturn=false]
 */
export function closeRatingModal(skipReturn = false) {
  if (state.isSavingRating && !skipReturn) return;
  const modal = document.getElementById("rating-modal");
  if (modal) modal.hidden = true;
  state.ratingRoomId = null;

  if (!skipReturn && state.ratingReturnRoomId) {
    const returnId = state.ratingReturnRoomId;
    state.ratingReturnRoomId = null;
    openRoomModal(returnId);
  } else {
    state.ratingReturnRoomId = null;
    if (!skipReturn) {
      restoreTriggerFocus();
    }
  }
}
