// -----------------------------------------------------------------------
// NightSkyBackground.jsx  (LANDING PAGE ONLY — never rendered by the admin)
// -----------------------------------------------------------------------
// WHAT: Hero background: the classic "Stars #Codevember 08" star field —
//       three layered box-shadow star canvases (1px/2px/3px) drifting
//       slowly the left, tiled with ::after so the loop is seamless, plus
//       one diagonal shooting-star streak (glowing white head, gradient
//       tail) sweeping the sky every 10s. Styling lives in StarField.css.
// RULES: Pure CSS (GPU-friendly, no canvas). Reduced-motion users get
//        static stars via index.css's global motion guard. The ns-*
//        classes are rooted at .nightsky so nothing leaks into the
//        admin portal.
// -----------------------------------------------------------------------
import "./StarField.css";

export default function NightSkyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ns-stars" />
      <div className="ns-stars1" />
      <div className="ns-stars2" />
      <div className="ns-shooting-stars" />
    </div>
  );
}
