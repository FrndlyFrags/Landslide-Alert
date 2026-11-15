// -----------------------------------------------------------------------
// FieldIntelligencePanel.jsx
// -----------------------------------------------------------------------
// WHAT: Interactive Field Photo Report modal & component.
//       Lets citizens or field officers upload slope crack photos for
//       simulated Computer Vision analysis (bounding box, width, severity).
// SCOPE: Presentational — same behaviour, new graphite surfaces.
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
  if (severity === "severe") return "text-critical border-critical/40 bg-critical/5";
  if (severity === "moderate") return "text-alert-amber border-alert-amber/40 bg-alert-amber/5";
  return "text-ok border-ok/40 bg-ok/5";
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted">
      <Icon size={12} className="text-faint" />
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md overflow-hidden border border-line bg-surface p-6 rounded-lg"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-faint transition-colors hover:text-text"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center border border-line-soft text-accent">
              <Camera size={16} />
            </div>
            <div>
              <h2 className="font-display text-[13.5px] font-medium leading-tight text-heading">Field photo report</h2>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Vision-assisted hillside check
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between border border-line bg-surface-2/40 px-3 py-2 rounded-sm">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WifiOff size={12} className="text-alert-amber" />
              ) : (
                <Wifi size={12} className="text-ok" />
              )}
              <span className="text-[11px] text-muted">
                {isOffline ? "Offline — queued in IndexedDB" : "Online — synced"}
              </span>
            </div>
            <button
              onClick={() => setIsOffline((current) => !current)}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint underline underline-offset-2 transition-colors hover:text-accent"
            >
              Toggle
            </button>
          </div>

          <section>
            <p className="mb-2 text-[11px] leading-relaxed text-muted">
              Upload a photo of a slope crack or road blockage for analysis.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-line bg-surface-2/20 p-6 text-center transition-colors hover:border-accent/60 hover:bg-accent/5 rounded-sm">
              <Camera size={18} className="text-accent" />
              <span className="text-[11.5px] text-text">Click to choose a photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} />
            </label>
          </section>

          {previewUrl && (
            <div className="mt-4 border-t border-line pt-3">
              <SectionHeading icon={ScanSearch}>Computer vision analysis</SectionHeading>
              <div className="relative mt-2 max-h-48 overflow-hidden border border-line rounded-sm">
                <img src={previewUrl} alt="Uploaded crack" className="w-full object-cover" />
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute border-2 border-critical"
                    style={{
                      left: `${analysisResult.boundingBox.x}%`,
                      top: `${analysisResult.boundingBox.y}%`,
                      width: `${analysisResult.boundingBox.width}%`,
                      height: `${analysisResult.boundingBox.height}%`,
                    }}
                  >
                    <span className="absolute -top-5 left-0 bg-critical px-1.5 py-0.5 font-mono text-[8.5px] font-medium uppercase tracking-[0.1em] text-bg">
                      crack
                    </span>
                  </motion.div>
                )}
              </div>

              {isAnalyzing && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-accent animate-live-pulse">
                  <ScanSearch size={12} />
                  Running crack detection model...
                </p>
              )}

              {analysisResult && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2.5 border border-l-2 p-3 ${severityColor(analysisResult.severity)}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Ruler size={12} /> Crack Width
                    </span>
                    <span className="font-mono font-medium tabular-nums">{analysisResult.crackWidthCm} cm</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={12} /> Severity
                    </span>
                    <span className="font-mono font-medium capitalize">{analysisResult.severity}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span>Risk Multiplier</span>
                    <span className="font-mono font-medium tabular-nums">×{analysisResult.multiplier}</span>
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
