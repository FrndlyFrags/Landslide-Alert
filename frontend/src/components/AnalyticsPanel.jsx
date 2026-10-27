// -----------------------------------------------------------------------
// AnalyticsPanel.jsx
// -----------------------------------------------------------------------
// WHAT: Left-hand sidebar. Shows ranked high-risk locations with live rain status,
//       smooth green-to-red risk gauges, slip-plane trend chart, and road detours.
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

// Circular gauge with smooth green-to-red color interpolation
function RiskGauge({ label, percent }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const color = getRiskColor(percent);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedPercent(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  const filledLength = (animatedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="90" viewBox="0 0 90 90" role="img" aria-label={`${label}: ${percent}%`}>
        <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--c-line)" strokeWidth="8" />
        <circle
          cx="45"
          cy="45"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${filledLength} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{
            transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease",
            filter: `drop-shadow(0 0 6px ${getRiskColorRgba(percent, 0.5)})`,
          }}
        />
        <text x="45" y="49" textAnchor="middle" fontSize="16" fontFamily="monospace" fill={color} fontWeight="700">
          {percent}%
        </text>
      </svg>
      <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
      <Icon size={13} className="text-accent/70" />
      {children}
    </h2>
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
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-bg-base p-4">
      {/* High-Risk Regional List with Live Rain Status */}
      <section aria-labelledby="panel-sites-heading">
        <SectionHeading icon={AlertTriangle}>
          <span id="shell-sites">Ranked Sites</span>
        </SectionHeading>
        <ul className="mt-2 space-y-1.5">
          {rankedSites.slice(0, 6).map((site, index) => {
            const riskPercent = site.risk.failureProbabilityPercent;
            const riskColor = getRiskColor(riskPercent);
            const rain = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);
            const isSelected = selectedSite?.siteId === site.siteId;

            return (
              <motion.li
                key={site.siteId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => onSelectSite(site.siteId)}
                  className={`flex w-full items-center justify-between rounded-sm border px-3 py-2 text-left transition-all hover:bg-panel-2 ${
                    isSelected
                      ? "border-accent/40 bg-accent/10"
                      : "border-line bg-panel/60 hover:border-accent/30"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[11px] font-medium text-ink-strong">{site.name}</p>
                      <span className="text-[10px]" title={rain.label}>{rain.icon}</span>
                    </div>
                    <p className="text-[10px] text-ink-faint">{site.state} · {site.telemetry.rainfallLast24hMm}mm 24h</p>
                  </div>
                  <span
                    className="ml-2 shrink-0 rounded-xs border px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
                    style={{
                      color: riskColor,
                      backgroundColor: getRiskColorRgba(riskPercent, 0.12),
                      borderColor: riskColor,
                    }}
                  >
                    {riskPercent}%
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/* AI Predictive Analytics Gauges */}
      <section aria-labelledby="panel-gauges-heading">
        <SectionHeading icon={GaugeIcon}>
          <span id="panel-gauges-heading">AI Predictive Risk Gauges</span>
        </SectionHeading>
        <p className="mt-1 truncate text-[10px] font-medium text-ink-muted">{selectedSite?.name}</p>
        <div className="mt-2 flex justify-around rounded-md border border-line bg-panel/60 py-3">
          <RiskGauge label="6-Hour Risk" percent={sixHourPercent} />
          <RiskGauge label="24-Hour Risk" percent={twentyFourHourPercent} />
        </div>
      </section>

      {/* Slip-Plane Displacement Chart */}
      <section aria-labelledby="panel-chart-heading">
        <SectionHeading icon={Activity}>
          <span id="panel-chart-heading">Slip-Plane Displacement Trend</span>
        </SectionHeading>
        <div className="mt-2 h-36 rounded-md border border-line bg-panel/60 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={slipPlaneData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="slipPlaneGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#334155" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#334155" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", fontSize: 11 }}
                labelStyle={{ color: "#94A3B8" }}
              />
              <Line
                type="monotone"
                dataKey="displacementMm"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={{ r: 3, fill: "#06B6D4" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Emergency Road Rerouting */}
      <section id="shell-rerouting" aria-labelledby="panel-rerouting-heading">
        <SectionHeading icon={TrafficCone}>
          <span id="panel-rerouting-heading">Emergency Road Rerouting</span>
        </SectionHeading>
        {blockedSites.length === 0 ? (
          <p className="mt-2 rounded-md border border-line bg-panel/60 p-3 text-[11px] text-ink-faint">
            All primary highways are currently open. No reroutes needed.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {blockedSites.map((site) => (
              <li
                key={site.siteId}
                className="rounded-sm border border-critical/40 bg-critical/10 p-3 text-[11px]"
              >
                <p className="font-medium text-critical">{site.name} — road blocked</p>
                <p className="mt-1 text-ink">
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
