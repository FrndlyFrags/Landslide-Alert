// -----------------------------------------------------------------------
// colorUtils.js
// -----------------------------------------------------------------------
// Helper functions for:
// 1. Smooth green-to-red color transitions based on risk percentage
// 2. Formatting rain status (is it raining, rain intensity, icon)
// -----------------------------------------------------------------------

/**
 * Calculates a smooth color transition from green (0% risk) to red (100% risk).
 * Same hue interpolation as before, desaturated to sit inside the muted
 * charcoal palette instead of glowing neon.
 * 0%   = sage green      (hsl 145)
 * 50%  = ochre amber     (hsl ~72)
 * 100% = clay red        (hsl 0)
 */
export function getRiskColor(percent) {
  const p = Math.max(0, Math.min(100, percent));

  // Interpolate Hue from 145 (Green) to 0 (Red)
  const hue = Math.round(145 * (1 - p / 100));
  const saturation = 42;
  const lightness = 58;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Returns an RGBA string with opacity for glow effects and backgrounds.
 */
export function getRiskColorRgba(percent, opacity = 0.2) {
  const p = Math.max(0, Math.min(100, percent));
  let r, g, b;

  if (p < 50) {
    // Sage (111, 169, 138) to ochre (201, 155, 92)
    const factor = p / 50;
    r = Math.round(111 + (201 - 111) * factor);
    g = Math.round(169 + (155 - 169) * factor);
    b = Math.round(138 + (92 - 138) * factor);
  } else {
    // Ochre (201, 155, 92) to clay red (201, 112, 107)
    const factor = (p - 50) / 50;
    r = Math.round(201 + (201 - 201) * factor);
    g = Math.round(155 + (112 - 155) * factor);
    b = Math.round(92 + (107 - 92) * factor);
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
      badgeColor: "#c9706b",
      bgClass: "bg-red-500/20 text-red-400 border-red-500/40",
    };
  } else if (currentEstRate > 2.0 || rainfall24h > 30) {
    return {
      isRaining: true,
      label: "Moderate Rain",
      detail: `${currentEstRate} mm/h`,
      icon: "🌧️",
      badgeColor: "#c99b5c",
      bgClass: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    };
  } else if (currentEstRate > 0.3 || rainfall24h > 5) {
    return {
      isRaining: true,
      label: "Light Rain",
      detail: `${currentEstRate} mm/h`,
      icon: "🌦️",
      badgeColor: "#a6bfcf",
      bgClass: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    };
  } else {
    return {
      isRaining: false,
      label: "No Active Rain",
      detail: "Dry conditions",
      icon: "🌤️",
      badgeColor: "#6fa98a",
      bgClass: "bg-slate-700/40 text-slate-400 border-slate-700",
    };
  }
}
