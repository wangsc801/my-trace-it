import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // In dev, forward API calls to the backend so they don't hit the react-router
    // dev server as routes (which caused "No route matches URL" errors).
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
