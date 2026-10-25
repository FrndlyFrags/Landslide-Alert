// -----------------------------------------------------------------------
// CopilotCenter.jsx
// -----------------------------------------------------------------------
// WHAT: Redesigned Floating AI Copilot & Emergency Alert Center.
//       Replaces the static, space-consuming bottom bar with a sleek,
//       glowing Floating Action Button (FAB) and interactive popover drawer.
//       This frees up maximum vertical space for the 3D Satellite Map!
// -----------------------------------------------------------------------
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, User, Send, MessageSquareText, Send as SendBroadcast,
  Sparkles, X, Minimize2, Languages, MessageCircle, ShieldAlert,
} from "lucide-react";
import { getRainStatus } from "../utils/colorUtils";
import { SAFE_ZONES } from "../data/safetyData";

const MOCK_ALERT_PHRASES = {
  English: "LANDSLIDE WARNING: Please move to higher ground immediately.",
  Assamese: "ভূমিষ্খলন সতৰ্কবাণী: অনুগ্ৰহ কৰি তৎক্ষণাৎ ওখ ঠাইলৈ যাওক।",
  Khasi: "JINGKHUM SHISHA: Wan sha jaka thang naduh mynta.",
  Mizo: "TLANG PUTHLET VANNEIH THUPUAN: Hmun sang zawnah paltansuh.",
  Bengali: "ভূমিধস সতর্কতা: অনুগ্রহ করে অবিলম্বে উঁচু স্থানে চলে যান।",
  Nagamese: "LANDSLIDE KHABOR: Joldi upor jagate jai.",
};

function generateCopilotAnswer(question, rankedSites) {
  if (!rankedSites || rankedSites.length === 0) {
    return "Data feed is still initializing. Please wait a moment.";
  }

  const q = question.toLowerCase();

  const matchedSite = rankedSites.find(
    (site) =>
      q.includes(site.name.toLowerCase()) ||
      q.includes(site.siteId.toLowerCase()) ||
      q.includes(site.name.split(",")[0].toLowerCase())
  );

  const matchedStateSites = rankedSites.filter((site) =>
    q.includes(site.state.toLowerCase())
  );

  if (matchedSite) {
    const rain = getRainStatus(matchedSite.telemetry.rainfallLast24hMm, matchedSite.telemetry.rainfallNext6hMm);
    const dest = SAFE_ZONES[matchedSite.siteId]?.[0]?.name || "Evacuation Center";
    return (
      `📍 **${matchedSite.name} (${matchedSite.state})**\n` +
      `• **Risk Level:** ${matchedSite.risk.failureProbabilityPercent}% (${matchedSite.risk.riskLevel.toUpperCase()})\n` +
      `• **Weather:** ${rain.icon} ${rain.label} (${matchedSite.telemetry.rainfallLast24hMm} mm 24h, ${matchedSite.telemetry.rainfallNext6hMm} mm forecast)\n` +
      `• **Slope:** ${matchedSite.telemetry.slopeAngleDegrees}° | **Soil Saturation:** ${matchedSite.telemetry.soilSaturationPercent}%\n` +
      `• **Road:** ${matchedSite.telemetry.roadStatus === "open" ? "✅ Highway Open" : "⚠️ ROAD BLOCKED"}\n` +
      `• **Nearest Relief Point:** ${dest}`
    );
  }

  if (matchedStateSites.length > 0) {
    const stateName = matchedStateSites[0].state;
    const siteSummary = matchedStateSites
      .map(
        (s) =>
          `• **${s.name}:** ${s.risk.failureProbabilityPercent}% risk (${s.telemetry.rainfallLast24hMm}mm rain, road ${s.telemetry.roadStatus})`
      )
      .join("\n");
    return (
      `📊 **Status report for ${stateName}:**\n${siteSummary}\n\n` +
      `💡 Click any site marker on the 3D map for escape routes.`
    );
  }

  if (q.includes("rain") || q.includes("weather") || q.includes("downpour") || q.includes("monsoon") || q.includes("forecast")) {
    const rainingSites = rankedSites.filter((s) => s.telemetry.rainfallLast24hMm > 30 || s.telemetry.rainfallNext6hMm > 5);
    const topRain = [...rankedSites].sort((a, b) => b.telemetry.rainfallLast24hMm - a.telemetry.rainfallLast24hMm)[0];
    const topRainStatus = getRainStatus(topRain.telemetry.rainfallLast24hMm, topRain.telemetry.rainfallNext6hMm);

    if (rainingSites.length === 0) {
      return `🌤️ **Weather Summary:** Rainfall levels are low across NER corridors. Highest recorded 24h precipitation is **${topRain.name}** at ${topRain.telemetry.rainfallLast24hMm} mm.`;
    }

    const rainList = rainingSites
      .slice(0, 4)
      .map((s) => `• **${s.name}:** ${s.telemetry.rainfallLast24hMm} mm (24h) | +${s.telemetry.rainfallNext6hMm} mm forecast (${s.risk.failureProbabilityPercent}% risk)`)
      .join("\n");

    return (
      `🌧️ **Live Weather & Precipitation:**\n` +
      `Highest rainfall at **${topRain.name}** (${topRainStatus.icon} ${topRain.telemetry.rainfallLast24hMm} mm past 24h).\n\n` +
      `**Active Rain Corridors:**\n${rainList}`
    );
  }

  if (q.includes("evacuate") || q.includes("evacuation") || q.includes("danger") || q.includes("urgent") || q.includes("critical") || q.includes("highest")) {
    const criticalSites = rankedSites.filter((s) => s.risk.failureProbabilityPercent >= 60);
    const top = rankedSites[0];

    if (criticalSites.length === 0) {
      return (
        `🛡️ **Evacuation Advice:** Currently no sites exceed 60% threshold. ` +
        `Highest watch area is **${top.name}** at ${top.risk.failureProbabilityPercent}% risk.`
      );
    }

    const critList = criticalSites
      .map((s) => {
        const d = SAFE_ZONES[s.siteId]?.[0]?.name || "Relief Center";
        return `• **${s.name} (${s.risk.failureProbabilityPercent}% risk):** Evacuate toward ${d}. Road ${s.telemetry.roadStatus.toUpperCase()}.`;
      })
      .join("\n");

    return (
      `🚨 **EMERGENCY EVACUATION PRIORITY:**\n${critList}\n\n` +
      `⚠️ Click "3D Terrain & All Escape Routes" on the map to view turn-by-turn driving paths.`
    );
  }

  if (q.includes("road") || q.includes("highway") || q.includes("blocked") || q.includes("route") || q.includes("detour") || q.includes("traffic")) {
    const blocked = rankedSites.filter((s) => s.telemetry.roadStatus === "blocked");
    if (blocked.length === 0) {
      return `🛣️ **Highway Status:** All primary arterial corridors (NH-10, NH-29, Shillong Expressway) are currently OPEN.`;
    }

    const list = blocked
      .map((s) => `• **${s.name} (${s.corridor}):** 🛑 ROAD BLOCKED (${s.risk.failureProbabilityPercent}% risk). Check Road Rerouting panel for detours.`)
      .join("\n");

    return `🚧 **Road Blockage Alert:**\n${list}`;
  }

  if (q.includes("hi") || q.includes("hello") || q.includes("help") || q.includes("who") || q.includes("what")) {
    return (
      `👋 **AI Disaster Copilot Active.**\n` +
      `I monitor live weather, satellite elevation, and landslide risk across North East India.\n\n` +
      `**Try asking:**\n` +
      `• *"Which sites need urgent evacuation?"*\n` +
      `• *"Is Sonapur safe right now?"*\n` +
      `• *"Where is heavy rain falling?"*`
    );
  }

  const topSites = rankedSites.slice(0, 3);
  const siteList = topSites
    .map((s) => `• **${s.name}** — ${s.risk.failureProbabilityPercent}% failure probability`)
    .join("\n");

  return (
    `🤖 **Regional Analysis:**\n` +
    `Current top risk zones:\n${siteList}\n\n` +
    `Ask about specific locations, rainfall, road blockages, or evacuation routes!`
  );
}

export default function CopilotCenter({ rankedSites }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "broadcast"
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      text: "Ask me things like: \"Which locations require immediate evacuation?\" or \"Is Sonapur safe?\"",
    },
  ]);
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastLanguages, setBroadcastLanguages] = useState(["English", "Khasi"]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading, isOpen, activeTab]);

  async function handleSendQuestion(event) {
    event.preventDefault();
    const trimmedQuestion = questionInput.trim();
    if (!trimmedQuestion) return;

    setQuestionInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: trimmedQuestion }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory((prev) => [...prev, { role: "assistant", text: data.answer }]);
        setIsLoading(false);
        return;
      }
    } catch {
      // Local fallback if backend offline
    }

    setTimeout(() => {
      const answer = generateCopilotAnswer(trimmedQuestion, rankedSites);
      setChatHistory((prev) => [...prev, { role: "assistant", text: answer }]);
      setIsLoading(false);
    }, 250);
  }

  function toggleBroadcastLanguage(language) {
    setBroadcastLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Action Button (Closed State) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full border border-telemetry/50 bg-dark-slate/95 px-4 py-3 text-slate-100 shadow-2xl shadow-cyan-500/20 backdrop-blur-md hover:border-telemetry"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-risk-low/20 text-ink ring-1 ring-ink/50">
              <Bot size={18} />
              <span className="absolute inset-0 " />
            </span>
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-50">
                <span>AI Copilot</span>
                <Sparkles size={11} className="text-ink animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400">Ask safety &amp; weather</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Popover Drawer (Open State) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex h-[500px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-dark-slate/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header with Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-card/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-risk-low/20 text-ink">
                  <Bot size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">AI Disaster Center</h3>
                  <p className="text-[9.5px] text-slate-400 font-mono">LIVE ASSISTANT &amp; BROADCAST</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 transition-colors"
                >
                  <Minimize2 size={15} />
                </button>
              </div>
            </div>

            {/* Tab Nav */}
            <div className="flex border-b border-slate-800 bg-onyx/40 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-2 border-risk-low text-ink bg-risk-low/5"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageCircle size={13} />
                Copilot Chat
              </button>
              <button
                onClick={() => setActiveTab("broadcast")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
                  activeTab === "broadcast"
                    ? "border-2 border-risk-low text-ink bg-risk-low/5"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Languages size={13} />
                Multilingual Alerts
              </button>
            </div>

            {/* Tab 1: AI Chat */}
            {activeTab === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden p-3">
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 text-[11px]">
                  {chatHistory.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          message.role === "assistant"
                            ? "bg-risk-low/15 text-ink ring-1 ring-ink/30"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {message.role === "assistant" ? <Bot size={11} /> : <User size={11} />}
                      </span>
                      <div
                        className={`rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                          message.role === "assistant"
                            ? "bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-sm"
                            : "bg-risk-moderate/20 text-ink border border-risk-moderate/30"
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                      <Bot size={12} className="animate-spin text-ink" />
                      Analyzing weather &amp; spatial risks...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendQuestion} className="mt-2 flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    placeholder="Ask about Sonapur, evacuation, rainfall..."
                    className="flex-1 rounded-lg border border-slate-700 bg-onyx px-3 py-2 text-[11px] text-slate-200 placeholder:text-slate-500 focus:border-telemetry focus:outline-none focus:ring-1 focus:ring-telemetry/40"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg bg-risk-moderate px-3 py-2 text-sm font-bold text-ink hover:bg-risk-moderate/20 transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Multilingual Broadcast */}
            {activeTab === "broadcast" && (
              <div className="flex flex-1 flex-col overflow-hidden p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] uppercase tracking-wide text-slate-400 font-semibold">
                    Target Broadcast Languages
                  </span>
                  <ShieldAlert size={13} className="text-amber-400" />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.keys(MOCK_ALERT_PHRASES).map((language) => (
                    <button
                      key={language}
                      onClick={() => toggleBroadcastLanguage(language)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                        broadcastLanguages.includes(language)
                          ? "border-risk-low bg-risk-low/15 text-ink font-semibold"
                          : "border-slate-700 text-slate-500 hover:border-slate-500"
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {broadcastLanguages.map((language) => (
                    <div
                      key={language}
                      className="rounded-lg border border-slate-800 bg-onyx/60 p-2.5 text-[11px] text-slate-300"
                    >
                      <span className="font-semibold text-ink">{language}: </span>
                      {MOCK_ALERT_PHRASES[language] ?? MOCK_ALERT_PHRASES.English}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
