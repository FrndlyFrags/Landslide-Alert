// -----------------------------------------------------------------------
// AnalyticsPanel.jsx
// -----------------------------------------------------------------------
// WHAT: Left-hand sidebar. Ranked high-risk locations with live rain
//       status, risk badges, slip-plane trend and road detours.
// NOTE: Presentational redesign only — every computation, memo and
//       handler below is unchanged.
// -----------------------------------------------------------------------
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, Activity, Gauge as GaugeIcon, TrafficCone } from "lucide-react";
import { generateSlipPlaneTrend } from "../data/mockData";
import { getRiskColor, getRiskColorRgba, getRainStatus } from "../utils/colorUtils";

const ALTERNATE_ROUTES = {
  "NER-003": "Detour via Melli - Jorethang bypass road (adds ~45 min)",
  "NER-004": "Detour via Algarah - Lava alternate hill road (adds ~70 min)",
  "NER-005": "Detour via Diphu - Haflong link road (adds ~90 min)",
  "NER-006": "Detour via Jatinga - Harangajao forest road (adds ~110 min)",
  "NER-007": "Detour via Tamenglong bypass track (adds ~60 min)",
  "NER-008": "Detour via Zubza - Chumukedima link road (adds ~40 min)",
  "NER-009": "Detour via Kolasib - Vairengte alternate road (adds ~55 min)",
  "NER-010": "Detour via Teliamura - Khowai link road (adds ~35 min)",
  "NER-011": "Detour via Dirang - Bomdila old cart road (adds ~120 min)",
  "NER-012": "Detour via Ledum - Pasighat farm road (adds ~50 min)",
};

// Flat risk badge (replaces circular gauge)
function RiskBadge({ label, percent }) {
  const color = getRiskColor(percent);
  return (
    <div className="inline-block rounded-sm px-2.5 py-1.5 text-[10px] font-medium" style={{ color, backgroundColor: getRiskColorRgba(percent, 0.1), borderColor: color }}>
      {percent}%
      <span className="text-[8px] uppercase tracking-[0.1em] ml-1">{label}</span>
    </div>
  );
}

function SectionHeading({ icon: Icon, children, id }) {
  return (
    <div className="flex items-center gap-2 border-b border-line pb-2">
      <Icon size={12} className="text-ink-faint" aria-hidden="true" />
      <h2 id={id} className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted">
        {children}
      </h2>
    </div>
  );
}

export default function AnalyticsPanel({ rankedSites, selectedSite, onSelectSite }) {
  const sixHourPercent = useMemo(() => {
    if (!selectedSite) return 0;
    const boosted = Math.min(100, selectedSite.risk.failureProbabilityPercent * 0.85);
    return Math.round(boosted * 10) / 10;
  }, [selectedSite]);

  const twentyFourHourPercent = selectedSite?.risk.failureProbabilityPercent ?? 0;

  const slipPlaneData = useMemo(
    () => generateSlipPlaneTrend(selectedSite?.telemetry?.rainfallLast24hMm ?? 50),
    [selectedSite?.siteId]
  );

  const blockedSites = rankedSites.filter((site) => site.telemetry.roadStatus === "blocked");

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-bg-base p-3">
      {/* Ranked sites */}
      <section aria-labelledby="shell-sites">
        <SectionHeading icon={AlertTriangle} id="shell-sites">
          Ranked sites
        </SectionHeading>
        <ul className="mt-1">
          {rankedSites.slice(0, 6).map((site, index) => {
            const riskPercent = site.risk.failureProbabilityPercent;
            const riskColor = getRiskColor(riskPercent);
            const rain = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);
            const isSelected = selectedSite?.siteId === site.siteId;

            return (
              <li
                key={site.siteId}
                className="border-b border-line-soft pb-3 transition-colors"
              >
                <button
                  onClick={() => onSelectSite(site.siteId)}
                  className={`flex w-full items-center justify-between gap-2 pl-2.5 pr-1 text-left transition-colors ${isSelected ? "border-accent bg-panel" : "hover:bg-panel/60"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[11.5px] text-ink-strong">{site.name}</p>
                      <span className="text-[9.5px]" title={rain.label}>{rain.icon}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[9.5px] text-ink-faint">
                      {site.state} · {site.telemetry.rainfallLast24hMm}mm 24h
                    </p>
                  </div>
                  <span
                    className="shrink-0 font-mono text-[11px] font-semibold tabular-nums"
                    style={{ color: riskColor }}
                  >
                    {riskPercent}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Predictive badges */}
      <section aria-labelledby="panel-gauges-heading">
        <SectionHeading icon={GaugeIcon} id="panel-gauges-heading">
          Risk gauges
        </SectionHeading>
        <p className="mt-2 truncate text-[11px] text-ink-muted">{selectedSite?.name ?? "Select a site"}</p>
        <div className="mt-2 flex items-center justify-around rounded-md border border-line bg-panel/50 py-2">
          <RiskBadge label="6-hour" percent={sixHourPercent} />
          <span className="h-10 w-[1px] bg-line" aria-hidden="true" />
          <RiskBadge label="24-hour" percent={twentyFourHourPercent} />
        </div>
      </section>

      {/* Slip-plane trend */}
      <section aria-labelledby="panel-chart-heading">
        <SectionHeading icon={Activity} id="panel-chart-heading">
          Slip-plane displacement
        </SectionHeading>
        <div className="mt-2 h-36 border border-line bg-panel/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={slipPlaneData} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="var(--c-line-soft)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: "var(--c-faint)" }}
                axisLine={{ stroke: "var(--c-line)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "var(--c-faint)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--c-line)" }}
                contentStyle={{
                  backgroundColor: "var(--c-surface)",
                  border: "1px solid var(--c-line)",
                  borderRadius: 2,
                  fontSize: 11,
                  color: "var(--c-text)",
                }}
                labelStyle={{ color: "var(--c-muted)" }}
              />
              <Line
                type="monotone"
                dataKey="displacementMm"
                stroke="var(--c-accent)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: "var(--c-accent)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Emergency rerouting */}
      <section id="shell-rerouting" aria-labelledby="panel-rerouting-heading">
        <SectionHeading icon={TrafficCone} id="panel-rerouting-heading">
          Emergency rerouting
        </SectionHeading>
        {blockedSites.length === 0 ? (
          <p className="mt-2 border border-line bg-panel/50 p-3 text-[11px] leading-relaxed text-ink-faint">
            All primary highways are currently open. No reroutes needed.
          </p>
        ) : (
          <ul className="mt-2">
            {blockedSites.map((site) => (
              <li key={site.siteId} className="border-b border-line-soft py-2.5 last:border-0">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-critical">
                  <span className="h-1 w-1 rounded-full bg-critical" aria-hidden="true" />
                  {site.name} — road blocked
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {ALTERNATE_ROUTES[site.siteId] ??
                    "No pre-mapped detour available. Dispatch a survey team."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
