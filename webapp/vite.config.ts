import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vibecodePlugin } from "@vibecodeapp/webapp/plugin";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8000,
    allowedHosts: true, // Allow all hosts
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "image.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: "CRM",
        short_name: "CRM",
        description: "CRM mobile web app",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/image.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/image.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/image.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
    mode === "development" && vibecodePlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
