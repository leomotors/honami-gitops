import adapter from "@sveltejs/adapter-static";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: adapter(),
    files: {
      src: "web",
    },
    alias: {
      $components: "web/lib/components",
      // Eden treaty imports `App` from src/, which uses this server alias.
      "@": "src",
    },
  },
};

export default config;
