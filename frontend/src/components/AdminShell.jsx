// -----------------------------------------------------------------------
// AdminShell.jsx  (ADMIN PORTAL ONLY — never rendered by the landing page)
// -----------------------------------------------------------------------
// WHAT: Pure layout wrapper for the authorized dashboard: collapsible left
//       rail, a single flat summary strip, and the page content.
// NOTE: UI/layout only. It holds no app state beyond the collapse toggle,
//       makes no API calls, and the children it renders are exactly the
//       components the app mounted before (Header, AnalyticsPanel,
//       DigitalTwinMap, CopilotCenter).
// -----------------------------------------------------------------------
import { useState } from "react";
import {
  LayoutDashboard, List, TrafficCone, PanelLeftClose, PanelLeftOpen,
  Radar, ShieldAlert, MapPin, Radio, TrendingUp,
} from "lucide-react";
import { getRiskColor } from "../utils/colorUtils";

const NAV_ITEMS = [
  { id: "shell-overview", label: "Overview", icon: LayoutDashboard },
  { id: "shell-sites", label: "Ranked Sites", icon: List },
  { id: "shell-rerouting", label: "Road Rerouting", icon: TrafficCone },
];

function scrollToPanel(panelId) {
  const el = document.getElementById(panelId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function Stat({ icon: Icon, label, value, valueStyle, isLive }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-shrink-0">
        <p className="text-[9px] uppercase tracking-[0.12em] text-ink-faint">
          {label}
          {isLive && (
            <span className="h-1 w-1 rounded-full bg-accent animate-live-pulse motion-reduce:animate-none" />
          )}
        </p>
        <p
          className="text-[13.5px] font-semibold tabular-nums text-ink-strong"
          style={valueStyle}
        >
          {value}
        </p>
      </div>
      <Icon size={13} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
    </div>
  );
}

export default function AdminShell({ rankedSites, regionalScore, activeSensorNodes = 142, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sites = rankedSites ?? [];
  const topSite = sites[0];
  const blockedCount = sites.filter((site) => site.telemetry.roadStatus === "blocked").length;
  const scoreColor = getRiskColor(regionalScore.regionalScore);

  function handleNavClick(itemId) {
    scrollToPanel(itemId);
  }

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-bg-base">
      {/* ---------------------- Collapsible left rail ---------------------- */}
      <aside
        className={`hidden h-full shrink-0 flex-col border-r border-line bg-bg-base transition-[width] duration-200 lg:flex ${
          isCollapsed ? "w-14" : "w-56"
        }`}
        aria-label="Dashboard navigation"
      >
        {/* Brand */}
        <div className={`flex h-14 items-center border-b border-line ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-4"}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-line-soft text-accent">
            <Radar size={13} />
          </span>
          {!isCollapsed && (
            <span className="min-w-0 leading-none">
              <span className="block truncate text-[11.5px] font-semibold tracking-tight text-ink-strong">
                Command Center
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
                NER · Admin
              </span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className={`flex-1 py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
          {!isCollapsed && (
            <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
              Workspace
            </p>
          )}
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-xs border-l py-2 text-[12px] text-ink-muted transition-colors hover:bg-panel hover:text-ink-strong ${
                    isCollapsed ? "justify-center border-transparent px-0" : "gap-2.5 border-transparent px-2.5 hover:border-accent/40"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Session + collapse */}
        <div className={`border-t border-line py-3 ${isCollapsed ? "px-2" : "px-3"}`}>
          {!isCollapsed && (
            <div className="mb-3 flex items-center gap-2 rounded-xs border border-line-soft px-2.5 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-safe animate-live-pulse motion-reduce:animate-none" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] text-ink">Authorized session</span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint">
                  Command privileges
                </span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed((current) => !current)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className={`flex w-full items-center rounded-xs py-2 text-[11.5px] text-ink-faint transition-colors hover:bg-panel hover:text-ink ${
              isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5"
            }`}
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ---------------------------- Main column ---------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Summary strip — one flat band, no cards */}
        <div className="grid shrink-0 gap-3 bg-bg-base/40 py-2 px-3 rounded-md lg:grid-cols-4">
          <Stat
            icon={TrendingUp}
            label="Regional score"
            value={`${regionalScore.regionalScore.toFixed(1)}%`}
            valueStyle={{ color: scoreColor }}
            isLive
          />
          <Stat
            icon={MapPin}
            label="Highest risk"
            value={topSite ? `${topSite.name.split(",")[0]} · ${topSite.risk.failureProbabilityPercent}%` : "—"}
            valueStyle={topSite ? { color: getRiskColor(topSite.risk.failureProbabilityPercent) } : undefined}
          />
          <Stat
            icon={ShieldAlert}
            label="Blocked roads"
            value={String(blockedCount)}
            valueStyle={{ color: blockedCount > 0 ? "var(--c-red)" : "var(--c-risk-safe)" }}
          />
          <Stat
            icon={Radio}
            label="IoT nodes"
            value={`${activeSensorNodes} active`}
            isLive
          />
        </div>

        {/* Chrome + content passed through from App, exactly as mounted before */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
