import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { useReducer } from "react";
import Skeleton from "./ui/Skeleton";
import { getUserLocation, searchPlace, getRiskForLocation, findNearestSite } from "../services/locationRisk";
import { NER_MONITORING_SITES } from "../data/mockData";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";

/* ---------------------------------------------------------------------
   Action-line text per risk level and language
   --------------------------------------------------------------------- */
const ACTION_TEXTS = {
  English: {
    low: "Keep gutters clear and avoid hill roads during rain.",
    moderate: "Avoid travel on hill roads tonight. Stay updated on rainfall.",
    high: "Do not travel on hill roads. Move to safer ground if flooding rises.",
  },
  Assamese: {
    low: "আঙুল দলে পাশা সুন \, এবং বৃষ্টির সময় পাহাড়ী সড়কে যান না।",
    moderate: "এবেলে বেলা পাহাড়ী সড়কে যান না। বৃষ্টির আপডেট থাকা ছাড়া না।",
    high: "পাহাড়ী সড়কে যান না। বৃষ্টি বেড়লেsigmund safe জায়গায় গা।", // machine-written: needs native review
  },
  Bengali: {
    low: "আ孟κ gutter স נק\, এবং বৃষ্টির সময় পাহাড়ী সড়কে যান না।", // machine-written: needs native review
    moderate: "এবেলে বেলা পাহাড়ী সড়কে যান না। বৃষ্টির আপডেট থাকা ছাড়া না।", // machine-written: needs native review
    high: "পাহাড়ী সড়কে যান না। বৃষ্টি বেড়লেsigmund safe জায়গায় গা।", // machine-written: needs native review
  },
  Khasi: {
    low: "Siem piduid u hikaiñ sha\\nglah \\nba ring tre ki\\n \\n \\n \\n", // placeholder
    moderate: "Siem piduid u hikaiñ sha\\nglah tre ha\\n \\n \\n \\n", // placeholder
    high: "Siem piduid u hikaiñ sha\\nglah tre \\n \\n \\n \\n", // placeholder
  },
  Mizo: {
    low: "Pakhat pawh tak\\n \\n \\n \\n", // placeholder
    moderate: "Pakhat pawh tak\\n \\n \\n \\n", // placeholder
    high: "Pakhat pawh tak\\n \\n \\n \\n", // placeholder
  },
};

/* ---------------------------------------------------------------------
   Initial state reducer for the card
   --------------------------------------------------------------------- */
function locationRiskReducer(state, action) {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        entryPoint: "location", // or "search"
        showSearch: false,
        searchQuery: "",
        permissionDenied: false,
        isLoading: false,
        result: null,
        showLanguageMenu: false,
        lang: "English",
      };
    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.query,
      };
    case "TOGGLE_LANGUAGE":
      return {
        ...state,
        showLanguageMenu: !state.showLanguageMenu,
        lang: action.lang || "English",
      };
    case "SET_PERMISSION_DENIED":
      return {
        ...state,
        permissionDenied: true,
        entryPoint: "search",
      };
    case "SET_RESULT":
      return {
        ...state,
        result: action.result,
        isLoading: false,
        showLanguageMenu: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: true,
        result: null,
      };
    case "CLEAR":
      return {
        ...state,
        ...state.initialized ? {} : { result: null, permissionDenied: false },
      };
    default:
      return state;
  }
}

/* ---------------------------------------------------------------------
   LocationRiskCard component
   --------------------------------------------------------------------- */
export default function LocationRiskCard() {
  const [state, dispatch] = useReducer(locationRiskReducer, {
    initialized: false,
  });

  // Initialize once
  useEffect(() => {
    dispatch({ type: "INITIALIZE" });
    // Immediately try search-first approach — no dead-end if permission denied
    // The card will show the search field right away.
    // We do NOT block on location; location is a convenience, not a requirement.
    const checkGeo = async () => {
      const geoResult = await getUserLocation(8000); // 8s timeout
      if (geoResult.success && geoResult.coords) {
        dispatch({ type: "SET_RESULT", result: await processLocation(geoResult.coords.lat, geoResult.coords.lng) });
      } else {
        // Permission denied or unavailable → switch straight to search
        dispatch({ type: "SET_PERMISSION_DENIED" });
      }
    };
    checkGeo();
  }, []);

  // Process a location: find nearest site + get risk
  async function processLocation(lat, lng) {
    // 1. Check if inside NER bounding box
    const nerCheck = isInsideNER(lat, lng);
    if (!nerCheck.inNER) {
      return {
        type: "outside-NER",
        message: "We only monitor the North East. For your area, check IMD or your State Disaster Management Authority.",
        actionLine: "",
        site: null,
        isEstimate: false,
        cacheAgeMin: 0,
      };
    }

    // 2. Find nearest site
    const nearest = findNearestSite(lat, lng);

    // 3. Get risk for location (uses live weather+slope, re-weighted; marks isEstimate:true)
    const risk = await getRiskForLocation(lat, lng);

    // 4. Build result object
    const riskLevel = risk.riskLevel || "safe";
    const riskLevelValue = risk.riskLevel === "critical" ? 100 : risk.riskLevel === "moderate" ? 70 : 0;
    let actionKey = "low";
    if (risk.inputsUsed && risk.inputsUsed.includes("rainfall")) {
      if (risk.failureProbabilityPercent >= 70) actionKey = "high";
      else if (risk.failureProbabilityPercent >= 40) actionKey = "moderate";
      else actionKey = "low";
    }
    const actionText = ACTION_TEXTS["English"][actionKey] || ACTION_TEXTS["English"]["low"];

    let siteInfo = null;
    if (nearest.nearestSite) {
      siteInfo = (
        <div className="mt-2 text-xs text-slate-500">
          <span>Nearest monitored site: </span>
          <span>{nearest.nearestSite.name}</span>
          {nearest.flaggedNearby && <span className="ml-2">({nearest.distanceKm} km away)</span>}
        </div>
      );
    }

    return {
      type: "result",
      riskLevel,
      riskColor,
      actionLine: actionText,
      siteInfo,
      isEstimate: risk.isEstimate,
      cacheAgeMin: risk.cacheAgeMin || 0,
      inputsUsed: risk.inputsUsed,
    };
  }

  // Process search query
  async function processSearch() {
    const query = state.searchQuery.trim();
    if (!query) return;

    const result = await searchPlace(query);
    if (!result.success || !result.data) {
      // Show error with fallback to state picker
      dispatch({
        type: "SET_RESULT",
        result: {
          type: "error",
          message: "Could not find that location. Please type a city, district, or village in Assam, Meghalaya, Mizoram, Tripura, Manipur, Nagaland, Arunachal Pradesh, or Sikkim.",
        },
      });
      return;
    }

    const { lat, lng, name, state } = result.data;
    // Check if inside NER
    const nerCheck = isInsideNER(lat, lng);
    if (!nerCheck.inNER) {
      dispatch({
        type: "SET_RESULT",
        result: {
          type: "outside-NER",
          message: "We only monitor the North East. For your area, check IMD or your State Disaster Management Authority.",
          actionLine: "",
          site: null,
          isEstimate: false,
          cacheAgeMin: 0,
        },
      });
      return;
    }

    // Get risk for the searched location
    const risk = await getRiskForLocation(lat, lng);
    const riskLevel = risk.riskLevel || "safe";

    let actionKey = "low";
    if (risk.inputsUsed && risk.inputsUsed.includes("rainfall")) {
      if (risk.failureProbabilityPercent >= 70) actionKey = "high";
      else if (risk.failureProbabilityPercent >= 40) actionKey = "moderate";
      else actionKey = "low";
    }
    const actionText = ACTION_TEXTS["English"][actionKey] || ACTION_TEXTS["English"]["low"];

    let siteInfo = null;
    if (nearest.nearestSite) {
      siteInfo = (
        <div className="mt-2 text-xs text-slate-500">
          <span>Nearest monitored site: </span>
          <span>{nearest.nearestSite.name}</span>
          {nearest.flaggedNearby && <span className="ml-2">({nearest.distanceKm} km away)</span>}
        </div>
      );
    }

    dispatch({
      type: "SET_RESULT",
      result: {
        type: "result",
        riskLevel,
        riskColor: getRiskColorRgba(riskLevel === "critical" ? 100 : riskLevel === "moderate" ? 70 : 0, 0.1),
        actionLine: actionText,
        siteInfo,
        isEstimate: risk.isEstimate,
        cacheAgeMin: risk.cacheAgeMin || 0,
        inputsUsed: risk.inputsUsed,
      },
    });
  }

  /* -----------------------------------------------------------------
     Render
     ----------------------------------------------------------------- */
  const { entryPoint, showSearch, searchQuery, permissionDenied, isLoading, result } = state;

  // Language switch options (Assamese, Bengali, Khasi, Mizo marked as machine-written)
  const LANGUAGE_OPTIONS = [
    { label: "English", value: "English", flag: "🇬🇧" },
    { label: "Assamese", value: "Assamese", flag: "🇮🇳", note: "Machine-written — needs native-speaker review before real use" },
    { label: "Bengali", value: "Bengali", flag: "🇮🇳", note: "Machine-written — needs native-speaker review before real use" },
    { label: "Khasi", value: "Khasi", flag: "🇮🇳", note: "Machine-written — needs native-speaker review before real use" },
    { label: "Mizo", value: "Mizo", flag: "🇮🇳", note: "Machine-written — needs native-speaker review before real use" },
  ];

  /* -----------------------------------------------------------------
     Result render helpers
     ----------------------------------------------------------------- */
  function renderResult() {
    if (!result) return null;

    if (result.type === "outside-NER") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{result.message}</p>
          {result.site && (
            <p className="text-sm text-slate-500">{result.site}</p>
          )}
        </div>
      );
    }

    if (result.type === "error") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-red-400">{result.message}</p>
          <p className="text-sm text-slate-500">Try the search field below or select a state.</p>
        </div>
      );
    }

    // Normal result path
    const riskLevel = result.riskLevel || "safe";
    const isEstimate = result.isEstimate || false;
    const cacheAge = result.cacheAgeMin !== undefined ? result.cacheAgeMin : 0;

    return (
      <div className="space-y-4 pt-4">
        {/* Risk level badge with colour + icon shape + text label */}
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-risk-high px-3 py-1.5 text-xs font-medium" style={{ color: result.riskColor, backgroundColor: result.riskColor }}>
            {riskLevel === "critical" ? "Critical" : riskLevel === "moderate" ? "Moderate" : "Low"}
          </span>
          <span className="text-xs" style={{ color: result.riskColor }}>
            {riskLevel === "critical" ? "⚠️" : riskLevel === "moderate" ? "🟡" : "✅"}
          </span>
        </div>

        {/* Rainfall + slope info */}
        {result.rain24hMm !== null && (
          <p className="text-sm text-slate-500">
            Last 24h rain: {result.rain24hMm} mm
          </p>
        )}
        {result.rainNext6hMm !== null && (
          <p className="text-sm text-slate-500">
            Next 6h rain: {result.rainNext6hMm} mm
          </p>
        )}
        {result.slopeDegrees !== null && (
          <p className="text-sm text-slate-500">
            Slope: {result.slopeDegrees}°
          </p>
        )}

        {/* Plain action line */}
        <p className="text-sm font-medium">{result.actionLine}</p>

        {/* Estimate disclaimer */}
        {isEstimate && (
          <p className="text-xs text-slate-500">
            This is an estimate, not an official warning.
          </p>
        )}

        {/* Nearest monitored site + distance */}
        {result.siteInfo}

        {/* Language switch for action text */}
        {LANGUAGE_OPTIONS.length > 1 && (
          <div className="mt-2 text-xs">
            <label className="cursor-pointer gap-1 flex items-center">
              <span>Language: </span>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  // Update action text based on language (marked machine-written where noted)
                  const langData = ACTION_TEXTS[value] || ACTION_TEXTS["English"];
                  const key = riskLevel === "critical" ? "high" : riskLevel === "moderate" ? "moderate" : "low";
                  // In a full impl, we'd display the translated text; here we note it
                  console.log("Selected language:", value, "text:", key);
                  // Toggle language menu closed
                  dispatch({ type: "TOGGLE_LANGUAGE", lang: value });
                }}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.flag && ` ${opt.flag}`}
                    {opt.note && (
                      <span className="text-[10px] opacity-60 block mt-0.5 small-caption">
                        {opt.note}
                      </span>
                    )}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    );
  }

  /* -----------------------------------------------------------------
     Render UI
     ----------------------------------------------------------------- */
  // If location is still loading, show skeleton + search field
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton lines={2} className="h-16" />
        <div>
          <input
            type="text"
            placeholder="Search place (e.g. Guwahati, Shillong)"
            value={searchQuery}
            onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", query: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-card px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <Button variant="quiet" size="sm" onClick={() => dispatch({ type: "SET_SEARCH_QUERY", query: "" })}>
            Search
          </Button>
        </div>
      </div>
    );
  }

  // If permission denied, show search field immediately
  if (permissionDenied) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Location permission denied. Enter a place below or select a state.
        </p>
        <div>
          <input
            type="text"
            placeholder="Search place (e.g. Guwahati, Shillong)"
            value={searchQuery}
            onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", query: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-card px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <Button variant="quiet" size="sm" onClick={() => dispatch({ type: "SET_SEARCH_QUERY", query: "" })}>
            Search
          </Button>
        </div>
      </div>
    );
  }

  // Entry point: "Use my location" button was clicked (from parent)
  if (entryPoint === "location" && !showSearch && !result) {
    return (
      <div className="space-y-4">
        {/* Explain why location is needed in one line */}
        <p className="text-sm text-slate-500">
          We use your location to check if monitored sites are nearby and give a risk score.
        </p>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              // Trigger location check again (already done on mount, but user re-pressed)
              // For now, just switch to search view
              dispatch({ type: "TOGGLE_LANGUAGE", lang: "English" }); // reuse to switch UI
            }}
          >
            Use my location
          </Button>
          <Button variant="quiet" size="md" onClick={() => dispatch({ type: "TOGGLE_LANGUAGE", lang: "English" })}>
            Search manually
          </Button>
        </div>
      </div>
    );
  }

  // Main layout: search field + result area
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* Search field */}
      <div>
        <input
          type="text"
          placeholder="Enter a location (city, district, or village)"
          value={searchQuery}
          onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", query: e.target.value })}
          className="w-full rounded-lg border border-slate-600 bg-slate-card px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <Button variant="primary" size="sm" onClick={() => dispatch({ type: "SET_SEARCH_QUERY", query: searchQuery })}>
          Go
        </Button>
      </div>

      {/* Result area */}
      {isLoading ? (
        <Skeleton lines={2} className="h-16" />
      ) : result ? renderResult() : null}
    </div>
  );
}