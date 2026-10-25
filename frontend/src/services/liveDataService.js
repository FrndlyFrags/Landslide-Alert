// -----------------------------------------------------------------------
// liveDataService.js
// -----------------------------------------------------------------------
// WHAT THIS FILE DOES (in plain English):
// Makes REAL network requests to real, free, public APIs so the dashboard
// reflects actual current conditions instead of randomized numbers.
// No API key or account is required for any of these.
//
// WHAT IS GENUINELY LIVE:
//   - Rainfall & weather   -> Open-Meteo (open-meteo.com)
//   - Soil moisture        -> Open-Meteo soil_moisture variable (model-derived
//                            from satellite + weather model, not a physical sensor)
//   - Ground elevation/slope -> Open Topo Data (opentopodata.org), real NASA SRTM
//   - Road-following escape routes -> OSRM (router.project-osrm.org),
//     real driving routes over OpenStreetMap roads, with alternatives
//
// WHAT IS STILL SIMULATED, AND WHY:
//   - Land creep rate: no free public feed exists for NER physical sensors.
//     It is now DRIVEN by real rainfall data as a proxy (not pure random).
//   - Sentinel-1 satellite ground-displacement: requires paid InSAR pipeline.
// -----------------------------------------------------------------------

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_TOPO_URL = "https://api.opentopodata.org/v1/srtm90m";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetches real rainfall, temperature, humidity, AND soil moisture
 * for a specific lat/lng from Open-Meteo.
 * Soil moisture (0–1 cm depth) is a model-derived estimate from Open-Meteo,
 * based on satellite + numerical weather data — not a physical sensor, but
 * real data, not a random number.
 */
export async function fetchLiveWeather(lat, lng) {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lng}` +
    `&hourly=precipitation,temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm` +
    `&past_hours=24&forecast_hours=6&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status})`);
  const data = await response.json();

  const precipitation = data.hourly.precipitation ?? [];
  const temperature = data.hourly.temperature_2m ?? [];
  const humidity = data.hourly.relative_humidity_2m ?? [];
  const soilMoistureRaw = data.hourly.soil_moisture_0_to_1cm ?? [];

  // The API returns 24 past hours followed by 6 forecast hours, in order.
  const rainfallLast24hMm = round1(sum(precipitation.slice(0, 24)));
  const rainfallNext6hMm = round1(sum(precipitation.slice(24, 30)));
  const currentTemperatureCelsius = temperature[23] ?? temperature[temperature.length - 1];
  const currentHumidityPercent = humidity[23] ?? humidity[humidity.length - 1];

  // Soil moisture from Open-Meteo is in m³/m³ (0–0.5 range typically).
  // Convert to a 0–100% saturation scale for display.
  // Field capacity for NER hill soils is roughly 0.35 m³/m³, so we use
  // 0.45 m³/m³ as the "100% saturated" anchor.
  const rawSoilMoisture = soilMoistureRaw[23] ?? soilMoistureRaw[soilMoistureRaw.length - 1] ?? 0;
  const soilSaturationPercent = Math.min(100, Math.round((rawSoilMoisture / 0.45) * 100));

  return {
    rainfallLast24hMm,
    rainfallNext6hMm,
    currentTemperatureCelsius,
    currentHumidityPercent,
    soilSaturationPercent,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches real elevation readings at 5 nearby points from Open Topo Data
 * (real NASA SRTM satellite elevation) and estimates slope angle.
 */
export async function fetchLiveSlope(lat, lng) {
  const offsetDegrees = 0.0015; // roughly 165 metres at NER's latitude
  const samplePoints = [
    [lat, lng],
    [lat + offsetDegrees, lng],
    [lat - offsetDegrees, lng],
    [lat, lng + offsetDegrees],
    [lat, lng - offsetDegrees],
  ];
  const locations = samplePoints.map(([la, lo]) => `${la},${lo}`).join("|");
  const url = `${OPEN_TOPO_URL}?locations=${locations}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open Topo Data request failed (${response.status})`);
  const data = await response.json();

  const elevations = data.results.map((result) => result.elevation);
  const centerElevation = elevations[0];
  const largestDifference = Math.max(...elevations.slice(1).map((e) => Math.abs(e - centerElevation)));
  const horizontalDistanceMeters = offsetDegrees * 111000;
  const slopeDegrees = Math.atan(largestDifference / horizontalDistanceMeters) * (180 / Math.PI);

  return {
    elevationMeters: Math.round(centerElevation),
    slopeDegrees: round1(slopeDegrees),
  };
}

/**
 * Calculates ALL available real, road-following driving routes from one
 * coordinate to another using OSRM (OpenStreetMap roads).
 * Returns primary route + up to 2 alternatives, each with its own
 * geometry, distance, duration, steps, and a display color.
 */
export async function fetchAllEscapeRoutes(fromLat, fromLng, toLat, toLng, toName = "Safe Zone") {
  const url =
    `${OSRM_URL}/${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=true`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM routing request failed (${response.status})`);
  const data = await response.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No drivable route was found");

  const ROUTE_COLORS = ["#06B6D4", "#F59E0B", "#10B981"]; // cyan, amber, emerald
  const ROUTE_LABELS = ["Primary Route", "Alt Route A", "Alt Route B"];

  return data.routes.map((route, index) => {
    const steps = route.legs[0].steps.map((step) => ({
      instruction: describeRouteStep(step),
      distanceMeters: Math.round(step.distance),
    }));
    return {
      id: `route-${index}`,
      label: ROUTE_LABELS[index] ?? `Route ${index + 1}`,
      color: ROUTE_COLORS[index] ?? "#94A3B8",
      destination: toName,
      routeGeometry: route.geometry,
      distanceKm: round1(route.distance / 1000),
      durationMinutes: Math.round(route.duration / 60),
      steps,
    };
  });
}

/**
 * Legacy single-route fetch — kept for backward compatibility.
 * Now wraps fetchAllEscapeRoutes and returns only the first (fastest) route.
 */
export async function fetchEscapeRoute(fromLat, fromLng, toLat, toLng) {
  const routes = await fetchAllEscapeRoutes(fromLat, fromLng, toLat, toLng);
  return routes[0];
}

/**
 * Turns one OSRM route step into a plain-English driving instruction.
 */
function describeRouteStep(step) {
  const roadName = step.name || "the road ahead";
  const maneuverType = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;

  if (maneuverType === "depart") return `Head out onto ${roadName}`;
  if (maneuverType === "arrive") return "Arrive at the safe zone";
  if (modifier) return `Turn ${modifier} onto ${roadName}`;
  return `Continue on ${roadName}`;
}

function sum(numbers) {
  return numbers.reduce((total, value) => total + (value ?? 0), 0);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}
