import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Config Vitest minimal pour Sprint 5c — tests unitaires sur la logique
// metier pure (pricing, wallet, geo, finance, stats). Pas d'integration
// Next.js, pas de tests de composants React (reporte V2).

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // exclude par defaut node_modules + dist.
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
