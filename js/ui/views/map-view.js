/**
 * Interactive Conquest Map (Leaflet + MarkerCluster) and regional/city breakdown.
 */

import { CARTO_API_KEY, MAP_VIEWPORTS } from "../../config.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatScore,
  normalizeKey
} from "../../utils/formatters.js";
import { openRoomModal } from "../modals.js";
import { filterVisitedByQueryAndOpen } from "./visited-view.js";

/**
 * Initializes or refreshes the Leaflet map with clustered escape room pins.
 */
export function renderMap() {
  if (typeof L === "undefined") return;

  if (!state.map) {
    state.map = L.map("visited-map", {
      scrollWheelZoom: false
    }).setView([40.35, -3.4], 6);

    const cartoTileUrl = CARTO_API_KEY
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    L.tileLayer(cartoTileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19
    }).addTo(state.map);

    state.markerCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 34
    });
    state.map.addLayer(state.markerCluster);

    // Delegate room detail button clicks inside Leaflet popups without global window functions
    state.map.on("popupopen", (event) => {
      const popupNode = event.popup?.getElement();
      if (!popupNode) return;
      const detailBtn = popupNode.querySelector("[data-popup-room-id]");
      if (detailBtn) {
        detailBtn.onclick = () => {
          openRoomModal(Number(detailBtn.getAttribute("data-popup-room-id")));
        };
      }
    });
  }

  state.markerCluster.clearLayers();

  let mappedCount = 0;
  state.visitedRooms.forEach((room) => {
    if (!room.coords) return;
    mappedCount += 1;

    const scoreText = room.average.score !== null ? formatScore(room.average.score) : "✓";
    const icon = L.divIcon({
      className: "custom-escape-marker",
      html: `<div class="escape-pin"><span>${escapeHtml(scoreText)}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -26]
    });

    const marker = L.marker(room.coords, { icon });
    marker.bindPopup(`
      <div class="map-popup">
        <h5>${escapeHtml(room.name)}</h5>
        <p><strong>${escapeHtml(room.company)}</strong> · ${escapeHtml(room.city)} (${escapeHtml(
      room.province
    )})</p>
        <p>🗓️ ${escapeHtml(room.displayDate)} · Media grupo: <strong>${formatScore(
      room.average.score
    )}★</strong> (${formatInteger(room.average.ratersCount)} val.)</p>
        <p>Equipo: <strong>${escapeHtml(room.teamCode || "—")}</strong> · ${escapeHtml(
      room.theme
    )}</p>
        <button type="button" class="map-popup-btn" data-popup-room-id="${
          room.id
        }">Ver expediente completo</button>
      </div>
    `);
    state.markerCluster.addLayer(marker);
  });

  const subtitleEl = document.getElementById("map-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `${formatInteger(
      mappedCount
    )} salas visitadas geolocalizadas · Haz clic en los círculos para desplegar`;
  }

  setTimeout(() => state.map && state.map.invalidateSize(), 120);
}

/**
 * Smoothly flies the map viewport to one of the configured regional presets.
 * @param {string} presetKey
 */
export function flyToMapPreset(presetKey) {
  const viewport = MAP_VIEWPORTS[presetKey];
  if (viewport && state.map) {
    state.map.flyTo(viewport.center, viewport.zoom, { duration: 0.8 });
  }
}

/**
 * Renders top conquered provinces/countries and municipalities with room counts and averages.
 */
export function renderGeoBreakdown() {
  const provMap = {};
  const cityMap = {};

  state.visitedRooms.forEach((room) => {
    const provKey = normalizeKey(room.province);
    if (!provMap[provKey]) provMap[provKey] = { name: room.province, count: 0, scores: [] };
    provMap[provKey].count += 1;
    if (room.average.score !== null) provMap[provKey].scores.push(room.average.score);

    if (room.city && room.city !== "—") {
      const cityKey = normalizeKey(room.city);
      if (!cityMap[cityKey]) {
        cityMap[cityKey] = { name: room.city, province: room.province, count: 0 };
      }
      cityMap[cityKey].count += 1;
    }
  });

  const topProvs = Object.values(provMap)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, 8);
  const maxProv = topProvs[0]?.count || 1;

  const provsEl = document.getElementById("geo-provinces-list");
  if (provsEl) {
    provsEl.innerHTML = topProvs
      .map((prov) => {
        const avg = prov.scores.length
          ? prov.scores.reduce((sum, val) => sum + val, 0) / prov.scores.length
          : null;
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span><strong>${escapeHtml(prov.name)}</strong> <span class="stat-inline-note">(${formatInteger(
          prov.count
        )} salas)</span></span>
              <span class="score-pill">★ ${formatScore(avg)}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round(
                (prov.count / maxProv) * 100
              )}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const topCities = Object.values(cityMap)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, 8);
  const maxCity = topCities[0]?.count || 1;

  const citiesEl = document.getElementById("geo-cities-list");
  if (!citiesEl) return;

  citiesEl.innerHTML = topCities
    .map(
      (city) => `
        <button type="button" class="stat-bar-row stat-bar-row-btn" data-geo-city="${escapeHtml(
          city.name
        )}">
          <div class="stat-bar-head">
            <span>📍 <strong>${escapeHtml(city.name)}</strong> <span class="stat-inline-note">(${escapeHtml(
        city.province
      )})</span></span>
            <strong class="stat-city-count">${formatInteger(city.count)} salas →</strong>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${Math.round(
              (city.count / maxCity) * 100
            )}%"></div>
          </div>
        </button>
      `
    )
    .join("");

  citiesEl.querySelectorAll("[data-geo-city]").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterVisitedByQueryAndOpen(btn.getAttribute("data-geo-city"));
    });
  });
}
