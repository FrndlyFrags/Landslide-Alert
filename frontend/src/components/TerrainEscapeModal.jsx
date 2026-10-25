// -----------------------------------------------------------------------
// TerrainEscapeModal.jsx
// -----------------------------------------------------------------------
// WHAT: Full-screen 3D satellite terrain map with all drivable escape routes,
//       turn-by-turn navigation, rain status, and safety strategy.
// -----------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Navigation, Clock, Route as RouteIcon, ShieldCheck,
  Loader2, MapPinned, CheckCircle2,
} from "lucide-react";
import { SAFE_ZONES, LANDSLIDE_SAFETY_STRATEGY } from "../data/safetyData";
import { fetchAllEscapeRoutes } from "../services/liveDataService";
import { getRiskColor, getRiskColorRgba, getRainStatus } from "../utils/colorUtils";

function buildMarkerElement(color, size = 18) {
  const el = document.createElement("div");
  el.style.cssText = `
    width:${size}px; height:${size}px; border-radius:50%;
    background:${color}; border:2px solid rgba(255,255,255,0.95);
    box-shadow:0 0 16px ${color}; z-index:30;
  `;
  return el;
}

export default function TerrainEscapeModal({ site, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawnLayerIds = useRef([]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [allRoutes, setAllRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routesFetched, setRoutesFetched] = useState(false);

  const safeZones = SAFE_ZONES[site.siteId] ?? [];
  const riskPercent = site.risk.failureProbabilityPercent;
  const riskColor = getRiskColor(riskPercent);
  const rainStatus = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);

  // ── Build MapLibre map once ────────────────────────────────────────────
  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      maxZoom: 17,
      minZoom: 4,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 17,
            attribution: "© Esri, Maxar, Earthstar Geographics",
          },
          "esri-labels": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 17,
          },
        },
        layers: [
          { id: "satellite", type: "raster", source: "esri-satellite" },
          { id: "labels", type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.8 } },
        ],
      },
      center: [site.lng, site.lat],
      zoom: 12,
      pitch: 60,
      bearing: -20,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // 3D terrain elevation DEM
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 15,
      });
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.7 });

      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-color": "rgba(15, 23, 42, 1)",
          "sky-atmosphere-sun-intensity": 6,
        },
      });

      // Site marker — pitchAlignment & rotationAlignment viewport anchors marker above 3D elevation mesh!
      const sitePopup = new maplibregl.Popup({ offset: 18, closeButton: false })
        .setHTML(`
          <div style="font-family:Inter,sans-serif;font-size:11px;padding:2px;">
            <strong style="color:#f1f5f9;">${site.name}</strong><br/>
            <span style="color:${riskColor};font-weight:700;font-family:monospace;">
              ${riskPercent}% failure probability
            </span>
            <div style="margin-top:2px;color:#06B6D4;">${rainStatus.icon} ${rainStatus.label} (${rainStatus.detail})</div>
          </div>
        `);

      new maplibregl.Marker({
        element: buildMarkerElement(riskColor, 22),
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([site.lng, site.lat])
        .setPopup(sitePopup)
        .addTo(map);

      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      drawnLayerIds.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.siteId]);

  // ── Fetch ALL escape routes from both safe zones ───────────────────────
  async function handleGetAllRoutes() {
    if (!safeZones.length) return;
    setIsLoading(true);
    setRouteError(null);
    setAllRoutes([]);
    setActiveRouteId(null);

    try {
      const routeGroups = await Promise.allSettled(
        safeZones.map((zone) =>
          fetchAllEscapeRoutes(site.lat, site.lng, zone.lat, zone.lng, zone.name)
        )
      );

      const COLORS = ["#06B6D4", "#F59E0B", "#10B981", "#A78BFA", "#FB7185", "#34D399"];
      const LABELS = ["Primary", "Alt A", "Alt B", "Route D", "Route E", "Route F"];

      let flatRoutes = [];
      routeGroups.forEach((result) => {
        if (result.status === "fulfilled") {
          flatRoutes = flatRoutes.concat(result.value);
        }
      });

      const uniqueRoutes = flatRoutes
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .filter((route, idx, arr) => {
          if (idx === 0) return true;
          return Math.abs(route.distanceKm - arr[idx - 1].distanceKm) > arr[idx - 1].distanceKm * 0.05;
        })
        .slice(0, 6)
        .map((route, idx) => ({
          ...route,
          id: `route-${idx}`,
          label: LABELS[idx] ?? `Route ${idx + 1}`,
          color: COLORS[idx],
        }));

      if (uniqueRoutes.length === 0) {
        setRouteError("No drivable routes were found. Road data may be limited in this area.");
        return;
      }

      setAllRoutes(uniqueRoutes);
      setActiveRouteId(uniqueRoutes[0].id);
      setRoutesFetched(true);
    } catch (error) {
      setRouteError("Could not reach the live routing service. Check your internet connection.");
      console.error(error);
    } fontinally: {
      setIsLoading(false);
    }
  }

  // ── Draw all routes on the map ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || allRoutes.length === 0) return;

    drawnLayerIds.current.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    drawnLayerIds.current = [];

    safeZones.forEach((zone) => {
      const el = buildMarkerElement("#10B981", 16);
      new maplibregl.Marker({
        element: el,
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([zone.lng, zone.lat])
        .setPopup(new maplibregl.Popup({ offset: 14, closeButton: false }).setText(zone.name))
        .addTo(map);
    });

    allRoutes.forEach((route) => {
      const sourceId = route.id;
      const layerId = `${route.id}-line`;
      const isActive = route.id === activeRouteId;

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "Feature", geometry: route.routeGeometry, properties: {} },
      });

      map.addLayer({
        id: `${layerId}-glow`,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": route.color,
          "line-width": isActive ? 10 : 5,
          "line-opacity": isActive ? 0.25 : 0.08,
          "line-blur": 4,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": route.color,
          "line-width": isActive ? 4.5 : 2.5,
          "line-opacity": isActive ? 0.95 : 0.45,
          "line-dasharray": isActive ? [1, 0] : [4, 3],
        },
      });

      drawnLayerIds.current.push(sourceId, `${layerId}-glow`, layerId);
    });

    const allCoords = allRoutes.flatMap((r) => r.routeGeometry.coordinates);
    if (allCoords.length > 0) {
      const bounds = allCoords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
      );
      map.fitBounds(bounds, { padding: 60, pitch: 50, duration: 1400 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRoutes, isMapReady]);

  // ── Re-style lines when active route changes ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || allRoutes.length === 0) return;

    allRoutes.forEach((route) => {
      const isActive = route.id === activeRouteId;
      const glowId = `${route.id}-line-glow`;
      const lineId = `${route.id}-line`;

      if (map.getLayer(glowId)) {
        map.setPaintProperty(glowId, "line-width", isActive ? 10 : 5);
        map.setPaintProperty(glowId, "line-opacity", isActive ? 0.25 : 0.08);
      }
      if (map.getLayer(lineId)) {
        map.setPaintProperty(lineId, "line-width", isActive ? 4.5 : 2.5);
        map.setPaintProperty(lineId, "line-opacity", isActive ? 0.95 : 0.45);
        map.setPaintProperty(lineId, "line-dasharray", isActive ? [1, 0] : [4, 3]);
      }
    });

    const active = allRoutes.find((r) => r.id === activeRouteId);
    if (active) {
      const coords = active.routeGeometry.coordinates;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, { padding: 80, pitch: 50, duration: 900 });
    }
  }, [activeRouteId, isMapReady, allRoutes]);

  const activeRoute = allRoutes.find((r) => r.id === activeRouteId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex bg-onyx"
    >
      {/* 3D terrain satellite map */}
      <div className="relative flex-1">
        <div ref={mapContainerRef} className="h-full w-full" />

        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-onyx">
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-telemetry" />
              Loading satellite terrain...
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-card/90 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur hover:border-critical/60 hover:text-critical transition-colors"
        >
          <X size={14} />
          Exit 3D View
        </button>

        <div className="absolute bottom-6 left-4 z-10 rounded-lg border border-slate-700/60 bg-slate-card/80 px-3 py-1.5 text-[10px] text-slate-400 backdrop-blur font-mono">
          SATELLITE · REAL 3D TERRAIN · OSRM LIVE ROUTING
        </div>

        {allRoutes.length > 0 && (
          <div className="absolute top-4 right-14 z-10 flex flex-col gap-1.5 rounded-lg border border-slate-700/60 bg-slate-card/85 p-2.5 backdrop-blur">
            {allRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => setActiveRouteId(route.id)}
                className={`flex items-center gap-2 rounded px-2 py-1 text-[10px] transition-all ${
                  route.id === activeRouteId
                    ? "bg-slate-700/60 text-slate-100"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <span
                  className="inline-block h-1.5 w-5 rounded-full"
                  style={{ backgroundColor: route.color, boxShadow: `0 0 6px ${route.color}` }}
                />
                <span className="font-mono">{route.label}</span>
                <span className="text-slate-500">{route.distanceKm} km</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-slate-800 bg-dark-slate p-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Selected Location</p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-50">{site.name}</h2>
          <p className="text-[11px] text-slate-400">{site.state} · {site.corridor}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div
              className="inline-block rounded-md px-2.5 py-1 font-mono text-xs font-semibold ring-1"
              style={{
                color: riskColor,
                backgroundColor: getRiskColorRgba(riskPercent, 0.12),
                borderColor: riskColor,
              }}
            >
              {riskPercent}% Failure Probability
            </div>

            <div className={`rounded-md border px-2 py-1 text-[10.5px] ${rainStatus.bgClass}`}>
              {rainStatus.icon} {rainStatus.label} ({rainStatus.detail})
            </div>
          </div>
        </div>

        {safeZones.length > 0 && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-card/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Safe Destinations</p>
            {safeZones.map((zone, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                {zone.name}
              </div>
            ))}
          </div>
        )}

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-card/40 p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Navigation size={13} className="text-telemetry/70" />
            All Escape Routes
          </h3>

          {!routesFetched && !isLoading && (
            <>
              <p className="mt-2 text-[11px] text-slate-400">
                Fetch all real drivable routes to{" "}
                <span className="text-slate-200">{safeZones.length} safe destinations</span>{" "}
                using live OpenStreetMap road data, including alternatives.
              </p>
              <button
                onClick={handleGetAllRoutes}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-telemetry px-3 py-2 text-[11px] font-semibold text-onyx hover:bg-cyan-400 transition-colors"
              >
                <MapPinned size={13} />
                Get All Escape Routes
              </button>
            </>
          )}

          {isLoading && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-telemetry animate-live-pulse">
              <Loader2 size={13} className="animate-spin" />
              Calculating all routes via live OSRM...
            </p>
          )}

          {routeError && <p className="mt-2 text-[11px] text-red-400">{routeError}</p>}

          <AnimatePresence>
            {allRoutes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                {allRoutes.map((route) => {
                  const isActive = route.id === activeRouteId;
                  return (
                    <button
                      key={route.id}
                      onClick={() => setActiveRouteId(route.id)}
                      className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                        isActive
                          ? "border-slate-600 bg-slate-700/50"
                          : "border-slate-800 bg-slate-card/20 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: route.color, boxShadow: `0 0 6px ${route.color}` }}
                          />
                          <span className="text-[11px] font-semibold text-slate-200">{route.label}</span>
                          {isActive && <CheckCircle2 size={11} className="text-telemetry" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <RouteIcon size={10} />
                          {route.distanceKm} km
                          <Clock size={10} />
                          ~{route.durationMinutes} min
                        </div>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">→ {route.destination}</p>
                    </button>
                  );
                })}

                {activeRoute && (
                  <div className="mt-2">
                    <p className="text-[10.5px] uppercase tracking-wide text-slate-500">Turn-by-Turn</p>
                    <ol className="mt-1.5 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                      {activeRoute.steps.map((step, index) => (
                        <li key={index} className="flex gap-2 text-[11px] text-slate-300">
                          <span className="shrink-0 font-mono text-slate-600">{index + 1}.</span>
                          <span>
                            {step.instruction}
                            <span className="ml-1 text-slate-500">({step.distanceMeters}m)</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <button
                  onClick={handleGetAllRoutes}
                  className="mt-1 w-full rounded-md border border-slate-700 px-3 py-1.5 text-[10px] text-slate-400 hover:border-telemetry/40 hover:text-telemetry transition-colors"
                >
                  Refresh routes
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-card/40 p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <ShieldCheck size={13} className="text-telemetry/70" />
            Safety Strategy
          </h3>
          <div className="mt-2 space-y-3">
            {LANDSLIDE_SAFETY_STRATEGY.map((section) => (
              <div key={section.phase}>
                <p className="text-[11px] font-semibold text-slate-200">{section.phase}</p>
                <ul className="mt-1 space-y-1">
                  {section.points.map((point, index) => (
                    <li key={index} className="flex gap-1.5 text-[10.5px] text-slate-400">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-telemetry/60" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <style>{`
        .maplibregl-popup-content {
          background: #1E293B !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
          color: #cbd5e1;
        }
        .maplibregl-popup-tip { display: none !important; }
      `}</style>
    </motion.div>
  );
}
