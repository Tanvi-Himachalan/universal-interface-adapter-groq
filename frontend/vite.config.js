import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server config — used during development with `npm run dev`
// The overlay iframe src in content.js should point to http://localhost:3000
export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
    cors: true,
    // Allow the extension iframe to load this dev server
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
