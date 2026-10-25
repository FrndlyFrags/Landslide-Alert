import { useState, useEffect } from "react";
import Skeleton from "./components/ui/Skeleton";
import Header from "./components/Header";
import DigitalTwinMap from "./components/DigitalTwinMap";
import AnalyticsPanel from "./components/AnalyticsPanel";
import CopilotCenter from "./components/CopilotCenter";
import WarningModal from "./components/WarningModal";
import TerrainEscapeModal from "./components/TerrainEscapeModal";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import { buildRankedSiteList, buildRankedSiteListLive, calculateRegionalScore } from "./data/mockData";

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
    setActiveLayers((current) => {
      current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId];
    });
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

  // Render landing page immediately; show skeletons where live data hasn't arrived
  return (
    <div className="relative min-h-screen bg-paper text-ink selection:text-accent">
      {/* Landing page shows right away; skeletons render while data loads */}
      <LandingPage
        rankedSites={isBooting ? null : rankedSites}
        isRefreshing={isRefreshing}
        SkeletonComponent={Skeleton}
        onOpenAdminAuth={handleOpenAdminPortal}
      />

      {/* Auth Modal for Admin Gate */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

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