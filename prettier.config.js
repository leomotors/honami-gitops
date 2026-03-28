// @ts-check

/** @satisfies {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
  tailwindStylesheet: "./web/routes/layout.css",
};

export default config;
