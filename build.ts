await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "bun",
  minify: true,
  sourcemap: "linked",
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version ?? "unknown"),
  },
});
