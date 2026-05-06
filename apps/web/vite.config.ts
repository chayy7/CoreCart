import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true,
      interval: 200,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    }
  }
});
