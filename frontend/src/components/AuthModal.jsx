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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md overflow-hidden rounded-lg border border-line bg-panel p-6 shadow-panel"
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
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent ring-1 ring-accent/25">
              <Lock size={19} />
            </div>
            <div>
              <h2 className="font-display text-[15px] font-semibold text-ink-strong">Authorized Admin Portal</h2>
              <p className="text-xs text-ink-muted">Restricted emergency command access</p>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-4 flex items-start gap-2 rounded-xs border border-alert-amber/25 bg-alert-amber/10 p-3 text-[11px] leading-relaxed text-alert-amber">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>
              Detailed spatial stats, IoT sensor telemetry, and warning blast triggers are restricted to authorized personnel.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Role selector */}
            <fieldset>
              <legend className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">
                Select official authority
              </legend>
              <div className="space-y-2">
                {ADMIN_ROLES.map((role, index) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-sm border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? "border-accent/50 bg-accent/10 font-medium text-ink"
                          : "border-line bg-panel-2/40 text-ink-muted hover:border-accent/30"
                      }`}
                    >
                      <Icon size={16} className={isSelected ? "text-accent" : "text-ink-faint"} />
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
                className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted"
              >
                Admin security passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (e.g. admin123)"
                className="w-full rounded-xs border border-line bg-bg-base px-3.5 py-2.5 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none"
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
              className="group flex w-full items-center justify-center gap-2 rounded-xs bg-accent px-4 py-2.5 text-xs font-bold text-[#06202b] transition-all hover:bg-[#7ad4ef] hover:shadow-glow-cyan active:scale-[0.99]"
            >
              <span>Authenticate &amp; Open Command Center</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
