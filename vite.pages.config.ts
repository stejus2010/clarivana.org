// GitHub Pages build: static single-page app (no server needed).
// Usage: PAGES_BASE=/your-repo-name/ bun run build:pages
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const base = process.env.PAGES_BASE ?? "/";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    spa: { enabled: true, prerender: { outputPath: "/index.html" } },
    router: { basepath: base },
  } as any,
  vite: { base },
});
