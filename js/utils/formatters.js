/**
 * Text normalization, HTML escaping, Spanish (es-ES) locale formatters,
 * date/time parsers, and theme visual helpers.
 */

const esIntegerFormat = new Intl.NumberFormat("es-ES", {
  useGrouping: "always",
  maximumFractionDigits: 0
});

const esScoreDecimalFormat = new Intl.NumberFormat("es-ES", {
  useGrouping: "always",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const esOneDecimalFormat = new Intl.NumberFormat("es-ES", {
  useGrouping: "always",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

/**
 * Normalizes a string to lowercase ASCII with collapsed spaces.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Normalizes a string to lowercase alphanumeric characters only.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeCompactKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Builds a canonical room key combining company and room name.
 * @param {string} company
 * @param {string} roomName
 * @returns {string}
 */
export function makeRoomKey(company, roomName) {
  return `${normalizeKey(company)}||${normalizeKey(roomName)}`;
}

/**
 * Escapes unsafe characters before interpolating dynamic strings into HTML.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Parses a numeric score supporting both Spanish comma and dot decimal separators.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseScore(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim().replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Formats a score using Spanish locale conventions (e.g., "4", "4,50", "—").
 * @param {number | null | undefined} value
 * @returns {string}
 */
export function formatScore(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(2));
  if (Number.isInteger(rounded)) {
    return esIntegerFormat.format(rounded);
  }
  return esScoreDecimalFormat.format(rounded);
}

/**
 * Formats an integer using Spanish thousands separators (e.g., 1234 -> "1.234").
 * @param {number} value
 * @returns {string}
 */
export function formatInteger(value) {
  if (!Number.isFinite(value)) return "0";
  return esIntegerFormat.format(Math.round(value));
}

/**
 * Formats a 1-decimal percentage value in Spanish format (e.g., 85.4 -> "85,4").
 * @param {number} value
 * @returns {string}
 */
export function formatOneDecimal(value) {
  if (!Number.isFinite(value)) return "—";
  return esOneDecimalFormat.format(value);
}

/**
 * Formats a calendar date strictly as DD/MM/YYYY.
 * @param {number} day
 * @param {number} monthIndex - Zero-based month index (0..11)
 * @param {number} year
 * @returns {string}
 */
export function formatDateDdMmYyyy(day, monthIndex, year) {
  return `${String(day).padStart(2, "0")}/${String(monthIndex + 1).padStart(2, "0")}/${year}`;
}

/**
 * Parses a spreadsheet date string (DD/MM/YYYY or YYYY-MM-DD) and outputs strict DD/MM/YYYY.
 * @param {string} rawDate
 * @returns {{ day: number, monthIndex: number, year: number, dateObj: Date, displayDate: string } | null}
 */
export function parseSheetDate(rawDate) {
  const trimmed = String(rawDate || "").trim();
  if (!trimmed) return null;

  let day = NaN;
  let month = NaN;
  let year = NaN;

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }

  if (year >= 0 && year < 100) {
    year += 2000;
  }

  const monthIndex = month - 1;
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return null;
  }

  const dateObj = new Date(year, monthIndex, day, 12, 0, 0);
  return {
    day,
    monthIndex,
    year,
    dateObj,
    displayDate: formatDateDdMmYyyy(day, monthIndex, year)
  };
}

/**
 * Formats an ISO timestamp or Date in 24-hour Spanish format (HH:mm).
 * @param {string | Date | null | undefined} value
 * @returns {string}
 */
export function formatTime24h(value) {
  if (!value) return "";
  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * Restores proper Spanish accents/spelling for common city names.
 * @param {string} city
 * @returns {string}
 */
export function cleanCityName(city) {
  const raw = String(city || "").trim();
  const normalized = normalizeKey(raw);
  if (normalized === "leganes") return "Leganés";
  if (normalized === "terrasa" || normalized === "terrassa") return "Terrassa";
  if (normalized === "mostoles") return "Móstoles";
  if (normalized === "alcorcon") return "Alcorcón";
  return raw;
}

/**
 * Cleans whitespace around province names.
 * @param {string} province
 * @returns {string}
 */
export function cleanProvinceName(province) {
  return String(province || "").trim();
}

/**
 * Maps a Spanish room theme label to its semantic English CSS modifier class.
 * @param {string} theme
 * @returns {string}
 */
export function getThemeClass(theme) {
  const normalized = normalizeKey(theme);
  if (normalized.includes("terror") || normalized.includes("miedo") || normalized.includes("tension")) {
    return "theme-horror";
  }
  if (normalized.includes("aventura")) {
    return "theme-adventure";
  }
  if (normalized.includes("misterio") || normalized.includes("criminal") || normalized.includes("mafia")) {
    return "theme-mystery";
  }
  if (normalized.includes("fantasia") || normalized.includes("medieval") || normalized.includes("disney")) {
    return "theme-fantasy";
  }
  if (normalized.includes("futurista") || normalized.includes("vr") || normalized.includes("apocaliptico")) {
    return "theme-futuristic";
  }
  return "";
}

/**
 * Provides a fallback CSS background gradient when no room image is available.
 * @param {string} theme
 * @returns {string}
 */
export function getFallbackGradient(theme) {
  const normalized = normalizeKey(theme);
  if (normalized.includes("terror") || normalized.includes("miedo")) {
    return "linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)";
  }
  if (normalized.includes("futurista") || normalized.includes("vr")) {
    return "linear-gradient(135deg, #082f49 0%, #3b0764 100%)";
  }
  if (normalized.includes("fantasia")) {
    return "linear-gradient(135deg, #422006 0%, #1e1b4b 100%)";
  }
  return "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)";
}
