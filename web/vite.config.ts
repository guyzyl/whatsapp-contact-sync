import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        // Keep the original Host (localhost:4000) so the backend builds the
        // Google OAuth redirect URI against :4000 (which is proxied back
        // correctly) rather than :8080, which has no /api/* route.
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/api/ws": {
        ws: true,
        target: "ws://localhost:8080/",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
