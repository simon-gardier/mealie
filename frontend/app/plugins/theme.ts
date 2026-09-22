import { bistroThemes } from "~/assets/ratatouille/palette";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("vuetify:before-create", ({ vuetifyOptions }) => {
    // This fork owns the palette, including teleported menus and dialogs.
    // Backend theme defaults must not overwrite the custom UI colors.
    vuetifyOptions.theme = {
      defaultTheme: nuxtApp.$config.public.useDark ? "dark" : "light",
      variations: {
        colors: ["primary", "accent", "secondary", "success", "info", "warning", "error", "background"],
        lighten: 3,
        darken: 3,
      },
      themes: bistroThemes,
    };
  });
});
