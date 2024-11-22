import replaceImports from "rollup-plugin-replace-imports-with-vars";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: `index.ts`,
    output: [
      {
        file: "dist/es/replicad-pantograph.js",
        format: "es",
        sourcemap: true,
      },
    ],
    external: ["replicad"],
    watch: {
      include: "src/**",
    },
    plugins: [
      typescript({
        declaration: true,
        declarationDir: "dist/es",
      }),
      resolve(),
    ],
  },
  {
    input: `index.ts`,
    output: [
      {
        file: "dist/studio/replicad-pantograph.js",
        format: "es",
        plugins: [
          replaceImports({
            varType: "const",
            replacementLookup: { replicad: "replicad" },
          }),
        ],
      },
    ],
    external: ["replicad"],
    watch: {
      include: "src/**",
    },
    plugins: [typescript({ sourceMap: false }), resolve()],
  },
];
