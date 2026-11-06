/**
 * Google Sheets API v4 client for live reading and writing of group and personal sheets.
 */

import {
  CORE_MEMBERS,
  DIMENSIONS,
  MAIN_SHEET_RANGE,
  MEMBER_SHEET_HEADERS,
  SPREADSHEET_ID
} from "../config.js";

/**
 * Fetches the main "Datos" tab and all 5 personal member tabs in a single batchGet call.
 * @param {string} accessToken
 * @returns {Promise<{ updatedAt: string, mainSheetRows: string[][], memberValuesByKey: Record<string, string[][]> }>}
 */
export async function fetchLiveGoogleSheet(accessToken) {
  const ranges = [MAIN_SHEET_RANGE, ...CORE_MEMBERS.map((member) => `${member.sheet}!A1:J1000`)];
  const queryString = ranges.map((range) => `ranges=${encodeURIComponent(range)}`).join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${queryString}&valueRenderOption=FORMATTED_VALUE`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });
  } catch (networkErr) {
    console.error("Network failure while fetching Google Sheets data:", networkErr);
    const error = new Error("Network request to Google Sheets API failed.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    let reason = "";
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || detail;
      const info = (errJson?.error?.details || []).find((entry) => entry.reason);
      reason = info?.reason || errJson?.error?.status || "";
    } catch (_) {
      // Ignore non-JSON error bodies
    }
    console.error(`Google Sheets batchGet failed (${response.status}):`, detail);
    const error = new Error(detail);
    error.status = response.status;
    error.reason = reason;
    throw error;
  }

  const payload = await response.json();
  const valueRanges = Array.isArray(payload.valueRanges) ? payload.valueRanges : [];
  const mainSheetRows = valueRanges[0]?.values || [];
  const memberValuesByKey = {};

  CORE_MEMBERS.forEach((member, index) => {
    memberValuesByKey[member.key] = valueRanges[index + 1]?.values || [];
  });

  return {
    updatedAt: new Date().toISOString(),
    mainSheetRows,
    memberValuesByKey
  };
}

/**
 * Writes row values to a specific range in the spreadsheet using USER_ENTERED mode.
 * @param {string} accessToken
 * @param {string} range
 * @param {Array<Array<string | number>>} rowsValues
 * @returns {Promise<object>}
 */
export async function putSheetValues(accessToken, range, rowsValues) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  let response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: rowsValues
      })
    });
  } catch (networkErr) {
    console.error("Network failure while saving values to Google Sheets:", networkErr);
    const error = new Error("Network request failed while writing to Google Sheets.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      detail = errJson?.error?.message || detail;
    } catch (_) {
      // Ignore non-JSON error bodies
    }
    console.error(`Google Sheets PUT failed (${response.status}):`, detail);
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Validates and persists a member's 7-dimension rating into their dedicated Google Sheet tab.
 * @param {{
 *   accessToken: string,
 *   member: { key: string, sheet: string },
 *   room: { rawCompany: string, name: string, sheetRowByMember: Record<string, number | null> },
 *   dimensions: Array<number | string | null>,
 *   sheetMeta: { hasHeader: boolean, maxRowNumber: number }
 * }} params
 */
export async function writeMemberRoomRating({ accessToken, member, room, dimensions, sheetMeta }) {
  const cleanDimensions = DIMENSIONS.map((dimLabel, index) => {
    const rawValue = dimensions[index];
    if (rawValue === null || rawValue === undefined || rawValue === "") return "";
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 5) {
      const validationErr = new Error(`Invalid score for dimension index ${index}.`);
      validationErr.code = "INVALID_SCORE";
      validationErr.dimensionLabel = dimLabel;
      throw validationErr;
    }
    return Number(numeric.toFixed(2));
  });

  const existingRow = room.sheetRowByMember[member.key];

  if (existingRow && existingRow >= 2) {
    const formula = `=IF(COUNT(D${existingRow}:I${existingRow});ROUND(AVERAGE(D${existingRow}:I${existingRow});2);"")`;
    const range = `${member.sheet}!C${existingRow}:J${existingRow}`;
    await putSheetValues(accessToken, range, [[...cleanDimensions, formula]]);
    return;
  }

  const safeMeta = sheetMeta || { hasHeader: false, maxRowNumber: 0 };
  let targetRow = safeMeta.maxRowNumber + 1;
  if (!safeMeta.hasHeader || targetRow < 2) {
    await putSheetValues(accessToken, `${member.sheet}!A1:J1`, [MEMBER_SHEET_HEADERS]);
    targetRow = 2;
  }

  const formula = `=IF(COUNT(D${targetRow}:I${targetRow});ROUND(AVERAGE(D${targetRow}:I${targetRow});2);"")`;
  const range = `${member.sheet}!A${targetRow}:J${targetRow}`;
  await putSheetValues(accessToken, range, [
    [room.rawCompany, room.name, ...cleanDimensions, formula]
  ]);
}
