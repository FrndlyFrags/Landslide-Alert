// -----------------------------------------------------------------------
// AdminShell.jsx  (ADMIN PORTAL ONLY — never rendered by the landing page)
// -----------------------------------------------------------------------
// WHAT: Pure layout wrapper for the authorized dashboard: collapsible left
//       sidebar, slim chrome above the content, and a compact summary stat
//       strip derived from the data the dashboard already receives.
// NOTE: UI/layout only. It holds no app state, makes no API calls, and the
//       children it renders are exactly the components the app mounted
//       before (Header, AnalyticsPanel, DigitalTwinMap, CopilotCenter).
// -----------------------------------------------------------------------
import { useState } from "react";
import {
  LayoutDashboard, List, TrafficCone, PanelLeftClose, PanelLeftOpen,
  Radar, ShieldAlert, MapPin, Radio, TrendingUp,
} from "lucide-react";
import { getRiskColor, getRiskColorRgba } from "../utils/colorUtils";

const NAV_ITEMS = [
  { id: "shell-overview", label: "Overview", icon: LayoutDashboard },
  { id: "shell-sites", label: "Ranked Sites", icon: List },
  { id: "shell-rerouting", label: "Road Rerouting", icon: TrafficCone },
];

function scrollToPanel(panelId) {
  const el = document.getElementById(panelId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function StatCard({ icon: Icon, label, value, valueStyle, iconClass = "text-accent", isLive }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-panel px-4 py-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-panel-2 ${iconClass}`}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse motion-reduce:animate-none" />}
        </p>
        <p className="truncate font-mono text-sm font-semibold tabular-nums text-ink-strong" style={valueStyle}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminShell({ rankedSites, regionalScore, activeSensorNodes = 142, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sites = rankedSites ?? [];
  const topSite = sites[0];
  const blockedCount = sites.filter((site) => site.telemetry.roadStatus === "blocked").length;
  const scoreColor = getRiskColor(regionalScore.regionalScore);

  function handleNavClick(itemId, collapsed) {
    if (itemId === "shell-overview") {
      scrollToPanel("shell-overview");
      if (collapsed) setIsCollapsed(true); // collapse back if on small screens
      return;
    }
    scrollToPanel(itemId);
  }

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-bg-base">
      {/* ------------------- Collapsible left sidebar ------------------- */}
      <aside
        className={`hidden h-full shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 lg:flex ${
          isCollapsed ? "w-14" : "w-52"
        }`}
        aria-label="Dashboard navigation"
      >
        <div className={`flex flex-1 flex-col items-start gap-1 p-2 ${isCollapsed ? "items-center" : ""}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, false)}
                title={isCollapsed ? item.label : undefined}
                className={
                  `flex w-full items-center rounded-sm px-2.5 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink ${
                    isCollapsed ? "justify-center px-0" : "gap-2.5"
                  }`
                }
              >
                <Icon size={15} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className={`border-t border-line p-2 ${isCollapsed ? "flex justify-center" : "space-y-1"}`}>
          <div className={`mb-2 flex items-center gap-2.5 px-1.5 ${isCollapsed ? "justify-center px-0" : ""}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent/10 text-accent ring-1 ring-accent/25">
              <Radar size={13} />
            </span>
            {!isCollapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-semibold text-ink-strong">Admin Session</span>
                <span className="block text-[9.5px] text-ink-faint">Authorized · Command</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed((current) => !current)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className={`flex w-full items-center rounded-sm px-2.5 py-2 text-xs text-ink-faint transition-colors hover:bg-panel-2 hover:text-ink ${
              isCollapsed ? "justify-center px-0" : "gap-2.5"
            }`}
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ------------------- Main column ------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Summary stat strip: stat cards on top (pure derived display) */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-line bg-bg-base px-3 py-2.5 lg:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            label="Regional Score"
            value={`${regionalScore.regionalScore.toFixed(1)}%`}
            valueStyle={{ color: scoreColor }}
            iconClass="text-accent"
            isLive
          />
          <StatCard
            icon={MapPin}
            label="Highest Risk"
            value={topSite ? `${topSite.name.split(",")[0]} · ${topSite.risk.failureProbabilityPercent}%` : "—"}
            valueStyle={topSite ? { color: getRiskColor(topSite.risk.failureProbabilityPercent) } : undefined}
            iconClass="text-ink-muted"
          />
          <StatCard
            icon={ShieldAlert}
            label="Blocked Roads"
            value={String(blockedCount)}
            valueStyle={{ color: blockedCount > 0 ? "var(--c-red)" : "var(--c-risk-safe)" }}
            iconClass={blockedCount > 0 ? "text-critical" : "text-safe"}
          />
          <StatCard
            icon={Radio}
            label="IoT Nodes"
            value={`${activeSensorNodes} Active`}
            iconClass="text-accent"
            isLive
          />
        </div>

        {/* Chrome + content passed through from App, exactly as mounted before */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
