// -----------------------------------------------------------------------
// App.jsx
// -----------------------------------------------------------------------
// WHAT: Main application wrapper.
//   1. Persists view state (landing vs dashboard) & admin auth status in localStorage,
//      so refreshing the page stays on the current page.
//   2. Enforces strict admin passcode verification for the Command Dashboard.
// -----------------------------------------------------------------------
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import Header from "./components/Header";
import DigitalTwinMap from "./components/DigitalTwinMap";
import AnalyticsPanel from "./components/AnalyticsPanel";
import CopilotCenter from "./components/CopilotCenter";
import WarningModal from "./components/WarningModal";
import TerrainEscapeModal from "./components/TerrainEscapeModal";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import { buildRankedSiteList, buildRankedSiteListLive, calculateRegionalScore } from "./data/mockData";

const BOOT_SEQUENCE_STEPS = [
  "Connecting to IMD-class weather feed...",
  "Pulling live rainfall for 12 sites...",
  "Sampling real satellite elevation data...",
  "Calculating regional risk model...",
];

function BootSequence() {
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    if (stepIndex >= BOOT_SEQUENCE_STEPS.length - 1) return;
    const timeout = setTimeout(() => setStepIndex((current) => current + 1), 700);
    return () => clearTimeout(timeout);
  }, [stepIndex]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      className="command-grid-backdrop fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-onyx"
    >
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-telemetry/10 ring-1 ring-telemetry/40">
        <Radio size={22} className="text-telemetry" />
        <span className="absolute inset-0 animate-ping-slow rounded-full bg-telemetry/40" />
      </div>
      <p className="text-xs font-semibold tracking-wide text-slate-300">NER LANDSLIDE COMMAND CENTER</p>
      <div className="h-16 w-72 text-center">
        {BOOT_SEQUENCE_STEPS.slice(0, stepIndex + 1).map((step, index) => (
          <p
            key={step}
            className={`font-mono text-[11px] ${
              index === stepIndex ? "text-telemetry" : "text-slate-600 line-through"
            }`}
          >
            {step}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

const DEFAULT_ACTIVE_LAYERS = ["elevation", "roads", "rainfall"];

export default function App() {
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("ner_view_mode") || "landing";
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("ner_is_admin") === "true";
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [rankedSites, setRankedSites] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [activeLayers, setActiveLayers] = useState(DEFAULT_ACTIVE_LAYERS);
  const [warningModal, setWarningModal] = useState({ isOpen: false, siteName: "", languages: [] });
  const [terrainViewSite, setTerrainViewSite] = useState(null);

  useEffect(() => {
    localStorage.setItem("ner_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("ner_is_admin", isAdminAuthenticated ? "true" : "false");
  }, [isAdminAuthenticated]);

  async function loadLiveData() {
    setIsRefreshing(true);
    try {
      const liveSites = await buildRankedSiteListLive();
      setRankedSites(liveSites);
      setSelectedSiteId((current) => current ?? liveSites[0]?.siteId);
    } catch (error) {
      console.warn("Live data load failed, using simulated fallback.", error);
      const fallbackSites = buildRankedSiteList();
      setRankedSites(fallbackSites);
      setSelectedSiteId((current) => current ?? fallbackSites[0]?.siteId);
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadLiveData();
  }, []);

  const isBooting = rankedSites === null;
  const regionalScore = rankedSites ? calculateRegionalScore(rankedSites) : { regionalScore: 0, riskLevel: "safe" };
  const selectedSite = rankedSites?.find((site) => site.siteId === selectedSiteId) ?? null;

  function toggleLayer(layerId) {
    setActiveLayers((current) =>
      current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId]
    );
  }

  function handleTriggerWarning(selectedLanguages) {
    const mostUrgentSite = rankedSites?.[0];
    setWarningModal({
      isOpen: true,
      siteName: mostUrgentSite?.name ?? "the affected region",
      languages: selectedLanguages,
    });
  }

  function handleOpenAdminPortal() {
    if (isAdminAuthenticated) {
      setViewMode("dashboard");
    } else {
      setIsAuthModalOpen(true);
    }
  }

  function handleAdminLoginSuccess() {
    setIsAdminAuthenticated(true);
    setIsAuthModalOpen(false);
    setViewMode("dashboard");
  }

  function handleExitToLanding() {
    setViewMode("landing");
  }

  return (
    <div className="relative min-h-screen bg-onyx text-slate-100 selection:bg-telemetry/30">
      <AnimatePresence>{isBooting && <BootSequence />}</AnimatePresence>

      {!isBooting && (
        <>
          {viewMode === "dashboard" && isAdminAuthenticated ? (
            <div className="relative flex h-screen flex-col overflow-hidden">
              <Header
                regionalScore={regionalScore}
                activeSensorNodes={142}
                onTriggerWarning={handleTriggerWarning}
                onRefresh={loadLiveData}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
                onExitToLanding={handleExitToLanding}
              />

              {/* Main Command Dashboard — Expanded Full Screen Width Map */}
              <main className="flex flex-1 min-h-0 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="hidden w-72 shrink-0 border-r border-slate-800 lg:block h-full"
                >
                  <AnalyticsPanel
                    rankedSites={rankedSites}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSiteId}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex-1 min-w-0 h-full"
                >
                  <DigitalTwinMap
                    rankedSites={rankedSites}
                    activeLayers={activeLayers}
                    onToggleLayer={toggleLayer}
                    selectedSite={selectedSite}
                    onSelectSite={setSelectedSiteId}
                    onOpenTerrainView={setTerrainViewSite}
                  />
                </motion.div>
              </main>

              {/* Floating AI Disaster Copilot Action Widget */}
              <CopilotCenter rankedSites={rankedSites} />
            </div>
          ) : (
            <LandingPage
              rankedSites={rankedSites}
              onOpenAdminAuth={handleOpenAdminPortal}
            />
          )}

          {/* Auth Modal for Admin Gate */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLoginSuccess={handleAdminLoginSuccess}
          />
        </>
      )}

      <WarningModal
        isOpen={warningModal.isOpen}
        siteName={warningModal.siteName}
        languages={warningModal.languages}
        onClose={() => setWarningModal((current) => ({ ...current, isOpen: false }))}
      />

      <AnimatePresence>
        {terrainViewSite && (
          <TerrainEscapeModal site={terrainViewSite} onClose={() => setTerrainViewSite(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
