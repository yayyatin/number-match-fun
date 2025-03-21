import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Base public path when served in production
  base: "/",

  // Build configuration
  build: {
    outDir: "dist",
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Enable asset and chunk name hashing
    assetsDir: "assets",
    // Rollup options
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        analytics: resolve(__dirname, "analytics/index.html"),
      },
    },
  },

  // Configure server
  server: {
    port: 3000,
    open: true,
    cors: true,
  },

  // Plugins array (empty for now)
  plugins: [],
});
