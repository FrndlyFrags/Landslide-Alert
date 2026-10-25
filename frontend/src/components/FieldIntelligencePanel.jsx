// -----------------------------------------------------------------------
// FieldIntelligencePanel.jsx
// -----------------------------------------------------------------------
// WHAT: Interactive Field Photo Report modal & component.
//       Lets citizens or field officers upload slope crack photos for
//       simulated Computer Vision analysis (bounding box, width, severity).
// -----------------------------------------------------------------------
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ScanSearch, Wifi, WifiOff, Ruler, ShieldAlert, X } from "lucide-react";

function simulateCrackAnalysis() {
  const boundingBox = {
    x: Math.round(15 + Math.random() * 40),
    y: Math.round(20 + Math.random() * 40),
    width: Math.round(20 + Math.random() * 25),
    height: Math.round(10 + Math.random() * 20),
  };
  const crackWidthCm = Math.round((1.5 + Math.random() * 16.5) * 10) / 10;

  let severity = "minor";
  let multiplier = 1.05;
  if (crackWidthCm >= 10) {
    severity = "severe";
    multiplier = 1.4;
  } else if (crackWidthCm >= 5) {
    severity = "moderate";
    multiplier = 1.2;
  }

  return { boundingBox, crackWidthCm, severity, multiplier };
}

function severityColor(severity) {
  if (severity === "severe") return "text-red-400 border-red-500/50 bg-red-500/10";
  if (severity === "moderate") return "text-amber-400 border-amber-500/50 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      <Icon size={13} className="text-ink/70" />
      {children}
    </h2>
  );
}

export function FieldPhotoModal({ isOpen, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  if (!isOpen) return null;

  function handlePhotoSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
    setIsAnalyzing(true);

    setTimeout(() => {
      setAnalysisResult(simulateCrackAnalysis());
      setIsAnalyzing(false);
    }, 1200);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-dark-slate p-6 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-risk-low/15 text-ink ring-1 ring-ink/40">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Field Photo Report</h2>
              <p className="text-xs text-slate-400">AI Computer Vision Hillside Analysis</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-card/40 px-3 py-2 mb-4">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WifiOff size={13} className="text-amber-400 animate-pulse" />
              ) : (
                <Wifi size={13} className="text-emerald-400" />
              )}
              <span className="text-[11px] text-slate-300">
                {isOffline ? "Offline — queued in IndexedDB" : "Online — synced"}
              </span>
            </div>
            <button
              onClick={() => setIsOffline((current) => !current)}
              className="text-sm text-slate-500 underline hover:text-ink"
            >
              Toggle
            </button>
          </div>

          <section>
            <p className="text-[11px] text-slate-400 mb-2">
              Upload a photo of a slope crack or road blockage for AI analysis.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-card/30 p-6 text-center transition-colors hover:border-risk-low/60 hover:bg-risk-low/5">
              <Camera size={20} className="text-ink" />
              <span className="text-xs font-medium text-slate-300">Click to choose a photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
            </label>
          </section>

          {previewUrl && (
            <div className="mt-4 border-t border-slate-800 pt-3">
              <SectionHeading icon={ScanSearch}>Computer Vision Analysis</SectionHeading>
              <div className="relative mt-2 max-h-48 overflow-hidden rounded-lg border border-slate-800">
                <img src={previewUrl} alt="Uploaded crack" className="w-full object-cover" />
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-red-500"
                    style={{
                      left: `${analysisResult.boundingBox.x}%`,
                      top: `${analysisResult.boundingBox.y}%`,
                      width: `${analysisResult.boundingBox.width}%`,
                      height: `${analysisResult.boundingBox.height}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      crack
                    </span>
                  </motion.div>
                )}
              </div>

              {isAnalyzing && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink">
                  <ScanSearch size={12} />
                  Running crack detection model...
                </p>
              )}

              {analysisResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2.5 rounded-lg border p-3 ${severityColor(analysisResult.severity)}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Ruler size={12} /> Crack Width
                    </span>
                    <span className="font-mono font-semibold">{analysisResult.crackWidthCm} cm</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={12} /> Severity
                    </span>
                    <span className="font-mono font-semibold capitalize">{analysisResult.severity}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span>Risk Multiplier</span>
                    <span className="font-mono font-semibold">×{analysisResult.multiplier}</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FieldPhotoModal;
