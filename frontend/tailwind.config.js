// -----------------------------------------------------------------------
// tailwind.config.js
// WHAT: Maps every design token from src/theme/tokens.css into Tailwind
//       utilities so the landing page and admin portal share one palette.
// NOTE: Console theme — graphite ground (oklch dark blue-grey), amber
//       accent for people/operators, cool-blue for instruments/telemetry.
// -----------------------------------------------------------------------
/** @type {import('tailwindcss').Config} */
const alpha = (token) => `rgb(var(${token}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        current: "currentColor",

        // Paper (graphite ground, three steps)
        "bg":       alpha("--c-bg-rgb"),
        "surface":  alpha("--c-surface-rgb"),
        "surface-2":alpha("--c-surface-2-rgb"),

        // Rules & edges
        "line":     alpha("--c-line-rgb"),
        "line-soft":alpha("--c-line-soft-rgb"),

        // Ink
        "heading":  "var(--c-heading)",
        "text":     "var(--c-text)",
        "muted":    "var(--c-muted)",
        "faint":    "var(--c-faint)",

        // Accent — amber (person / operator signal)
        "accent":      alpha("--c-accent-rgb"),
        "accent-deep": alpha("--c-accent-deep-rgb"),

        // Cool — instrument / telemetry signal
        "cool":      alpha("--c-cool-rgb"),
        "cool-soft": "var(--c-cool-soft)",

        // Risk & alert semantics (domain-stable colours)
        "ok":          alpha("--c-ok-rgb"),
        "ok-soft":     "var(--c-ok-soft)",
        "critical":    alpha("--c-critical-rgb"),
        "critical-soft":"var(--c-critical-soft)",
        "alert-amber": alpha("--c-alert-amber-rgb"),
        "alert-amber-soft": "var(--c-alert-amber-soft)",

        // Legacy aliases kept for backward compatibility during transition
        "panel":    alpha("--c-surface-rgb"),
        "panel-2":  alpha("--c-surface-2-rgb"),
        "onyx":     alpha("--c-bg-rgb"),
        "dark-slate":alpha("--c-surface-rgb"),
        "telemetry":"var(--c-cool)",
      },
      fontFamily: {
        sans:   ["Host Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        display:["Host Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:   ["Atkinson Hyperlegible Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs:   "var(--r-xs)",
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        xl:   "var(--r-xl)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.28)",
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { opacity: 0.25 },
          "30%": { opacity: 1 },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "typing-dot":  "typing-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
