// -----------------------------------------------------------------------
// LandingPage.jsx  (LANDING PAGE ONLY)
// -----------------------------------------------------------------------
// WHAT: Public landing page introducing the NER Landslide Early Warning
//       and Monitoring Platform — night-sky theme: calm, trustworthy,
//       with a continuous falling-stars meteor shower behind the hero.
// NOTE: Presentational redesign only. All actions, data fields and the
//       ranked-site summary cards behave exactly as before; unlike the
//       admin view this file renders nothing of the command dashboard.
// -----------------------------------------------------------------------
import { motion, useReducedMotion } from "framer-motion";
import {
  ShieldCheck, Mountain, CloudRain, Route, Bot, Eye, Lock, ArrowRight,
  CheckCircle2, ChevronRight, Radio, Siren,
} from "lucide-react";
import { getRainStatus, getRiskColor } from "../utils/colorUtils";
import NightSkyBackground from "./NightSkyBackground";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export default function LandingPage({ rankedSites, onOpenAdminAuth }) {
  const topSites = rankedSites ? rankedSites.slice(0, 4) : [];
  const prefersReducedMotion = useReducedMotion();

  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }

  return (
    <div className="nightsky isolate min-h-screen text-ink selection:bg-accent/30 selection:text-accent font-sans">
      {/* --------------- Fixed full-page star sky (StarField) --------------- */}
      {/* Rendered as one fixed -z-10 layer; `isolate` on this root makes
          its stacking context so stars sit above the page gradient but
          below all content at every scroll position. */}
      <NightSkyBackground />

      {/* ------------------------- Minimal navbar ------------------------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg-base/85 px-6 py-3.5 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between" aria-label="Main">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })}
            className="flex items-center gap-3 text-left"
            aria-label="Back to top"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 ring-1 ring-accent/30">
              <Radio size={17} className="text-accent" />
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-accent/20 motion-reduce:animate-none" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold tracking-tight text-ink-strong">
                NER Landslide Early Warning
              </span>
              <span className="block text-[10.5px] text-ink-muted">North Eastern Region · India</span>
            </span>
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection("what")}
              className="hidden text-xs text-ink-muted transition-colors hover:text-ink md:block"
            >
              What we do
            </button>
            <button
              onClick={() => scrollToSection("corridors")}
              className="hidden text-xs text-ink-muted transition-colors hover:text-ink md:block"
            >
              Live corridors
            </button>
            <button
              onClick={() => scrollToSection("safety")}
              className="hidden text-xs text-ink-muted transition-colors hover:text-ink md:block"
            >
              Safety guidance
            </button>
            <button
              onClick={onOpenAdminAuth}
              className="flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-[#06202b] transition-all hover:bg-[#7ad4ef] hover:shadow-glow-cyan active:scale-[0.98]"
            >
              <Lock size={13} />
              <span>Admin portal</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ----------------------------- Hero ----------------------------- */}
      <section className="relative overflow-hidden px-6 pb-16 pt-28 md:pb-24 md:pt-36">
        {/* Star sky now comes from the fixed full-page NightSkyBackground layer */}

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-7 inline-flex items-center gap-2 rounded-pill border border-line bg-panel/70 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-accent"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-live-pulse motion-reduce:animate-none" />
            Live IMD &amp; NASA satellite telemetry
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="display-heading mx-auto max-w-2xl text-3xl font-semibold leading-tight text-ink-strong sm:text-5xl"
          >
            Early warning for landslide-prone corridors across North East India
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-[15px]"
          >
            Continuous rainfall, satellite terrain and road-connectivity monitoring across
            Meghalaya, Sikkim, Assam, Manipur, Nagaland, Mizoram, Tripura and Arunachal Pradesh —
            with road-following escape routing when a slope turns dangerous.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={onOpenAdminAuth}
              className="group flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-xs font-semibold text-[#06202b] transition-all hover:bg-[#7ad4ef] hover:shadow-glow-cyan active:scale-[0.98]"
            >
              <Lock size={14} />
              <span>Open admin command center</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => scrollToSection("what")}
              className="flex items-center gap-2 rounded-sm border border-line bg-panel/60 px-6 py-3 text-xs font-medium text-ink transition-colors hover:border-line-soft hover:bg-panel active:scale-[0.98]"
            >
              <Eye size={14} />
              <span>See how the system works</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* -------------------- What the system does -------------------- */}
      <section id="what" className="hairline px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mx-auto mb-12 max-w-xl text-center">
            <p className="eyebrow">What the system does</p>
            <h2 className="display-heading mt-3 text-2xl font-semibold text-ink-strong sm:text-3xl">
              Four tools, one monitoring picture
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Mountain,
                tone: "text-accent",
                title: "3D satellite terrain",
                text: "Renders real NASA SRTM elevation with MapLibre GL 3D terrain to show the exact steepness of every hillside.",
                tag: "MapLibre 3D engine",
              },
              {
                icon: Route,
                tone: "text-safe",
                title: "Drivable escape routes",
                text: "Queries OSRM OpenStreetMap routing for turn-by-turn escape paths and alternate detours around blocked roads.",
                tag: "Multi-route evacuation",
              },
              {
                icon: Bot,
                tone: "text-safe",
                title: "AI disaster copilot",
                text: "Natural-language answers about site safety, evacuation points and rainfall forecasts, in your language.",
                tag: "Multilingual NLP",
              },
              {
                icon: Eye,
                tone: "text-accent",
                title: "Crack photo inspection",
                text: "Field officers upload slope-crack photos; computer vision measures width and geological instability.",
                tag: "Vision analysis",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.07 }}
                className="flex flex-col"
              >
                <item.icon size={20} className={item.tone} aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold text-ink-strong">{item.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-muted">{item.text}</p>
                <p className="mt-4 flex items-center gap-1 font-mono text-[10.5px] text-ink-faint">
                  <span>{item.tag}</span>
                  <ChevronRight size={11} />
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Live monitored corridors ---------------- */}
      <section id="corridors" className="hairline px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <CloudRain size={13} className="text-accent" />
                Live corridors
              </p>
              <h2 className="display-heading mt-3 text-2xl font-semibold text-ink-strong sm:text-3xl">
                Public weather &amp; risk status
              </h2>
            </div>
            <p className="font-mono text-[11px] text-ink-faint">12 sites across 8 states</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topSites.map((site, index) => {
              const rain = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);
              const riskColor = getRiskColor(site.risk.failureProbabilityPercent);
              return (
                <motion.div
                  key={site.siteId}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                  className="rounded-md border border-line bg-panel/70 p-4 transition-colors hover:border-accent/30 hover:bg-panel"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-ink-strong">{site.name}</p>
                      <p className="mt-0.5 text-[10.5px] text-ink-muted">{site.state} · {site.corridor}</p>
                    </div>
                    <span className="text-sm" aria-label={rain.label}>{rain.icon}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3 text-[11px]">
                    <span className="text-ink-muted">
                      24h rainfall <strong className="font-mono text-ink">{site.telemetry.rainfallLast24hMm} mm</strong>
                    </span>
                    <span className="font-mono font-semibold" style={{ color: riskColor }}>
                      {site.risk.failureProbabilityPercent}% risk
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------- Safety & preparedness ------------------- */}
      <section id="safety" className="hairline px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp} className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <Siren size={13} className="text-alert-amber" />
                Citizen safety
              </p>
              <h2 className="display-heading mt-3 text-2xl font-semibold text-ink-strong sm:text-3xl">
                Landslide safety &amp; evacuation protocol
              </h2>
            </div>
            <p className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
              <ShieldCheck size={13} className="text-safe" />
              NDMA &amp; SDMA preparedness guidelines
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                badge: "1. Before — preparedness",
                badgeClass: "border-accent/30 bg-accent/10 text-accent",
                checkClass: "text-accent",
                items: [
                  "Inspect hillside walls for new cracks, tilting trees, or sudden groundwater seepage.",
                  "Identify at least two evacuation routes away from steep slopes.",
                  "Prepare an emergency grab-bag with torch, water, ID, and medicines.",
                ],
              },
              {
                badge: "2. During — immediate action",
                badgeClass: "border-alert-amber/30 bg-alert-amber/10 text-alert-amber",
                checkClass: "text-alert-amber",
                items: [
                  "Move quickly sideways out of the slide path toward higher stable ground.",
                  "Avoid stream valleys and drainage gullies where debris flows concentrate.",
                  "If trapped inside, curl into a tight ball and protect your head.",
                ],
              },
              {
                badge: "3. After — post-slide recovery",
                badgeClass: "border-safe/30 bg-safe/10 text-safe",
                checkClass: "text-safe",
                items: [
                  "Stay clear of slide debris — secondary slope failures are common.",
                  "Report blocked roads, broken power lines, or trapped vehicles to authorities.",
                  "Re-enter damaged structures only after safety confirmation.",
                ],
              },
            ].map((phase, index) => (
              <motion.div
                key={phase.badge}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.08 }}
                className="rounded-md border border-line bg-panel/70 p-6"
              >
                <span className={`inline-block rounded-xs border px-2.5 py-1 text-[10.5px] font-semibold tracking-wide ${phase.badgeClass}`}>
                  {phase.badge}
                </span>
                <ul className="mt-4 space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink">
                      <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${phase.checkClass}`} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- Footer ----------------------------- */}
      <footer className="hairline px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-xs text-ink-faint md:text-left">
            <span className="font-semibold text-ink-muted">NER Landslide Command &amp; Early Warning System.</span>
            {" "}Monitoring Shillong Plateau, NH-10 Sikkim, Silchar–Lumding &amp; Tawang corridors.
          </p>
          <button
            onClick={onOpenAdminAuth}
            className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-[#8adcf5]"
          >
            <Lock size={12} />
            <span>Admin login</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
