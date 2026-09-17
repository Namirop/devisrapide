import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests unitaires de la logique métier pure (pricing, géo, stats, masquage
// des coordonnées, règles de matching) : ni Next.js ni composants React.

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
