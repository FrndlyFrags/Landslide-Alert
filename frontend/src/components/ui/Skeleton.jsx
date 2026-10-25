import React from "react";

/**
 * Renders a calm skeleton placeholder.
 * - No animation (unless explicitly needed for a specific node).
 * - Uses currentColour CSS var so it inherits from parent palette.
 * - Height based on typical line-height for body text (15–16px rhythm).
 *
 * Props:
 *  lines  — number of skeleton rows to stack (default 1)
 *  width  — optional width constraint (e.g. "full", "half", "quarter")
 *  radius — border radius (default matches 4–8px spec)
 */

function Skeleton({ lines = 1, width = "full", radius = "radius", ...props }) {
  const lineHeight = "1.5em";
  const baseWidth = width === "full" ? "w-full" : width === "half" ? "w-1/2" : "w-1/4";

  return (
    <div
      className={`
        animate-none       /* explicit opt-out */
        rounded-md        /* 4px radius per spec */
        bg-slate-card     /* soft neutral, matches paper palette */
        ${baseWidth}
        ${radius}
        h-6               /* one line height ≈ 15–16px */
        margin-y-1.5
        flex flex-col items-center justify-center
        overflow-hidden
        transition-property: none
      `}
      {...props}
    >
      {lines > 1 && (
        <>
          {[Array(lines)].map((_, i) => (
            <div
              key={i}
              className="h-6 w-full mb-1.5"
            />
          ))}
        </>
      )}
    </div>
  );
}

/* -----------------------
   Individual shap
   ----------------------- */

Skeleton.line = function LineSkeleton({ width = "full", ...props }) {
  return <Skeleton width={width} lines={1} {...props} />;
};

Skeleton.shimmer = function ShimmerSkeleton() {
  // intentionally empty — no shimmer effect per design spec
  return null;
};

/* -----------------------------------------------------------------------
   Export — this component replaces BootSequence in App.jsx
   ----------------------------------------------------------------------- */

export default Skeleton;