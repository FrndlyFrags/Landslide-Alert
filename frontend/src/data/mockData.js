// -----------------------------------------------------------------------
// mockData.js
// -----------------------------------------------------------------------
// WHAT THIS FILE DOES (in plain English):
// Contains the list of NER monitoring sites, the risk-scoring formula,
// and both a SIMULATED telemetry generator (instant, offline) and a LIVE
// telemetry fetcher that calls real public weather/elevation/soil-moisture
// APIs (see services/liveDataService.js) and falls back to simulated
// numbers if the network request fails.
// -----------------------------------------------------------------------
import { fetchLiveWeather, fetchLiveSlope } from "../services/liveDataService";


// Real, fixed locations across NER known to be landslide-prone.
// This list matches the backend's services/telemetry.py file so the
// frontend and backend agree on site IDs and names.
export const NER_MONITORING_SITES = [
  { siteId: "NER-001", name: "Sonapur, East Khasi Hills", state: "Meghalaya", corridor: "Shillong Plateau", lat: 25.5138, lng: 91.9899, elevationM: 1420 },
  { siteId: "NER-002", name: "Mawkyrwat Road Section", state: "Meghalaya", corridor: "Shillong Plateau", lat: 25.3167, lng: 91.3167, elevationM: 1180 },
  { siteId: "NER-003", name: "NH-10 near Rangpo", state: "Sikkim", corridor: "NH-10 Sikkim", lat: 27.1749, lng: 88.5326, elevationM: 950 },
  { siteId: "NER-004", name: "NH-10 near Kalimpong Bypass", state: "Sikkim", corridor: "NH-10 Sikkim", lat: 27.0710, lng: 88.4700, elevationM: 1250 },
  { siteId: "NER-005", name: "Lumding Hill Section", state: "Assam", corridor: "Silchar-Lumding Route", lat: 25.7461, lng: 93.1706, elevationM: 680 },
  { siteId: "NER-006", name: "Silchar-Haflong Rail Corridor", state: "Assam", corridor: "Silchar-Lumding Route", lat: 24.8333, lng: 92.9833, elevationM: 540 },
  { siteId: "NER-007", name: "Noney District Bridge Zone", state: "Manipur", corridor: "Imphal-Jiribam Route", lat: 24.7833, lng: 93.7500, elevationM: 1050 },
  { siteId: "NER-008", name: "Kohima-Dimapur Road", state: "Nagaland", corridor: "NH-29 Nagaland", lat: 25.7500, lng: 94.0500, elevationM: 1320 },
  { siteId: "NER-009", name: "Aizawl Outer Ring Road", state: "Mizoram", corridor: "Aizawl Hill Corridor", lat: 23.7271, lng: 92.7176, elevationM: 1150 },
  { siteId: "NER-010", name: "Atharamura Range", state: "Tripura", corridor: "Agartala-Ambassa Route", lat: 23.8833, lng: 91.6167, elevationM: 420 },
  { siteId: "NER-011", name: "Bomdila-Tawang Highway", state: "Arunachal Pradesh", corridor: "Tawang Approach Road", lat: 27.2645, lng: 92.4159, elevationM: 2200 },
  { siteId: "NER-012", name: "Along-Pasighat Stretch", state: "Arunachal Pradesh", corridor: "Siang Valley Road", lat: 28.1500, lng: 95.3333, elevationM: 310 },
];

// The list of languages the multilingual notification dropdown supports.
export const SUPPORTED_LANGUAGES = [
  "English",
  "Assamese",
  "Manipuri",
  "Khasi",
  "Garo",
  "Mizo",
  "Bengali",
  "Nagamese",
];

/**
 * Picks a random decimal number between two values.
 * Used for simulated fallback data only.
 */
function randomInRange(low, high) {
  return Math.round((Math.random() * (high - low) + low) * 100) / 100;
}

/**
 * Generates a fake-but-realistic bundle of weather, soil, and satellite
 * readings for one monitoring site — used only as offline/fallback data
 * if all live network requests fail.
 */
export function generateSiteTelemetry() {
  return {
    rainfallLast24hMm: randomInRange(5, 220),
    rainfallNext6hMm: randomInRange(0, 90),
    soilSaturationPercent: randomInRange(20, 99),
    slopeAngleDegrees: randomInRange(18, 55),
    landCreepRateMmPerDay: randomInRange(0.1, 12.0),
    groundDisplacementMmPerMonth: randomInRange(0.0, 45.0),
    roadStatus: Math.random() > 0.75 ? "blocked" : "open",
    dataSource: { weather: "simulated", slope: "simulated", soil: "simulated", satellite: "simulated" },
  };
}

/**
 * Builds telemetry for one site using REAL live data where possible:
 *   - Rainfall (last 24h + 6h forecast) → Open-Meteo [LIVE]
 *   - Soil moisture (0–1 cm depth)       → Open-Meteo model [LIVE]
 *   - Slope angle & elevation            → NASA SRTM via Open Topo Data [LIVE]
 *   - Land creep rate                    → derived from real rainfall (proxy) [SIM]
 *   - Ground displacement                → no free API, stays random [SIM]
 *   - Road status                        → no free real-time feed [SIM]
 * Falls back to fully simulated data for any field where the network fails.
 */
export async function fetchLiveSiteTelemetry(site) {
  const fallback = generateSiteTelemetry();
  const dataSource = { weather: "simulated", slope: "simulated", soil: "simulated", satellite: "simulated" };

  let rainfallLast24hMm = fallback.rainfallLast24hMm;
  let rainfallNext6hMm = fallback.rainfallNext6hMm;
  let soilSaturationPercent = fallback.soilSaturationPercent;

  try {
    const weather = await fetchLiveWeather(site.lat, site.lng);
    rainfallLast24hMm = weather.rainfallLast24hMm;
    rainfallNext6hMm = weather.rainfallNext6hMm;
    soilSaturationPercent = weather.soilSaturationPercent;
    dataSource.weather = "live";
    dataSource.soil = "live"; // soil moisture from same Open-Meteo call
  } catch (error) {
    console.warn(`Live weather/soil unavailable for ${site.siteId}, using simulated fallback.`, error);
  }

  let slopeAngleDegrees = fallback.slopeAngleDegrees;
  let elevationMeters = site.elevationM;
  try {
    const slope = await fetchLiveSlope(site.lat, site.lng);
    slopeAngleDegrees = slope.slopeDegrees;
    elevationMeters = slope.elevationMeters;
    dataSource.slope = "live";
  } catch (error) {
    console.warn(`Live elevation unavailable for ${site.siteId}, using simulated fallback.`, error);
  }

  // Land creep rate: no free IoT sensor feed exists for NER.
  // Proxy it from real rainfall — higher recent rainfall → higher estimated creep.
  // Still labeled SIM since it is not a direct physical measurement.
  const rainfallFactor = Math.min(1, rainfallLast24hMm / 150);
  const landCreepRateMmPerDay = round1(0.3 + rainfallFactor * 10.5 + randomInRange(-0.5, 0.5));

  return {
    rainfallLast24hMm,
    rainfallNext6hMm,
    slopeAngleDegrees,
    elevationMeters,
    soilSaturationPercent,
    landCreepRateMmPerDay: Math.max(0.1, landCreepRateMmPerDay),
    groundDisplacementMmPerMonth: fallback.groundDisplacementMmPerMonth,
    roadStatus: fallback.roadStatus,
    dataSource,
  };
}

/**
 * Builds the full site list using SIMULATED telemetry only — instant
 * fallback when there is no internet connection at all.
 */
export function buildRankedSiteList() {
  return NER_MONITORING_SITES.map((site) => {
    const telemetry = generateSiteTelemetry();
    const risk = calculateLandslideRisk(telemetry);
    return { ...site, telemetry, risk };
  }).sort((a, b) => b.risk.failureProbabilityPercent - a.risk.failureProbabilityPercent);
}

/**
 * Builds the full site list using REAL live weather, soil moisture, and
 * elevation data, fetching all 12 sites in parallel.
 */
export async function buildRankedSiteListLive() {
  const sitesWithTelemetry = await Promise.all(
    NER_MONITORING_SITES.map(async (site) => {
      const telemetry = await fetchLiveSiteTelemetry(site);
      const risk = calculateLandslideRisk(telemetry);
      return { ...site, telemetry, risk };
    })
  );
  return sitesWithTelemetry.sort(
    (a, b) => b.risk.failureProbabilityPercent - a.risk.failureProbabilityPercent
  );
}

/**
 * The weighted risk-scoring formula (same logic as backend predict.py).
 * Inputs: rainfall (30 pts), soil saturation (25 pts), slope (20 pts),
 *         creep rate (15 pts), ground displacement (10 pts).
 */
export function calculateLandslideRisk(telemetry) {
  const rainfallPoints = Math.min(30, (telemetry.rainfallLast24hMm / 200) * 30);
  const soilPoints = (telemetry.soilSaturationPercent / 100) * 25;
  const slopePoints = Math.min(20, (telemetry.slopeAngleDegrees / 45) * 20);
  const creepPoints = Math.min(15, (telemetry.landCreepRateMmPerDay / 10) * 15);
  const displacementPoints = Math.min(
    10,
    (telemetry.groundDisplacementMmPerMonth / 40) * 10
  );

  const totalScore = Math.max(
    0,
    Math.min(100, rainfallPoints + soilPoints + slopePoints + creepPoints + displacementPoints)
  );

  let riskLevel = "safe";
  if (totalScore >= 70) riskLevel = "critical";
  else if (totalScore >= 40) riskLevel = "moderate";

  return { failureProbabilityPercent: Math.round(totalScore * 10) / 10, riskLevel };
}

/**
 * Combines every site's score into a single regional score.
 * Powers the "Regional Global Risk Score" badge in the header.
 */
export function calculateRegionalScore(rankedSites) {
  const scores = rankedSites.map((site) => site.risk.failureProbabilityPercent);
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const highest = Math.max(...scores);
  const regionalScore = Math.round((average * 0.6 + highest * 0.4) * 10) / 10;

  let riskLevel = "safe";
  if (regionalScore >= 70) riskLevel = "critical";
  else if (regionalScore >= 40) riskLevel = "moderate";

  return { regionalScore, riskLevel };
}

/**
 * Generates a 6-point slip-plane displacement trend, now weighted by
 * actual rainfall (passed in) to make it less purely random.
 */
export function generateSlipPlaneTrend(rainfallLast24hMm = 50) {
  const rainfallBoost = (rainfallLast24hMm / 200) * 3;
  let value = 2 + rainfallBoost;
  const points = [];
  const weekLabels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"];
  for (let i = 0; i < 6; i++) {
    const drift = (Math.random() * 3) - 0.5 + rainfallBoost * 0.3;
    value += drift;
    points.push({ week: weekLabels[i], displacementMm: Math.max(0, Math.round(value * 10) / 10) });
  }
  return points;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

