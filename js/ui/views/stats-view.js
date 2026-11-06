/**
 * Advanced Statistics view: annual evolution chart, 7-dimension group radar,
 * visited vs pending themes stacked bar, top studios, and score distribution.
 */

import { CORE_MEMBERS, DIMENSIONS } from "../../config.js";
import { state } from "../../state.js";
import {
  escapeHtml,
  formatInteger,
  formatScore,
  normalizeKey
} from "../../utils/formatters.js";
import { filterVisitedByYearAndOpen } from "./visited-view.js";

/**
 * Renders the combined annual bar + average score line chart with Spanish locale formatting.
 */
export function renderYearChart() {
  if (typeof Chart === "undefined") return;

  const byYear = {};
  let undatedCount = 0;

  state.visitedRooms.forEach((room) => {
    if (room.undated || !room.year) {
      undatedCount += 1;
      return;
    }
    if (!byYear[room.year]) byYear[room.year] = { count: 0, scores: [] };
    byYear[room.year].count += 1;
    if (room.average.score !== null) byYear[room.year].scores.push(room.average.score);
  });

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length >= 2) {
    for (let yr = years[0]; yr <= years[years.length - 1]; yr++) {
      if (!byYear[yr]) byYear[yr] = { count: 0, scores: [] };
    }
  }

  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b);

  const counts = sortedYears.map((yr) => byYear[yr].count);
  const avgs = sortedYears.map((yr) => {
    const arr = byYear[yr].scores;
    return arr.length
      ? Number((arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(2))
      : null;
  });

  const undatedEl = document.getElementById("undated-badge");
  if (undatedEl) {
    if (undatedCount > 0) {
      undatedEl.textContent = `+ ${formatInteger(undatedCount)} sin fecha exacta`;
      undatedEl.hidden = false;
    } else {
      undatedEl.hidden = true;
    }
  }

  let peakYear = "—";
  let peakCount = 0;
  sortedYears.forEach((yr) => {
    if (byYear[yr].count > peakCount) {
      peakCount = byYear[yr].count;
      peakYear = yr;
    }
  });

  const currentYear = new Date().getFullYear();
  const currentYearCount = byYear[currentYear]?.count || 0;

  const summaryStripEl = document.getElementById("year-summary-strip");
  if (summaryStripEl) {
    summaryStripEl.innerHTML = `
      <span>🏆 Año récord: <strong>${peakYear}</strong> (${formatInteger(peakCount)} salas)</span>
      <span>📆 En ${currentYear}: <strong>${formatInteger(currentYearCount)} salas</strong></span>
      <span>💡 Pulsa una barra para filtrar ese año en Visitadas</span>
    `;
  }

  const yearCanvas = document.getElementById("yearChart");
  if (!yearCanvas) return;

  const ctx = yearCanvas.getContext("2d");
  if (state.charts.year) state.charts.year.destroy();

  const valueLabelsPlugin = {
    id: "barValueLabels",
    afterDatasetsDraw(chart) {
      const { ctx: chartCtx } = chart;
      const meta = chart.getDatasetMeta(0);
      chartCtx.save();
      chartCtx.font = "700 12px 'JetBrains Mono', monospace";
      chartCtx.fillStyle = "#f8fafc";
      chartCtx.textAlign = "center";
      meta.data.forEach((bar, idx) => {
        const val = counts[idx];
        if (val > 0) chartCtx.fillText(formatInteger(val), bar.x, bar.y - 7);
      });
      chartCtx.restore();
    }
  };

  state.charts.year = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sortedYears.map(String),
      datasets: [
        {
          type: "bar",
          label: "Salas visitadas",
          data: counts,
          backgroundColor: sortedYears.map((yr) =>
            yr === peakYear ? "rgba(245, 176, 56, 0.85)" : "rgba(56, 189, 248, 0.68)"
          ),
          hoverBackgroundColor: "#ffd166",
          borderRadius: 8,
          maxBarThickness: 44,
          yAxisID: "y"
        },
        {
          type: "line",
          label: "Nota media del año",
          data: avgs,
          borderColor: "#f5b038",
          backgroundColor: "#f5b038",
          borderWidth: 2.4,
          pointRadius: 4,
          tension: 0.32,
          spanGaps: true,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      locale: "es-ES",
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_, elements) => {
        if (elements && elements.length > 0) {
          const clickedIndex = elements[0].index;
          const clickedYear = String(sortedYears[clickedIndex]);
          filterVisitedByYearAndOpen(clickedYear);
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#cbd5e1",
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: "#0f172a",
          borderColor: "rgba(245,176,56,0.4)",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8", font: { family: "'JetBrains Mono', monospace" } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          suggestedMax: Math.max(...counts, 5) + 3,
          ticks: { color: "#94a3b8", precision: 0 },
          grid: { color: "rgba(148,163,184,0.1)" }
        },
        y1: {
          position: "right",
          min: 1,
          max: 5,
          ticks: { color: "#f5b038" },
          grid: { drawOnChartArea: false }
        }
      }
    },
    plugins: [valueLabelsPlugin]
  });
}

/**
 * Renders the 7-dimension radar, theme comparison bar chart, top studios, and score brackets.
 */
export function renderExtraStats() {
  if (typeof Chart === "undefined") return;

  // 1. 7-dimension Radar (Global Average + each active rater)
  const globalDimAvgs = DIMENSIONS.map((_, dimIdx) => {
    const vals = state.visitedRooms
      .map((room) => room.average.dimensions[dimIdx])
      .filter((val) => val !== null);
    return vals.length
      ? Number((vals.reduce((sum, val) => sum + val, 0) / vals.length).toFixed(2))
      : 0;
  });

  const radarDatasets = [
    {
      label: "Media global",
      data: globalDimAvgs,
      borderColor: "#f5b038",
      backgroundColor: "rgba(245, 176, 56, 0.22)",
      borderWidth: 2.3,
      pointRadius: 3
    }
  ];

  let allNonZero = globalDimAvgs.filter((val) => val > 0);

  CORE_MEMBERS.forEach((member) => {
    const hasAny = state.visitedRooms.some((room) => room.ratings[member.key]?.hasAnyScore);
    if (!hasAny) return;
    const memberData = DIMENSIONS.map((_, dimIdx) => {
      const vals = state.visitedRooms
        .map((room) => room.ratings[member.key]?.dimensions[dimIdx] ?? null)
        .filter((val) => val !== null);
      return vals.length
        ? Number((vals.reduce((sum, val) => sum + val, 0) / vals.length).toFixed(2))
        : 0;
    });
    allNonZero = allNonZero.concat(memberData.filter((val) => val > 0));
    radarDatasets.push({
      label: member.name,
      data: memberData,
      borderColor: member.color,
      backgroundColor: member.bg.replace("0.18", "0.10"),
      borderWidth: 1.9,
      pointRadius: 2.8
    });
  });

  const minRadar = allNonZero.length
    ? Math.max(0, Math.floor(Math.min(...allNonZero) - 0.5))
    : 2;

  const radarCanvas = document.getElementById("radarChart");
  if (radarCanvas) {
    if (state.charts.radar) state.charts.radar.destroy();
    state.charts.radar = new Chart(radarCanvas.getContext("2d"), {
      type: "radar",
      data: {
        labels: DIMENSIONS,
        datasets: radarDatasets
      },
      options: {
        locale: "es-ES",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: minRadar,
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

  // 2. Themes DNA: Visited vs Pending
  const themeMap = {};
  state.visitedRooms.forEach((room) => {
    if (room.theme === "Sin especificar") return;
    themeMap[room.theme] = themeMap[room.theme] || { visited: 0, pending: 0 };
    themeMap[room.theme].visited += 1;
  });
  state.pendingRooms.forEach((room) => {
    if (room.theme === "Sin especificar") return;
    themeMap[room.theme] = themeMap[room.theme] || { visited: 0, pending: 0 };
    themeMap[room.theme].pending += 1;
  });

  const topThemes = Object.entries(themeMap)
    .sort((a, b) => b[1].visited + b[1].pending - (a[1].visited + a[1].pending))
    .slice(0, 7);

  const themesCanvas = document.getElementById("themesChart");
  if (themesCanvas) {
    if (state.charts.themes) state.charts.themes.destroy();
    state.charts.themes = new Chart(themesCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: topThemes.map(([themeLabel]) => themeLabel),
        datasets: [
          {
            label: "Visitadas",
            data: topThemes.map(([, counts]) => counts.visited),
            backgroundColor: "rgba(56, 189, 248, 0.78)",
            borderRadius: 6
          },
          {
            label: "Pendientes",
            data: topThemes.map(([, counts]) => counts.pending),
            backgroundColor: "rgba(245, 176, 56, 0.72)",
            borderRadius: 6
          }
        ]
      },
      options: {
        locale: "es-ES",
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#cbd5e1", boxWidth: 12 } }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: "#94a3b8", precision: 0 },
            grid: { color: "rgba(148,163,184,0.1)" }
          },
          y: {
            stacked: true,
            ticks: { color: "#e2e8f0" },
            grid: { display: false }
          }
        }
      }
    });
  }

  // 3. Top escape room companies (>= 2 visited rooms)
  const companyStats = {};
  state.visitedRooms.forEach((room) => {
    if (!room.company || room.company === "Sin empresa") return;
    const key = normalizeKey(room.company);
    if (!companyStats[key]) companyStats[key] = { name: room.company, count: 0, scores: [] };
    companyStats[key].count += 1;
    if (room.average.score !== null) companyStats[key].scores.push(room.average.score);
  });

  const topCompanies = Object.values(companyStats)
    .filter((entry) => entry.count >= 2 && entry.scores.length > 0)
    .map((entry) => ({
      ...entry,
      avg: entry.scores.reduce((sum, val) => sum + val, 0) / entry.scores.length
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 7);

  const companiesEl = document.getElementById("companies-list");
  if (companiesEl) {
    companiesEl.innerHTML = topCompanies
      .map(
        (company) => `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span><strong>${escapeHtml(company.name)}</strong> <span class="stat-inline-note">(${formatInteger(
          company.count
        )} salas jugadas)</span></span>
              <span class="score-pill">★ ${formatScore(company.avg)}</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${Math.round((company.avg / 5) * 100)}%"></div>
            </div>
          </div>
        `
      )
      .join("");
  }

  // 4. Score distribution and overall escape success rate
  const ratedRooms = state.visitedRooms.filter((room) => room.average.score !== null);
  const totalRated = ratedRooms.length || 1;
  const brackets = [
    {
      label: "Obras maestras (4,50 – 5,00★)",
      count: ratedRooms.filter((room) => room.average.score >= 4.5).length,
      color: "#ffd166"
    },
    {
      label: "Sobresalientes (4,00 – 4,49★)",
      count: ratedRooms.filter(
        (room) => room.average.score >= 4.0 && room.average.score < 4.5
      ).length,
      color: "#38bdf8"
    },
    {
      label: "Notables (3,50 – 3,99★)",
      count: ratedRooms.filter(
        (room) => room.average.score >= 3.5 && room.average.score < 4.0
      ).length,
      color: "#34d399"
    },
    {
      label: "Aprobadas / Discretas (< 3,50★)",
      count: ratedRooms.filter((room) => room.average.score < 3.5).length,
      color: "#94a3b8"
    }
  ];

  const escapedCount = state.visitedRooms.filter((room) => room.escapeResult === "S").length;
  const failedCount = state.visitedRooms.filter((room) => room.escapeResult === "N").length;
  const evaluatedTotal = escapedCount + failedCount;
  const successPct =
    evaluatedTotal > 0 ? Math.round((escapedCount / evaluatedTotal) * 100) : 0;

  const distEl = document.getElementById("ratings-dist-list");
  if (!distEl) return;

  distEl.innerHTML =
    brackets
      .map((bracket) => {
        const pct = Math.round((bracket.count / totalRated) * 100);
        return `
          <div class="stat-bar-row">
            <div class="stat-bar-head">
              <span>${escapeHtml(bracket.label)}</span>
              <strong class="mono-strong">${formatInteger(bracket.count)} (${formatInteger(
          pct
        )}%)</strong>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${pct}%;background:${bracket.color}"></div>
            </div>
          </div>
        `;
      })
      .join("") +
    `
      <div class="stat-bar-row stat-bar-divider">
        <div class="stat-bar-head">
          <span>🏁 <strong>Tasa global de escape completado</strong></span>
          <strong class="stat-win-label">${formatInteger(successPct)}% (${formatInteger(
      escapedCount
    )}/${formatInteger(evaluatedTotal)})</strong>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width:${successPct}%;background:#10b981"></div>
        </div>
      </div>
    `;
}
