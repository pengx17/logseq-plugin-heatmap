import reactRefresh from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import WindiCSS from "vite-plugin-windicss";
import logseqPlugin from "vite-plugin-logseq";

const reactRefreshPlugin = reactRefresh();
const windiCSS = WindiCSS();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefreshPlugin, windiCSS, logseqPlugin()],
  clearScreen: false,
  build: {
    target: "esnext",
    minify: "esbuild",
  },
});
