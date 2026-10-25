// -----------------------------------------------------------------------
// WarningModal.jsx
// WHAT: A pop-up confirmation dialog shown after the header's "Trigger
//       Regional Warning Blast" button is clicked. Confirms what was
//       sent, to whom, and in which languages.
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-critical/40 bg-slate-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-critical/15 text-critical">
                  <Siren size={14} className="animate-live-pulse" />
                </span>
                <h3 className="text-sm font-semibold text-critical">Warning Blast Sent</h3>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                <X size={16} />
              </button>
            </div>

            <p className="mt-3 text-[12px] text-slate-300">
              A landslide warning has been broadcast for{" "}
              <span className="font-semibold text-slate-100">{siteName}</span> via SMS and WhatsApp.
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300"
                >
                  {language}
                </span>
              ))}
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Users size={11} />
              Estimated recipients: ~1,200 residents
            </p>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-md bg-slate-700 py-2 text-[11px] font-medium text-slate-100 transition-colors hover:bg-slate-600"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
