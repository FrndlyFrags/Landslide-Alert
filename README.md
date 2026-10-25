# AI-Based Early Warning and Landslide Risk Monitoring Platform (NER)

A dashboard concept for monitoring landslide risk across India's North
Eastern Region (NER) — covering Assam, Meghalaya, Sikkim, Manipur,
Tripura, Nagaland, Mizoram, and Arunachal Pradesh.

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
landslide-monitoring-ner/
├── frontend/    React (Vite) + Tailwind CSS dashboard UI
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

Then open **http://127.0.0.1:5173** in your browser. On load, it fetches
real live rainfall and elevation data for all 12 sites directly from
the browser (no backend required for this) — you'll see a short "boot
sequence" while that happens. Click any site, then **"3D Terrain &
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

**Frontend (`/frontend/src`)**
- `App.jsx` — main dashboard layout, live-data loading, shared selection state
- `services/liveDataService.js` — real calls to Open-Meteo, Open Topo Data, and OSRM
- `data/mockData.js` — site list, risk-scoring formula, simulated fallback data
- `data/safetyData.js` — safe-zone destinations + landslide safety checklist
- `components/Header.jsx` — live feed badges, language picker, refresh + warning buttons
- `components/DigitalTwinMap.jsx` — regional overview map with toggleable layers
- `components/TerrainEscapeModal.jsx` — real 3D terrain view + live escape route + safety strategy
- `components/AnalyticsPanel.jsx` — high-risk list, risk gauges, slip-plane chart, rerouting
- `components/FieldIntelligencePanel.jsx` — photo upload + computer vision demo
- `components/CopilotCenter.jsx` — AI chat bar + multilingual broadcast preview
- `components/WarningModal.jsx` — confirmation dialog for the warning blast

## Design system

Dark "Tactical Operations Command Center" theme:

| Purpose            | Color          | Hex       |
|---------------------|----------------|-----------|
| Background (deepest) | Deep Onyx      | `#030712` |
| Background (panels)  | Dark Slate     | `#0F172A` |
| Cards                | Slate Card     | `#1E293B` |
| Safe / Stable        | Neon Emerald   | `#10B981` |
| Moderate Watch       | Amber Gold     | `#F59E0B` |
| Critical / High Risk | Crimson Red    | `#EF4444` |
| Telemetry / AI       | Electric Cyan  | `#06B6D4` |
# Landslide-Alert
