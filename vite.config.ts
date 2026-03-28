import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

// Proxy for local development
const apiProxyTarget = "https://emu-gitops-internal.lmhome.dev";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
  server: apiProxyTarget
    ? {
        proxy: {
          // Forward only the UI-used endpoints; keep `/webhook` untouched.
          "/compose": {
            target: apiProxyTarget,
            changeOrigin: true,
          },
          "/health": {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        },
      }
    : undefined,
});
