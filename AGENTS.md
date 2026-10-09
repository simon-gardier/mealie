# Mealie Development Guide for AI Agents

## Petit Chef fork: owner requirements

These fork-specific instructions take precedence over the upstream guidance below.

- This fork serves the owner's family and friends for sharing recipes, meal planning, and related Mealie features.
- Brand the app as **Petit Chef**, inspired by Pixar's Ratatouille.
- French is the primary language; English is used occasionally. Extend and improve French support. Editing French locale files is explicitly allowed in this fork, overriding the upstream en-US-only rule. Keep English usable; avoid unrelated locale changes.
- Improve components, input fields, buttons, and simplify layouts while retaining Vuetify.
- The Remy rebranding follows the **iOS color scheme**, replacing Mealie's default color scheme. UI colors use the iOS semantic light/dark palette in `frontend/app/theme/colors.ts`; read `docs/petit-chef-colors.md`. Keep new color values in that configuration and use semantic Vuetify/CSS tokens elsewhere. User-selected colors and authored artwork are documented exceptions.
- Do not change backend source, API contracts, database schemas, or introduce large breaking frontend changes. Prefer incremental frontend customization.
- Run backend and frontend as separate foreground processes in visible, user-accessible terminals. The owner must be able to inspect output, stop with Ctrl+C, and restart each service. Do not leave servers running only as hidden agent processes.
- Docker is available and preferred over WSL when Linux dependencies are needed. Prefer a Docker development backend and a local frontend on Windows.
- Read `docs/petit-chef-development.md` before local setup or startup, and update it with verified setup fixes. Repository instructions are the portable source of context for agents on other machines; keep secrets and local data out of Git.

### Petit Chef UI/UX conventions and lessons (updated 2026-10-09)

Use the recipe edit page and Analyze ingredients modal as the reference for future frontend refactors. The owner wants a calm, intuitive interface inspired by Apple's Human Interface Guidelines while retaining Vuetify and the Ratatouille identity. The measurements below are Petit Chef conventions established in this conversation, not universal Apple requirements. Consult Apple's [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color), and [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) guidance when making new design decisions.

#### Appearance, hierarchy, and spacing

- Dialog headers use a neutral `surface` background, an approximately 18px semibold title, and a subtle semantic separator. Do not restore solid blue, green, or red header banners. Header styling is independent of confirmation-button color: a delete confirmation still has a red action.
- Use semantic `on-surface`/primary text for readable content and secondary text for hints. Blue communicates actions, selection, and focus; red communicates deletion; green is reserved for genuine success states rather than ordinary Add buttons. Support light and dark themes using `frontend/app/theme/colors.ts` and `docs/petit-chef-colors.md`.
- Default control typography is the app's readable sans-serif font, with roughly 16px input text, 14-15px button/body text, 13-14px helper text, and 18px semibold section headings. Keep the decorative recipe title and authored artwork; do not spread handwritten/serif styling into input fields or administrative labels.
- Follow a coherent spacing scale: 8px between related controls, 12-16px inside compact cards, 24px desktop dialog/page padding, 16px mobile padding, and 24-32px between sections. Avoid arbitrary negative margins, oversized blank areas, and several disconnected action rows.
- Use approximately 10px rounded controls/buttons, 12-14px content cards/menu surfaces, and 20px desktop dialogs. Match existing shared button shapes when placing Add actions alongside them. Avoid inconsistent square corners, excessive pills, and elevated circular toolbar buttons.
- The main recipe editor shell and decorative summary are **transparent and borderless**, revealing the dotted page background. Borders belong only on genuine grouped content cards/fields where they help organization. Do not use a blanket `.recipe-editor .v-card` rule that turns transparent containers into white bordered cards; explicitly exclude `recipe-editor-shell` and `recipe-info-summary`.
- Keep the dotted background visible throughout long pages. Current styling paints it on `.v-application` and `.app-main` in `frontend/app/assets/ratatouille/main.css` (1.5px dot radius, 18px spacing, semantic separator at 0.4 opacity). A previous change targeting only `.v-application__wrap` made it disappear for the owner. Verify actual rendering at the top, middle, and bottom; never infer full-page coverage from viewport-height CSS alone. Preserve print rules that remove the dots.
- Responsive layout depends on the available **component** width, not just viewport width. The three recipe time details share one row when space permits and stack as a single column when narrow; avoid an awkward total-time row above a separate pair. Use container queries where appropriate.

#### Inputs, buttons, and menus

- Inputs have visible, consistent labels and neutral idle borders; reserve blue borders for actual focus. Do not hard-code a permanent primary border or confuse a populated field with a focused one. In the installed Vuetify version, `--v-field-border-color` may control the outline: verify rendered styles rather than changing only `.v-field__outline` text color.
- Modal field regression lesson: the Clone recipe field inherited Vuetify's filled variant while global CSS suppressed filled/underlined outlines. Its label remained inside the fill and there was no visible blue focus border. Shared field defaults in `theme/colors.ts` now use `variant: "outlined"` and `color: "primary"`; keep these defaults consistent for text fields, textareas, selects, autocompletes, comboboxes, and number inputs. Do not globally hide field outlines or manually position/transform floating labels. Preserve Vuetify's label/notch geometry; control idle/focus/error through `--v-field-border-color`. Check blank, populated, focused, blurred, and invalid fields in dialogs and mobile sheets; focus must turn blue even before typing, while error remains red. Verify the label actually clears the top border with long French text, rather than assuming a font-size change fixes it.
- Keep related inputs/actions aligned and at the same height, including the analyzer selector and Analyze button (approximately 44px). Normal text actions should have comfortable targets; compact icon actions must remain accessible, with labels/tooltips and visible keyboard focus.
- Add actions use a consistent `primary` tonal style, normal capitalization, readable wrapping, and a plus icon. This includes ingredient/unit creation inside autocomplete menus, substitution-food creation, synonyms, categories/tags, and Add buttons outside selects. Do not use orange/green banners or a large full-width generic Create button inside a dropdown.
- Use `BaseActionPanel` for a short explanatory message plus a related Create ingredient or Save synonym action. The owner explicitly wanted this panel for the **synonym** action, not the ordinary Add substitute action. The latter remains a compact button.
- Destructive actions are red throughout the app, including instructions, substitutions, notes, and shared menus. Use explicit red `Supprimer` text where requested (such as review-card actions); use red trash icons with accessible labels where icons suit the layout (such as section-heading removal). Check shared `getActionColor` behavior without accidentally making unrelated actions red.
- Overflow-menu entries need meaningful icons, matching instruction-step menus. Use clear action verbs, distinguish adding a section from removing it, and preserve semantic delete colors. Avoid bare text-only ingredient menus.
- Teleported menus do not inherit page-scoped styles. Use `recipe-editor-overlay`/menu `contentClass` where needed, and check autocomplete, nested menu, and dialog styling separately from the main page.
- Put explanatory analyzer warnings/details behind an accessible info popover; keep the main controls concise. Analyzer choices should use understandable names and short descriptions, not technical jargon. Selecting a method stages the choice; explicit Analyze runs it and replaces results.

- Include empty states and submission controls in every UI audit: remarks/notes, comments, no-results notices, and Send buttons are part of the design, not incidental leftovers. Routine absence of content is a quiet neutral state, not an informational alert: reuse `BaseEmptyState.vue` with semantic fill, secondary text, a small contextual icon, 12px corners, and 16px padding. Reserve colored alerts for actual feedback requiring attention. Match Send/Submit buttons to the tonal blue action family: 10px corners, approximately 44px height, a meaningful action icon, no raised pill styling, consistent spacing from the composer, and a disabled state for empty input. Preserve existing submission and error behavior; verify empty/populated and enabled/disabled states separately.

#### Sharing dialogs and status feedback

- Adding a cooked meal and editing its History event use the same `RecipeTimelinePhotoEditor.vue` component. Keep upload visibility, crop helper text, neutral rounded image card, and Apply/Reset/Remove actions identical; do not build separate photo-editor layouts in each modal. Keep the final history Save/Add action distinct from applying a crop.

- When converting colored headers to neutral surfaces, audit old component-specific foreground overrides too. `RecipeLastMade.vue` previously forced its title to `media-foreground`, making it white on white. Dialog titles use `on-surface`; white media text is reserved for artwork/photo overlays. Do not group title and submit-button foreground selectors: their backgrounds differ. Remove forced idle primary borders and check photo editors nested inside forms for double elevation, excess padding, and competing save actions. Optional comments/photos should be labeled clearly, without automatically opening the keyboard.

- Include hover help in UI audits. All Vuetify tooltips share the global `.v-tooltip .v-overlay__content` styling and `VTooltip` defaults: neutral elevated surface, semantic text, roughly 10px corners, subtle border/shadow, 13px sans-serif text, 8px/12px padding, and wrapping within 280px or the viewport. Do not add blue tooltip banners or page-scoped overrides; overlays are teleported. These measurements are Petit Chef conventions.
- Tooltips appear after a short hover delay (500ms), support keyboard focus, and fade without a sliding motion. Keep labels concise, localized, in sentence case, and focused on the action; prefer verbs and state-aware descriptions. Follow Apple's [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help) guidance. Give icon buttons an independent accessible name; hover text cannot be the only way to understand an action on touch devices. Preserve Vuetify activator bindings and Escape dismissal. Check hover, focus, pointer exit, long French text, viewport edges, and both themes; do not confuse tooltips with interactive help popovers.

- Use `RecipeDialogShare.vue` as the reference for sharing dialogs: a neutral shared dialog header, recipe/context name, concise explanation, and clearly separated Create link and Sharing links sections. Use approximately 24px desktop / 16px mobile padding, 24px between sections, and compact 14px rounded link cards. Keep explanatory text secondary and action labels explicit; avoid generic New buttons and clickable rows whose copy/share behavior is unclear.
- Put the expiration-date field and tonal plus-icon Create link action together; align their heights and stack them on narrow screens. Existing links show their expiration date with labeled Copy and Share actions. Show native Share only when supported. Revocation uses a red, accessible action labeled with its effect. Preserve clipboard errors and sharing behavior; show pending states, prevent duplicate requests, and retain a link when revocation fails.
- Routine success feedback, including copying a link, uses the shared `TheSnackbar.vue` presentation: a neutral `surface-elevated` surface, approximately 16px corners, subtle semantic border and soft shadow, readable 14px text, and a small semantic status icon. Do not restore saturated full-width green success banners. Error and warning states remain recognizable through their icon/color and clear wording; never rely on color alone.
- Keep copy confirmations short (French: « Lien de la recette copié »). Routine feedback dismisses automatically without moving focus; provide an accessible close icon. Preserve meaningful custom notification actions as labeled buttons. Keep status announcements accessible and avoid blocking alerts for ordinary successful actions. Check notifications on narrow screens and in both themes, including messages with custom actions and long text.
- Reuse the shared notification and empty-state components rather than styling each copy action independently. Include modal dates, empty/populated link lists, loading controls, and transient notifications in UI audits. These dimensions are Petit Chef conventions inspired by Apple's feedback guidance, not claims of exact native iOS behavior.

#### Reference appearance for submenus, selects, and search dropdowns

The owner explicitly approved the submenu opened by the blue **Add ingredient** split button at the bottom of the recipe ingredient editor. Use this as the visual reference when refactoring dropdowns across pages, including overflow/nested menus, selects, autocompletes, and search suggestion/results panels. Carry over its appearance while preserving each control's native keyboard, selection, and search behavior.

- The popup is a compact floating surface, with approximately 14px rounded outer corners, a subtle semantic separator border, and a soft Vuetify elevation shadow. Preserve the shadow that makes it distinct from the page; avoid flat square panels or heavy dark outlines. Use `surface-elevated` and semantic text colors so the same design works in dark mode.
- Give the list approximately 4px of internal padding, matching the 4px gaps between rows. Option rows have approximately 8px rounded corners, a minimum height of 44px, comfortable horizontal padding, and consistent gaps between a leading icon and the label. Keep icon and text columns aligned across rows; use 14px readable labels and semantic medium-emphasis icons for ordinary options.
- Verify the selected-state geometry, not only the popup shell: keep approximately 4px between option backgrounds and every popup edge, matching the 4px between option rows. Avoid double padding from a menu card wrapping a list: the card has no padding and the list owns the inset. Apply list padding to both direct lists and lists nested inside menu cards (History filters previously missed the nested case). Selects/autocompletes may virtualize their rows: put vertical gaps inside measured virtual-item wrappers, rather than unmeasured margins that can cause overlapping rows. Keep these rules global in `theme.css` so teleported menus inherit them. Inspect first/last items, adjacent selections, scrolling, keyboard navigation, and long French labels; remove local zero-padding overrides that defeat the shared inset.
- Hovered, keyboard-focused, and selected rows use a subtle rounded fill within the popup's padding, rather than a saturated full-width blue strip. Distinguish transient hover/focus from an actual selected value: an action menu has no persistent selection, while a select should retain a clear selected indication (such as a checkmark). Keep red destructive options and accessible keyboard focus recognizable.
- Preserve the reference's compact proportions: size the popup for its labels, constrain it to the viewport, wrap long French labels cleanly, and bound tall lists with scrolling. Avoid excessive blank space, oversized row heights, clipped text, and unnecessary separators between every option.
- Search/autocomplete panels use the same surface, rounding, shadow, row spacing, and highlight language. Keep query matching, loading, no-results messages, and Add/create actions clearly organized. Creation actions match the existing tonal blue plus-icon buttons, with descriptive labels.
- Start from `RecipePageIngredientEditor.vue` and the `.recipe-editor-overlay` rules in `frontend/app/assets/recipe-editor.css`. Inspect the computed Vuetify overlay/list styles too: the reference shadow and hover/selection appearance also come from Vuetify. When extending this pattern beyond recipe pages, reuse or extract shared menu styling instead of copying divergent page-specific rules. Ensure the styles reach teleported content via `contentClass`/`menu-props`.
- Compare the rendered dropdown against this reference, including pointer hover, keyboard navigation, selection, disabled items, long labels, mobile placement, and light/dark themes. A CSS-only inspection is insufficient evidence of a matching popup.

#### Recipe editor and analysis interactions

- Latest owner decision: **Ingredients, Categories, and Tags headings belong inside their cards.** Moving them outside was tried and explicitly rolled back. Instructions remain outside the step cards. In the recipe view, place the portions counter to the right of the Ingredients heading in the same wrapping row, with a subtle divider beneath both. Do not revive the abandoned outside-heading layout to make columns align.
- Header branding and navigation are neutral: Petit Chef text and hamburger icons use `text-primary` (black in light mode, white in dark mode), not action blue. The global link rule must exclude `.bistro-wordmark`; a previous scoped color rule lost to the more specific global link selector. Check the top bar **and** sidebar header, including Vuetify button color defaults. Decorative recipe-title artwork uses fully opaque `media-foreground` white; avoid reduced opacity that makes the title gray.
- Cook mode headings and step titles use **Fraunces** (`--bistro-heading`), as explicitly requested. Inputs, buttons, helper text, and instruction body text remain readable sans-serif. Keep the dedicated portions/Exit toolbar, neutral rounded shadow-free step cards, explicit completion controls, and responsive linked-ingredient layout. Do not add duplicate Instructions headings above the cooking steps. Preserve ingredient check state, step completion, scaling, reference links, and both linked/unlinked Cook mode layouts.
- Preserve meaningful ingredient text when food recognition is incomplete: do not render only a number/unit or an empty checkbox when original text is available. Check `RecipeIngredientListItem.vue` and the print renderer. Do not silently duplicate quantities or invent missing ingredient names; original unparsed text cannot safely be rescaled as if it were structured data.
- History uses a compact single-column timeline, with subject and date together inside each neutral rounded event card, readable avatars, bounded images, and labeled sort/filter controls. Avoid the old alternating wide layout, detached date chips, elevated cards, and empty card bodies on system events. Preserve permission checks for edit/delete, sorting, filtering, pagination, and recipe navigation when shared timeline components change.
- History image editing is part of the feature, not a decorative preview: use the existing timeline-image API for replacement/cropping and the existing image-presence field for removal. Revoke temporary object URLs, clear pending edits when reopening, refresh cached thumbnails after saving, and keep the modal open on image-upload failure. Verify crop, replace, remove, cancel, and reopen; do not persist changes merely to inspect the UI. Image upload and event-text update are separate requests, so do not assume the overall save is atomic.

#### Printing

- The print layout has its own semantic black/white surface and readable sans-serif typography. Keep the full wrapping recipe title, balanced image/title placement, compact three-part time summary, recipe-order ingredients, consistent section headings, and empty optional sections hidden. Avoid decorative handwriting for print time values, truncated titles, large blank areas, and screen-only controls/background dots.
- Apply page-break control to individual steps/notes and headings, not the entire instructions section. Preserve meaningful unresolved ingredient text, substitutions, linked ingredients, notes, and populated nutrition fields with all options enabled. Do not mutate the recipe while grouping it for print. Check long titles and multi-page recipes; do not force every recipe onto one page by making text too small.
- Verify a rendered PDF for clipping, orphaned sections, spacing, and ordering. Clearly distinguish a representative fixture from the owner's actual authenticated recipe. Browser-generated date/URL headers and footers are controlled by the print dialog, not the app's recipe layout.

#### Recipe editor behavior details

- Ingredient cards must stay compact. On wide screens place quantity, unit, food, and notes in a single organized row; reduce columns on smaller screens. Group Add substitute, deletion, and the overflow menu in one action row rather than three widely separated rows. The editor's `compact` mode is opt-in so the analysis/review modal can retain its appropriate layout.
- When splitting one original text into multiple ingredients, keep new ingredient editors together and move Add another ingredient **below all the added ingredients** for that text.
- Removing the last substitution must collapse the empty Substitutions section back to Add substitute, both in the analysis modal and normal recipe edit page. Derive visibility from actual saved rows and clear transient visibility flags on last-row removal.
- Section-title fields have consistent input styling and a red removal icon. Removing a heading clears/hides its title without deleting the ingredient or instruction. Prevent clicks on the field or its delete icon from bubbling into section-collapse or card actions.
- Drag-and-drop must show the destination clearly. Ingredients and instruction steps use a tinted placeholder with a blue dashed outline (`recipe-drop-target`) plus distinct chosen/dragging states. Do not rely solely on a barely visible opacity change. Verify reordering and touch behavior.
- Keep the dashed destination highlight without the solid vertical blue line on its left; the owner explicitly rejected that extra line.
- Align the original recipe URL field with the Extras API card below it; avoid negative outer margins that make their edges differ.
- Latest owner decision: **Remove the progress bar from the Analyze ingredients modal.** Keep one concise current-position counter (for example, `1 / 5`), distinct from any reviewed count. This supersedes the earlier request for a correctly scaled progress bar. Keep the header compact, with modest top padding and the title, counter, and close button vertically centered; allow long French titles to wrap without clipping.
- Previous/Next navigation preserves edits, missing-food/unit hints, additional ingredients, and substitutions. Removal and undo must keep navigation history and progress coherent. Do not treat a revisited/resolved ingredient as unavailable.
- Final verification uses compact collapsed cards with a clear summary and status, then an organized expanded editor. Keep whitespace after the introductory guidance (currently 24px), modest gaps between cards, and source text readable. Apply `box-sizing: border-box` when combining padding and minimum height so cards do not accidentally become oversized.
- Reference linking is presented as associating ingredients/notes with a cooking step: show the current step clearly, selection counts, meaningful automatic-selection text, and explicit Apply / Apply and next step actions. Explain that an ingredient can be used in several steps. Keep selections staged until Apply; cancellation must not persist them.

#### Recipe cards, favorites, and timeline lessons (2026-10-09)

- Recipe-card titles use semantic primary text: black in light mode and white in dark mode. Descriptions use `text-secondary`, visibly quieter than the title; neither should inherit action-blue link styling. Check every card variant, including the recipe listing, menu, timeline, and cards revealed from shopping items. Allow a truncated menu-card title to be expanded in full when clicked, without accidentally triggering unrelated actions.
- Timeline recipe cards need their own visible semantic border and approximately 14px corners, even when nested inside an event card. Keep images bounded, stars centered and comparable in size to listing-card stars, and heart/overflow actions grouped inside the card. Give icon actions contrasting foregrounds and subtle tonal backgrounds, with roughly 44px targets and 10px corners; avoid gray blocks with invisible icons. Use the shared `RecipeRating` component rather than a separate star implementation. The timeline uses the same `RecipeLoading` presentation as the listing, with an appropriate localized loading label.
- Favorites must update shared reactive state after a successful API response. Removing a favorite on the current user's favorites page must immediately remove its card; adding/removing it elsewhere must update the menu label and filled/empty heart without a refresh. Derive menu entries with `computed` from current state, rather than keeping a snapshot. Prevent duplicate pending requests, retain state on failure, and preserve the existing numeric rating when changing only the favorite flag.
- New recipe filters, including Author, use the existing `SearchFilter` presentation and interaction patterns. Keep reset behavior, URL initialization/serialization, query construction, permissions, and localized labels consistent with the other filters. Center the quiet empty-meal message within an unplanned menu day.

#### Shopping-list interactions and layout lessons (2026-10-09)

- Portion selection must affect quantities, not merely change a counter. Use the recipe's base servings to calculate the scaling factor, and apply the same behavior from every recipe-to-list entry point: menu cards, recipe details, and listing cards. Preserve meaningful unparsed ingredient text; do not invent scalable quantities where structured data is missing.
- In linked recipes, explicitly label the counter as portions. A plus/minus action changes one portion, which can be a fraction of a whole recipe when calling the existing API. Place the stepper beside the recipe link as a separate control group; avoid nesting its buttons inside a clickable card/link. Keep comfortable targets and prevent click propagation into navigation.
- Portion adjustments should feel immediate: update the displayed target promptly, coalesce rapid clicks, serialize requests, and reconcile confirmed server state. Reuse the returned shopping list where available instead of adding a full refresh for each click. Release pending locks in `finally`, surface failures, and allow retry; check rapid repeated clicks, fractional recipe increments, minimum portions, and failed requests.
- Linked-recipe info uses the app's normal accessible info-button treatment, with a readable icon and comfortable target. Explain what portion controls do in concise French and English. Recipe previews opened from individual shopping items follow the same rounded, bordered card language and readable wrapping titles as the rest of the app.
- Checked shopping items belong in a rounded grouped panel with a clear count and labeled Uncheck all/Delete checked actions. Use subdued ingredient text and restrained strikethrough; keep the completion date smaller and secondary beneath its ingredient, without strikethrough or an oversized italic row. Keep checkbox targets easy to use and destructive actions red.
- Shopping-item and tag reordering retain the blue dashed destination placeholder without a solid vertical blue line. The chosen item and actual drag preview need matching rounded corners and a sufficiently opaque semantic surface so content underneath does not show through. Check the drag preview itself, including native/fallback and touch behavior, rather than only the original row. In the Reorganize shopping tags modal, the scrollable body fills the available space down to the footer instead of leaving an unused bottom region.
- Recipe-to-list selection dialogs use a neutral header, compact rounded selection rows, clear list names/avatars, and a readable own-lists toggle. Preserve selection behavior and use the shared dialog/menu styling rather than bespoke elevated square cards.

#### Analysis review and mobile controls lessons (2026-10-09)

- Expanded final-review ingredient fields keep normal input heights (approximately 56px in the current review layout), not tall stacked blocks. Check the outer `.v-field`, `.v-field__input`, and nested native input together; `box-sizing: border-box` prevents padding from inflating height. Scope adjustments to the review/editor mode, preserving Vuetify label geometry and error/helper space.
- An empty labeled field shows one prompt. Do not display the same text as both label and persistent placeholder; let Vuetify move the label when focused or populated. Verify empty, focused, typed, and blurred states, especially Notes, unit, and food fields. Follow the recipe edit page's section-title placement in final review, above the source-text block and ingredient fields.
- Keep Move up, Move down, Delete, and the overflow menu together in one compact action row; the dots must not fall into an isolated row on mobile. Make the final Verify all action fit its full French label; when needed, place it on a full-width footer row while keeping Previous and removal actions organized separately.
- The analyzer debugger shows confidence from the selected analyzer's actual result. If that analyzer has not analyzed the input or supplied confidence, show an explicit unavailable state rather than a stale value or an invented zero. Error feedback should identify the failed action and useful available detail instead of only a generic error message.

#### Responsive polish and regression lessons (2026-10-09)

- Size buttons for their full localized labels and icons. The French webhook Save action must not be clipped; allow the action group to wrap while keeping each button's content intact. Related bulk-import Add actions have matching width/height and clear French wording describing categories/tags applied to each recipe.
- Alias-manager delete buttons keep a stable rounded-rectangle shape when pressed, with an accessible label and red icon. Place Create in the modal body below the alias input rows. User-management section shells are borderless while individual fields retain their outlines. Statistics cards use `on-surface`/secondary text on neutral surfaces; reserve white foregrounds for colored icon badges or media backgrounds.
- Recipe-menu resize diagnostics observed an initially empty overlay changing through several widths while Vuetify positioned it. A constrained stable menu width and a nonzero loading body were applied as a targeted mitigation; live confirmation is still required. Do not treat lint as proof that a `ResizeObserver` loop is resolved, suppress the error globally, or remove diagnostic evidence before verifying the cause. Keep long labels wrapping and menus bounded by the viewport.
- Inspect the saved source after scripted edits. Mixed CRLF/LF line endings caused exact replacements to silently miss, including a leftover `menuItems.value` assignment that accessed a newly computed declaration before initialization. Check for old assignments, duplicate style blocks, and remaining props after refactors; lint alone may not catch runtime ordering errors. Keep timeline rules scoped and remove redundant copies rather than appending more overrides.
- Distinguish implemented changes from verified behavior. Run targeted lint and meaningful regressions for state updates, portions, and modal navigation, but report authenticated visual checks and resize-loop confirmation as pending until actually observed. Check mobile French labels and both themes; never claim a broad check passed when unrelated pre-existing failures remain.

#### French wording, reuse, and verification

- French is primary and English must remain usable. Translate new titles, buttons, helper text, tooltips, and empty states together. Avoid technical/literal wording such as `Lier les références` or unexplained `Auto`; prefer the existing `Associer les ingrédients et notes` and explicit detection/apply labels (with proper French accents in locale files).
- The owner requested the exact synonym wording: `Enregistrez « {name} » comme synonyme de « {item} ».` Do not revert it to `autre nom`. Keep synonym, substitution, creating a food in the database, and adding another ingredient to a recipe as distinct actions.
- Reuse the established components and semantic tokens first. Main references: `frontend/app/assets/recipe-editor.css`, `frontend/app/components/global/BaseDialogContent.vue`, `BaseActionPanel.vue`, `frontend/app/lib/action-color.ts`, `RecipeIngredientEditor.vue`, `RecipeIngredientSubstitutionEditor.vue`, and `RecipePage/RecipePageParts/RecipeParseDialog/` under `frontend/app/components/Domain/Recipe/`.
- Prefer narrowly scoped rules and opt-in props. Review shared-component changes across their callers: a modal header change must not alter confirmation semantics; a card rule must not affect the transparent summary; compact recipe fields must not break expanded review cards.
- Inspect the installed Vuetify API/source when unsure. In the analyzer select's item slot the installed version supplies a raw item; assuming `item.raw.value` caused a crash. Do not generalize that shape to all slots without checking.
- Verify the full editor, including collapsed/expanded states and its ingredient menus, substitution/synonym/create flows, analysis and final review, reference linking, image/crop/delete dialogs, settings/owner menus, category/tag creation, notes, assets, and advanced fields. Check narrow and wide layouts, idle/focused fields, long French labels, keyboard access, and light/dark appearance.
- Use screenshots of the actual authenticated editor at the top, middle, and bottom and of relevant menus/modals. Automated browser sessions may require a separate sign-in; ask the owner to sign in instead of reading credentials or bypassing authentication. A blank/loading/login screenshot is not evidence that the editor looks correct. If access is unavailable, clearly report visual verification as pending rather than claiming completion.
- Run targeted lint and meaningful existing regression tests for affected behavior. Keep test selectors synchronized with intentional component changes, while still checking behavior. Do not describe unit tests or lint as visual verification, and do not claim a broad check passed if unrelated pre-existing errors remain.
- Work incrementally, preserve unrelated local changes, and do not save/delete real recipe data merely to inspect UI. These instructions and setup guidance remain local unless the owner explicitly requests a commit or push.

### Verified local development setup and gotchas (2026-10-08)

- Preferred Windows setup: **Docker backend + local frontend**. Docker Desktop must use Linux containers. Do not use WSL as the default fallback.
- Native Windows `task setup:py` failed building `python-ldap==3.4.8` because Microsoft Visual C++ build tools were missing. Docker successfully built the locked dependency with Linux LDAP/SASL development libraries; do not modify backend dependencies to bypass this.
- Install Task with `winget install --id Task.Task --exact --source winget`. With Node installed, install the package-manager version specified in `frontend/package.json` (`npm install --global pnpm@11.23.0` for this checkout). Open a fresh terminal after installing tools. Codex's private pnpm path is insufficient: the owner's ordinary terminals must resolve pnpm themselves. Initial `task ui` failed with `pnpm: executable file not found in $PATH` until user-PATH pnpm was installed.
- Install frontend dependencies from `frontend` with `pnpm install --frozen-lockfile`; preserve both lockfiles. From the root, build the backend with `docker compose -f compose.petit-chef.yml build backend`. The development Dockerfile uses Python 3.12, uv, and `UV_FROZEN=1`; its environment is `/opt/mealie-venv`, separate from Windows `.venv`.
- Start visible terminals with `powershell -ExecutionPolicy Bypass -File dev/start-petit-chef.ps1`. Alternatively, run `docker compose -f compose.petit-chef.yml up --build backend` in one terminal and `task ui` in another. Keep Compose attached (no `-d`). Ctrl+C stops the service; rerun its command to restart.
- First backend startup builds the editable project and applies existing SQLite migrations to `dev/data`. This took several minutes on the Windows bind mount. Wait for **Application startup complete** before opening `http://localhost:3000`. Preserve `dev/data`; never clean it without explicit authorization.
- Opening the frontend before backend readiness caused **An error occurred** and `NUXT_E1005`. `frontend/app/plugins/app-info.client.ts` requires `/api/app/about` during initialization. Check `http://localhost:9000/api/app/about` and `http://localhost:3000/api/app/about`; once both return HTTP 200, reload the browser. This was resolved by completing startup, without frontend or backend source changes.
- PowerShell 5 may display a misleading `NativeCommandError` when `task` writes normal status output to stderr through `2>&1 | Tee-Object`. Prefer the launcher's direct commands. If logging through a pipeline, merge output inside `cmd /c 'task ui 2>&1'` first, and set `[Console]::OutputEncoding = [Text.UTF8Encoding]::new()` to avoid garbled Unicode.
- Translation-hook gotcha: `postTranslation` in `frontend/app/i18n.config.ts` also receives VNode arrays from `i18n-t`, including the Language dialog's contribution link. Apply the Mealie-to-Petit-Chef string replacement only to strings, and return other values unchanged. The former unconditional `.replace()` caused `message.replace is not a function`, followed by secondary Vue `emitsOptions`, null-vnode, and lifecycle errors when navigating. Regression coverage is in `frontend/app/i18n.config.test.ts` for English and French interpolated links. After a render failure, fully refresh the browser instead of relying on hot reload to recover component state.
- Verified: frontend HTTP 200, backend docs HTTP 200, frontend-proxied app-info HTTP 200; the owner confirmed the app works in their browser. Setup details are in `docs/petit-chef-development.md`. These guidance and setup files are intentionally kept local at the owner's request; do not commit or push them without a subsequent request.

## Project Overview

Mealie is a self-hosted recipe manager, meal planner, and shopping list application with a FastAPI backend (Python 3.12) and Nuxt 4 frontend (Vue 3 + TypeScript). It uses SQLAlchemy ORM with support for SQLite and PostgreSQL databases.

**Development vs Production:**
- **Development:** Frontend (port 3000) and backend (port 9000) run as separate processes
- **Production:** Frontend is statically generated and served via FastAPI's SPA module (`mealie/routes/spa/`) in a single container

## Architecture & Key Patterns

### Backend Architecture (mealie/)

**Repository-Service-Controller Pattern:**
- **Controllers** (`mealie/routes/**/controller_*.py`): Inherit from `BaseUserController` or `BaseAdminController`, handle HTTP concerns, delegate to services
- **Services** (`mealie/services/`): Business logic layer, inherit from `BaseService`, coordinate repos and external dependencies
- **Repositories** (`mealie/repos/`): Data access layer using SQLAlchemy, accessed via `AllRepositories` factory
  - Get repos via dependency injection: `repos: AllRepositories = Depends(get_repositories)`
  - All repos scoped to group/household context automatically

**Route Organization:**
- Routes in `mealie/routes/` organized by domain (auth, recipe, groups, households, admin)
- Use `APIRouter` with FastAPI dependency injection
- Apply `@router.get/post/put/delete` decorators with Pydantic response models
- Route controllers use `HttpRepo` mixin for common CRUD operations (see `mealie/routes/_base/mixins.py`)

**Schemas & Type Generation:**
- Pydantic schemas in `mealie/schema/` with strict separation: `*In`, `*Out`, `*Create`, `*Update` suffixes
- Auto-exported from submodules via `__init__.py` files (generated by `task dev:generate`)
- TypeScript types auto-generated from Pydantic schemas - **never manually edit** `frontend/app/lib/api/types/`

**Database & Sessions:**
- Session management via `Depends(generate_session)` in FastAPI routes
- Use `session_context()` context manager in services/scripts
- SQLAlchemy models in `mealie/db/models/`, migrations in `mealie/alembic/`
- Create migrations: `task py:migrate -- "description"`

### Frontend Architecture (frontend/)

**Component Organization (strict naming conventions):**
- **Domain Components** (`components/Domain/`): Feature-specific, prefix with domain (e.g., `AdminDashboard`)
- **Global Components** (`components/global/`): Reusable primitives, prefix with `Base` (e.g., `BaseButton`)
- **Layout Components** (`components/Layout/`): Layout-only, prefix with `App` if props or `The` if singleton
- **Page Components** (`components/` with page prefix): Last resort for breaking up complex pages

**API Client Pattern:**
- API clients in `frontend/app/lib/api/` extend `BaseAPI`, `BaseCRUDAPI`, or `BaseCRUDAPIReadOnly`
- Types imported from auto-generated `frontend/app/lib/api/types/` (DO NOT EDIT MANUALLY)
- Composables in `frontend/app/composables/` for shared state and API logic (e.g., `use-mealie-auth.ts`)
- Use `useAuthBackend()` for authentication state, `useMealieAuth()` for user management

**State Management:**
- Nuxt 4 composables for state (no Vuex)
- Auth state via `use-mealie-auth.ts` composable
- Prefer composables over global state stores

## Essential Commands (via Task/Taskfile.yml)

**Development workflow:**
```bash
task setup              # Install all dependencies (Python + Node)
task dev:services       # Start Postgres & Mailpit containers
task py                 # Start FastAPI backend (port 9000)
task ui                 # Start Nuxt frontend (port 3000)
task docs               # Start Zensical documentation server
```

**Code generation (REQUIRED after schema changes):**
```bash
task dev:generate       # Generate TypeScript types, schema exports, test helpers
```

**Testing & Quality:**
```bash
task py:test            # Run pytest (supports args: task py:test -- -k test_name)
task py:check           # Format + lint + type-check + test (full validation)
task py:format          # Ruff format
task py:lint            # Ruff check
task py:mypy            # Type checking
task ui:test            # Vitest frontend tests
task ui:check           # Frontend lint + test
```

**Database:**
```bash
task py:migrate -- "description"  # Generate Alembic migration
task py:postgres        # Run backend with PostgreSQL config
```

**Docker:**
```bash
task docker:prod        # Build and run production Docker compose
```

## Critical Development Practices

### Python Backend

1. **Always use `uv` for Python commands** (not `python` or `pip`):
   ```bash
   uv run python mealie/app.py
   uv run pytest tests/
   ```

2. **Type hints are mandatory:** Use mypy-compatible annotations, handle Optional types explicitly

3. **Dependency injection pattern:**
   ```python
   from fastapi import Depends
   from mealie.repos.all_repositories import get_repositories, AllRepositories


   def my_route(repos: AllRepositories = Depends(get_repositories), user: PrivateUser = Depends(get_current_user)):
       recipe = repos.recipes.get_one(recipe_id)
   ```

4. **Settings & Configuration:**
   - Get settings: `settings = get_app_settings()` (cached singleton)
   - Get directories: `dirs = get_app_dirs()`
   - Never instantiate `AppSettings()` directly

5. **Testing:**
   - Fixtures in `tests/fixtures/`
   - Use `api_client` fixture for integration tests
   - Follow existing patterns in `tests/integration_tests/` and `tests/unit_tests/`

### Frontend

1. **Run code generation after backend schema changes:** `task dev:generate`

2. **TypeScript strict mode:** All code must pass type checking

3. **Component naming:** Follow strict conventions (see Architecture section above)

4. **API calls pattern:**
   ```typescript
   const api = useUserApi();
   const recipe = await api.recipes.getOne(recipeId);
   ```

5. **Composables for shared logic:** Prefer composables in `composables/` over inline code duplication

6. **Translations:** Only modify `en-US` locale files when adding new translation strings - other locales are managed via Crowdin and **must never be modified** (PRs modifying non-English locales will be rejected)

### Cross-Cutting Concerns

1. **Code generation is source of truth:** After Pydantic schema changes, run `task dev:generate` to update:
   - TypeScript types (`frontend/app/lib/api/types/`)
   - Schema exports (`mealie/schema/*/__init__.py`)
   - Test data paths and routes

2. **Multi-tenancy:** All data scoped to **groups** and **households**:
   - Groups contain multiple households
   - Households contain recipes, meal plans, shopping lists
   - Repositories automatically filter by group/household context

3. **Pre-commit hooks:** Install via `task setup:py`, enforces Ruff formatting/linting

4. **Testing before PRs:** Run `task py:check` and `task ui:check` before submitting PRs

## Pull Request Best Practices

### Before Submitting a PR

1. **Draft PRs are optional:** Create a draft PR early if you want feedback while working, or open directly as ready when complete
2. **Verify code generation:** If you modified Pydantic schemas, ensure `task dev:generate` was run
3. **Follow Conventional Commits:** Title your PR according to the conventional commits format (see PR template)
4. **Add release notes:** Include user-facing changes in the PR description

### What to Review

**Architecture & Patterns:**
- Does the code follow the repository-service-controller pattern?
- Are controllers delegating business logic to services?
- Are services coordinating repositories, not accessing the database directly?
- Is dependency injection used properly (`Depends(get_repositories)`, `Depends(get_current_user)`)?

**Data Scoping:**
- Are repositories correctly scoped to group/household context?
- Do route handlers properly validate group/household ownership before operations?
- Are multi-tenant boundaries enforced (users can't access other groups' data)?

**Type Safety:**
- Are type hints present on all functions and methods?
- Are Pydantic schemas using correct suffixes (`*In`, `*Out`, `*Create`, `*Update`)?
- For frontend, does TypeScript code pass strict type checking?

**Generated Files:**
- Verify `frontend/app/lib/api/types/` files weren't manually edited (they're auto-generated)
- Check that `mealie/schema/*/__init__.py` exports match actual schema files (auto-generated)
- If schemas changed, confirm generated files were updated via `task dev:generate`

**Code Quality:**
- Is the code readable and well-organized?
- Are complex operations documented with clear comments?
- Do component names follow the strict naming conventions (Domain/Global/Layout/Page prefixes)?
- Are composables used for shared frontend logic instead of duplication?

**Translations:**
- Were only `en-US` locale files modified for new translation strings?
- Verify no other locale files (managed by Crowdin) were touched

**Database Changes:**
- Are Alembic migrations included for schema changes?
- Are migrations tested against both SQLite and PostgreSQL?

### Review Etiquette

- Be constructive and specific in feedback
- Suggest code examples when proposing changes
- Focus on architecture and logic - formatting/linting is handled by CI
- Use "Approve" when ready to merge, "Request Changes" for blocking issues, "Comment" for non-blocking suggestions

## Common Gotchas

- **Don't manually edit generated files:** `frontend/app/lib/api/types/`, schema `__init__.py` files
- **Repository context:** Repos are group/household-scoped - passing wrong IDs causes 404s
- **Session handling:** Don't create sessions manually, use dependency injection or `session_context()`
- **Schema changes require codegen:** After changing Pydantic models, run `task dev:generate`
- **Translation files:** Only modify `en-US` locale files - all other locales are managed by Crowdin
- **Dev containers:** This project uses VS Code dev containers - leverage the pre-configured environment
- **Task commands:** Use `task` commands instead of direct tool invocation for consistency

## Key Files to Reference

- `Taskfile.yml` - All development commands and workflows
- `mealie/routes/_base/base_controllers.py` - Controller base classes and patterns
- `mealie/repos/repository_factory.py` - Repository factory and available repos
- `frontend/app/lib/api/base/base-clients.ts` - API client base classes
- `tests/conftest.py` - Test fixtures and setup
- `dev/code-generation/main.py` - Code generation entry point

## Additional Resources

- [Documentation](https://docs.mealie.io/)
- [Contributors Guide](https://nightly.mealie.io/contributors/developers-guide/code-contributions/)
- [Discord](https://discord.gg/QuStdQGSGK)
