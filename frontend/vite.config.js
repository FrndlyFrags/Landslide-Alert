// -----------------------------------------------------------------------
// vite.config.js
// WHAT: Tells Vite (our build tool) to use React.
// WHY:  Without this, Vite wouldn't know how to handle .jsx files.
// -----------------------------------------------------------------------
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
