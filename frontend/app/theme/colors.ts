// Single source of truth for UI colors. Normal-contrast sRGB baseline, 2026-10-08.
// Accent/gray values: https://developer.apple.com/design/human-interface-guidelines/color
// UIKit semantic roles: https://developer.apple.com/documentation/uikit/ui-element-colors
// Native UIKit additionally adapts to elevation, materials, and accessibility.
export const iosColors = {
  light: {
    blue: "#0088FF", green: "#34C759", red: "#FF383C", orange: "#FF8D28",
    yellow: "#FFCC00", purple: "#CB30E0", indigo: "#6155F5", teal: "#00C3D0",
    gray: "#8E8E93", gray2: "#AEAEB2", gray3: "#C7C7CC", gray4: "#D1D1D6",
    gray5: "#E5E5EA", gray6: "#F2F2F7",
    background: "#F2F2F7", surface: "#FFFFFF", elevated: "#FFFFFF",
    label: "#000000", secondaryLabel: "#3C3C43", separator: "#C6C6C8",
  },
  dark: {
    blue: "#0091FF", green: "#30D158", red: "#FF4245", orange: "#FF9230",
    yellow: "#FFD600", purple: "#DB34F2", indigo: "#6D7CFF", teal: "#00D2E0",
    gray: "#8E8E93", gray2: "#636366", gray3: "#48484A", gray4: "#3A3A3C",
    gray5: "#2C2C2E", gray6: "#1C1C1E",
    background: "#000000", surface: "#1C1C1E", elevated: "#2C2C2E",
    label: "#FFFFFF", secondaryLabel: "#EBEBF5", separator: "#38383A",
  },
};

// Theme-independent colors are intentional: media overlays, print, and artwork.
export const fixedColors = {
  white: "#FFFFFF",
  black: "#000000",
  cheeseGlow: "#e8c778",
};

export const actionColors = {
  create: "primary", update: "primary", save: "primary", edit: "primary",
  delete: "error", cancel: "secondary", download: "primary",
};

export const controlDefaults = {
  VTooltip: { openDelay: 500, closeDelay: 100, openOnFocus: true, openOnClick: false, transition: "fade-transition", maxWidth: 280 },
  VTextField: { variant: "filled", color: "primary" },
  VTextarea: { variant: "filled", color: "primary" },
  VSelect: { variant: "filled", color: "primary" },
  VAutocomplete: { variant: "filled", color: "primary" },
  VCombobox: { variant: "filled", color: "primary" },
  VNumberInput: { variant: "filled", color: "primary" },
  VBtn: { color: "primary" },
  VCheckbox: { color: "primary" },
  VSwitch: { color: "primary" },
  VRadio: { color: "primary" },
  VSlider: { color: "primary" },
  VTabs: { color: "primary" },
};

function makeTheme(mode: keyof typeof iosColors) {
  const c = iosColors[mode];
  return {
    dark: mode === "dark",
    colors: {
      "background": c.background,
      "surface": c.surface,
      "surface-bright": c.elevated,
      "surface-light": c.elevated,
      "surface-variant": c.gray6,
      "surface-elevated": c.elevated,
      "on-background": c.label,
      "on-surface": c.label,
      "on-surface-variant": c.label,
      "text-primary": c.label,
      "text-secondary": c.secondaryLabel,
      "text-tertiary": c.secondaryLabel,
      "separator": c.separator,
      "field-border": mode === "dark" ? c.gray2 : c.separator,
      "fill": mode === "dark" ? c.gray5 : c.gray6,
      "primary": c.blue,
      "secondary": c.gray,
      "accent": c.blue,
      "success": c.green,
      "info": c.blue,
      "warning": c.orange,
      "error": c.red,
      "rating": c.yellow,
      "label-default": c.purple,
      "on-primary": fixedColors.white,
      "on-secondary": fixedColors.white,
      "on-accent": fixedColors.white,
      "on-success": fixedColors.black,
      "on-info": fixedColors.white,
      "on-warning": fixedColors.black,
      "on-error": fixedColors.white,
      "media-foreground": fixedColors.white,
      "chip-remove-background": fixedColors.white,
      "media-scrim": fixedColors.black,
      "shadow": fixedColors.black,
      "print-background": fixedColors.white,
      "print-foreground": fixedColors.black,
    },
    variables: {
      "border-color": c.separator,
      "border-opacity": 1,
      "high-emphasis-opacity": 1,
      "medium-emphasis-opacity": 0.6,
      "disabled-opacity": 0.3,
      "secondary-label-opacity": 0.6,
      "tertiary-label-opacity": 0.3,
      "shadow-color": fixedColors.black,
    },
  };
}

export const appThemes = { light: makeTheme("light"), dark: makeTheme("dark") };
export const celebrationColors = [iosColors.light.red, iosColors.light.yellow, iosColors.light.teal, fixedColors.white, iosColors.light.purple];
