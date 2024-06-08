import { defineConfig } from "vite";

export default defineConfig({
  root: "./frontend",
  build: {
    outDir: "../dist/backend/src/public",
    target: "esnext",
    emptyOutDir: true,
  },
});
