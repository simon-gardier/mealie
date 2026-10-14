import { joinURL } from "ufo";
import { iosColors } from "../../app/theme/colors";

// The development backend does not mount SPA routes, including its manifest.
export default defineEventHandler((event) => {
  const baseURL = useRuntimeConfig(event).app.baseURL || "/";
  setHeader(event, "Content-Type", "application/manifest+json");
  return {
    name: "Petit Chef",
    short_name: "Petit Chef",
    id: baseURL,
    start_url: baseURL,
    scope: baseURL,
    display: "standalone",
    lang: "fr",
    background_color: iosColors.light.background,
    theme_color: iosColors.light.blue,
    icons: [
      { src: joinURL(baseURL, "icons/android-chrome-192x192.png"), sizes: "192x192", type: "image/png" },
      { src: joinURL(baseURL, "icons/android-chrome-512x512.png"), sizes: "512x512", type: "image/png" },
    ],
  };
});
