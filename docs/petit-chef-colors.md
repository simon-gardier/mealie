# Petit Chef color system

All frontend color values live in `frontend/app/theme/colors.ts`. It exports Apple's current normal-contrast sRGB accents and grays, semantic light/dark Vuetify themes, and fixed colors for media, print, and artwork. The theme plugin, Nuxt startup background, CSS, default label color, and celebration canvas consume this configuration.

Source: [Apple Color guidance](https://developer.apple.com/design/human-interface-guidelines/color), including its official swatch RGB labels, checked 2026-10-08. [UIKit UI element colors](https://developer.apple.com/documentation/uikit/ui-element-colors) defines the roles. The current blue is #0088FF light / #0091FF dark, rather than the older iOS blue. Native UIKit also varies colors for elevation, accessibility, gamut, and materials. This browser theme implements the normal-contrast sRGB light/dark baseline; it does not emulate Liquid Glass rendering or all native accessibility variants.

| App role | iOS role / usage |
| --- | --- |
| background | systemGroupedBackground: grouped page background |
| surface | secondarySystemGroupedBackground: cards and content panels |
| surface-elevated | Elevated dark surface: menus and dialogs |
| text-primary / on-surface | label: main text and headings |
| text-secondary | secondaryLabel, with 60% opacity: hints and subtitles |
| text-tertiary | tertiaryLabel, with 30% opacity |
| separator | opaqueSeparator: borders and dividers |
| field-border | Neutral input outlines on elevated dialogs: separator in light mode, systemGray2 in dark mode |
| fill | Neutral control fill: inputs and inactive UI |
| primary / info / accent | systemBlue: actions, links, focus and selection |
| success | systemGreen: successful status |
| error | systemRed: destructive actions and error status |
| warning | systemOrange: warning status |
| rating | systemYellow: selected rating stars |

Use Vuetify semantic props (`color="primary"`) or generated CSS (`rgb(var(--v-theme-separator))`). Do not add local hex/RGB values or Material named colors to components. Opacity, gradients, and shadows may compose these roles for presentation. User-selected label colors and color-picker-generated values are user content, not theme constants. Fixed white/black on photos and printed pages intentionally remain independent of the active theme. The cheese animation's authored glow is an artwork exception, also configured centrally.

The former Ratatouille palette and runtime THEME_* color defaults have been removed; `THEME_USE_DARK` still selects an initial appearance. Ratatouille imagery, typography, layout, and Vuetify remain in place.
