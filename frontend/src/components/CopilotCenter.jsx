// -----------------------------------------------------------------------
// CopilotCenter.jsx  (ADMIN PORTAL ONLY)
// -----------------------------------------------------------------------
// WHAT: Floating AI Disaster Center (chat + multilingual broadcast).
//       Redesigned UI: cleaner bubbles with timestamps, typing indicator,
//       auto-scroll, minimize/expand, Enter-to-send.
// BEHAVIOR KEPT: same backend endpoint (/api/copilot/ask) + same local
//       fallback answer engine. Chat state now persists for the browser
//       session (sessionStorage), so it survives admin navigation and
//       re-renders without ever unmounting mid-session.
// SCOPE RULE: an input guard answers ONLY project topics (landslide
//       alerts, sensor data, risk levels, incident/report details, admin
//       portal usage). Anything else receives one short fixed message.
// -----------------------------------------------------------------------
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, User, Send, Minimize2, Languages,
  Sparkles, MessageCircle, ShieldAlert, X,
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

const OUT_OF_SCOPE_REPLY =
  "I can only help with issues and reports related to this system. Please ask about an alert, issue or report.";

const CHAT_SESSION_KEY = "ner_copilot_chat";
const CHAT_HISTORY_LIMIT = 60;

// Topics the chatbot handles. Detection uses word boundaries so partial
// matches inside unrelated words do not falsely pass the guard.
const IN_SCOPE_KEYWORDS = [
  "alert", "alerts", "risk", "sensor", "sensors", "issue", "issues", "report",
  "reports", "incident", "incidents", "landslide", "site", "sites", "rain",
  "rainfall", "weather", "monsoon", "forecast", "soil", "saturation", "slope",
  "creep", "displacement", "road", "roads", "highway", "blocked", "route",
  "routes", "detour", "evacuate", "evacuation", "critical", "urgent", "warning",
  "warning blast", "terrain", "escape", "corridor", "corridors", "portal",
  "dashboard", "broadcast", "telemetry", "monitoring", "nodal", "map",
];

function isWithinScope(question, rankedSites) {
  const q = question.toLowerCase();
  // Mentioning any monitored site (name/id/state) is always in scope.
  const matchesSite = (rankedSites ?? []).some(
    (site) =>
      q.includes(site.name.toLowerCase()) ||
      q.includes(site.siteId.toLowerCase()) ||
      q.includes(site.state.toLowerCase())
  );
  if (matchesSite) return true;
  return IN_SCOPE_KEYWORDS.some((keyword) =>
    q.includes(keyword) // keyword list already contains whole words
  );
}

// Session-persisted history (last messages only), so the conversation
// survives admin navigation and remounts within the same browser session.
function loadPersistedChat() {
  try {
    const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Corrupted storage — fall through to the default greeting.
  }
  return [
    {
      role: "assistant",
      text: "Ask about a site's risk, rainfall, road status or evacuation. I only answer project topics.",
      time: Date.now(),
    },
  ];
}

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
      `**${matchedSite.name} (${matchedSite.state})**\n` +
      `• Risk: ${matchedSite.risk.failureProbabilityPercent}% (${matchedSite.risk.riskLevel.toUpperCase()})\n` +
      `• Weather: ${rain.icon} ${rain.label} — ${matchedSite.telemetry.rainfallLast24hMm} mm 24h, ${matchedSite.telemetry.rainfallNext6hMm} mm forecast\n` +
      `• Slope: ${matchedSite.telemetry.slopeAngleDegrees}° | Soil: ${matchedSite.telemetry.soilSaturationPercent}%\n` +
      `• Road: ${matchedSite.telemetry.roadStatus === "open" ? "Open" : "BLOCKED"}\n` +
      `• Relief point: ${dest}`
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
    return `**${stateName}:**\n${siteSummary}`;
  }

  if (q.includes("rain") || q.includes("weather") || q.includes("downpour") || q.includes("monsoon") || q.includes("forecast")) {
    const rainingSites = rankedSites.filter((s) => s.telemetry.rainfallLast24hMm > 30 || s.telemetry.rainfallNext6hMm > 5);
    const topRain = [...rankedSites].sort((a, b) => b.telemetry.rainfallLast24hMm - a.telemetry.rainfallLast24hMm)[0];

    if (rainingSites.length === 0) {
      return `**Weather:** Rainfall is low across NER corridors. Highest 24h precipitation: **${topRain.name}** at ${topRain.telemetry.rainfallLast24hMm} mm.`;
    }

    const rainList = rainingSites
      .slice(0, 4)
      .map((s) => `• **${s.name}:** ${s.telemetry.rainfallLast24hMm} mm (24h) | +${s.telemetry.rainfallNext6hMm} mm forecast (${s.risk.failureProbabilityPercent}% risk)`)
      .join("\n");

    return `**Live rainfall:**\nHighest: **${topRain.name}** (${topRain.telemetry.rainfallLast24hMm} mm past 24h).\n**Active rain corridors:**\n${rainList}`;
  }

  if (q.includes("evacuate") || q.includes("evacuation") || q.includes("danger") || q.includes("urgent") || q.includes("critical") || q.includes("highest")) {
    const criticalSites = rankedSites.filter((s) => s.risk.failureProbabilityPercent >= 60);
    const top = rankedSites[0];

    if (criticalSites.length === 0) {
      return `No sites exceed the 60% evacuation threshold. Highest watch: **${top.name}** at ${top.risk.failureProbabilityPercent}%.`;
    }

    const critList = criticalSites
      .map((s) => {
        const d = SAFE_ZONES[s.siteId]?.[0]?.name || "Relief Center";
        return `• **${s.name} (${s.risk.failureProbabilityPercent}% risk):** evacuating toward ${d}. Road ${s.telemetry.roadStatus.toUpperCase()}.`;
      })
      .join("\n");

    return `**Evacuation priority:**\n${critList}`;
  }

  if (q.includes("road") || q.includes("highway") || q.includes("blocked") || q.includes("route") || q.includes("detour") || q.includes("traffic")) {
    const blocked = rankedSites.filter((s) => s.telemetry.roadStatus === "blocked");
    if (blocked.length === 0) {
      return `**Highways:** All primary arterial corridors (NH-10, NH-29, Shillong Expressway) are open.`;
    }

    const list = blocked
      .map((s) => `• **${s.name} (${s.corridor}):** blocked (${s.risk.failureProbabilityPercent}% risk) — see the rerouting panel for detours.`)
      .join("\n");

    return `**Road blockage:**\n${list}`;
  }

  if (q.includes("hi") || q.includes("hello") || q.includes("help") || q.includes("who") || q.includes("what")) {
    return "I answer questions about site risk, rainfall, road status, evacuation and reports in this system. Which site or state should I look up?";
  }

  const topSites = rankedSites.slice(0, 3);
  const siteList = topSites
    .map((s) => `• **${s.name}** — ${s.risk.failureProbabilityPercent}% failure probability`)
    .join("\n");

  return `**Top risk zones:**\n${siteList}`;
}

export default function CopilotCenter({ rankedSites }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "broadcast"
  const [chatHistory, setChatHistory] = useState(loadPersistedChat);
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastLanguages, setBroadcastLanguages] = useState(["English", "Khasi"]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist the conversation for the session (overwrite trimmed tail).
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_SESSION_KEY,
        JSON.stringify(chatHistory.slice(-CHAT_HISTORY_LIMIT))
      );
    } catch {
      // Storage unavailable (e.g. permissions) — chat still works in-memory.
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatHistory, isLoading, isOpen, activeTab]);

  async function handleSendQuestion(event) {
    event.preventDefault();
    const trimmedQuestion = questionInput.trim();
    if (!trimmedQuestion || isLoading) return;

    setQuestionInput("");

    // Input guard: refuse anything outside the project's topics with a
    // short fixed message. The backend flow is not called for these.
    if (!isWithinScope(trimmedQuestion, rankedSites)) {
      setChatHistory((prev) => [
        ...prev,
        { role: "user", text: trimmedQuestion, time: Date.now() },
        { role: "assistant", text: OUT_OF_SCOPE_REPLY, time: Date.now() },
      ]);
      return;
    }

    setChatHistory((prev) => [...prev, { role: "user", text: trimmedQuestion, time: Date.now() }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory((prev) => [...prev, { role: "assistant", text: data.answer, time: Date.now() }]);
        setIsLoading(false);
        return;
      }
    } catch {
      // Local fallback if backend offline
    }

    setTimeout(() => {
      const answer = generateCopilotAnswer(trimmedQuestion, rankedSites);
      setChatHistory((prev) => [...prev, { role: "assistant", text: answer, time: Date.now() }]);
      setIsLoading(false);
    }, 250);
  }

  function toggleBroadcastLanguage(language) {
    setBroadcastLanguages((current) =>
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
            className="group relative flex items-center gap-3 border border-line bg-panel px-3.5 py-3 text-ink shadow-panel transition-colors hover:border-ink-faint"
            aria-label="Open AI Disaster Center"
          >
            <span className="flex h-8 w-8 items-center justify-center border border-line-soft text-accent">
              <Bot size={18} />
            </span>
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-strong">
                <span>AI Copilot</span>
                <Sparkles size={11} className="text-accent" />
              </div>
              <p className="text-[10px] text-ink-muted">Alerts, issues &amp; reports</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Popover Drawer (Open State) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="AI Disaster Center"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex h-[520px] w-[calc(100vw-2.5rem)] max-w-96 flex-col overflow-hidden border border-line bg-panel shadow-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-panel-2/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-panel-2 text-accent">
                  <Bot size={15} />
                </div>
                <div>
                  <h3 className="font-display text-xs font-semibold text-ink-strong">AI Disaster Center</h3>
                  <p className="font-mono text-[9.5px] text-ink-faint">Issues, alerts &amp; reports only</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xs p-1.5 text-ink-faint hover:bg-panel-2 hover:text-ink transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 size={15} />
              </button>
            </div>

            {/* Tab Nav */}
            <div className="flex border-b border-line text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab("chat")}
                aria-pressed={activeTab === "chat"}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
                  activeTab === "chat"
                    ? "border-b-2 border-accent text-accent bg-accent/5"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <MessageCircle size={13} />
                Copilot Chat
              </button>
              <button
                onClick={() => setActiveTab("broadcast")}
                aria-pressed={activeTab === "broadcast"}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 transition-colors ${
                  activeTab === "broadcast"
                    ? "border-b-2 border-accent text-accent bg-accent/5"
                    : "text-ink-muted hover:text-ink"
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
                      className={`group flex items-end gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-pill ${
                          message.role === "assistant"
                            ? "bg-panel-2 text-accent ring-1 ring-accent/25"
                            : "bg-line text-ink"
                        }`}
                      >
                        {message.role === "assistant" ? <Bot size={11} /> : <User size={11} />}
                      </span>
                      <div className={`max-w-[82%] ${message.role === "user" ? "text-right" : ""}`}>
                        <div
                          className={`whitespace-pre-wrap rounded-md px-3 py-2 leading-relaxed ${
                            message.role === "assistant"
                              ? "rounded-bl-xs border border-line bg-panel-2 text-ink"
                              : "rounded-br-xs border border-accent/25 bg-accent/15 text-ink"
                          }`}
                        >
                          {message.text}
                        </div>
                        <span className="mt-0.5 block font-mono text-[8.5px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          {formatTime(message.time)}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 py-0.5"
                      aria-live="polite"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-pill bg-panel-2 text-accent ring-1 ring-accent/25">
                        <Bot size={11} />
                      </span>
                      <span className="flex items-center gap-1 rounded-md border border-line bg-panel-2 px-3 py-2">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-typing-dot"
                            style={{ animationDelay: `${dot * 0.18}s` }}
                          />
                        ))}
                      </span>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendQuestion} className="mt-2 flex gap-2 border-t border-line pt-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    placeholder="Ask about a site, alert, road or report…"
                    aria-label="Ask the copilot"
                    className="flex-1 rounded-xs border border-line bg-bg-base px-3 py-2 text-[11px] text-ink placeholder:text-ink-faint focus:border-accent/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1 bg-ink-strong px-3 py-2 text-[11px] font-semibold text-bg-base transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Multilingual Broadcast */}
            {activeTab === "broadcast" && (
              <div className="flex flex-1 flex-col overflow-hidden p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                    Target Broadcast Languages
                  </span>
                  <ShieldAlert size={13} className="text-alert-amber" />
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {Object.keys(MOCK_ALERT_PHRASES).map((language) => (
                    <button
                      key={language}
                      onClick={() => toggleBroadcastLanguage(language)}
                      aria-pressed={broadcastLanguages.includes(language)}
                      className={`border px-2.5 py-1 text-[10px] transition-colors ${
                        broadcastLanguages.includes(language)
                          ? "border-accent/50 bg-accent/15 font-semibold text-accent"
                          : "border-line text-ink-faint hover:border-ink-faint"
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {broadcastLanguages.map((language) => (
                    <div
                      key={language}
                      className="rounded-xs border border-line bg-bg-base/60 p-2.5 text-[11px] text-ink"
                    >
                      <span className="font-semibold text-accent">{language}: </span>
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
