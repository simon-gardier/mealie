import { describe, expect, test } from "vitest";
import { createVuetify } from "vuetify";
import { appThemes, iosColors } from "./colors";

describe("iOS color themes", () => {
  test.each(["light", "dark"] as const)("generates semantic CSS roles for %s mode", (mode) => {
    const vuetify = createVuetify({
      theme: { defaultTheme: mode, themes: appThemes },
    });
    const css = vuetify.theme.styles.value;
    expect(css).toContain(`.v-theme--${mode}`);
    expect(css).toContain("--v-theme-text-secondary:");
    expect(css).toContain("--v-theme-separator:");
    expect(css).toContain("--v-secondary-label-opacity: 0.6");
    expect(vuetify.theme.current.value.colors.primary).toBe(iosColors[mode].blue);
    expect(vuetify.theme.current.value.colors.background).toBe(iosColors[mode].background);
    expect(vuetify.theme.current.value.dark).toBe(mode === "dark");
  });

  test("both appearances define every semantic role", () => {
    expect(Object.keys(appThemes.light.colors).sort()).toEqual(Object.keys(appThemes.dark.colors).sort());
    for (const theme of Object.values(appThemes)) {
      for (const color of Object.values(theme.colors)) {
        expect(color).toMatch(/^#[\da-f]{6}$/i);
      }
    }
  });
});
