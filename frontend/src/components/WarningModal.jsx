// -----------------------------------------------------------------------
// WarningModal.jsx
// WHAT: A pop-up confirmation dialog shown after the header's "Warning
//       blast" button is clicked. Confirms what was sent, to whom, and in
//       which languages.
// WHY: Sending a region-wide public warning is a serious action, so the
//      user needs clear confirmation of what actually happened.
// -----------------------------------------------------------------------
import { AnimatePresence, motion } from "framer-motion";
import { Siren, Users, X } from "lucide-react";

export default function WarningModal({ isOpen, onClose, siteName, languages }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm border border-line border-t-2 border-t-critical bg-panel p-5 shadow-panel"
            role="dialog"
            aria-label="Warning blast confirmation"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Siren size={15} className="text-critical" />
                <div>
                  <h3 className="text-[13px] font-semibold text-ink-strong">Warning blast sent</h3>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                    SMS · WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-ink-faint transition-colors hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
              A landslide warning has been broadcast for{" "}
              <span className="font-medium text-ink-strong">{siteName}</span> via SMS and WhatsApp.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {languages.map((language) => (
                <span
                  key={language}
                  className="border border-line px-2 py-0.5 text-[10px] text-ink-muted"
                >
                  {language}
                </span>
              ))}
            </div>

            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 font-mono text-[10px] text-ink-faint">
              <Users size={11} />
              Estimated recipients: ~1,200 residents
            </p>

            <button
              onClick={onClose}
              className="mt-4 w-full border border-line py-2 text-[11px] font-medium text-ink transition-colors hover:border-ink-faint"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
