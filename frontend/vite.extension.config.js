import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Extension build config - outputs single JS + CSS bundle
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../extension",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/overlay/main.jsx"),
      output: {
        entryFileNames: "overlay.js",
        chunkFileNames: "overlay-chunk.js",
        assetFileNames: "overlay.css",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
  },
});
