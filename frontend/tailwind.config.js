/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    colors: {
      paper: "#F4F1EA", // light-first public site background
      ink: "#1C1B19", // warm near-black
      accent: "#B4482B", // laterite red-brown accent
      // Risk colours — used ONLY for risk status
      low: "#5E7A3A", // olive
      moderate: "#C98A1B", // ochre
      high: "#A83226", // brick
    },
    fontFamily: {
      sans: ["Public Sans", "system-ui", "sans-serif"],
      serif: ["Source Serif 4", "ui-serif", "serif"],
      mono: "+ZeroLined", // numerals only
    },
    boxShadow: {
      // only essential shadows; no glow-* accents
    },
  },
  plugins: [],
};