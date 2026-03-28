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
    },
  },
};

export default config;
