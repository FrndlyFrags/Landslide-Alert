// -----------------------------------------------------------------------
// tailwind.config.js
// WHAT: Configures Tailwind CSS and maps every UI theme token defined in
//       src/theme/tokens.css into Tailwind utilities (bg-ink, text-heading,
//       bg-panel ...) so the landing page and the admin portal share one
//       palette without hard-coded hex values.
// WHY:  Colors use `rgb(var(--token-rgb) / <alpha-value>)` so opacity
//       modifiers like bg-telemetry/10 keep working.
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

        // Base surfaces (alpha-capable triplets)
        "bg-base":   alpha("--c-bg-rgb"),
        "panel":     alpha("--c-surface-rgb"),
        "panel-2":   alpha("--c-surface-2-rgb"),
        "line":      alpha("--c-line-rgb"),
        "line-soft": alpha("--c-line-soft-rgb"),

        // Text
        "ink":        "var(--c-text)",
        "ink-strong": "var(--c-heading)",
        "ink-muted":  "var(--c-muted)",
        "ink-faint":  "var(--c-faint)",

        // Accent
        "accent":      alpha("--c-accent-rgb"),
        "accent-deep": alpha("--c-accent-deep-rgb"),
        // Legacy aliases — existing dashboard components keep their class
        // names while consuming the new token palette underneath.
        telemetry:     alpha("--c-accent-rgb"),
        onyx:          alpha("--c-bg-rgb"),
        "dark-slate":  alpha("--c-surface-rgb"),
        "slate-card":  alpha("--c-surface-2-rgb"),

        // Alerts & risk only
        "alert-amber": alpha("--c-amber-rgb"),
        "alert-red":   alpha("--c-red-rgb"),
        watch:         alpha("--c-amber-rgb"),
        critical:      alpha("--c-red-rgb"),
        safe:          alpha("--c-risk-safe-rgb"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "var(--r-xs)",
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        "glow-cyan":    "none",
        "glow-emerald": "none",
        "glow-amber":   "none",
        "glow-red":     "none",
        "panel":        "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.32)",
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
        "reveal-up": {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { opacity: 0.25 },
          "30%": { opacity: 1 },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 4s linear infinite",
        "scan-line": "scan-line 3s ease-in-out infinite",
        "ping-slow": "ping-slow 2.4s cubic-bezier(0,0,0.2,1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "reveal-up": "reveal-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
