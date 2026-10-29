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
          "sky-atmosphere-color": "rgba(13, 14, 16, 1)",
          "sky-atmosphere-sun-intensity": 6,
        },
      });

      // Site marker — pitchAlignment & rotationAlignment viewport anchors marker above 3D elevation mesh!
      const sitePopup = new maplibregl.Popup({ offset: 18, closeButton: false })
        .setHTML(`
          <div style="font-family:Inter,sans-serif;font-size:11px;padding:2px;">
            <strong style="color:#f4f4f2;">${site.name}</strong><br/>
            <span style="color:${riskColor};font-weight:700;font-family:monospace;">
              ${riskPercent}% failure probability
            </span>
            <div style="margin-top:2px;color:#a6bfcf;">${rainStatus.icon} ${rainStatus.label} (${rainStatus.detail})</div>
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
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 size={13} className="animate-spin text-accent" />
              Loading satellite terrain...
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 border border-line bg-bg-base/90 px-3 py-2 text-[11px] font-medium text-ink backdrop-blur transition-colors hover:border-critical/60 hover:text-critical"
        >
          <X size={14} />
          Exit 3D View
        </button>

        <div className="absolute bottom-6 left-4 z-10 border border-line bg-bg-base/90 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint backdrop-blur">
          Satellite · 3D terrain · OSRM routing
        </div>

        {allRoutes.length > 0 && (
          <div className="absolute right-14 top-4 z-10 flex flex-col gap-0.5 border border-line bg-bg-base/90 p-1.5 backdrop-blur">
            {allRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => setActiveRouteId(route.id)}
                className={`flex items-center gap-2 px-2 py-1 text-[10px] transition-colors ${
                  route.id === activeRouteId
                    ? "bg-panel text-ink-strong"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <span
                  className="inline-block h-[2px] w-5"
                  style={{ backgroundColor: route.color }}
                />
                <span className="font-mono">{route.label}</span>
                <span className="text-ink-faint">{route.distanceKm} km</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-line bg-bg-base p-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">Selected location</p>
          <h2 className="mt-0.5 text-sm font-semibold text-ink-strong">{site.name}</h2>
          <p className="text-[11px] text-ink-muted">{site.state} · {site.corridor}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div
              className="inline-block border px-2.5 py-1 font-mono text-[11px] font-semibold"
              style={{
                color: riskColor,
                backgroundColor: getRiskColorRgba(riskPercent, 0.1),
                borderColor: riskColor,
              }}
            >
              {riskPercent}% failure probability
            </div>

            <div
              className="border border-line px-2 py-1 text-[10.5px]"
              style={{ color: rainStatus.badgeColor }}
            >
              {rainStatus.icon} {rainStatus.label} ({rainStatus.detail})
            </div>
          </div>
        </div>

        {safeZones.length > 0 && (
          <div className="mt-3 border border-line bg-panel/50 p-2.5">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">Safe destinations</p>
            {safeZones.map((zone, i) => (
              <div key={i} className="mb-1 flex items-center gap-1.5 text-[11px] text-ink">
                <span className="h-1 w-1 shrink-0 rounded-full bg-safe" />
                {zone.name}
              </div>
            ))}
          </div>
        )}

        <section className="mt-4 border border-line bg-panel/40 p-3">
          <h3 className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
            <Navigation size={12} className="text-ink-faint" />
            All escape routes
          </h3>

          {!routesFetched && !isLoading && (
            <>
              <p className="mt-2 text-[11px] text-ink-muted">
                Fetch all real drivable routes to{" "}
                <span className="text-ink">{safeZones.length} safe destinations</span>{" "}
                using live OpenStreetMap road data, including alternatives.
              </p>
              <button
                onClick={handleGetAllRoutes}
                className="mt-3 flex w-full items-center justify-center gap-1.5 bg-ink-strong px-3 py-2 text-[11px] font-semibold text-bg-base transition-colors hover:bg-white"
              >
                <MapPinned size={13} />
                Get All Escape Routes
              </button>
            </>
          )}

          {isLoading && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-accent animate-live-pulse">
              <Loader2 size={13} className="animate-spin" />
              Calculating all routes via live OSRM...
            </p>
          )}

          {routeError && <p className="mt-2 text-[11px] text-critical">{routeError}</p>}

          <AnimatePresence>
            {allRoutes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                {allRoutes.map((route) => {
                  const isActive = route.id === activeRouteId;
                  return (
                    <button
                      key={route.id}
                      onClick={() => setActiveRouteId(route.id)}
                      className={`w-full border p-2.5 text-left transition-colors ${
                        isActive
                          ? "border-accent/50 bg-panel"
                          : "border-line bg-panel/40 hover:border-ink-faint"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: route.color }}
                          />
                          <span className="text-[11px] font-semibold text-ink">{route.label}</span>
                          {isActive && <CheckCircle2 size={11} className="text-accent" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                          <RouteIcon size={10} />
                          {route.distanceKm} km
                          <Clock size={10} />
                          ~{route.durationMinutes} min
                        </div>
                      </div>
                      <p className="mt-0.5 text-[10px] text-ink-faint">→ {route.destination}</p>
                    </button>
                  );
                })}

                {activeRoute && (
                  <div className="mt-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">Turn-by-turn</p>
                    <ol className="mt-1.5 max-h-36 space-y-1.5 overflow-y-auto pr-1">
                      {activeRoute.steps.map((step, index) => (
                        <li key={index} className="flex gap-2 text-[11px] text-ink">
                          <span className="shrink-0 font-mono text-[10px] text-ink-faint">{index + 1}.</span>
                          <span>
                            {step.instruction}
                            <span className="ml-1 text-ink-faint">({step.distanceMeters}m)</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <button
                  onClick={handleGetAllRoutes}
                  className="mt-1 w-full border border-line px-3 py-1.5 text-[10px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Refresh routes
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="mt-4 border border-line bg-panel/40 p-3">
          <h3 className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
            <ShieldCheck size={12} className="text-ink-faint" />
            Safety strategy
          </h3>
          <div className="mt-2 space-y-3">
            {LANDSLIDE_SAFETY_STRATEGY.map((section) => (
              <div key={section.phase}>
                <p className="text-[11px] font-semibold text-ink">{section.phase}</p>
                <ul className="mt-1 space-y-1">
                  {section.points.map((point, index) => (
                    <li key={index} className="flex gap-1.5 text-[10.5px] text-ink-muted">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
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
          background: var(--c-surface) !important;
          border: 1px solid var(--c-line) !important;
          border-radius: 2px !important;
          padding: 8px 12px !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.55) !important;
          color: var(--c-text);
        }
        .maplibregl-popup-tip { display: none !important; }
      `}</style>
    </motion.div>
  );
}
