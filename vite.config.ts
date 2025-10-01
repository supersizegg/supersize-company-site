import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      buffer: "node-stdlib-browser/buffer",
      process: "node-stdlib-browser/process",
      stream: "node-stdlib-browser/stream",
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: ["@solana/web3.js", "buffer", "process"],
  },
});
