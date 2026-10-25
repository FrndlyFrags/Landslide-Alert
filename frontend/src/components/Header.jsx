// -----------------------------------------------------------------------
// Header.jsx
// -----------------------------------------------------------------------
// WHAT: Top command bar of dashboard. Shows live data connection status,
//       animated regional risk score with green-to-red color transition,
//       language picker, warning blast trigger, and "Exit to Public View" button.
// -----------------------------------------------------------------------
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, CloudRain, Radio, ChevronDown, Siren, Languages, RefreshCw, Home } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../data/mockData";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";

function LiveFeedBadge({ icon: Icon, label, detail }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-card/50 px-3 py-1.5 backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-telemetry" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-telemetry" />
      </span>
      <Icon size={13} className="text-telemetry/80" />
      <div className="leading-tight">
        <p className="text-[11px] font-medium text-slate-200">{label}</p>
        {detail && <p className="text-[10px] font-mono text-slate-500">{detail}</p>}
      </div>
    </div>
  );
}

function useCountUp(targetValue, durationMs = 900) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const startValue = displayValue;
    const startTime = performance.now();
    let frameId;
    function tick(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (targetValue - startValue) * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);
  return displayValue;
}

export default function Header({
  regionalScore,
  activeSensorNodes,
  onTriggerWarning,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onExitToLanding,
}) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(["English"]);
  const animatedScore = useCountUp(regionalScore.regionalScore);
  const scoreColor = getRiskColor(animatedScore);
  const scoreBgColor = getRiskColorRgba(animatedScore, 0.12);

  function toggleLanguage(language) {
    setSelectedLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  }

  return (
    <header className="command-grid-backdrop relative border-b border-slate-800 bg-dark-slate/95 px-5 py-2.5 backdrop-blur shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExitToLanding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-card px-2.5 py-1.5 text-xs text-slate-300 hover:border-telemetry/60 hover:text-telemetry transition-colors"
            title="Return to Public Landing Page"
          >
            <Home size={13} />
            <span className="hidden sm:inline">Public View</span>
          </button>

          <div className="flex items-center gap-2.5 pr-3 border-r border-slate-700/70">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-telemetry/10 ring-1 ring-telemetry/30">
              <Radio size={16} className="text-telemetry" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-50">
                NER Landslide Command Center
              </h1>
              <p className="text-[10.5px] text-slate-400">Authorized Admin Telemetry Dashboard</p>
            </div>
          </div>

          <LiveFeedBadge icon={CloudRain} label="Live Rainfall" detail="Open-Meteo" />
          <LiveFeedBadge icon={Satellite} label="Live Elevation" detail="NASA SRTM" />
          <LiveFeedBadge icon={Radio} label="IoT Nodes" detail={`${activeSensorNodes} Active`} />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-card px-3 py-2 text-[11px] font-medium text-slate-300 hover:border-telemetry/60 hover:text-telemetry transition-colors disabled:opacity-60"
            title="Re-fetch live rainfall and elevation data"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing..." : "Refresh Live Data"}
            {lastUpdated && !isRefreshing && (
              <span className="ml-1 font-mono text-[9.5px] text-slate-500">
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </button>

          {/* Regional Score badge with smooth Green-to-Red transition */}
          <div
            className="rounded-lg border px-3.5 py-1 text-right transition-colors"
            style={{
              borderColor: scoreColor,
              backgroundColor: scoreBgColor,
            }}
          >
            <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-medium">Regional Score</p>
            <p className="font-mono text-lg font-bold tabular-nums" style={{ color: scoreColor }}>
              {animatedScore.toFixed(1)}%
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu((open) => !open)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-card px-3 py-2 text-xs font-medium text-slate-200 hover:border-telemetry/60 hover:text-telemetry transition-colors"
            >
              <Languages size={13} />
              {selectedLanguages.length}
              <ChevronDown size={12} className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-card shadow-2xl"
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <label
                      key={language}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-dark-slate cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(language)}
                        onChange={() => toggleLanguage(language)}
                        className="accent-telemetry"
                      />
                      {language}
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTriggerWarning(selectedLanguages)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-glow-red hover:bg-red-500 transition-colors"
          >
            <Siren size={14} />
            Trigger Regional Warning Blast
          </motion.button>
        </div>
      </div>
    </header>
  );
}
