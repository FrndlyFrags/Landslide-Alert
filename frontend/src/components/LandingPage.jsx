// -----------------------------------------------------------------------
// LandingPage.jsx
// -----------------------------------------------------------------------
// WHAT: Public Landing Page introducing the NER Landslide Early Warning &
//       Monitoring Platform. Showcases system capabilities, public weather alerts,
//       and disaster preparedness guidance, with a secure entry portal to the
//       Tactical Command Center for authorized admins.
// -----------------------------------------------------------------------
import { motion } from "framer-motion";
import {
  ShieldCheck, Mountain, CloudRain, Route, Bot, Eye, Radio,
  Lock, ArrowRight, CheckCircle2, ChevronRight, Siren, Sparkles, MapPin,
} from "lucide-react";
import { getRainStatus, getRiskColor } from "../utils/colorUtils";

export default function LandingPage({ rankedSites, onOpenAdminAuth }) {
  const topSites = rankedSites ? rankedSites.slice(0, 4) : [];

  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-onyx text-slate-100 font-sans selection:bg-telemetry/30 selection:text-telemetry">
      {/* Top Public Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-dark-slate/90 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-telemetry/15 ring-1 ring-telemetry/40">
              <Radio size={18} className="text-telemetry" />
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-telemetry/30" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-50">
                NER Landslide Early Warning Platform
              </h1>
              <p className="text-[10.5px] text-slate-400">North Eastern Region · India</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollToSection("features")}
              className="hidden text-xs text-slate-400 hover:text-slate-200 transition-colors md:block"
            >
              System Tools
            </button>
            <button
              onClick={() => scrollToSection("safety")}
              className="hidden text-xs text-slate-400 hover:text-slate-200 transition-colors md:block"
            >
              Safety Guidelines
            </button>

            <button
              onClick={onOpenAdminAuth}
              className="flex items-center gap-2 rounded-lg bg-telemetry px-4 py-2 text-xs font-bold text-onyx shadow-glow-cyan hover:bg-cyan-400 transition-all hover:scale-[1.02]"
            >
              <Lock size={13} />
              <span>Authorized Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="command-grid-backdrop relative overflow-hidden px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-telemetry/30 bg-telemetry/10 px-3.5 py-1 text-xs font-semibold text-telemetry mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-telemetry animate-pulse" />
            LIVE IMD &amp; NASA Satellite Telemetry Integration
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight"
          >
            AI-Based Early Warning &amp; Landslide Risk Monitoring Platform
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-sm text-slate-300 sm:text-base max-w-2xl mx-auto leading-relaxed"
          >
            Continuous spatial intelligence across Meghalaya, Sikkim, Assam, Manipur, Nagaland, Mizoram, Tripura, and Arunachal Pradesh. Combining live rainfall, satellite terrain elevation, and road-following escape routing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onOpenAdminAuth}
              className="flex items-center gap-2 rounded-xl bg-telemetry px-6 py-3.5 text-xs font-bold text-onyx shadow-glow-cyan hover:bg-cyan-400 transition-all hover:scale-105"
            >
              <Lock size={15} />
              <span>Open Admin Command Center</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => scrollToSection("corridors")}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-card/60 px-6 py-3.5 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-card transition-all"
            >
              <Eye size={15} />
              <span>View Public Risk Summaries</span>
            </button>
          </motion.div>
        </div>

        {/* Live Corridors Banner */}
        <div id="corridors" className="mx-auto max-w-7xl mt-16 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CloudRain size={14} className="text-telemetry" />
              Live Monitored Corridors &amp; Public Weather Status
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">12 Sites Across 8 States</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topSites.map((site) => {
              const rain = getRainStatus(site.telemetry.rainfallLast24hMm, site.telemetry.rainfallNext6hMm);
              const riskColor = getRiskColor(site.risk.failureProbabilityPercent);
              return (
                <div
                  key={site.siteId}
                  className="rounded-xl border border-slate-800 bg-dark-slate/80 p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{site.name}</p>
                      <p className="text-[10.5px] text-slate-400">{site.state} · {site.corridor}</p>
                    </div>
                    <span className="text-sm">{rain.icon}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] pt-3 border-t border-slate-800/80">
                    <span className="text-slate-400">24h Rainfall: <strong className="text-slate-200 font-mono">{site.telemetry.rainfallLast24hMm} mm</strong></span>
                    <span className="font-mono font-bold" style={{ color: riskColor }}>
                      {site.risk.failureProbabilityPercent}% Risk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools & Features Section */}
      <section id="features" className="px-6 py-16 bg-dark-slate/50 border-y border-slate-800">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry mb-2">System Tools &amp; Architecture</h3>
            <h4 className="text-2xl sm:text-3xl font-bold text-slate-50">Advanced Spatial &amp; AI Disaster Technologies</h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Designed to serve both emergency response command rooms and regional disaster management teams.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-card/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-telemetry/10 text-telemetry mb-4">
                  <Mountain size={20} />
                </div>
                <h5 className="text-sm font-bold text-slate-100">3D Satellite Terrain Mapping</h5>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Renders real NASA SRTM satellite elevation data with MapLibre GL 3D terrain mesh to visualize exact hillside steepness.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-mono text-telemetry flex items-center gap-1">
                <span>MapLibre 3D Engine</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-card/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  <Route size={20} />
                </div>
                <h5 className="text-sm font-bold text-slate-100">Live Drivable Escape Routes</h5>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Queries OSRM OpenStreetMap routing engines to calculate turn-by-turn driving escape paths and alternative detours.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-mono text-emerald-400 flex items-center gap-1">
                <span>Multi-Route Evacuation</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-card/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                  <Bot size={20} />
                </div>
                <h5 className="text-sm font-bold text-slate-100">AI Disaster Copilot</h5>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Natural language processing model that provides immediate answers regarding site safety, evacuation points, and rainfall forecasts.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-mono text-amber-400 flex items-center gap-1">
                <span>Multilingual NLP AI</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-card/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                  <Eye size={20} />
                </div>
                <h5 className="text-sm font-bold text-slate-100">Computer Vision Crack Inspection</h5>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Field photo upload analysis module for evaluating hillside crack width and geological instability severity.
                </p>
              </div>
              <div className="mt-4 text-[10.5px] font-mono text-purple-400 flex items-center gap-1">
                <span>Vision Photo Intelligence</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Safety & Preparedness Guidelines */}
      <section id="safety" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-slate-800 gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry">Citizen Safety</h3>
              <h4 className="text-2xl font-bold text-slate-50 mt-1">Landslide Safety &amp; Evacuation Protocol</h4>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-card px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck size={14} className="text-emerald-400" />
              Standard NDMA &amp; SDMA Preparedness Guidelines
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Phase 1 */}
            <div className="rounded-2xl border border-slate-800 bg-dark-slate p-6">
              <span className="inline-block rounded-md bg-telemetry/15 px-2.5 py-1 text-xs font-bold text-telemetry mb-3">
                1. BEFORE (Preparedness)
              </span>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-telemetry shrink-0 mt-0.5" />
                  <span>Inspect hillside walls for new cracks, tilting trees, or sudden ground water seepage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-telemetry shrink-0 mt-0.5" />
                  <span>Identify at least two evacuation routes away from steep slopes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-telemetry shrink-0 mt-0.5" />
                  <span>Prepare an emergency grab-bag with torch, water, ID, and medicines.</span>
                </li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="rounded-2xl border border-slate-800 bg-dark-slate p-6">
              <span className="inline-block rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400 mb-3">
                2. DURING (Immediate Action)
              </span>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Move quickly sideways out of the slide path toward higher stable ground.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Avoid stream valleys and drainage gullies where debris flows concentrate.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>If trapped inside, curl into a tight ball and protect your head.</span>
                </li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="rounded-2xl border border-slate-800 bg-dark-slate p-6">
              <span className="inline-block rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400 mb-3">
                3. AFTER (Post-Slide Recovery)
              </span>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Stay clear of slide debris — secondary slope failures are common.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Report blocked roads, broken power lines, or trapped vehicles to authorities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Re-enter damaged structures only after safety confirmation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-dark-slate px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-300">NER Landslide Command &amp; Early Warning System</p>
            <p className="mt-0.5">Monitoring Shillong Plateau, NH-10 Sikkim, Silchar-Lumding &amp; Tawang corridors.</p>
          </div>

          <button
            onClick={onOpenAdminAuth}
            className="flex items-center gap-1.5 text-telemetry hover:underline font-semibold"
          >
            <Lock size={12} />
            <span>Authorized Admin Login</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
