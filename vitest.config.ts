import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Config Vitest minimal — tests unitaires sur la logique metier pure
// (pricing, geo, stats, masquage des coordonnees, regles de matching).
// Pas d'integration Next.js ni de tests de composants React.

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
