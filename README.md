# AI-Based Early Warning and Landslide Risk Monitoring Platform (NER)

A monitoring platform for landslide risk across India's North Eastern
Region (NER) — covering Assam, Meghalaya, Sikkim, Manipur, Tripura,
Nagaland, Mizoram, and Arunachal Pradesh.

The app has **two experiences**:

- **Public landing page** — introduces the platform: night-sky hero with a
  continuous falling-stars animation, live-risk corridor cards, and NDMA
  landslide safety & evacuation guidance.
- **Admin portal** — the full command center behind a passcode: regional
  overview map, live telemetry, 3D terrain + escape routing, field photo
  inspection, and the AI disaster copilot.

**Live site:** https://frndlyfrags.github.io/Landslide-Alert/ (auto-deployed)

## What's actually real vs. simulated

Being upfront about this matters, so here's exactly what's genuinely
live and what's estimated:

| Data | Status | Source |
|---|---|---|
| Rainfall (last 24h + 6h forecast) | **Live** | [Open-Meteo](https://open-meteo.com) — free, no API key |
| Ground elevation & slope angle | **Live** | [Open Topo Data](https://opentopodata.org) — real NASA SRTM satellite elevation |
| Driving escape routes | **Live** | [OSRM](https://project-osrm.org) — real road-following routes over OpenStreetMap data |
| 3D terrain shape | **Live** | Real elevation tiles rendered with MapLibre GL JS |
| Soil moisture (IoT sensors) | Simulated | No public free feed exists — requires physically installed hardware |
| Satellite ground displacement (Sentinel-1) | Simulated | Requires a paid InSAR radar-processing pipeline, not a simple API |

The dashboard labels every figure **LIVE** or **SIM** in the Spatial
Inspector panel so this is always clear at a glance. If a live request
fails (e.g. no internet connection), each site quietly falls back to a
simulated value rather than showing an error.

This is still a **demo/scaffold**: every place that would normally call
a paid government API or a trained AI model is clearly commented so a
real engineer can swap it in later without restructuring the project.

## Project layout

```
Landslide-Alert/
├── frontend/    React (Vite) + Tailwind CSS UI (landing page + admin portal)
│   └── src/
│       └── theme/tokens.css   shared design tokens (single source of truth)
└── backend/     Python FastAPI backend & AI risk models
```

## Running the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Then open **http://127.0.0.1:8000/docs** — FastAPI automatically builds
an interactive page where you can try every API route (site list, risk
scores, crack photo analysis, warning blasts, rerouting, and the AI
copilot) without writing any code.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Then open **http://127.0.0.1:5173** in your browser. You land on the
public landing page; open the **admin portal** (navbar button, passcode
protected) to reach the command center. On first load the dashboard
fetches real live rainfall and elevation data for all 12 sites directly
from the browser (no backend required for this) — you'll see a short
"boot sequence" while that happens. Click any site, then **"3D Terrain &
Escape Route"**, to see a real pitched 3D terrain view of that hillside
and calculate a real driving route to the nearest safe zone.

> **Note:** The regional risk score, gauges, and charts still use the
> same simplified weighted-scoring formula as the backend
> (`predict.py`) — only now it's fed by real rainfall and slope data
> instead of random numbers for those two inputs.

## What's inside

**Backend (`/backend`)**
- `main.py` — every REST API route (sites, risk scores, crack analysis,
  warning blasts, rerouting, AI copilot)
- `models/predict.py` — the weighted risk-scoring "AI" engine
- `models/cv_crack.py` — mock computer-vision crack photo analyzer
- `services/telemetry.py` — mock IMD weather & IoT soil sensor data,
  plus the list of 12 real NER monitoring locations

**Frontend — shared (`/frontend/src`)**
- `theme/tokens.css` — design tokens (colors, radii, spacing, type, motion)
  shared by both pages; consumed by `tailwind.config.js` and `index.css`
- `services/liveDataService.js` — real calls to Open-Meteo, Open Topo Data, and OSRM
- `data/mockData.js` — site list, risk-scoring formula, simulated fallback data
- `data/safetyData.js` — safe-zone destinations + landslide safety checklist
- `utils/colorUtils.js` — smooth green→red risk coloring + rain-status helpers

**Frontend — public landing page only**
- `components/LandingPage.jsx` — minimal navbar, night-sky hero, live
  corridor status cards, safety & evacuation guidance, footer
- `components/NightSkyBackground.jsx` — canvas animation: twinkling stars
  + a continuous falling-stars shower (glowing diagonal streaks), paused
  for hidden tabs and `prefers-reduced-motion`

**Frontend — admin portal only**
- `components/AdminShell.jsx` — collapsible sidebar navigation + summary
  stat strip around the dashboard
- `components/Header.jsx` — slim top bar: live feed badges, language
  picker, refresh + warning buttons
- `components/DigitalTwinMap.jsx` — regional overview map with toggleable layers
- `components/TerrainEscapeModal.jsx` — real 3D terrain view + live escape route + safety strategy
- `components/AnalyticsPanel.jsx` — high-risk list, risk gauges, slip-plane chart, rerouting
- `components/FieldIntelligencePanel.jsx` — photo upload + computer vision demo
- `components/CopilotCenter.jsx` — floating AI chat widget: in-scope only
  (system/site/route questions), conversation cached in `sessionStorage`
  so it survives view switches
- `components/AuthModal.jsx` — passcode gate for the admin portal
- `components/WarningModal.jsx` — confirmation dialog for the warning blast

The two pages are strictly scoped (`.nightsky` vs `.admin-shell` roots),
so no styles or markup leak between the landing page and the dashboard.

## Design system

A dark "night sky" theme: deep ink surfaces, a single cool-teal accent,
with amber/red reserved for alerts & risk semantics. All values live in
[`frontend/src/theme/tokens.css`](frontend/src/theme/tokens.css):

| Token | Value | Used for |
|---|---|---|
| `--c-bg` | `#05070f` | deepest background |
| `--c-surface` / `--c-surface-2` | `#0b111f` / `#101830` | panels / raised cards |
| `--c-line` / `--c-line-soft` | `#1c2742` / `#141d33` | borders / hairlines |
| `--c-text` / `--c-heading` / `--c-muted` | `#dbe3f0` / `#f2f6fc` / `#8ea0bd` | body / headings / secondary text |
| `--c-accent` | `#5cc8e8` | the one accent (live telemetry, CTAs) |
| `--c-risk-safe` / `--c-risk-watch` / `--c-risk-critical` | `#4ade80` / `#f2b34c` / `#e5696c` | risk status ramp |
| `--font-body` / `--font-heading` / `--font-mono` | Inter / Sora / JetBrains Mono | type pairing |

Colors are also exposed as `R G B` triples (`--c-accent-rgb`, …) so
Tailwind alpha modifiers like `bg-accent/10` work correctly.

## Deployment

Every push to `main` automatically builds the frontend and deploys it to
GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
it runs `npm ci` + `npm run build` in `/frontend` and publishes `dist/`
to the `gh-pages` branch (the workflow holds `permissions: contents: write`
so the `github-actions[bot]` token may push it). Set **Settings → Pages →
Source: `gh-pages`** once on a fresh repo, then just push to `main`.
