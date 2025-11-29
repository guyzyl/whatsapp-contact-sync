import { defineConfig } from "vite";
import { viteEnvs } from "vite-envs";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteEnvs({
      declarationFile: "sample.env",
    }),
    vue(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
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
