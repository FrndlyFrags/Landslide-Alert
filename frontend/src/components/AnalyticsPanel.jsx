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
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#1E293B" strokeWidth="8" />
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
      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <Icon size={13} className="text-ink/70" />
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
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-dark-slate p-4">
      {/* High-Risk Regional List with Live Rain Status */}
      <section>
        <SectionHeading icon={AlertTriangle}>High-Risk Regional List</SectionHeading>
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
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? "border-risk-low/60 bg-risk-low/10"
                      : "border-slate-800 bg-slate-card/50 hover:border-slate-600"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[11px] font-medium text-slate-100">{site.name}</p>
                      <span className="text-[10px]" title={rain.label}>{rain.icon}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{site.state} · {site.telemetry.rainfallLast24hMm}mm 24h</p>
                  </div>
                  <span
                    className="ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1"
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
      <section>
        <SectionHeading icon={GaugeIcon}>AI Predictive Risk Gauges</SectionHeading>
        <p className="mt-1 truncate text-[10px] text-slate-400 font-medium">{selectedSite?.name}</p>
        <div className="mt-2 flex justify-around rounded-md border border-slate-800 bg-slate-card/40 py-3">
          <RiskGauge label="6-Hour Risk" percent={sixHourPercent} />
          <RiskGauge label="24-Hour Risk" percent={twentyFourHourPercent} />
        </div>
      </section>

      {/* Slip-Plane Displacement Chart */}
      <section>
        <SectionHeading icon={Activity}>Slip-Plane Displacement Trend</SectionHeading>
        <div className="mt-2 h-36 rounded-md border border-slate-800 bg-slate-card/40 p-2">
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
      <section>
        <SectionHeading icon={TrafficCone}>Emergency Road Rerouting</SectionHeading>
        {blockedSites.length === 0 ? (
          <p className="mt-2 rounded-md border border-slate-800 bg-slate-card/40 p-3 text-[11px] text-slate-500">
            All primary highways are currently open. No reroutes needed.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {blockedSites.map((site) => (
              <li
                key={site.siteId}
                className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[11px]"
              >
                <p className="font-medium text-red-400">{site.name} — road blocked</p>
                <p className="mt-1 text-slate-300">
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
