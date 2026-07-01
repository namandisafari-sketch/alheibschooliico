import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// VitePWA removed — was causing service worker issues

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
    allowedHosts: ["alheibschool.org", "www.alheibschool.org"],
  },
  plugins: [
    react(),
    // VitePWA removed — was causing service worker issues.
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-tooltip",
          ],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          charts: ["recharts"],
          utils: ["date-fns", "lucide-react", "clsx", "tailwind-merge"],
          xlsx: ["xlsx"],
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
