// -----------------------------------------------------------------------
// NightSkyBackground.jsx  (LANDING PAGE ONLY — never rendered by the admin)
// -----------------------------------------------------------------------
// WHAT: Hero background: faint twinkling static stars on a canvas plus a
//       continuous "falling stars" meteor shower — bright, glowing streaks
//       that rain down from the top at a consistent diagonal angle with
//       long gradient tails (style inspired by the devMilosh/Huly falling
//       stars animation). No moon.
// RULES: Pauses fully when the tab is hidden and when the user prefers
//        reduced motion. Frees its canvas + listeners on unmount.
//        Content stays readable above it (z-0 layer).
// -----------------------------------------------------------------------
import { useEffect, useRef } from "react";

const STAR_COUNT = 110;                 // faint twinkling background stars
const METEOR_ANGLE_RAD = (18 * Math.PI) / 180; // ≈18° off straight-down, drifting left
const HEAD_ALPHA = 0.85;                // streak head brightness
const HEAD_COLOR = "223, 236, 255";

function spawnStar(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height * 0.9,
    radius: Math.random() * 0.9 + 0.3,
    baseAlpha: Math.random() * 0.45 + 0.15,
    twinkleSpeed: Math.random() * 0.9 + 0.25,
    twinklePhase: Math.random() * Math.PI * 2,
  };
}

function spawnMeteor(width, height, preFlightSeconds = 0) {
  const speed = 520 + Math.random() * 320;              // px/s along the fall direction
  const vx = -Math.sin(METEOR_ANGLE_RAD) * speed;
  const vy = Math.cos(METEOR_ANGLE_RAD) * speed;
  const tail = 90 + Math.random() * 90;                 // tail length in px
  const meteor = {
    // Launch slightly past the top edge (and a bit past the sides) so
    // streaks slide into view instead of popping.
    x: width * (0.08 + Math.random() * 1.02) + 40,
    y: -tail - Math.random() * 60,
    vx,
    vy,
    tail,
    alpha: 0.22 + Math.random() * 0.4,
  };
  // Pre-flight lets the page open with streaks already mid-fall.
  if (preFlightSeconds > 0) {
    meteor.x += meteor.vx * preFlightSeconds;
    meteor.y += meteor.vy * preFlightSeconds;
  }
  return meteor;
}

export default function NightSkyBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // keep fill cheap on hi-dpi

    let stars = [];
    let meteors = [];
    let nextMeteorAt = 0;
    let rafId = 0;
    let lastTime = performance.now();
    let running = true;

    // Density of the shower scales with viewport width, capped so it
    // never looks like a whiteout.
    function maxMeteors(width) {
      return Math.max(3, Math.min(12, Math.round(width / 150)));
    }

    function resize() {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Reseed stars so density fits the new area (cheap, rare event).
      const count = Math.round(STAR_COUNT * ((w * h) / (1280 * 800)));
      stars = Array.from({ length: Math.max(40, Math.min(count, STAR_COUNT)) }, () =>
        spawnStar(w, h)
      );
    }

    function drawFrame(now) {
      rafId = requestAnimationFrame(drawFrame);
      if (document.hidden) return; // skip drawing entirely while hidden

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Twinkling of static stars
      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed * dt;
        const alpha = star.baseAlpha * (0.55 + 0.45 * Math.sin(star.twinklePhase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#dbe9ff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Continuous falling-stars shower: spawn on a randomized short
      // cadence so streaks rain down without gaps.
      if (now >= nextMeteorAt) {
        nextMeteorAt = now + 180 + Math.random() * 320;
        if (meteors.length < maxMeteors(w)) {
          meteors.push(spawnMeteor(w, h));
        }
      }

      meteors = meteors.filter((m) => {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        // Dead once fully below the screen (including its tail).
        if (m.y - m.tail > h) return false;

        const dirX = -m.vx;
        const dirY = -m.vy;
        const invLen = 1 / Math.hypot(m.vx, m.vy);
        const tailX = m.x + (dirX * invLen * m.tail);
        const tailY = m.y + (dirY * invLen * m.tail);

        // Glowing tail: transparent at the far end → bright at the head.
        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, `rgba(${HEAD_COLOR}, 0)`);
        grad.addColorStop(0.65, `rgba(${HEAD_COLOR}, ${0.35 * m.alpha})`);
        grad.addColorStop(1, `rgba(${HEAD_COLOR}, ${HEAD_ALPHA * m.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Bright head with a small soft glow.
        const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 5);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${HEAD_ALPHA * m.alpha})`);
        headGlow.addColorStop(1, `rgba(${HEAD_COLOR}, 0)`);
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
        ctx.fill();

        return m.x > -m.tail * 2 && m.x < w + m.tail * 2;
      });
    }

    function start() {
      running =
        !document.hidden && !reducedMotion.matches;
      if (!running) return;
      resize();
      // Pre-warm the shower so streaks are visible immediately.
      const warm = 0.9 + Math.random() * 0.8;
      meteors = Array.from({ length: maxMeteors(canvas.clientWidth) }, () =>
        spawnMeteor(canvas.clientWidth, canvas.clientHeight, Math.random() * warm)
      );
      rafId = requestAnimationFrame(drawFrame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function handleVisibility() {
      if (document.hidden || reducedMotion.matches) stop();
      else if (!running) start();
    }

    start();

    const mediaIdle = reducedMotion.addEventListener
      ? null
      : reducedMotion.addListener?.bind(reducedMotion);

    if (mediaIdle) {
      mediaIdle(handleVisibility);
    } else {
      reducedMotion.addEventListener?.("change", handleVisibility);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", resize);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", resize);
      if (mediaIdle) reducedMotion.removeListener?.(handleVisibility);
      else reducedMotion.removeEventListener?.("change", handleVisibility);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Star field + falling-stars meteor shower */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
