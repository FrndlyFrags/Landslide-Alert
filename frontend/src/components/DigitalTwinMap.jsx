// -----------------------------------------------------------------------
// DigitalTwinMap.jsx
// -----------------------------------------------------------------------
// WHAT: Central viewport of dashboard with MapLibre GL JS interactive map:
//         - Esri World Imagery maxzoom 17
//         - NATIVE WebGL GeoJSON Circle Layers for Site Dots:
//           Rendered directly inside WebGL canvas so dots are 100% locked
//           to terrain coordinates and NEVER shift or drift when zooming in/out or pitching!
//         - MapLibre Heatmap layer for Displacement Heat
//         - Tactical Controls Bar (Field Photo Report, Drone Patrol, Day/Night)
//         - Right-hand side panel containing Spatial Inspector & Emergency Road Rerouting
// -----------------------------------------------------------------------
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mountain, CloudRain, Droplets, Satellite as SatelliteIcon,
  Route, Box, Loader2, Play, Pause, Sun, Moon, MapPin, Lock as LockIcon, Unlock, Camera, TrafficCone, AlertTriangle,
} from "lucide-react";
import { getRiskColor, getRiskColorRgba, getRainStatus } from "../utils/colorUtils";
import { FieldPhotoModal } from "./FieldIntelligencePanel";

const MAP_LAYERS = [
  { id: "elevation", label: "3D Terrain", icon: Mountain },
  { id: "rainfall", label: "Rainfall Overlay", icon: CloudRain },
  { id: "soil", label: "Soil Nodes", icon: Droplets },
  { id: "displacement", label: "Displacement Heatmap", icon: SatelliteIcon },
  { id: "roads", label: "Road Status", icon: Route },
];

const ALTERNATE_ROUTES = {
  "NER-003": "Detour via Melli - Jorethang bypass road (adds ~45 min)",
  "NER-004": "Detour via Algarah - Lava alternate hill road (adds ~70 min)",
  "NER-005": "Detour via Diphu - Haflong link road (adds ~90 min)",
  "NER-006": "Detour via Jatinga - Harangajao forest road (adds ~110 min)",
  "NER-007": "Detour via Tamenglong bypass track (adds ~60 min)",
  "NER-008": "Detour via Zubza - Chumukedima link road (adds ~40 min)",
  "NER-009": "Detour via Kolasib - Vairengte alternate road (adds ~55 min)",
  "NER-010": "Detour via Teliamura - Khowai link road (adds ~35 min)",
  "NER-011": "Detour via Dirang - Bomdila old cart road (adds ~120 min)",
  "NER-012": "Detour via Ledum - Pasighat farm road (adds ~50 min)",
};

function SourceTag({ source }) {
  const isLive = source === "live";
  return (
    <span
      className={`ml-1.5 rounded px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide ${
        isLive ? "bg-telemetry/15 text-telemetry" : "bg-slate-700/60 text-slate-400"
      }`}
    >
      {isLive ? "Live" : "Sim"}
    </span>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <Icon size={13} className="text-telemetry/70" />
      {children}
    </h2>
  );
}

export default function DigitalTwinMap({
  rankedSites,
  activeLayers,
  onToggleLayer,
  selectedSite,
  onSelectSite,
  onOpenTerrainView,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const orbitAnimRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isDroneOrbiting, setIsDroneOrbiting] = useState(false);
  const [isDaylight, setIsDaylight] = useState(false);
  const [isMapUnlocked, setIsMapUnlocked] = useState(true); // Default free zoom & pan active
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const showElevation = activeLayers.includes("elevation");
  const showRainfall = activeLayers.includes("rainfall");
  const showDisplacement = activeLayers.includes("displacement");
  const showSoil = activeLayers.includes("soil");
  const showRoads = activeLayers.includes("roads");

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
          { id: "labels", type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.85 } },
        ],
      },
      center: [93.0, 25.8],
      zoom: 6.5,
      pitch: 35,
      bearing: -10,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

    map.on("load", () => {
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 15,
      });

      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-color": "rgba(15, 23, 42, 1)",
          "sky-atmosphere-sun": [0.0, 90.0],
          "sky-atmosphere-sun-intensity": 5,
        },
      });

      setIsMapReady(true);
    });

    return () => {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Unlock/Lock map panning ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    if (isMapUnlocked) {
      map.scrollZoom.enable();
      map.dragPan.enable();
    } else {
      map.scrollZoom.disable();
      map.dragPan.disable();
    }
  }, [isMapUnlocked, isMapReady]);

  // ── Toggle 3D terrain ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    if (showElevation) {
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.8 });
    } else {
      map.setTerrain(null);
    }
  }, [showElevation, isMapReady]);

  // ── Toggle Day / Night lighting ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    if (map.getLayer("sky")) {
      map.setPaintProperty("sky", "sky-atmosphere-color", isDaylight ? "rgba(135, 206, 235, 1)" : "rgba(15, 23, 42, 1)");
      map.setPaintProperty("sky", "sky-atmosphere-sun-intensity", isDaylight ? 15 : 5);
    }
  }, [isDaylight, isMapReady]);

  // ── MapLibre Displacement Heatmap Layer ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !rankedSites) return;

    const sourceId = "displacement-heatmap-src";
    const layerId = "displacement-heatmap-layer";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (showDisplacement) {
      const geojsonFeatures = rankedSites.map((site) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [site.lng, site.lat] },
        properties: {
          weight: site.telemetry.groundDisplacementMmPerMonth || 10,
        },
      }));

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: geojsonFeatures },
      });

      map.addLayer({
        id: layerId,
        type: "heatmap",
        source: sourceId,
        maxzoom: 17,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0.2, 45, 1.2],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(6, 182, 212, 0)",
            0.2, "rgba(6, 182, 212, 0.5)",
            0.4, "rgba(245, 158, 11, 0.7)",
            0.7, "rgba(249, 115, 22, 0.85)",
            1.0, "rgba(239, 68, 68, 0.95)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 25, 12, 60],
          "heatmap-opacity": 0.85,
        },
      });
    }
  }, [showDisplacement, isMapReady, rankedSites]);

  // ── NATIVE WebGL GeoJSON Circle Layers for Site Dots ──────────────────
  // Replaces HTML DOM markers with WebGL layers so dots NEVER shift/drift on zoom or tilt!
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !rankedSites) return;

    const srcId = "native-site-dots-src";
    const glowLayerId = "native-site-dots-glow";
    const ringLayerId = "native-site-dots-ring";
    const dotLayerId = "native-site-dots-main";
    const rainSymbolLayerId = "native-site-rain-icon";

    // Clean up old layers if re-rendering
    [rainSymbolLayerId, dotLayerId, ringLayerId, glowLayerId].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(srcId)) map.removeSource(srcId);

    const geojsonFeatures = rankedSites.map((site) => {
      const riskPercent = site.risk.failureProbabilityPercent;
      const color = getRiskColor(riskPercent);
      const rainStatus = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);

      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [site.lng, site.lat] },
        properties: {
          siteId: site.siteId,
          name: site.name,
          state: site.state,
          riskPercent: riskPercent,
          color: color,
          isRaining: rainStatus.isRaining,
          rainLabel: rainStatus.label,
          rainIcon: rainStatus.icon,
          rainfall24h: site.telemetry.rainfallLast24hMm,
          soilSaturation: site.telemetry.soilSaturationPercent,
        },
      };
    });

    map.addSource(srcId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: geojsonFeatures },
    });

    // 1. Soft glowing aura behind dot
    map.addLayer({
      id: glowLayerId,
      type: "circle",
      source: srcId,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 12, 12, 22],
        "circle-opacity": 0.35,
        "circle-blur": 0.8,
      },
    });

    // 2. Soil Saturation Ring (if soil layer is active)
    if (showSoil) {
      map.addLayer({
        id: ringLayerId,
        type: "circle",
        source: srcId,
        paint: {
          "circle-color": "transparent",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 10, 12, 16],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#06B6D4",
          "circle-stroke-opacity": 0.8,
        },
      });
    }

    // 3. Native Solid Dot Layer (WebGL rendered — 100% locked to earth!)
    map.addLayer({
      id: dotLayerId,
      type: "circle",
      source: srcId,
      paint: {
        "circle-color": ["get", "color"],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 6, 12, 10],
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#ffffff",
      },
    });

    // 4. Cloud symbol layer when Rainfall Overlay is active
    if (showRainfall) {
      map.addLayer({
        id: rainSymbolLayerId,
        type: "symbol",
        source: srcId,
        layout: {
          "text-field": ["case", ["get", "isRaining"], ["get", "rainIcon"], "☁️"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 14, 12, 22],
          "text-offset": [0, -1.4],
          "text-allow-overlap": true,
        },
      });
    }

    // 4. Click event listener on WebGL dots
    const handleClick = (e) => {
      if (e.features && e.features.length > 0) {
        const siteId = e.features[0].properties.siteId;
        onSelectSite(siteId);
      }
    };

    const handleMouseEnter = (e) => {
      map.getCanvas().style.cursor = "pointer";

      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates;

        if (popupRef.current) popupRef.current.remove();

        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: false, className: "ner-popup" })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:'Inter',sans-serif;font-size:11px;padding:4px 2px;">
              <strong style="color:#f1f5f9;">${props.name}</strong><br/>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                <span style="color:${props.color};font-family:monospace;font-weight:700;font-size:12px;">
                  ${props.riskPercent}% Risk
                </span>
                <span style="color:#94a3b8;font-size:10px;">${props.state}</span>
              </div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid #334155;display:flex;align-items:center;justify-between;gap:8px;font-size:10px;">
                <span>Weather: ${props.rainIcon} <strong>${props.rainLabel}</strong></span>
                <span style="font-family:monospace;color:#06B6D4;">${props.rainfall24h}mm 24h</span>
              </div>
            </div>
          `)
          .addTo(map);
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      if (popupRef.current) popupRef.current.remove();
    };

    map.on("click", dotLayerId, handleClick);
    map.on("mouseenter", dotLayerId, handleMouseEnter);
    map.on("mouseleave", dotLayerId, handleMouseLeave);

    return () => {
      // On unmount, React runs this cleanup AFTER the map-init effect's
      // cleanup has already destroyed the map (cleanups run in declaration
      // order). Calling getLayer() on a destroyed map throws and blanks the
      // whole app, so skip cleanup when the map is already gone.
      if (mapRef.current !== map) return;
      try {
        if (map.getLayer(dotLayerId)) {
          map.off("click", dotLayerId, handleClick);
          map.off("mouseenter", dotLayerId, handleMouseEnter);
          map.off("mouseleave", dotLayerId, handleMouseLeave);
        }
      } catch {
        // Map was destroyed mid-cleanup — nothing left to detach.
      }
    };
  }, [rankedSites, isMapReady, showSoil, showRainfall, onSelectSite]);

  // ── Fly to selected site ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !selectedSite) return;
    map.flyTo({
      center: [selectedSite.lng, selectedSite.lat],
      zoom: 11,
      pitch: 52,
      bearing: -15,
      duration: 1200,
      essential: true,
    });
  }, [selectedSite?.siteId, isMapReady]);

  // ── 3D Drone Orbit Animation ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !isDroneOrbiting) {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
      return;
    }

    function rotateCamera() {
      map.setBearing((map.getBearing() + 0.25) % 360);
      orbitAnimRef.current = requestAnimationFrame(rotateCamera);
    }

    orbitAnimRef.current = requestAnimationFrame(rotateCamera);
    return () => {
      if (orbitAnimRef.current) cancelAnimationFrame(orbitAnimRef.current);
    };
  }, [isDroneOrbiting, isMapReady]);

  const selectedRainStatus = selectedSite
    ? getRainStatus(selectedSite.telemetry.rainfallLast24hMm, selectedSite.telemetry.rainfallNext6hMm)
    : null;

  const selectedRiskColor = selectedSite ? getRiskColor(selectedSite.risk.failureProbabilityPercent) : "#10B981";

  const blockedSites = rankedSites ? rankedSites.filter((site) => site.telemetry.roadStatus === "blocked") : [];

  return (
    <div className="flex h-full flex-col">
      {/* Layer toggle bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-dark-slate px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
            Map Layers
          </span>
          {MAP_LAYERS.map((layer) => {
            const isActive = activeLayers.includes(layer.id);
            const Icon = layer.icon;
            return (
              <button
                key={layer.id}
                onClick={() => onToggleLayer(layer.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-all ${
                  isActive
                    ? "border-telemetry bg-telemetry/10 text-telemetry shadow-glow-cyan"
                    : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={12} />
                {layer.label}
              </button>
            );
          })}
        </div>

        {/* Tactical Map Controls */}
        <div className="flex items-center gap-2">
          {/* Field Photo Report Modal Trigger Button */}
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-telemetry/50 bg-telemetry/10 px-3 py-1 text-[11px] font-semibold text-telemetry hover:bg-telemetry/20 transition-all shadow-glow-cyan/40"
            title="Upload slope crack photo for AI analysis"
          >
            <Camera size={13} />
            <span>Field Photo Report</span>
          </button>

          {/* Map Lock / Unlock Toggle */}
          <button
            onClick={() => setIsMapUnlocked((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              isMapUnlocked
                ? "border-telemetry/50 bg-telemetry/10 text-telemetry"
                : "border-slate-700 bg-slate-card/80 text-slate-400 hover:border-slate-500"
            }`}
            title={isMapUnlocked ? "Free pan/zoom active" : "Map movement locked"}
          >
            {isMapUnlocked ? <Unlock size={12} /> : <LockIcon size={12} />}
            <span>{isMapUnlocked ? "Map Unlocked" : "Map Locked"}</span>
          </button>

          {/* Quick Location Jump Select */}
          {rankedSites && (
            <div className="relative flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-card/80 px-2 py-1 text-[11px] text-slate-200">
              <MapPin size={12} className="text-telemetry shrink-0" />
              <select
                value={selectedSite?.siteId || ""}
                onChange={(e) => onSelectSite(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1 text-[11px]"
              >
                {rankedSites.map((site) => (
                  <option key={site.siteId} value={site.siteId} className="bg-slate-800 text-slate-100">
                    {site.name} ({site.risk.failureProbabilityPercent}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3D Drone Patrol Orbit Button */}
          <button
            onClick={() => setIsDroneOrbiting((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
              isDroneOrbiting
                ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-glow-amber"
                : "border-slate-700 bg-slate-card/80 text-slate-300 hover:border-slate-500"
            }`}
            title="Orbit camera 360° around selected hillside in 3D"
          >
            {isDroneOrbiting ? <Pause size={12} className="animate-pulse" /> : <Play size={12} />}
            <span>{isDroneOrbiting ? "Patrol Active" : "3D Drone Patrol"}</span>
          </button>

          {/* Day / Night lighting toggle */}
          <button
            onClick={() => setIsDaylight((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-card/80 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500"
            title="Toggle Tactical Day/Night sky lighting"
          >
            {isDaylight ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-telemetry" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Map canvas */}
        <div className="relative flex-1 overflow-hidden">
          <div ref={mapContainerRef} className="h-full w-full" />

          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-onyx z-20">
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin text-telemetry" />
                Loading satellite terrain...
              </p>
            </div>
          )}


          {/* Radar sweep */}
          {isMapReady && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 animate-radar-sweep opacity-[0.12] z-10">
              <div
                className="h-full w-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #06B6D4 340deg, #06B6D4 360deg)",
                }}
              />
            </div>
          )}

          {/* Road connectivity legend */}
          {showRoads && isMapReady && (
            <div className="absolute bottom-10 left-4 z-20 flex gap-4 rounded-lg border border-slate-800 bg-slate-card/90 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-sm shadow-xl">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded bg-emerald-500 shadow-glow-emerald" /> Open Road
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded bg-red-500 shadow-glow-red" /> Blocked Road
              </span>
            </div>
          )}

          {/* Map info hint */}
          {isMapReady && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-card/80 px-2.5 py-1 text-[9.5px] text-slate-300 backdrop-blur font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SATELLITE · 3D TERRAIN · LIVE MONITORING
              {selectedSite && (
                <span className="border-l border-slate-700 pl-2 text-telemetry">
                  SLOPE: {selectedSite.telemetry.slopeAngleDegrees}°
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right-hand side panel: Spatial Inspector & Emergency Road Rerouting */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-dark-slate p-4 flex flex-col gap-5">
          {/* Spatial Inspector */}
          <AnimatePresence mode="wait">
            {selectedSite ? (
              <motion.div
                key={selectedSite.siteId}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Spatial Inspector</p>
                <h3 className="mt-1 text-sm font-semibold text-slate-50">{selectedSite.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedSite.state} · {selectedSite.corridor}
                </p>

                {/* Smooth green-to-red risk score badge */}
                <div
                  className="mt-3 inline-block rounded-md px-2.5 py-1 font-mono text-xs font-semibold ring-1"
                  style={{
                    color: selectedRiskColor,
                    backgroundColor: getRiskColorRgba(selectedSite.risk.failureProbabilityPercent, 0.12),
                    borderColor: selectedRiskColor,
                  }}
                >
                  {selectedSite.risk.failureProbabilityPercent}% Failure Probability
                </div>

                {/* Explicit Rain Status Card */}
                {selectedRainStatus && (
                  <div className={`mt-3 rounded-lg border p-2.5 ${selectedRainStatus.bgClass}`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>{selectedRainStatus.icon}</span>
                        {selectedRainStatus.label}
                      </span>
                      <span className="font-mono text-[10.5px] font-medium">
                        {selectedRainStatus.detail}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      24h Total: <strong className="text-slate-200">{selectedSite.telemetry.rainfallLast24hMm} mm</strong> | 6h Forecast: <strong className="text-slate-200">{selectedSite.telemetry.rainfallNext6hMm} mm</strong>
                    </p>
                  </div>
                )}

                <dl className="mt-4 space-y-2 text-[11px]">
                  <InspectorRow
                    label="Slope Angle"
                    value={`${selectedSite.telemetry.slopeAngleDegrees}°`}
                    source={selectedSite.telemetry.dataSource?.slope}
                  />
                  <InspectorRow
                    label="Soil Saturation"
                    value={`${selectedSite.telemetry.soilSaturationPercent}%`}
                    source={selectedSite.telemetry.dataSource?.soil}
                  />
                  <InspectorRow
                    label="24h Rainfall"
                    value={`${selectedSite.telemetry.rainfallLast24hMm} mm`}
                    source={selectedSite.telemetry.dataSource?.weather}
                  />
                  <InspectorRow
                    label="Land Creep Rate"
                    value={`${selectedSite.telemetry.landCreepRateMmPerDay} mm/day`}
                    source={selectedSite.telemetry.dataSource?.satellite}
                  />
                  <InspectorRow
                    label="Road Status"
                    value={selectedSite.telemetry.roadStatus === "open" ? "Open" : "Blocked"}
                    valueClass={
                      selectedSite.telemetry.roadStatus === "open" ? "text-emerald-400" : "text-red-400"
                    }
                  />
                </dl>

                <button
                  onClick={() => onOpenTerrainView(selectedSite)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-telemetry/50 bg-telemetry/10 px-3 py-2 text-[11px] font-semibold text-telemetry transition-colors hover:bg-telemetry/20"
                >
                  <Box size={13} />
                  3D Terrain &amp; All Escape Routes
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-28 flex-col items-center justify-center gap-2 text-center border-b border-slate-800/80 pb-4"
              >
                <SatelliteIcon size={20} className="text-slate-600" />
                <p className="text-[11px] text-slate-500">
                  Click any site marker on the satellite map to inspect its live data
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emergency Road Rerouting Section on Right Side */}
          <section className="border-t border-slate-800 pt-4">
            <SectionHeading icon={TrafficCone}>Emergency Road Rerouting</SectionHeading>
            {blockedSites.length === 0 ? (
              <p className="mt-2 rounded-md border border-slate-800 bg-slate-card/40 p-3 text-[11px] text-slate-500">
                All primary highways are currently open. No reroutes needed.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {blockedSites.map((site) => (
                  <li
                    key={site.siteId}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-[11px]"
                  >
                    <p className="font-medium text-red-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="shrink-0" />
                      {site.name} — road blocked
                    </p>
                    <p className="mt-1 text-slate-300 leading-relaxed">
                      {ALTERNATE_ROUTES[site.siteId] ??
                        "No pre-mapped detour available. Dispatch a survey team."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Field Photo Report Modal */}
      <FieldPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
      />

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
        .maplibregl-ctrl-attrib { font-size: 9px !important; }
      `}</style>
    </div>
  );
}

function InspectorRow({ label, value, valueClass = "text-slate-100", source }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`flex items-center font-mono ${valueClass}`}>
        {value}
        {source && <SourceTag source={source} />}
      </dd>
    </div>
  );
}
