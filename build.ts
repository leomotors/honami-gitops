await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "out",
  compile: true,
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version ?? "unknown"),
  },
});
