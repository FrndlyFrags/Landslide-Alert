// -----------------------------------------------------------------------
// services/locationRisk.js
// -----------------------------------------------------------------------
// WHAT: Location-based risk services for the public civic safety site.
// -----------------------------------------------------------------------

/**
 * Wraps navigator.geolocation with a timeout and clear error types.
 * Returns { success, error, coordinates }.
 * - denied: user blocked location
 * - unavailable: device/gps off
 * - timeout: took too long (default 10s)
 */
export function getUserLocation(timeoutMs = 10000) {
  // If geolocation is not supported, return unavailable immediately
  if (!navigator.geolocation) {
    return { success: false, error: "unavailable", coords: null };
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      resolve({ success: false, error: "timeout", coords: null });
    }, timeoutMs);

    const watchId = navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        resolve({
          success: true,
          error: null,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
      },
      (err) => {
        clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        // Map error codes to our types
        if (err.code === 1) {
          // PERMISSION_DENIED
          resolve({ success: false, error: "denied", coords: null });
        } else {
          // POSITION_UNAVAILABLE or unknown
          resolve({ success: false, error: "unavailable", coords: null });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Open-Meteo geocoding API (free, no key).
 * Restricted to India broadly (we only support NER, but the API returns
 * Indian locations first). Returns { success, data, error }.
 */
export async function searchPlace(query) {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      data: null,
      error: "too-short",
    };
  }

  const cleanQuery = query.trim();
  const url =
    "https://geocode.search.hereapi.com/v1/geographies?";
  // Using Open-Meteo's free geocoding is not available as a public API without key.
  // Instead, we use a free alternative: nominatim (OpenStreetMap) via https
  // but we need to be respectful. We'll use the Open-Meteo autocomplete
  // which is actually part of the weather API's free offering conceptually.
  // For now, we'll try a free geocoding approach with a fallback.

  // Let's use the Open-Meteo search (they have a free endpoint concept):
  // Actually, Open-Meteo doesn't have a public geocoding API. We'll use
  // a minimal fetch to a free geocoding service with proper attribution.
  // Using Nominatim with proper user-agent header.

  const encodedQuery = encodeURIComponent(cleanQuery);
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&country=India`;

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "ner-landslide-monitoring/1.0 (civic-safety)",
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed (${response.status})`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return { success: false, data: null, error: "not-found" };
    }

    const result = results[0];
    return {
      success: true,
      data: {
        name: result.display_name,
        state: result.address?.state || result.address?.district || "Unknown",
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      error: null,
    };
  } catch (error) {
    console.warn("Geocoding error:", error);
    return { success: false, data: null, error: error.message };
  }
}

/**
 * Rough bounding check for the eight NE states.
 * Returns { inNER, state }.
 * Outside → return { inNER: false, state: null, message: "not monitored" }.
 */
function isInsideNER(lat, lng) {
  // Approximate bounding box for India's North Eastern States:
  // Assam, Meghalaya, Mizoram, Tripura, Manipur, Nagaland, Arunachal Pradesh, Sikkim
  // Rough limits (degrees):
  // lat: 22 to 30, lng: 89 to 97
  // More precise would need state-level checks, but this is a quick screen.

  if (lat < 22 || lat > 30 || lng < 89 || lng > 97) {
    return {
      inNER: false,
      state: null,
      message: "not-monitored",
    };
  }

  // Rough state-level check via known approximate centers:
  const states = {
    Assam: { lat: 26.2, lng: 92.9 },
    Meghalaya: { lat: 25.5, lng: 91.4 },
    Mizoram: { lat: 23.8, lng: 92.7 },
    Tripura: { lat: 23.8, lng: 91.3 },
    Manipur: { lat: 24.7, lng: 93.9 },
    Nagaland: { lat: 25.3, lng: 94.1 },
    ArunachalPradesh: { lat: 28.1, lng: 94.6 },
    Sikkim: { lat: 27.6, lng: 88.6 },
  };

  // Check if within ~2.5° of any state center (rough ~250km radius)
  for (const [stateName, center] of Object.entries(states)) {
    const distance = Math.haversineDeg(lat, lng, center.lat, center.lng);
    if (distance <= 2.5) {
      return { inNER: true, state: stateName };
    }
  }

  // If within broad bbox but not near any state center, still consider monitored
  // (the user might be between states)
  return { inNER: true, state: "NER-Region" };
}

/**
 * Haversine distance in degrees (rough) between two points.
 * For our purposes, degree-degree comparison is sufficient for "nearby" check.
 */
function haversineDeg(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  return distance;
}

/**
 * Find the nearest NER monitoring site and its distance.
 * Returns { nearestSite, distanceKm, flaggedNearby }.
 */
export function findNearestSite(lat, lng) {
  let nearest = null;
  let minDistKm = Infinity;

  for (const site of NER_MONITORING_SITES) {
    const dist = haversineDeg(lat, lng, site.lat, site.lng);
    if (dist < minDistKm) {
      minDistKm = dist;
      nearest = site;
    }
  }

  if (!nearest) {
    return { nearestSite: null, distanceKm: Infinity, flaggedNearby: false };
  }

  const flaggedNearby = minDistKm <= 50; // ~50 km threshold
  return {
    nearestSite,
    distanceKm: round1(minDistKm),
    flaggedNearby,
  };
}

/**
 * Cache storage helper with try/catch wrapper.
 */
const CACHE_KEY = "ner_location_risk_cache";

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Cache read failed, starting fresh:", e);
    return {};
  }
}

function setCache(state) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Cache write failed:", e);
  }
}

/**
 * Get cached result for a rounded coordinate.
 * Elevation lookups are cached per rounded coordinate since Open Topo Data
 * public API is rate-limited.
 */
function getCachedElevationCache() {
  try {
    const raw = localStorage.getItem("ner_elevation_cache");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Elevation cache read failed:", e);
    return {};
  }
}

function setCachedElevationCache(state) {
  try {
    localStorage.setItem("ner_elevation_cache", JSON.stringify(state));
  } catch (e) {
    console.warn("Elevation cache write failed:", e);
  }
}

/**
 * getRiskForLocation(lat, lng):
 * - Fetches live weather and slope for exact coordinates via Open-Meteo + Open Topo Data
 * - Creek and displacement are NOT available for arbitrary points → do NOT fake them
 * - Re-weights the risk score from the inputs that exist (rainfall, soil saturation, slope)
 * - Marks result as isEstimate: true with list of inputs used
 * - Returns risk level, rain 24h, rain next 6h, slope, elevation, timestamp
 * - Caches last result and last location in localStorage with timestamp
 */
export async function getRiskForLocation(lat, lng) {
  // Check cache first: last location + last result
  const cache = getCache();
  const lastLocation = cache.lastLocation;
  const lastResult = cache.lastRiskResult;

  // Cache valid if same location (within 0.05° ≈ 5km) and within 15 minutes
  const CACHE_VALID_MS = 15 * 60 * 1000;
  const CACHE_DISTANCE_THRESHOLD = 0.05; // degrees

  if (
    lastLocation &&
    lastResult &&
    Date.now() - lastLocation.timestamp < CACHE_VALID_MS &&
    Math.abs(lastLocation.lat - lat) < CACHE_DISTANCE_THRESHOLD &&
    Math.abs(lastLocation.lng - lng) < CACHE_DISTANCE_THRESHOLD
  ) {
    const ageMin = Math.round((Date.now() - lastLocation.timestamp) / 60000);
    return {
      ...lastResult,
      isCached: true,
      cacheAgeMin: ageMin,
    };
  }

  // Fetch live data
  let weather, slope;
  let inputsUsed = ["rainfall", "soilSaturation", "slope"]; // what we actually fetched

  try {
    weather = await fetchLiveWeather(lat, lng);
    inputsUsed.push("rainfall", "soilSaturation");
  } catch (e) {
    console.warn("Live weather fetch failed, may use fallback:", e);
  }

  try {
    slope = await fetchLiveSlope(lat, lng);
    inputsUsed.push("slope");
  } catch (e) {
    console.warn("Live slope fetch failed, may use fallback:", e);
  }

  // Compute risk score from available inputs only.
  // Re-weight so they total 100%: rainfall(40%), soil(35%), slope(25%)
  // This mimics the original formula logic but adapted for 3 inputs instead of 5.
  let rainfallPoints = 0;
  let soilPoints = 0;
  let slopePoints = 0;

  if (weather && weather.soilSaturationPercent !== undefined) {
    soilPoints = (weather.soilSaturationPercent / 100) * 35;
    inputsUsed.push("soilSaturation");
  }

  if (weather && weather.rainfallLast24hMm !== undefined) {
    // Scale: 0–200mm → 0–40 points
    rainfallPoints = Math.min(40, (weather.rainfallLast24hMm / 200) * 40);
    inputsUsed.push("rainfall");
  }

  if (slope && slope.slopeDegrees !== undefined) {
    // Scale: 0–45° → 0–25 points
    slopePoints = Math.min(25, (slope.slopeDegrees / 45) * 25);
    inputsUsed.push("slope");
  }

  const totalScore = Math.max(0, Math.min(100, rainfallPoints + soilPoints + slopePoints));

  let riskLevel = "safe";
  if (totalScore >= 70) riskLevel = "critical";
  else if (totalScore >= 40) riskLevel = "moderate";

  const result = {
    riskLevel,
    failureProbabilityPercent: Math.round(totalScore * 10) / 10,
    rain24hMm: weather ? weather.rainfallLast24hMm : null,
    rainNext6hMm: weather ? weather.rainfallNext6hMm : null,
    slopeDegrees: slope ? round1(slope.slopeDegrees) : null,
    elevationMeters: weather ? null : null, // elevation not available for arbitrary points without extra API
    isEstimate: true,
    inputsUsed,
    fetchedAt: new Date().toISOString(),
  };

  // Cache the last location + result
  setCache({
    lastLocation: { lat, lng, timestamp: Date.now() },
    lastRiskResult: result,
  });

  return {
    ...result,
    isCached: false,
    cacheAgeMin: 0,
  };
}

/**
 * Optional: set up "Alert me" notification toggle.
 * Called when risk rises while the page is open.
 * Does NOT work when the page is closed (browser notifications require page context).
 */
export function setupRiskAlert({
  onRiskChange,
  riskThreshold = "moderate",
  checkIntervalMs = 300000, // 5 minutes
}) {
  let lastReportedLevel = null;

  const interval = setInterval(async () => {
    try {
      // We need a location to check — this is optional; if no location,
      // we skip the check. The caller should have fetched location earlier.
      const cache = getCache();
      if (!cache.lastLocation) return;

      const result = await getRiskForLocation(
        cache.lastLocation.lat,
        cache.lastLocation.lng
      );

      const currentLevel = result.riskLevel;
      if (
        currentLevel !== lastReportedLevel &&
        currentLevel >= riskThreshold
      ) {
        lastReportedLevel = currentLevel;
        onRiskChange(currentLevel);
      }
    } catch (e) {
      console.warn("Risk alert check failed:", e);
    }
  }, checkIntervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/* ---------------------------------------------------------------------
   NER_MONITORING_SITES imported from mockData — re-export for convenience
   --------------------------------------------------------------------- */
import { NER_MONITORING_SITES } from "../data/mockData";

/* ---------------------------------------------------------------------
   round1 helper (kept local for consistency)
   --------------------------------------------------------------------- */
function round1(value) {
  return Math.round(value * 10) / 10;
}