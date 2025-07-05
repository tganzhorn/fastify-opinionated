import type { Options } from "tsup";

export const tsup: Options = {
  splitting: true,
  sourcemap: true,
  platform: "node",
  minify: true,
  dts: true,
  target: "es2020",
  format: ["esm"],
  bundle: true,
  clean: true,
  treeshake: true,
  entry: ["src/index.ts", /**"src/templates/generate.ts"*/],
  noExternal: [],
};
