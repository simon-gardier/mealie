# First visual slice

Implemented on `codex/ratatouille-ui`, starting at `6f74625f052752138b4a81b42cb7a386d62ee951`.

## Design decisions

- `frontend/app/assets/ratatouille/palette.ts` owns the light and dark Vuetify palettes. This fork intentionally does not fetch `/api/app/about/theme`; backend theme environment overrides no longer control this UI. Colors reach teleported dialogs and menus through Vuetify.
- Cream/paper surfaces, tomato primary actions, navy headings, copper borders and sage details follow the customization guide. Secondary text/actions use a darker sage for contrast. Semantic status colors have explicit foreground colors.
- `main.css` supplies Inter interface text and recipe descriptions, Fraunces for editorial titles, navigation, buttons, cooking mode and search placeholders, and Borel for recipe timing values, cooked dates and selected metadata. Existing Nuxt Fonts integration resolves and self-hosts the font files; static output was checked for bundled WOFF2 assets.
- The header uses the Petit Chef name and the existing MDI chef hat. The brand is one keyboard-accessible link. The desktop search bar is visually disabled while its code and search dialog remain available through the mobile button and keyboard shortcut.
- Existing navigation and its permissions are retained. Active entries have a copper underline. Desktop and mobile recipe cards receive paper borders and restrained shadows; desktop titles can wrap to two lines. Existing rating, favorite, context-menu and tag behavior is retained.
- Hover lift is limited to pointer devices without reduced-motion preferences. Print removes texture and shadows. Final mascot artwork is deferred.

## Local runtime

The running application was actually using `/home/simon/projects/mealie`, a separate clean WSL checkout, rather than the Windows-mounted path stated in the original plan. Only changed frontend files were copied into that checkout for the preview. Formatted changes were copied back to the Windows workspace. No backend or data files were copied.

Node 24.21.0 and Task/pnpm were available through `/home/simon/.local/opt/mealie-node/bin`. The default WSL shell instead selects Node 22; use the existing development runtime for checks. These paths describe this workstation only and are not embedded in application code.

Local login credentials are in the Git-ignored root file `MEALIE_LOCAL_LOGIN.md`; never copy them into tracked documentation.

## Verification

- `task ui:lint`: passed.
- `pnpm --dir frontend test:ci`: 42 files / 431 tests passed.
- `task ui:generate`: passed; static assets and locally served fonts produced.
- Nuxt typecheck cannot run directly because no Vue checker is installed. An ephemeral vue-tsc 3.1.0 / TypeScript 5.9.3 run completed analysis but reported 326 errors across the checkout, including existing unchecked array accesses, API type mismatches and the existing i18n `lazy` configuration. No errors were reported in the new palette or theme plugin. A clean full-project typecheck is still outstanding; the full error set was not baseline-compared.
- Live login succeeded. Reviewed light and dark appearance, desktop at 1440px and mobile at 390px, navigation drawer/settings and mobile header search with a real recipe result. Hot reload and reload both displayed the customized UI.
- Broad workflow/permission, print and reduced-motion execution tests remain part of later review. No new persisted behavior, schemas, generated API types or locale files were changed.

## Upstream integration

Review the theme plugin, Nuxt stylesheet registration/startup background, header/sidebar, default layout menu label, recipe card variants and section title when merging upstream changes. Styling is otherwise centralized under `assets/ratatouille`.

## Completed functionality

- Added a Ratatouille-inspired light and dark theme: cream/paper surfaces, tomato primary actions, navy text, copper details and accessible status colors.
- Added self-hosted Inter, Fraunces and Borel typography through the existing Nuxt font integration.
- Renamed visible product branding to Petit Chef across metadata, header, footer, login and registration screens.
- Applied typography by role: Fraunces for titles, navigation, buttons, cooking mode and search placeholders; Borel for recipe timing values and cooked dates; Inter for recipe descriptions.
- Restyled shared buttons, fields, menus and navigation with paper texture, irregular borders, keyboard focus states and reduced-motion support.
- Restyled the header with a chef-hat wordmark, accessible mobile controls and preserved search activation while hiding the desktop search bar.
- Restyled the sidebar while retaining all existing routes and permission-dependent navigation.
- Restyled desktop and mobile recipe cards with index-card borders, responsive title treatment, tags, rating, favorite and action menus preserved.
- Verified local login, search, recipe navigation, desktop/mobile views, dark mode, lint, frontend tests and static generation.

## Files modified for this slice

- `.gitignore`
- `MEALIE_RATATOUILLE_UI_PLAN.md`
- `docs/custom-ui/first-visual-slice.md`
- `frontend/nuxt.config.ts`
- `frontend/app/assets/ratatouille/main.css`
- `frontend/app/assets/ratatouille/palette.ts`
- `frontend/app/plugins/theme.ts`
- `frontend/app/components/Layout/DefaultLayout.vue`
- `frontend/app/components/Layout/LayoutParts/AppHeader.vue`
- `frontend/app/components/Layout/LayoutParts/AppFooter.vue`
- `frontend/app/components/Layout/LayoutParts/AppSidebar.vue`
- `frontend/app/components/Domain/Recipe/RecipeLastMade.vue`
- `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInfoCard.vue`
- `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInstructions.vue`
- `frontend/app/components/Domain/Recipe/RecipeTimeCard.vue`
- `frontend/app/components/Domain/Recipe/RecipeCard.vue`
- `frontend/app/components/Domain/Recipe/RecipeCardMobile.vue`
- `frontend/app/components/Domain/Recipe/RecipeCardSection.vue`
- `frontend/app/pages/login.vue`
- `frontend/app/pages/register/index.vue`
