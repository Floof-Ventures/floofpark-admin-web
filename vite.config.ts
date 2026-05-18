import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: "frontend",
  resolve: { alias: { "@": path.resolve(__dirname, "frontend/src") } },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev proxy so localhost calls go to real services without CORS pain.
      "/api/v1/auth": { target: "https://auth.floofpark.app", changeOrigin: true, secure: true },
      "/api/v1/authz": { target: "https://auth.floofpark.app", changeOrigin: true, secure: true },
      "/api/v1/tenants": { target: "https://tenants.floofpark.app", changeOrigin: true, secure: true },
      "/api/v1/audit": { target: "https://audit.floofpark.app", changeOrigin: true, secure: true },
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
