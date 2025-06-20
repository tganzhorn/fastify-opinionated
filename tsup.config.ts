import type { Options } from "tsup";

import { esbuildDecorators } from "esbuild-decorators";

export const tsup: Options = {
  splitting: false,
  sourcemap: true,
  platform: "node",
  minify: true,
  dts: true,
  target: "es2020",
  format: ["esm"],
  bundle: true,
  clean: true,
  treeshake: false,
  esbuildPlugins: [esbuildDecorators()],
  entryPoints: ["src/index.ts", "src/templates/generate.ts"],
};
