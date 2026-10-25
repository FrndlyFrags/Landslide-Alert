import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "../data/mockData";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";
import { Button } from "../components/Button";
import { Home, Radio, CloudRain, Satellite } from "lucide-react";

function LiveFeedBadge({ icon: Icon, label, detail }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-card/50 px-3 py-1.5 backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500" />
      </span>
      <Icon size={13} className="text-slate-400" />
      <div className="leading-tight">
        <p className="text-[11px] font-medium text-slate-200">{label}</p>
        {detail && <p className="text-[10px] font-mono text-slate-500">{detail}</p>}
      </div>
    </div>
  );
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

  // Simple display — no count-up animation; show rounded value
  const displayScore = Math.round(regionalScore.regionalScore);
  const scoreColor = getRiskColor(regionalScore.regionalScore);
  const scoreBgColor = getRiskColorRgba(regionalScore.regionalScore, 0.12);

  function toggleLanguage(language) {
    setSelectedLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language]
    );
  }

  return (
    <header className="relative border-b border-slate-800 bg-slate-card/95 px-5 py-2.5 backdrop-blur shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExitToLanding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-card px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
            title="Return to Public Landing Page"
          >
            <Home size={13} />
            <span className="hidden sm:inline">Public View</span>
          </button>

          <div className="flex items-center gap-2.5 pr-3 border-r border-slate-700/70">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 ring-1 ring-slate-300">
              <Radio size={16} className="text-slate-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-50">
                NER Landslide Early Warning
              </h1>
              <p className="text-[10.5px] text-slate-400">Community safety notification</p>
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-card px-3 py-2 text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors disabled:opacity-60"
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

          {/* Regional Score badge — flat, colour from risk function */}
          <div
            className="rounded-lg border px-3.5 py-1 text-right"
            style={{
              borderColor: scoreColor,
              backgroundColor: scoreBgColor,
            }}
          >
            <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-medium">Regional Score</p>
            <p className="font-mono text-lg font-bold tabular-nums" style={{ color: scoreColor }}>
              {displayScore}%
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu((open) => !open)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-card px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-slate-100 transition-colors"
            >
              <Languages size={13} />
              {selectedLanguages.length}
              <ChevronDown size={12} className={`transition-transform ${showLanguageMenu ? "rotate-180" : ""}`} />
            </button>
            <div
              className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-card p-3 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
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
                  />
                  {language}
                </label>
              ))}
            </div>
          </div>

          {/* Warning button — using new Button component, danger variant */}
          <Button variant="danger" size="md" onClick={() => onTriggerWarning(selectedLanguages)}>
            Trigger Regional Warning Blast
          </Button>
        </div>
      </div>
    </header>
  );
}