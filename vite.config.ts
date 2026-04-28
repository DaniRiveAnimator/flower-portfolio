import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/flower-portfolio/",
  plugins: [react()],
  build: {
    target: "es2020",
    cssMinify: true,
  },
});
