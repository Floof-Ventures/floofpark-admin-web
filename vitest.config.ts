import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "frontend/src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./frontend/src/test-setup.ts"],
    include: ["frontend/src/**/*.{test,spec}.{ts,tsx}"],
  },
});
