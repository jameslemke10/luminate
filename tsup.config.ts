import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/lib/luminate/index.ts"],
  format: ["esm", "cjs"],
  dts: { compilerOptions: { incremental: false } },
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom", "next", "fabric", "@imgly/background-removal"],
  banner: { js: '"use client";' },
});
