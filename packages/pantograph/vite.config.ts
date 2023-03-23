/// <reference types="vitest" />
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  test: {
    setupFiles: ["test/setup.ts"],
  },

  build: {
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        pantograph: resolve(__dirname, "src/main.ts"),
        "pantograph/models": resolve(__dirname, "src/models/exports.ts"),
      },
      name: "Pantograph",
    },
  },

  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
