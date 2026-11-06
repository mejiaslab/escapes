# Expediente Escapista — Private Escape Room Dashboard

Interactive single-page web application connected **exclusively in real time to Google Sheets** via **Google Cloud OAuth 2.0**.

> **Zero Static Sheet Data:** This repository stores no static spreadsheet records. Only Google accounts granted **read or edit permissions on the `Escapes` spreadsheet** can authenticate and view or update data.

**Live Production URL (GitHub Pages):** [https://mejiaslab.github.io/escapes/](https://mejiaslab.github.io/escapes/)

---

## Features

- **Real-Time Google Sheets Access Control & Sync** (`719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`):
  - Authenticates via Google Identity Services (`spreadsheets` scope) to read group records and persist personal ratings.
  - Fetches the main `Datos` sheet alongside the 5 individual member tabs (`Sara`, `Miguel`, `Rafa`, `Antonio`, `Joan`) in a single `values:batchGet` request. Accounts without spreadsheet access receive a `403` error and remain locked out.
  - Automatically matches the authenticated Google profile to its team member (`Sara`, `Miguel`, `Rafa / Rafael`, `Antonio`, `Joan`) and restricts rating submissions strictly to visited rooms attended by that member.
  - Plays a skippable cinematic intro video upon interactive sign-in, with automatic muted-autoplay fallback and reduced-motion support.
  - Revokes the OAuth token and clears all in-memory and `sessionStorage` state upon sign-out.
- **Mobile-First Section Navigation** (off-canvas drawer on mobile/tablet, sticky sidebar on desktop, and hash-based routing):
  - **Main Dashboard (`#dashboard`)**: Executive KPIs, historical Top 3 podium, 5 most recent rooms, member participation progress, upcoming reservations, and pending roadmap.
  - **Personal Workspace (`#personal`)**: Individual KPIs, personal annual chart, 7-dimension radar comparison against the group average, personal Top 5, and live 7-criteria rating editor (*Difficulty* is recorded for reference and excluded from the final average).
  - **Visited Rooms (`#visited`)**: Complete reverse-chronological history (`DD/MM/YYYY`), search and member/year filters, configurable pagination, and detailed multi-member breakdown modal.
  - **Pending Rooms (`#pending`)**: Upcoming objectives with mutually exclusive faceted filters by province and multi-select themes, confirmed reservation banners, and **TERPECA / Escape Room Awards** badges.
  - **Top 10 Hall of Fame (`#ranking`)**: Official posters, podium medals, and instant ranking switchers (*Global Average*, *General Score*, *Sara*, *Miguel*, *Rafa*, *Antonio*, *Joan*).
  - **Conquest Map (`#map`)**: Full-size interactive Leaflet map with `MarkerCluster` grouping, regional quick-jump presets, and province/city breakdowns.
  - **Team (`#team`)**: Total and per-member room counters (including guests `+`), recurring squad lineups, and escape success rates.
  - **Advanced Statistics (`#stats`)**: Annual volume and average score chart, 7-dimension group radar, visited vs. pending theme DNA, top studios, and score distribution.

---

## Project Architecture

Built with zero build-step dependencies using standard HTML5, modular mobile-first CSS, and native ES Modules:

```text
escapes/
├── index.html                  # Application shell (Spanish es-ES UI)
├── favicon.svg                 # Vector brand icon
├── AGENTS.md                   # AI engineering & PR delivery guidelines
├── assets/                     # Static media (hero backdrop, intro video, room posters)
├── css/
│   ├── base.css                # Design tokens, reset, typography, and shared utilities
│   ├── auth.css                # Google OAuth gateway and cinematic intro screen
│   ├── layout.css              # Mobile-first shell, drawer/sticky sidebar, topbar, footer
│   ├── dashboard.css           # Hero banner, executive KPIs, and 2x2 summary bento
│   ├── tables-filters.css      # Search/select bars, multi-theme dropdown, tables, pagination
│   ├── cards.css               # Team, Top 10 ranking, upcoming, and pending room cards
│   ├── charts-map.css          # Panels, Chart.js containers, comparative bars, Leaflet map
│   └── modals-personal.css     # Room detail modal, personal workspace, and rating modal
└── js/
    ├── main.js                 # Application entrypoint and global DOM event wiring
    ├── config.js               # OAuth/Sheets constants, member metadata, and section definitions
    ├── state.js                # Centralized in-memory runtime state
    ├── utils/
    │   └── formatters.js       # Spanish (es-ES) formatters, DD/MM/YYYY dates, 24h time, keys
    ├── data/
    │   ├── locations-data.js   # Geocoded coordinates and top-room poster overrides
    │   ├── catalog-part-1.js   # Curated room catalog metadata (part 1)
    │   └── catalog-part-2.js   # Curated room catalog metadata (part 2)
    ├── services/
    │   ├── auth.js             # Google OAuth 2.0 lifecycle and session management
    │   ├── sheets-api.js       # Google Sheets API v4 batchGet and rating persistence
    │   ├── data-parser.js      # Spreadsheet row parser and multi-member score aggregator
    │   └── catalog.js          # Normalized catalog lookup index
    └── ui/
        ├── intro.js            # Cinematic intro video controller
        ├── navigation.js       # Hash router, mobile sidebar drawer, topbar, notifications
        ├── modals.js           # Room detail and live personal rating modals
        └── views/              # Dedicated view renderers per section
```

---

## Local Development

Because the application uses native ES Modules (`<script type="module">`), serve the repository root over HTTP rather than `file://`:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## Google Cloud & Google Sheets Requirements

1. **Enable Google Sheets API** in Google Cloud project `719597836416`:
   - [Google Sheets API Console](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=719597836416)
2. **Authorized JavaScript Origins** on OAuth Client ID `719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`:
   - `https://mejiaslab.github.io`
   - `http://localhost:8000` *(optional for local development)*
3. **Spreadsheet Access Permissions**:
   - Share the **Escapes** spreadsheet in Google Drive/Sheets as **Editor** with team members who submit ratings from the web app (or **Viewer** for read-only access).
   - If the Google Cloud OAuth consent screen is in **Testing** mode, include all authorized user emails under **Test users**.
