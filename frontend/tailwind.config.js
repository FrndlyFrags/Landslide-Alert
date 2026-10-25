// -----------------------------------------------------------------------
// tailwind.config.js
// WHAT: Configures Tailwind CSS and defines our custom color palette so
//       every component can use names like "bg-onyx" or "text-safe"
//       instead of remembering hex codes.
// WHY:  Keeps the "Tactical Operations Command Center" color scheme
//       consistent across the entire dashboard.
// -----------------------------------------------------------------------
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        onyx: "#030712", // Deepest background
        "dark-slate": "#0F172A", // Section backgrounds
        "slate-card": "#1E293B", // Card backgrounds
        safe: "#10B981", // Neon Emerald - stable / safe status
        watch: "#F59E0B", // Amber Gold - moderate watch status
        critical: "#EF4444", // Crimson Red - critical / high risk status
        telemetry: "#06B6D4", // Electric Cyan - live data / AI streams
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.35)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.35)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.35)",
        "glow-red": "0 0 24px rgba(239, 68, 68, 0.45)",
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: 0.6 },
          "100%": { transform: "scale(2.4)", opacity: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "scan-line": "scan-line 3s ease-in-out infinite",
        "ping-slow": "ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
