// -----------------------------------------------------------------------
// Header.jsx  (ADMIN PORTAL ONLY)
// -----------------------------------------------------------------------
// WHAT: Slim top bar of the dashboard. Shows live data connection status,
//       animated regional risk score, language picker, warning blast
//       trigger, and "Exit to Public View" button — all controls kept
//       exactly as before, restyled for the slimmer chrome.
// -----------------------------------------------------------------------
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Satellite, CloudRain, Radio, ChevronDown, Siren, Languages, RefreshCw, Home } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../data/mockData";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";

function LiveFeedBadge({ icon: Icon, label, detail }) {
  return (
    <div className="flex items-center gap-2 rounded-xs border border-line bg-panel/60 px-2.5 py-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-accent motion-reduce:animate-none" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      <Icon size={12} className="text-accent/80" />
      <div className="leading-tight">
        <p className="text-[10.5px] font-medium text-ink">{label}</p>
        {detail && <p className="text-[9.5px] font-mono text-ink-faint">{detail}</p>}
      </div>
    </div>
  );
}

function useCountUp(targetValue, durationMs = 900) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(targetValue);
      return undefined;
    }
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
    <header className="topbar-sheen relative z-20 shrink-0 border-b border-line bg-panel/95 px-4 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left side */}
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <button
            onClick={onExitToLanding}
            className="flex items-center gap-1.5 rounded-xs border border-line bg-panel px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-accent/40 hover:text-accent"
            title="Return to Public Landing Page"
          >
            <Home size={13} />
            <span className="hidden sm:inline">Public View</span>
          </button>

          <div className="flex items-center gap-2.5 border-r border-line pr-3">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-xs bg-accent/10 ring-1 ring-accent/25">
              <Radio size={14} className="text-accent" />
            </div>
            <div className="leading-tight">
              <h1 className="text-[13px] font-semibold tracking-tight text-ink-strong">
                NER Landslide Command Center
              </h1>
              <p className="text-[9.5px] text-ink-faint">Authorized Admin Telemetry Dashboard</p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2">
            <LiveFeedBadge icon={CloudRain} label="Live Rainfall" detail="Open-Meteo" />
            <LiveFeedBadge icon={Satellite} label="Live Elevation" detail="NASA SRTM" />
            <LiveFeedBadge icon={Radio} label="IoT Nodes" detail={`${activeSensorNodes} Active`} />
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xs border border-line bg-panel px-2.5 py-1.5 text-[11px] font-medium text-ink-muted hover:border-accent/40 hover:text-accent disabled:opacity-60"
            title="Re-fetch live rainfall and elevation data"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing..." : "Refresh"}
            {lastUpdated && !isRefreshing && (
              <span className="ml-1 font-mono text-[9.5px] text-ink-faint tabular-nums">
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </button>

          {/* Regional Score badge with smooth color transition */}
          <div
            className="rounded-xs border px-3 py-1 text-right transition-colors"
            style={{ borderColor: scoreColor, backgroundColor: scoreBgColor }}
            title="Regional Global Risk Score"
          >
            <p className="text-[9px] font-medium uppercase tracking-wider text-ink-faint">Regional Score</p>
            <p className="font-mono text-sm font-bold tabular-nums" style={{ color: scoreColor }}>
              {animatedScore.toFixed(1)}%
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu((open) => !open)}
              aria-expanded={showLanguageMenu}
              className="flex items-center gap-1.5 rounded-xs border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Languages size={13} />
              {selectedLanguages.length}
              <ChevronDown size={12} className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} aria-hidden="true" />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-line bg-panel py-1 shadow-panel"
                    role="menu"
                  >
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <label
                        key={language}
                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-panel-2"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(language)}
                          onChange={() => toggleLanguage(language)}
                          className="accent-[var(--c-accent)]"
                        />
                        {language}
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTriggerWarning(selectedLanguages)}
            className="flex items-center gap-1.5 rounded-xs bg-critical px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-red transition-colors hover:bg-[#ef8386]"
          >
            <Siren size={13} />
            <span className="hidden sm:inline">Warning Blast</span>
            <span className="sm:hidden">Blast</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
