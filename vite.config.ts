import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Build timestamp: 2026-08-17T12:57:30
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      manifest: true,
    },
  },
});
