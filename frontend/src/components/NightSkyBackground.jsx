// -----------------------------------------------------------------------
// NightSkyBackground.jsx  (LANDING PAGE ONLY — never rendered by the admin)
// -----------------------------------------------------------------------
// WHAT: Hero/page background: the classic "Stars #Codevember 08" star field —
//       three layered box-shadow star canvases (1px/2px/3px) drifting
//       slowly up-left, each tiled one field-height (2560px) lower with
//       ::after so the loop never empties the viewport, plus one diagonal
//       shooting-star streak (white head, gradient tail) sweeping the sky
//       every 10s. Styling lives in StarField.css.
// RULES: Pure CSS (GPU-friendly, no canvas). Rendered as ONE fixed
//        full-viewport layer with z-index: -10 inside the .nightsky
//        stacking context (root uses `isolate`), so the star sky sits
//        above the page's gradient but below all content at every
//        scroll position. Reduced-motion users get static stars via
//        index.css's global motion guard. All ns-* classes are rooted
//        at .nightsky so nothing leaks into the admin portal.
// -----------------------------------------------------------------------
import "./StarField.css";

export default function NightSkyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="ns-stars" />
      <div className="ns-stars1" />
      <div className="ns-stars2" />
      <div className="ns-shooting-stars" />
    </div>
  );
}
