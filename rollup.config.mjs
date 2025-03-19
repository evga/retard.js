import terser from "@rollup/plugin-terser";

export default {
  input: "src/api.js",
  output: [
    {
      file: "bundle/retard.js",
      format: "esm",
    },
    {
      file: "docs/scripts/retard.js",
      format: "esm",
    },
    {
      file: "bundle/retard.min.js",
      format: "esm",

      plugins: [terser({ mangle: true })],
    }
  ]
};
