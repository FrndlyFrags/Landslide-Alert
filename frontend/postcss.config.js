// -----------------------------------------------------------------------
// postcss.config.js
// WHAT: Tells the build process to run Tailwind and Autoprefixer on our
//       CSS.
// WHY:  Required for Tailwind's utility classes to actually work.
// -----------------------------------------------------------------------
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
