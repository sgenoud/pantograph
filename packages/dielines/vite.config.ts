import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        dielines: resolve(__dirname, "src/main.ts"),
      },
      name: "Dielines",
    },
  },

  plugins: [
    dts({
      outputDir: "dist/types",
    }),
  ],
});
