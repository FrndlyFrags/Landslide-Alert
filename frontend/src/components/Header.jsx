// -----------------------------------------------------------------------
// Header.jsx  (ADMIN PORTAL ONLY)
// -----------------------------------------------------------------------
// WHAT: Top bar of the dashboard: connection status, regional risk figure,
//       language picker, warning blast trigger and "Public view" link.
// NOTE: Every control, state variable and handler is unchanged from the
//       previous version — only presentation (flat bar, hairline dividers,
//       no glow) has been redesigned.
// -----------------------------------------------------------------------
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Satellite, CloudRain, Radio, ChevronDown, Siren, Languages, RefreshCw, Home } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../data/mockData";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";

function FeedNote({ icon: Icon, label, detail }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <Icon size={11} className="text-ink-faint" aria-hidden="true" />
      <span className="text-[10.5px] text-ink-muted">{label}</span>
      <span className="font-mono text-[9.5px] text-ink-faint">{detail}</span>
    </span>
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
  const scoreBgColor = getRiskColorRgba(animatedScore, 0.1);

  function toggleLanguage(language) {
    setSelectedLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  }

  return (
    <header className="relative z-20 shrink-0 border-b border-line bg-bg-base px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ---------------------------- Left side ---------------------------- */}
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            onClick={onExitToLanding}
            className="flex items-center gap-1.5 text-[11px] text-ink-muted transition-colors hover:text-ink-strong"
            title="Return to Public Landing Page"
          >
            <Home size={12} />
            <span className="hidden sm:inline">Public view</span>
          </button>

          <span className="hidden h-4 w-[1px] bg-line sm:block" aria-hidden="true" />

          <div className="leading-none">
            <h1 className="text-[12px] font-semibold tracking-tight text-ink-strong">
              Landslide Command Center
            </h1>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
              Authorized telemetry
            </p>
          </div>

          <div className="hidden items-center gap-4 border-l border-line pl-4 xl:flex">
            <FeedNote icon={CloudRain} label="Rainfall" detail="Open-Meteo" />
            <FeedNote icon={Satellite} label="Elevation" detail="NASA SRTM" />
            <FeedNote icon={Radio} label="Nodes" detail={`${activeSensorNodes}`} />
          </div>
        </div>

        {/* ---------------------------- Right side ---------------------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[11px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-50"
            title="Re-fetch live rainfall and elevation data"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing" : "Refresh"}
            {lastUpdated && !isRefreshing && (
              <span className="ml-0.5 font-mono text-[9px] text-ink-faint tabular-nums">
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </button>

          {/* Regional score — plain figure, colour carries the meaning */}
          <div
            className="flex items-center gap-2 border px-2.5 py-1"
            style={{ borderColor: scoreColor, backgroundColor: scoreBgColor }}
            title="Regional Global Risk Score"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
              Region
            </span>
            <span className="font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: scoreColor }}>
              {animatedScore.toFixed(1)}%
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu((open) => !open)}
              aria-expanded={showLanguageMenu}
              className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[11px] text-ink transition-colors hover:border-ink-faint"
            >
              <Languages size={12} />
              <span className="font-mono tabular-nums">{selectedLanguages.length}</span>
              <ChevronDown size={11} className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} aria-hidden="true" />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 z-20 mt-2 w-48 border border-line bg-panel py-1 shadow-panel"
                    role="menu"
                  >
                    <p className="px-3 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                      Alert languages
                    </p>
                    {SUPPORTED_LANGUAGES.map((language) => {
                      const isSelected = selectedLanguages.includes(language);
                      return (
                        <div
                          key={language}
                          className={`flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink transition-colors hover:bg-panel-2 ${
                            isSelected ? "border-accent bg-accent/10" : "border-line bg-panel/20"
                          }`}                        >                        <span
                          className={`h-2.5 w-2.5 rounded shrink-0 items-center justify-center border ${
                            isSelected ? "border-accent bg-accent" : "border-ink-faint"
                          }`}                          aria-hidden="true"                        >                          {isSelected && <span className="h-1 w-1 bg-bg-base" />}                        </span>                        {language}                      </div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTriggerWarning(selectedLanguages)}
            className="flex items-center gap-1.5 bg-critical px-3 py-1.5 text-[11px] font-semibold text-[#170b0a] transition-colors hover:bg-[#d9807b]"
          >
            <Siren size={12} />
            <span className="hidden sm:inline">Warning blast</span>
            <span className="sm:hidden">Blast</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
