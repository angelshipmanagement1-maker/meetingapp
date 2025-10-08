import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import nodePolyfills from 'rollup-plugin-node-polyfills';
const config: UserConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  server: {
    port: 8080,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 8080,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    cssMinify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      },
      plugins: [
        // Polyfill Node.js globals and modules for browser
        nodePolyfills()
      ]
    }
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || 'development'),
    global: "globalThis",
    process: {
      env: {},
      nextTick: "((fn) => setTimeout(fn, 0))"
    },
    util: {
      debuglog: "() => () => {}"
    }
  },
  optimizeDeps: {
    include: ['socket.io-client', 'buffer', 'util', 'events', 'process'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
        process: 'process',
      }
    }
  },
  plugins: [
    react({ jsxImportSource: "react" }),
    viteStaticCopy({
      targets: [
        { src: "./assets/*", dest: "assets" },
        {
          src: "./public/assets/{*,}",
          dest: path.join("dist", "public/assets"),
        },
        { src: "src/assets/*", dest: path.join("dist", "assets") },
      ],
      silent: true,
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};

export default defineConfig(config);
