/**
 * Dataset parser joining the main "Datos" sheet with the 5 individual member rating sheets.
 */

import { CORE_MEMBERS, DIMENSIONS } from "../config.js";
import { resolveRoomCoordinates } from "../data/locations-data.js";
import { state } from "../state.js";
import {
  cleanCityName,
  cleanProvinceName,
  makeRoomKey,
  normalizeKey,
  parseScore,
  parseSheetDate
} from "../utils/formatters.js";

/**
 * Matches an authenticated Google user profile to one of the 5 core team members.
 * @param {{ givenName?: string, name?: string } | null} user
 * @returns {object | null}
 */
export function resolveCurrentMember(user) {
  if (!user) return null;
  const tokenize = (input) =>
    normalizeKey(input)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

  const givenTokens = tokenize(user.givenName || "");
  const fullTokens = tokenize(user.name || "");

  if (givenTokens.length > 0) {
    const firstGiven = CORE_MEMBERS.find((member) => member.aliases.includes(givenTokens[0]));
    if (firstGiven) return firstGiven;
    const anyGiven = CORE_MEMBERS.find((member) =>
      givenTokens.some((token) => member.aliases.includes(token))
    );
    if (anyGiven) return anyGiven;
  }

  if (fullTokens.length > 0) {
    const firstFull = CORE_MEMBERS.find((member) => member.aliases.includes(fullTokens[0]));
    if (firstFull) return firstFull;
    const anyFull = CORE_MEMBERS.find((member) =>
      fullTokens.some((token) => member.aliases.includes(token))
    );
    if (anyFull) return anyFull;
  }

  return null;
}

/**
 * Checks whether a given core member attended a visited room and is eligible to rate it.
 * @param {{ key: string } | null} member
 * @param {{ status: string, teamCode: string } | null} room
 * @returns {boolean}
 */
export function canMemberRateRoom(member, room) {
  if (!member || !room) return false;
  return room.status === "visited" && room.teamCode.includes(member.key);
}

/**
 * Computes the arithmetic mean of dimensions 1..6 (excluding index 0 = Difficulty).
 * @param {Array<number | null>} dimensions
 * @returns {number | null}
 */
export function computeAverageExcludingDifficulty(dimensions) {
  if (!Array.isArray(dimensions)) return null;
  const validScores = dimensions
    .slice(1)
    .filter((value) => value !== null && Number.isFinite(value));
  if (validScores.length === 0) return null;
  const mean = validScores.reduce((sum, value) => sum + value, 0) / validScores.length;
  return Number(mean.toFixed(2));
}

/**
 * Parses rows from an individual member sheet tab into lookup maps.
 * @param {string[][]} values
 */
export function parseMemberSheetValues(values) {
  const byExactKey = new Map();
  const byRoomCounts = new Map();
  const byRoomEntry = new Map();
  const rows = Array.isArray(values) ? values : [];
  let maxRowNumber = rows.length > 0 ? 1 : 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const rawRow = rows[rowIndex] || [];
    const rowNumber = rowIndex + 1; // 1-based row number in Google Sheets
    const cells = Array.from({ length: 10 }, (_, colIdx) =>
      rawRow[colIdx] !== undefined && rawRow[colIdx] !== null
        ? String(rawRow[colIdx]).trim()
        : ""
    );

    if (cells.some((cell) => cell !== "")) {
      maxRowNumber = Math.max(maxRowNumber, rowNumber);
    }

    const company = cells[0];
    const roomName = cells[1];
    if (!roomName) continue;

    const dimensions = DIMENSIONS.map((_, dimIdx) => parseScore(cells[2 + dimIdx]));
    const average = computeAverageExcludingDifficulty(dimensions);
    const hasAnyScore = dimensions.some((score) => score !== null);
    const hasAverage = average !== null;

    const entry = {
      rowNumber,
      company,
      roomName,
      dimensions,
      general: dimensions[6],
      average,
      hasAnyScore,
      hasAverage
    };

    const exactKey = makeRoomKey(company, roomName);
    if (!byExactKey.has(exactKey) || hasAnyScore) {
      byExactKey.set(exactKey, entry);
    }

    const roomKey = normalizeKey(roomName);
    byRoomCounts.set(roomKey, (byRoomCounts.get(roomKey) || 0) + 1);
    byRoomEntry.set(roomKey, entry);
  }

  return {
    hasHeader: rows.length > 0 && Boolean(rows[0] && rows[0].length > 0),
    maxRowNumber,
    byExactKey,
    byRoomCounts,
    byRoomEntry
  };
}

/**
 * Parses the complete spreadsheet payload and updates application state collections.
 * @param {{ mainSheetRows: string[][], memberValuesByKey: Record<string, string[][]> }} dataset
 */
export function parseSheetDataset(dataset) {
  const mainSheetRows = dataset.mainSheetRows || [];
  const memberValuesByKey = dataset.memberValuesByKey || {};

  const parsedMembers = {};
  state.memberSheetMeta = {};

  CORE_MEMBERS.forEach((member) => {
    const parsed = parseMemberSheetValues(memberValuesByKey[member.key] || []);
    parsedMembers[member.key] = parsed;
    state.memberSheetMeta[member.key] = {
      hasHeader: parsed.hasHeader,
      maxRowNumber: parsed.maxRowNumber
    };
  });

  const allRooms = [];
  const visitedRooms = [];
  const pendingRooms = [];
  const upcomingRooms = [];
  const draftRooms = [];
  const collisionCounter = {};

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const dataRows = Array.isArray(mainSheetRows) ? mainSheetRows.slice(2) : [];

  // Track room name uniqueness in "Datos" as fallback if company name differs slightly across tabs
  const mainRoomCounts = new Map();
  dataRows.forEach((rawRow) => {
    const roomName = rawRow && rawRow[1] ? String(rawRow[1]).trim() : "";
    if (roomName) {
      const roomKey = normalizeKey(roomName);
      mainRoomCounts.set(roomKey, (mainRoomCounts.get(roomKey) || 0) + 1);
    }
  });

  dataRows.forEach((rawRow, index) => {
    const cells = Array.from({ length: 16 }, (_, colIdx) =>
      rawRow[colIdx] !== undefined && rawRow[colIdx] !== null
        ? String(rawRow[colIdx]).trim()
        : ""
    );

    if (!cells[1]) return;

    const rawCompany = cells[0];
    const name = cells[1];
    const rawDate = cells[10];
    const teamCode = cells[12].toUpperCase();
    const city = cleanCityName(cells[2]);
    const province = cleanProvinceName(cells[3]);

    const room = {
      id: index + 3,
      rawCompany,
      company: rawCompany || "Sin empresa",
      name,
      city: city || "—",
      province: province || "Sin provincia",
      theme: cells[4] && cells[4] !== "-" ? cells[4] : "Sin especificar",
      minPlayers: cells[5],
      maxPlayers: cells[6],
      recommendedPlayers: cells[7],
      maxTime: cells[8],
      awards: cells[9],
      rawDate,
      displayDate: "—",
      year: null,
      undated: false,
      sortTimestamp: -Infinity,
      playersCount: cells[11],
      teamCode,
      escapeResult: cells[13].toUpperCase(),
      timeUsed: cells[14],
      opinion: cells[15],
      ratings: {},
      sheetRowByMember: {},
      average: {
        dimensions: DIMENSIONS.map(() => null),
        general: null,
        score: null,
        ratersCount: 0,
        raterKeys: [],
        hasAnyScore: false
      },
      status: "draft",
      coords: null
    };

    if (rawDate.toUpperCase() === "PENDIENTE") {
      room.status = "pending";
      room.displayDate = "Pendiente";
      pendingRooms.push(room);
    } else if (!rawDate) {
      room.status = "draft";
      draftRooms.push(room);
    } else {
      const parsedDate = parseSheetDate(rawDate);
      if (parsedDate) {
        if (parsedDate.year < 1950) {
          room.status = "visited";
          room.undated = true;
          room.displayDate = "Sin fecha exacta";
          room.sortTimestamp = -1e15 + index;
          room.coords = resolveRoomCoordinates(room, collisionCounter);
          visitedRooms.push(room);
        } else if (parsedDate.dateObj <= endOfToday || teamCode.length > 0) {
          room.status = "visited";
          room.year = parsedDate.year;
          room.displayDate = parsedDate.displayDate;
          room.sortTimestamp = parsedDate.dateObj.getTime();
          room.coords = resolveRoomCoordinates(room, collisionCounter);
          visitedRooms.push(room);
        } else {
          room.status = "upcoming";
          room.year = parsedDate.year;
          room.displayDate = parsedDate.displayDate;
          room.sortTimestamp = parsedDate.dateObj.getTime();
          upcomingRooms.push(room);
        }
      } else {
        room.status = "draft";
        draftRooms.push(room);
      }
    }

    // Cross-reference personal ratings from the 5 core members (eligible only if attended)
    const exactKey = makeRoomKey(rawCompany, name);
    const roomKey = normalizeKey(name);
    const isUniqueRoomInMain = mainRoomCounts.get(roomKey) === 1;

    CORE_MEMBERS.forEach((member) => {
      const parsedMember = parsedMembers[member.key];
      let entry = parsedMember.byExactKey.get(exactKey) || null;
      if (!entry && isUniqueRoomInMain && parsedMember.byRoomCounts.get(roomKey) === 1) {
        entry = parsedMember.byRoomEntry.get(roomKey) || null;
      }

      room.sheetRowByMember[member.key] = entry ? entry.rowNumber : null;

      if (canMemberRateRoom(member, room) && entry) {
        room.ratings[member.key] = {
          dimensions: entry.dimensions.slice(),
          general: entry.general,
          average: entry.average,
          hasAnyScore: entry.hasAnyScore,
          hasAverage: entry.hasAverage
        };
      } else {
        room.ratings[member.key] = {
          dimensions: DIMENSIONS.map(() => null),
          general: null,
          average: null,
          hasAnyScore: false,
          hasAverage: false
        };
      }
    });

    // Compute group average across all members who rated the room
    const ratersWithAverage = CORE_MEMBERS.filter(
      (member) => room.ratings[member.key].average !== null
    );
    const anyRaters = CORE_MEMBERS.filter((member) => room.ratings[member.key].hasAnyScore);

    const averageDimensions = DIMENSIONS.map((_, dimIdx) => {
      const values = CORE_MEMBERS.map((member) => room.ratings[member.key].dimensions[dimIdx]).filter(
        (val) => val !== null
      );
      if (values.length === 0) return null;
      return Number((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2));
    });

    const globalAverage = ratersWithAverage.length
      ? Number(
          (
            ratersWithAverage.reduce((sum, member) => sum + room.ratings[member.key].average, 0) /
            ratersWithAverage.length
          ).toFixed(2)
        )
      : null;

    room.average = {
      dimensions: averageDimensions,
      general: averageDimensions[6],
      score: globalAverage,
      ratersCount: ratersWithAverage.length,
      raterKeys: ratersWithAverage.map((member) => member.key),
      hasAnyScore: anyRaters.length > 0
    };

    allRooms.push(room);
  });

  visitedRooms.sort((a, b) => b.sortTimestamp - a.sortTimestamp || b.id - a.id);

  pendingRooms.sort(
    (a, b) =>
      a.province.localeCompare(b.province, "es") || a.name.localeCompare(b.name, "es")
  );

  upcomingRooms.sort((a, b) => a.sortTimestamp - b.sortTimestamp);

  state.allRooms = allRooms;
  state.visitedRooms = visitedRooms;
  state.pendingRooms = pendingRooms;
  state.upcomingRooms = upcomingRooms;
  state.draftRooms = draftRooms;
  state.hasData = true;
}
