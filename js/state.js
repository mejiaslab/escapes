/**
 * Centralized reactive-style state container for the single-page application.
 */

export const state = {
  user: null,
  currentMember: null,
  tokenClient: null,
  activeSection: "dashboard",
  hasData: false,
  needsMapRender: false,
  needsChartsRender: false,
  needsPersonalChartsRender: false,
  allRooms: [],
  visitedRooms: [],
  pendingRooms: [],
  upcomingRooms: [],
  draftRooms: [],
  memberSheetMeta: {},
  openRoomModalId: null,
  ratingRoomId: null,
  ratingReturnRoomId: null,
  lastFocusedElement: null,
  isSavingRating: false,
  bannerTimer: null,
  rankMode: "average",
  visitedFilter: {
    search: "",
    member: "ALL",
    year: "ALL",
    page: 1,
    pageSize: 10
  },
  personalFilter: {
    status: "ALL",
    search: "",
    year: "ALL",
    page: 1,
    pageSize: 10
  },
  pendingFilter: {
    search: "",
    province: "ALL",
    themes: []
  },
  charts: {
    year: null,
    radar: null,
    themes: null,
    personalRadar: null,
    personalYear: null
  },
  map: null,
  markerCluster: null
};

/**
 * Destroys active Chart.js instances and resets loaded room collections in memory.
 */
export function resetStateData() {
  state.currentMember = null;
  state.hasData = false;
  state.needsMapRender = false;
  state.needsChartsRender = false;
  state.needsPersonalChartsRender = false;
  state.allRooms = [];
  state.visitedRooms = [];
  state.pendingRooms = [];
  state.upcomingRooms = [];
  state.draftRooms = [];
  state.memberSheetMeta = {};
  state.openRoomModalId = null;
  state.ratingRoomId = null;
  state.ratingReturnRoomId = null;
  state.lastFocusedElement = null;

  Object.keys(state.charts).forEach((chartKey) => {
    if (state.charts[chartKey]) {
      state.charts[chartKey].destroy();
      state.charts[chartKey] = null;
    }
  });

  if (state.markerCluster) {
    state.markerCluster.clearLayers();
  }
}
