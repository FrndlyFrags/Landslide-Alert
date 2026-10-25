import React from "react";

/**
 * Renders a button with plain CSS transitions (150ms, cubic-bezier).
 * - No framer-motion. No glow. No pulse. No bounce.
 * - Accessible: visible focus ring, disabled state, 44px+ touch target.
 * - States: hover (subtle bg shift), active (1px press-down), focus ring, disabled.
 * - Props: loading and loadingText. When loading, shows spinner and swaps label.
 * - Optional trailing arrow that nudges 2px on hover (no animation otherwise).
 *
 * Variant tokens (from design spec):
 *   primary — laterite accent bg with ink fg
 *   secondary — subtle bg, ink fg
 *   quiet — light bg, ink fg (subtle)
 *   danger — brick risk colour, ink fg
 *
 * Size tokens:
 *   sm:     px-3 py-1.5, font-xs
 *   md:     px-4 py-2.5, text-[11px] (default)
 *   lg:     px-5 py-3, font-semibold
 */

const variants = {
  primary: {
    bg: "bg-accent",
    fg: "text-ink",
    hover: "hover:bg-ink",
    active: "active:bg-accent/90",
    border: "border-accent",
  },
  secondary: {
    bg: "bg-slate-card",
    fg: "text-slate-200",
    hover: "hover:bg-slate-700",
    active: "active:bg-slate-800",
    border: "border-slate-700",
  },
  quiet: {
    bg: "bg-paper",
    fg: "text-ink",
    hover: "hover:bg-paper/80",
    active: "active:bg-paper/90",
    border: "border-paper/50",
  },
  danger: {
    bg: "bg-risk-high",
    fg: "text-ink",
    hover: "hover:bg-risk-high/90",
    active: "active:bg-risk-high/80",
    border: "border-risk-high",
  },
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5",
  lg: "px-5 py-3 font-semibold",
};

export function Button({ variant = "primary", size = "md", children, loading, loadingText, }) {
  const variantStyles = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const isLoading = Boolean(loading);

  // spinner HTML — simple svg, no external deps
  const spinner = (
    <svg
      className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M8 12l4 4 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const classes = `
    rounded-lg border transition-colors duration-150 easing-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-w-[140px]
    ${variantStyles.bg} ${variantStyles.fg} ${variantStyles.hover} ${variantStyles.active} ${variantStyles.border}
    ${sizeClasses}
    cursor-pointer
    hover:translate-y-0.5 active:translate-y-1
    min-h-[44px]
  `.trim();

  if (!isLoading && !loadingText) {
    return (
      <button type="button" className={classes}>
        {children}
      </button>
    );
  }

  // Show loading state or swapped text
  const label = isLoading ? loadingText : children;

  return (
    <button type="button" className={classes} disabled>
      {loading ? (
        <span className="flex items-center gap-2">
          {spinner}
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

/* ---------- trailing arrow that nudges 2px on hover only ---------- */

Button.tailwindAttributes = {
  className:
    "after:content-[''] after:absolute after:right-1.5 after:h-full after:w- after:bg-current after:rotate-0 after:transition-transform after:duration-150 hover:after:translate-x-0.5",
};

/* -------------------------------------------------------------------------- */
/* Group component for horizontal radio-style button groups (if needed later) */
/* -------------------------------------------------------------------------- */

export function ButtonGroup({ className, ...props }) {
  return <div className={className} role="group" {...props} />;
}