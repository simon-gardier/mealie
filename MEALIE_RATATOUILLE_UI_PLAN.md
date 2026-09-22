# Mealie: Ratatouille-inspired UI plan

## 1. Objective and scope

Reshape this Mealie fork into a warm, playful Ratatouille-inspired Parisian cooking website. Preserve existing features, permissions, data scoping and workflows while introducing the requested visual design and, where needed, focused feature additions.

The current priority is development and live testing on this computer through WSL.
- Frontend preview: `http://localhost:3000`
- Backend: `http://localhost:9000`
No need to re-run the app, it is already running

The inspected checkout reports Mealie **3.27.0**, with Vue 3, Nuxt 4 and Vuetify 4. Use the current checkout as the baseline; do not downgrade to the previous plan's 3.25.1 assumption.

## 2. Establish the WSL development baseline

Keep the existing checkout at the paths above. Run dependency management, development servers, generation and checks inside WSL. Use a WSL-connected editor so its language tools use the same environment. Do not create a second clone or share Windows-installed dependencies with the Linux runtime.

Planned preparation:

1. Inspect the current branch, working tree and remotes; preserve existing work.
2. Record the baseline commit and any pre-existing failures. Use a focused `codex/ratatouille-ui` branch when implementation begins, unless an existing customization branch is already appropriate.
3. Check WSL prerequisites against this checkout: Python 3.12 through `uv`, Node 24, pnpm 11.23.0 and the Task CLI. These versions come from the repository configuration, not a new upgrade requirement.
4. Inspect local environment overrides and use development-only data. Begin with the default SQLite setup; use `task dev:services` only when PostgreSQL or Mailpit is needed.
5. Install dependencies inside WSL using the repository tasks.

Future setup commands, from a WSL shell:

```bash
cd /mnt/c/Users/nayko/Downloads/mealie
task setup
```

Then use two WSL terminals, both in that directory:

```bash
# Terminal 1: FastAPI backend on port 9000
task py
```

```bash
# Terminal 2: Nuxt frontend on port 3000
task ui
```

Open `http://localhost:3000` in the Windows browser. Verify API requests, login and hot reload before starting the redesign. If Windows-to-WSL access or file watching fails, diagnose the listener, forwarding and watcher settings. Enable polling only if needed; keep the requested checkout location unchanged.

The daily feedback loop is: edit a small UI section, inspect the hot-reloaded page, exercise its controls, check desktop and mobile widths, then run the relevant checks. Backend changes may require a backend restart; verify actual reload behavior rather than assuming it.

Baseline acceptance:

- [ ] Frontend and backend run together from WSL.
- [ ] Login, browsing, editing, importing, planning and shopping lists work on test data.
- [ ] A small frontend edit appears through hot reload.
- [ ] Representative desktop and mobile screenshots and page actions are recorded.
- [ ] Existing failures are distinguished from regressions.

A container build is not a prerequisite for this milestone.

## 3. Design specification

The customization guide is the source for visual and feature intent. Replace the old generic burgundy-and-brass proposal with its specified palette:

| Token | Value | Intended use |
| --- | --- | --- |
| Cream | `#f5efe1` | Main background |
| Paper | `#fffaf0` | Cards and menu surfaces |
| Tomato | `#b85336` | Primary actions |
| Sage | `#78866b` | Filters, tags and secondary accents |
| Navy | `#243447` | Strong text and navigation |
| Copper | `#b77945` | Fine borders and cookware details |
| Ink | `#302820` | Body text |
| Butter | `#e4bd64` | Ratings and highlights |

Use **Fraunces** for editorial headings, **Inter** for functional text, and **Borel** sparingly for handwritten notes. Define accessible text/background combinations, semantic status colors and a matching dark palette before applying the theme broadly.

Use paper grain, fine irregular borders, restrained shadows, market labels, copper cookware, tiled-kitchen details and Parisian motifs. Keep food photography and recipe text prominent.

### Character direction to settle before asset production

The guide's opening requests Remy, movie-inspired branding and Disney/Pixar imagery for personal use. Later sections request an original chef rat and avoiding the exact character design. Keep both directions visible as an unresolved choice; settle the character and branding direction before producing final assets. The layout and theme foundation can proceed independently.

Plan character states for welcome, search, loading, no results, saved, error, success and timer completion. Start with static poses, then add lightweight SVG or Lottie motion where useful. Keep one prominent character moment per screen, provide reduced-motion alternatives, and avoid decorative motion during focused cooking.

## 4. Map requested features to existing Mealie behavior

Before implementing each feature, inspect the existing components and APIs. Restyle existing behavior where it exists; record missing behavior as an explicit feature task with its own acceptance checks. Do not assume every concept in the guide is already supported.

| Area | Requested experience | Behavior to inspect before implementation |
| --- | --- | --- |
| Header and navigation | Bistro wordmark, mascot/hat, tail or hand-drawn active underline | Map Recipes, Ingredients, Collections and Favorites onto real routes without removing planning, shopping or administration access |
| Search and browse | Hero search, aroma hints, market-label ingredient chips, pantry filters, orderly grid, helpful empty state | Search suggestions, ingredient filtering, sorting and alternative-match support |
| Homepage | Tonight's specials, seasonal ingredient carousel, cookbook dividers, recently viewed cards | Sources for curated/seasonal content and whether viewing history exists; do not invent user history |
| Recipe cards | Index-card treatment, subtle lift, ribbon save, illustrated detail, themed rating | Available time, difficulty, season and dietary metadata; preserve card actions and accessible rating semantics |
| Recipe detail | Warm photography, editorial title, menu-card facts, Start cooking action | Available metadata and entry into existing cooking views |
| Ingredients | Market-list styling, serving scaling, readable checked items, component groups | Existing scaling, grouping and checkbox behavior |
| Instructions | Enamel step numbers, highlighted times/temperatures, optional tips and illustrations | Existing step data, notes, media and timer behavior |
| Favorites and collections | Personal notebook, handwritten organization, mascot empty state | Existing favorites/cookbooks versus any genuinely new folder behavior |
| Shopping | Folded market list, repeated-ingredient grouping, recipe attribution, print/mobile views | Current grouping, attribution and printing support |
| Cooking mode | Large type, optional one-step view, large controls, persistent timers | Navigation and timer persistence semantics; voice controls only if supported |
| Feedback | Save/plated-dish response, herb celebration, timer rattle, seasonal accents | Trigger only on actual successful actions; retain readable status and error feedback |

Preserve the backend, API contracts and database schema for appearance-only stages. If an agreed feature needs new persisted data or API behavior, plan that separately using Mealie's repository-service-controller pattern and group/household boundaries. Schema changes require `task dev:generate`; never edit generated API types manually.

## 5. Theme architecture and repository conventions

Use Mealie's existing Vue components, Vuetify theme, props and slots. Avoid a second UI framework and copies of whole pages made solely for styling.

| Existing path | Planned role |
| --- | --- |
| `frontend/nuxt.config.ts` | Styles and font/document configuration |
| `frontend/app/plugins/theme.ts` | Runtime Vuetify palette integration |
| `frontend/app/assets/main.css` | Existing global styles to account for |
| `frontend/app/assets/style-overrides.scss` | Existing overrides to review |
| `frontend/app/components/Layout/DefaultLayout.vue` | Main application layout |
| `frontend/app/components/Layout/LayoutParts/` | Header and navigation |
| `frontend/app/layouts/` | Alternate and administration layouts |
| `frontend/app/components/Domain/Recipe/` | Recipe cards and recipe UI |
| `frontend/app/pages/` | Page composition and behavior |
| `frontend/public/` | Portable static assets |

Proposed additions, to create only during implementation:

- `frontend/app/assets/ratatouille/`: tokens, typography and scoped component styling, imported through a main theme stylesheet.
- `frontend/public/ratatouille/`: optimized images, character assets and fonts.
- Reusable decoration under `components/global/` with `Base` names; layout elements under `components/Layout/` with `App` or `The` names; feature components under the relevant `components/Domain/` directory with domain prefixes.
- `docs/custom-ui/`: design decisions, feature/acceptance inventory and upstream integration notes.

The current theme plugin fetches `/api/app/about/theme`. Account for those runtime colors; changing CSS or configuration defaults alone will not reliably establish the palette. Keep one deliberate source of truth for each color and ensure dialogs and menus rendered outside page wrappers receive the theme.

Use stable classes, narrowly scoped selectors and reusable components. Preserve event handlers, bindings, validation, permissions, routes, loading/error/empty states, keyboard access, touch interactions and translation keys. Add new strings only to `en-US`.

## 6. Implementation milestones for later work

| Stage | Scope | Live acceptance criterion |
| --- | --- | --- |
| 0. Baseline | WSL setup and original application | Local workflows and hot reload work |
| 1. First visual slice | Palette, fonts, shared controls, header/navigation and one recipe-card variant | A coherent desktop/mobile preview with existing actions intact |
| 2. Discovery | Home, search, filters, cards, favorites and collections | Search, filtering, sorting and saving work; new content has a defined data source |
| 3. Recipe and cooking | Detail, ingredients, instructions, tips and cooking mode | Scaling, editing, checking steps, timers and printing retain correct behavior |
| 4. Supporting workflows | Creation/import, planner, shopping, account, household and administration | No workflows or permission-dependent controls are lost |
| 5. Character and icons | Chosen character direction, core poses and consistent cooking icons | Welcome/search/save/error states remain understandable without animation |
| 6. Motion and atmosphere | Short feedback, restrained loops, seasonal details and optional page transitions | Reduced motion works and animation does not obstruct cooking or slow actions |
| 7. Final local review | Responsive coverage, accessibility, performance and regression checks | Agreed feature inventory passes on the dev machine |

Complete one representative screen before extending its treatment. Each stage should remain reviewable in the local browser. Missing functional capabilities discovered in section 4 become bounded tasks in the relevant stage, rather than being hidden inside styling changes.

## 7. Verification plan

During implementation, use live browser checks for each changed screen and focused automated tests for meaningful behavior changes. Record pre-existing failures separately.

Local development login is stored separately in the Git-ignored MEALIE_LOCAL_LOGIN.md file.

The current `task ui:test` invokes Vitest in watch mode. For a finite frontend verification run use:

```bash
task ui:lint
pnpm --dir frontend test:ci
task ui:generate
```

`task ui:check` remains the repository's combined lint/test task. Before submitting a PR, run the required `task py:check` and `task ui:check`, ensuring the watch-mode test result is captured. Include TypeScript checking using the checkout's supported Nuxt tooling when implementation starts; static generation alone is not proof of type safety.

Use relevant existing Playwright workflows for substantial behavioral changes. Its current full `task e2e` workflow builds and runs containers; document that requirement if choosing it. Manual live checks and focused tests are the immediate development loop, with container-based end-to-end validation deferred until needed.

Manual acceptance covers:

- Guest, ordinary-user and administrator permissions and navigation.
- Login/logout, recipe search, import, creation, editing, scaling and deletion on test data.
- Favorites, collections, planner and shopping-list actions.
- Validation, network errors, loading states and empty states.
- Menus, dialogs, tooltips, notifications, keyboard focus and touch controls.
- Narrow screens, long titles, translated text, dark mode and reduced motion.
- Cooking views, timers and readable print output.
- Optimized images, explicit dimensions, sensible lazy loading and responsive interaction.

## 8. Future container portability

The repository already contains `docker/Dockerfile`, which builds the static frontend and packages it with the Python backend. This provides the route to a container containing the customized application later. It has not been built or validated as part of this planning work.

Keep assets in the repository, avoid hardcoded Windows/WSL paths in application code, preserve static frontend generation and keep environment-specific settings configurable. A later packaging milestone will build and smoke-test the image and verify support for the target machine's architecture.

Registry publishing, multi-platform build automation, host-specific configuration, reverse proxies, production data migration and deployment/rollback procedures are outside the current plan. None is needed to begin live UI development.

## 9. Maintainability

Keep changes small and focused. Record intentional edits to upstream components and the baseline commit. For future upstream upgrades, review release notes and changed customized files, preserve upstream ancestry, resolve conflicts, then repeat local behavior and visual checks. Updating the fork and packaging an image remain separate operations.

The first implementation deliverable is a working WSL preview with the theme foundation, header and recipe cards applied, verified at desktop and mobile widths. Continue page by page after that review.

## Local references

- [Development instructions](AGENTS.md)
- [Task definitions](Taskfile.yml)
- [Frontend dependencies](frontend/package.json)
- [Python requirements](pyproject.toml)
- [Development environment reference](.devcontainer/devcontainer.json)
- [Runtime theme plugin](frontend/app/plugins/theme.ts)
- [Container build](docker/Dockerfile)

## First visual slice implementation

See [implementation and verification notes](docs/custom-ui/first-visual-slice.md).
