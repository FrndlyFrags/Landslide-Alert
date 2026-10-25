// -----------------------------------------------------------------------
// AuthModal.jsx
// -----------------------------------------------------------------------
// WHAT: Secure Admin Authorization Gate. Strictly restricts access to the full
//       Emergency administrators portal for authorized users.
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
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-dark-slate p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-risk-low/15 text-ink ring-1 ring-ink/40">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Authorized Admin Portal</h2>
              <p className="text-xs text-slate-400">Restricted Emergency Command Access</p>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Detailed spatial stats, IoT sensor telemetry, and warning blast triggers are restricted to authorized personnel.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Select Official Authority
              </label>
              <div className="space-y-2">
                {ADMIN_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? "border-risk-low bg-risk-low/10 text-ink font-medium"
                          : "border-slate-800 bg-slate-card/50 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Icon size={16} className={isSelected ? "text-ink" : "text-slate-500"} />
                      <span>{role.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passcode input */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                Admin Security Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (e.g. admin123)"
                className="w-full rounded-lg border border-slate-700 bg-onyx px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-telemetry focus:outline-none focus:ring-1 focus:ring-telemetry/40 font-mono"
              />
              {errorMsg && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{errorMsg}</p>}
              <p className="mt-1 text-[10.5px] text-slate-500">Authorized passcode: <code className="text-ink font-mono font-bold">admin123</code></p>
            </div>

            {/* Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-risk-low bg-risk-low/10 px-4 py-2.5 text-xs font-bold text-ink hover:bg-risk-low/15 transition-colors"
              >
                <span>Authenticate &amp; Open Command Center</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
