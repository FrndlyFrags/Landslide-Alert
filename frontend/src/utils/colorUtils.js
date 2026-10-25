// -----------------------------------------------------------------------
// colorUtils.js
// -----------------------------------------------------------------------
// Helper functions for:
// 1. Smooth green-to-red color transitions based on risk percentage
// 2. Formatting rain status (is it raining, rain intensity, icon)
// -----------------------------------------------------------------------

/**
 * Calculates a smooth color transition from Green (0% risk) to Red (100% risk).
 * 0%   = #10B981 (Emerald Green)
 * 25%  = #84CC16 (Lime Green)
 * 50%  = #F59E0B (Amber Gold)
 * 75%  = #F97316 (Orange)
 * 100% = #EF4444 (Crimson Red)
 */
export function getRiskColor(percent) {
  const p = Math.max(0, Math.min(100, percent));
  
  // Interpolate Hue from 145 (Green) to 0 (Red)
  const hue = Math.round(145 * (1 - p / 100));
  const saturation = 85;
  const lightness = 48;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Returns an RGBA string with opacity for glow effects and backgrounds.
 */
export function getRiskColorRgba(percent, opacity = 0.2) {
  const p = Math.max(0, Math.min(100, percent));
  let r, g, b;

  if (p < 50) {
    // Green (16, 185, 129) to Yellow (245, 158, 11)
    const factor = p / 50;
    r = Math.round(16 + (245 - 16) * factor);
    g = Math.round(185 + (158 - 185) * factor);
    b = Math.round(129 + (11 - 129) * factor);
  } else {
    // Yellow (245, 158, 11) to Red (239, 68, 68)
    const factor = (p - 50) / 50;
    r = Math.round(245 + (239 - 245) * factor);
    g = Math.round(158 + (68 - 158) * factor);
    b = Math.round(11 + (68 - 11) * factor);
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Determines whether it is currently raining at a site and formats the status.
 */
export function getRainStatus(rainfall24h = 0, rainfallNext6h = 0) {
  const currentEstRate = Math.round((rainfall24h / 24 + rainfallNext6h / 6) * 10) / 10;
  
  if (currentEstRate > 8.0 || rainfall24h > 100) {
    return {
      isRaining: true,
      label: "Heavy Rain",
      detail: `${currentEstRate} mm/h`,
      icon: "🌧️",
      badgeColor: "#EF4444",
      bgClass: "bg-red-500/20 text-red-400 border-red-500/40",
    };
  } else if (currentEstRate > 2.0 || rainfall24h > 30) {
    return {
      isRaining: true,
      label: "Moderate Rain",
      detail: `${currentEstRate} mm/h`,
      icon: "🌧️",
      badgeColor: "#F59E0B",
      bgClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    };
  } else if (currentEstRate > 0.3 || rainfall24h > 5) {
    return {
      isRaining: true,
      label: "Light Rain",
      detail: `${currentEstRate} mm/h`,
      icon: "🌦️",
      badgeColor: "#06B6D4",
      bgClass: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    };
  } else {
    return {
      isRaining: false,
      label: "No Active Rain",
      detail: "Dry conditions",
      icon: "🌤️",
      badgeColor: "#10B981",
      bgClass: "bg-slate-700/40 text-slate-400 border-slate-700",
    };
  }
}
