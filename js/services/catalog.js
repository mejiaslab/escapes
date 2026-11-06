/**
 * Catalog lookup service indexing room metadata by company + room name and fallback aliases.
 */

import { CATALOG_ITEMS_PART_1 } from "../data/catalog-part-1.js";
import { CATALOG_ITEMS_PART_2 } from "../data/catalog-part-2.js";
import { getTopPosterPath } from "../data/locations-data.js";
import { normalizeCompactKey } from "../utils/formatters.js";

export const CATALOG_ITEMS = [...CATALOG_ITEMS_PART_1, ...CATALOG_ITEMS_PART_2];

const catalogByKey = new Map();
const catalogByRoomName = new Map();

function buildCompactPairKey(company, roomName) {
  return `${normalizeCompactKey(company)}||${normalizeCompactKey(roomName)}`;
}

CATALOG_ITEMS.forEach((item) => {
  const canonicalPair = buildCompactPairKey(item.company, item.name);
  catalogByKey.set(canonicalPair, item);

  const canonicalRoomKey = normalizeCompactKey(item.name);
  if (canonicalRoomKey) {
    if (!catalogByRoomName.has(canonicalRoomKey)) {
      catalogByRoomName.set(canonicalRoomKey, item);
    }
    if (!catalogByKey.has(canonicalRoomKey)) {
      catalogByKey.set(canonicalRoomKey, item);
    }
  }

  if (Array.isArray(item.aliases)) {
    item.aliases.forEach((rawAlias) => {
      if (!rawAlias) return;
      catalogByKey.set(rawAlias, item);
      const parts = rawAlias.split("||");
      if (parts.length === 2) {
        catalogByKey.set(buildCompactPairKey(parts[0], parts[1]), item);
      } else {
        catalogByKey.set(normalizeCompactKey(rawAlias), item);
      }
    });
  }

  if (Array.isArray(item.nameAliases)) {
    item.nameAliases.forEach((rawName) => {
      const aliasKey = normalizeCompactKey(rawName);
      if (!aliasKey) return;
      if (!catalogByRoomName.has(aliasKey)) {
        catalogByRoomName.set(aliasKey, item);
      }
      if (!catalogByKey.has(aliasKey)) {
        catalogByKey.set(aliasKey, item);
      }
    });
  }
});

/**
 * Finds a catalog entry matching company and room name.
 * @param {string} company
 * @param {string} roomName
 * @returns {object | null}
 */
export function findCatalogEntry(company, roomName) {
  if (!roomName) return null;

  const directKey = buildCompactPairKey(company, roomName);
  if (catalogByKey.has(directKey)) return catalogByKey.get(directKey);

  const rawKey = `${company || ""}||${roomName}`;
  if (catalogByKey.has(rawKey)) return catalogByKey.get(rawKey);

  const roomKey = normalizeCompactKey(roomName);
  if (catalogByRoomName.has(roomKey)) return catalogByRoomName.get(roomKey);
  if (catalogByKey.has(roomKey)) return catalogByKey.get(roomKey);

  return null;
}

/**
 * Resolves catalog metadata for a parsed room object.
 * @param {{ company?: string, rawCompany?: string, name?: string } | null} room
 * @returns {object | null}
 */
export function resolveRoomCatalog(room) {
  if (!room || !room.name) return null;
  const direct = findCatalogEntry(room.company, room.name);
  if (direct) return direct;

  if (room.rawCompany && room.rawCompany !== room.company) {
    return findCatalogEntry(room.rawCompany, room.name);
  }
  return null;
}

/**
 * Returns the best available poster/photo path for podiums and ranking cards.
 * @param {{ company?: string, rawCompany?: string, name: string }} room
 * @returns {string | null}
 */
export function getPosterOrCatalogImage(room) {
  if (!room) return null;
  return getTopPosterPath(room.name) || resolveRoomCatalog(room)?.image || null;
}
