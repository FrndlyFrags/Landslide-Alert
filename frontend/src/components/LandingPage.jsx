// -----------------------------------------------------------------------
// LandingPage.jsx  (LANDING PAGE ONLY)
// -----------------------------------------------------------------------
// WHAT: Public landing page for the NER Landslide Early Warning platform.
//       Editorial layout: a flat charcoal canvas, serif display type and
//       hairline rules instead of cards, glows or animated backgrounds.
// NOTE: Presentational only. The ranked-site data is read, never mutated,
//       and the admin entry point is a single discreet operator block at
//       the bottom of the page (no nav/hero admin button).
// -----------------------------------------------------------------------
import { motion, useReducedMotion } from "framer-motion";
import {
  CloudRain, Mountain, Route, ArrowRight, ArrowUpRight,
  Radio, ShieldCheck, Activity, Lock,
} from "lucide-react";
import { getRainStatus, getRiskColor } from "../utils/colorUtils";

// Motion is opinionated: short, quiet, and skipped entirely when the OS
// asks for reduced motion.
function useReveal() {
  const prefersReducedMotion = useReducedMotion();
  return (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
        };
}

function Label({ children }) {
  return <p className="eyebrow">{children}</p>;
}

export default function LandingPage({ rankedSites, onOpenAdminAuth }) {
  const sites = rankedSites ?? [];
  const topSites = sites.slice(0, 6);
  const highestRiskSite = sites[0];
  const blockedCount = sites.filter((site) => site.telemetry.roadStatus === "blocked").length;
  const stateCount = new Set(sites.map((site) => site.state)).size;
  const meanRisk = sites.length
    ? Math.round(sites.reduce((total, site) => total + site.risk.failureProbabilityPercent, 0) / sites.length)
    : 0;

  const prefersReducedMotion = useReducedMotion();
  const reveal = useReveal();

  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }

  return (
    <div className="nightsky min-h-screen font-sans text-ink selection:bg-accent/25 selection:text-ink-strong">
      {/* ------------------------------ Nav ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg-base/95 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6" aria-label="Main">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })}
            className="flex items-center gap-3 text-left"
            aria-label="Back to top"
          >
            <span className="flex h-7 w-7 items-center justify-center border border-line-soft text-accent">
              <Radio size={13} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[12.5px] font-semibold tracking-tight text-ink-strong">
                NER Landslide Early Warning
              </span>
              <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                North Eastern Region · India
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {[
              { id: "method", label: "Method" },
              { id: "corridors", label: "Corridors" },
              { id: "safety", label: "Safety" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-[12px] text-ink-muted transition-colors hover:text-ink-strong"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse motion-reduce:animate-none" />
            Live feeds
          </div>
        </nav>
      </header>

      {/* ------------------------------ Hero ------------------------------ */}
      <section className="px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <motion.div initial={false} animate={{ opacity: 1 }}>
            <motion.div {...reveal(0)}>
              <Label>Early warning · 12 monitored corridors</Label>
            </motion.div>

            <motion.h1
              {...reveal(0.05)}
              className="display-heading mt-5 text-[42px] leading-[1.02] text-ink-strong sm:text-[58px]"
            >
              A live warning layer for the hill roads of North East India.
            </motion.h1>

            <motion.p
              {...reveal(0.1)}
              className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-ink-muted"
            >
              Rainfall, slope angle, soil saturation and ground creep are sampled
              continuously across the region. When a hillside starts to move, district
              control rooms and residents are told before the road goes — and given a
              route out that still works.
            </motion.p>

            <motion.div {...reveal(0.15)} className="mt-9 flex flex-wrap items-center gap-5">
              <button
                onClick={() => scrollToSection("corridors")}
                className="group inline-flex items-center gap-2.5 border border-ink-strong bg-ink-strong px-5 py-2.5 text-[12px] font-semibold text-bg-base transition-colors hover:bg-white"
              >
                View corridor status
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => scrollToSection("method")}
                className="group inline-flex items-center gap-2 text-[12px] text-ink-muted transition-colors hover:text-ink-strong"
              >
                How the warning is built
                <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          </motion.div>

          {/* Regional snapshot — read-only view of the same ranked data */}
          <motion.aside
            {...reveal(0.12)}
            className="border border-line bg-panel p-5 self-start"
            aria-label="Regional snapshot"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="eyebrow">Regional snapshot</span>
              <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse motion-reduce:animate-none" />
                Live
              </span>
            </div>

            <div className="flex items-end justify-between gap-4 pt-5">
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  Mean failure probability
                </p>
                <p
                  className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums"
                  style={{ color: getRiskColor(meanRisk) }}
                >
                  {sites.length ? `${meanRisk}%` : "—"}
                </p>
              </div>
              <p className="max-w-[9rem] text-right text-[10.5px] leading-relaxed text-ink-faint">
                Across {sites.length || 12} corridors, 24-hour model run
              </p>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[11.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Highest risk site</dt>
                <dd className="truncate text-right font-mono text-ink">
                  {highestRiskSite
                    ? `${highestRiskSite.name.split(",")[0]} · ${highestRiskSite.risk.failureProbabilityPercent}%`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Blocked highways</dt>
                <dd className="font-mono" style={{ color: blockedCount > 0 ? "var(--c-red)" : "var(--c-risk-safe)" }}>
                  {sites.length ? blockedCount : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">States reporting</dt>
                <dd className="font-mono text-ink">{stateCount || 8}</dd>
              </div>
            </dl>

            {topSites.length > 0 && (
              <ul className="mt-5 space-y-3 border-t border-line pt-4">
                {topSites.slice(0, 3).map((site) => (
                  <li key={site.siteId}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[11.5px] text-ink">{site.name}</span>
                      <span
                        className="font-mono text-[11px] tabular-nums"
                        style={{ color: getRiskColor(site.risk.failureProbabilityPercent) }}
                      >
                        {site.risk.failureProbabilityPercent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-[2px] w-full bg-line-soft">
                      <div
                        className="h-full"
                        style={{
                          width: `${site.risk.failureProbabilityPercent}%`,
                          backgroundColor: getRiskColor(site.risk.failureProbabilityPercent),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </div>

        {/* Quiet figures strip */}
        <div className="mx-auto mt-16 max-w-6xl border-t border-line pt-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              { value: String(sites.length || 12), label: "Corridors monitored" },
              { value: String(stateCount || 8), label: "States covered" },
              { value: "5 min", label: "Feed refresh" },
              { value: "6", label: "Alert languages" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 font-mono text-[19px] leading-none text-ink-strong tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------ Method ------------------------------ */}
      <section id="method" className="hairline px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...reveal(0)} className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <Label>How the warning is built</Label>
              <h2 className="display-heading mt-4 text-[30px] leading-tight text-ink-strong sm:text-[38px]">
                Four signals, one honest risk figure.
              </h2>
            </div>
            <p className="max-w-xl text-[13.5px] leading-relaxed text-ink-muted md:pt-9">
              The model is deliberately boring: measure the things that fail a slope,
              keep the readings current, and publish the number with its inputs so a
              district officer can see why it changed.
            </p>
          </motion.div>

          <div className="mt-12">
            {[
              {
                icon: CloudRain,
                title: "Rainfall",
                text: "Open-Meteo and IMD-class readings give 24-hour accumulation and a 6-hour forecast for every corridor, refreshed through the day rather than once each morning.",
                tag: "Open-Meteo · IMD",
              },
              {
                icon: Mountain,
                title: "Terrain",
                text: "NASA SRTM elevation is rendered as real 3D terrain, so slope angle and fall-line come from the hillside itself — not from a flat map approximation.",
                tag: "NASA SRTM · 30 m",
              },
              {
                icon: Activity,
                title: "Ground movement",
                text: "Displacement heat layers and soil-node saturation show creep and water loading building up days before a visible crack appears.",
                tag: "Soil nodes · creep",
              },
              {
                icon: Route,
                title: "Response",
                text: "OSRM road routing returns drivable escape paths and detours around blocked highways, alongside six-language warning blasts.",
                tag: "OSRM · 6 languages",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                {...reveal(index * 0.05)}
                className="grid gap-4 border-t border-line py-7 md:grid-cols-[3rem_1fr_auto] md:items-start md:gap-8"
              >
                <span className="font-mono text-[11px] text-ink-faint tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex items-start gap-4">
                  <item.icon size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink-strong">{item.title}</h3>
                    <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
                      {item.text}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint md:pt-1">
                  {item.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- Corridors ----------------------------- */}
      <section id="corridors" className="hairline px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...reveal(0)} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label>Live corridors</Label>
              <h2 className="display-heading mt-4 text-[30px] leading-tight text-ink-strong sm:text-[38px]">
                Public weather and risk status.
              </h2>
            </div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
              Ranked by failure probability
            </p>
          </motion.div>

          <div className="mt-10">
            <div className="hidden grid-cols-[1.6fr_1fr_0.7fr_1.1fr] gap-6 border-b border-line pb-2.5 md:grid">
              {["Corridor", "State", "24h rain", "Failure probability"].map((heading) => (
                <span key={heading} className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                  {heading}
                </span>
              ))}
            </div>

            {topSites.map((site, index) => {
              const risk = site.risk.failureProbabilityPercent;
              const riskColor = getRiskColor(risk);
              const rain = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);
              return (
                <motion.div
                  key={site.siteId}
                  {...reveal(index * 0.04)}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line py-4 md:grid-cols-[1.6fr_1fr_0.7fr_1.1fr] md:gap-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-strong">{site.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-faint">{site.corridor}</p>
                  </div>

                  <p className="hidden text-[12px] text-ink-muted md:block">{site.state}</p>

                  <p className="hidden font-mono text-[12px] text-ink md:block tabular-nums">
                    {site.telemetry.rainfallLast24hMm} mm
                    <span className="ml-1.5 text-[10.5px] text-ink-faint">{rain.label}</span>
                  </p>

                  <div className="flex items-center justify-end gap-3 md:justify-start">
                    <div className="h-[3px] w-24 bg-line-soft">
                      <div className="h-full" style={{ width: `${risk}%`, backgroundColor: riskColor }} />
                    </div>
                    <span className="w-9 text-right font-mono text-[12px] tabular-nums" style={{ color: riskColor }}>
                      {risk}%
                    </span>
                  </div>
                </motion.div>
              );
            })}

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              Showing the six most exposed of {sites.length || 12} monitored corridors
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------ Safety ------------------------------ */}
      <section id="safety" className="hairline px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div {...reveal(0)} className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <Label>Citizen safety</Label>
              <h2 className="display-heading mt-4 text-[30px] leading-tight text-ink-strong sm:text-[38px]">
                If the ground starts to move.
              </h2>
            </div>
            <p className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-muted md:pt-10">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-safe" aria-hidden="true" />
              Preparedness guidance follows NDMA and State Disaster Management Authority
              protocols. Read it before the monsoon, not during it.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-3">
            {[
              {
                phase: "01",
                title: "Before",
                note: "Prepare",
                items: [
                  "Inspect hillside walls for new cracks, tilting trees or sudden seepage.",
                  "Agree two evacuation routes that stay off steep slopes.",
                  "Keep a grab-bag ready: torch, water, ID, medicines, phone power bank.",
                ],
              },
              {
                phase: "02",
                title: "During",
                note: "Act",
                items: [
                  "Move sideways out of the slide path, toward stable higher ground.",
                  "Stay out of stream valleys and drainage gullies — debris flows collect there.",
                  "If you cannot escape, curl up and protect your head.",
                ],
              },
              {
                phase: "03",
                title: "After",
                note: "Recover",
                items: [
                  "Stay clear of fresh debris; secondary failures are common.",
                  "Report blocked roads, broken power lines and trapped vehicles.",
                  "Re-enter damaged structures only after an official clearance.",
                ],
              },
            ].map((phase, index) => (
              <motion.div
                key={phase.phase}
                {...reveal(index * 0.06)}
                className="border-t border-line pt-5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    {phase.phase} · {phase.note}
                  </span>
                  <ShieldCheck size={13} className="text-ink-faint" aria-hidden="true" />
                </div>
                <h3 className="mt-2 text-[15px] font-semibold text-ink-strong">{phase.title}</h3>
                <ul className="mt-4 space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-muted">
                      <span className="mt-[9px] h-[1px] w-3 shrink-0 bg-ink-faint" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------- Operator access (admin) ---------------------- */}
      <section className="hairline px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Operator access</p>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
              District control rooms and emergency administrators sign in with their
              passcode to open the live command dashboard.
            </p>
          </div>
          <button
            onClick={onOpenAdminAuth}
            className="group inline-flex shrink-0 items-center gap-2.5 border border-line px-5 py-2.5 text-[12px] font-medium text-ink transition-colors hover:border-ink-faint hover:text-ink-strong"
          >
            <Lock size={13} className="text-ink-faint transition-colors group-hover:text-accent" />
            Operator sign-in
            <ArrowRight size={13} className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        </div>
      </section>

      {/* ------------------------------ Footer ------------------------------ */}
      <footer className="hairline px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="font-display text-[12.5px] font-semibold text-ink-strong">
              NER Landslide Early Warning
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-faint">
              Monitoring the Shillong Plateau, NH-10 Sikkim, Silchar–Lumding and Tawang
              corridors. A research-and-response platform, not a substitute for local
              authority instructions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[11.5px]">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">Data</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">Built with</span>
            <span className="text-ink-muted">Open-Meteo rainfall</span>
            <span className="text-ink-muted">MapLibre GL</span>
            <span className="text-ink-muted">NASA SRTM elevation</span>
            <span className="text-ink-muted">OSRM routing</span>
            <span className="text-ink-muted">OSM road network</span>
            <span className="text-ink-muted">Esri imagery</span>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-2 border-t border-line pt-5 text-[10.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NER Landslide Command &amp; Early Warning System.</p>
          <p className="font-mono uppercase tracking-[0.12em]">North Eastern Region · India</p>
        </div>
      </footer>
    </div>
  );
}
