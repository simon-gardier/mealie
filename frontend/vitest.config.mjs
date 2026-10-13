import path from "path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default {
  plugins: [
    vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
    AutoImport({
      imports: ["vue", "@vueuse/core", "vue-i18n"],
      dts: false,
    }),
  ],
  test: {
    server: { deps: { inline: ["vuetify"] } },
    globals: true,
    environment: "jsdom",
    setupFiles: ["./app/tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["app/{lib,components,composables,layouts,pages}/**/*.{ts,tsx,vue}"],
      exclude: [
        "**/*.test.*",
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "**/__tests__/**",
        "app/lib/icons/**",
        "app/lib/api/types/**",
      ],
      reporter: ["html", "text-summary"],
      all: true,
    },
  },
  resolve: {
    alias: {
      "#app": path.resolve(root, "./node_modules/nuxt/dist/app/index.js"),
      "@": path.resolve(root, "./app"),
      "~": path.resolve(root, "./app"),
      "@@": path.resolve(root, "."),
      "~~": path.resolve(root, "."),
    },
  },
};
