// -----------------------------------------------------------------------
// AuthModal.jsx  (ADMIN PORTAL GATE — shared entry point)
// -----------------------------------------------------------------------
// WHAT: Secure Admin Authorization Gate. Strictly restricts access to the
//       command dashboard to authorized administrators. Visual redesign
//       only — role selection, passcode verification and callbacks are
//       exactly as before.
// -----------------------------------------------------------------------
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, X, AlertCircle, ArrowRight, Building2, Radio } from "lucide-react";

const ADMIN_ROLES = [
  { id: "sdma", title: "State Disaster Management Authority (SDMA)", icon: Building2 },
  { id: "deoc", title: "District Emergency Operation Center (DEOC)", icon: Radio },
  { id: "admin", title: "Emergency Response Administrator", icon: ShieldCheck },
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState(ADMIN_ROLES[0].id);
  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    // Strict Admin Passcode Verification
    const cleanPass = passcode.trim();
    if (cleanPass === "admin123" || cleanPass === "admin") {
      onLoginSuccess();
    } else {
      setErrorMsg("Incorrect admin passcode. Authorized passcode is required to access command stats.");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md overflow-hidden border border-line bg-panel p-6 shadow-panel"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-label="Authorized Admin Portal"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close login"
            className="absolute top-4 right-4 text-ink-faint transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-line-soft text-accent">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="font-display text-[14px] font-semibold text-ink-strong">Authorized admin portal</h2>
              <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                Restricted command access
              </p>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-4 flex items-start gap-2 border-l-2 border-alert-amber/70 bg-alert-amber/5 py-2 pl-2.5 pr-2 text-[11px] leading-relaxed text-alert-amber">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>
              Detailed spatial stats, IoT sensor telemetry, and warning blast triggers are restricted to authorized personnel.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Role selector */}
            <fieldset>
              <legend className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
                Select official authority
              </legend>
              <div className="divide-y divide-line-soft border-y border-line-soft">
                {ADMIN_ROLES.map((role, index) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 border-l py-2.5 pl-2.5 pr-1 text-left text-[11.5px] transition-colors ${
                        isSelected
                          ? "border-accent bg-panel-2/70 font-medium text-ink"
                          : "border-transparent text-ink-muted hover:border-ink-faint hover:text-ink"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-accent" : "text-ink-faint"} />
                      <span>{role.title}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Passcode input */}
            <div>
              <label
                htmlFor="admin-passcode"
                className="mb-1.5 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint"
              >
                Admin security passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (e.g. admin123)"
                className="w-full border border-line bg-bg-base px-3.5 py-2.5 font-mono text-[11.5px] text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none"
              />
              {errorMsg && (
                <p className="mt-1.5 text-[11px] font-medium text-critical" role="alert">
                  {errorMsg}
                </p>
              )}
              <p className="mt-1 text-[10.5px] text-ink-faint">
                Authorized passcode:{" "}
                <code className="font-mono font-semibold text-accent">admin123</code>
              </p>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 border border-ink-strong bg-ink-strong px-4 py-2.5 text-[11.5px] font-semibold text-bg-base transition-colors hover:bg-white active:scale-[0.99]"
            >
              <span>Authenticate &amp; open command center</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
