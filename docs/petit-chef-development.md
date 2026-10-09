# Petit Chef development

Read the fork requirements at the top of `AGENTS.md`. This repository is the portable source of project context; commit and push these instructions so a checkout on another machine includes them.

## Fresh installation

### Preferred Windows setup: Docker backend, local frontend

The owner prefers Docker over WSL. Start Docker Desktop (Linux containers), install Node.js, pnpm, and Task, then run `pnpm install --frozen-lockfile` in `frontend`. Run `docker compose -f compose.petit-chef.yml build backend` from the root. The image installs Python 3.12, uv, and the Linux LDAP build libraries using the committed Python lockfile. Backend source is mounted from the checkout for reload; its Python environment stays inside the image at `/opt/mealie-venv`, separate from Windows `.venv`.

With Node.js installed, run `npm install --global pnpm@11.23.0` (the version specified by this checkout), then open a fresh terminal. Do not rely on a pnpm executable in Codex's private runtime: ordinary visible terminals must find pnpm on their own PATH.

Run `dev/start-petit-chef.ps1` as shown below to open two visible terminals. The backend terminal runs `docker compose -f compose.petit-chef.yml up --build backend`; the frontend runs `task ui`. Ctrl+C stops the attached backend; rerun the Compose command to restart. Compose binds the backend to localhost port 9000 and stores development data in the checkout's ignored `dev/data` directory.

Native Windows `task setup:py` was attempted on 2026-10-08 and failed building `python-ldap==3.4.8` because Microsoft Visual C++ build tools were missing. Use Docker instead of changing or bypassing backend dependencies.

### Upstream native or Linux setup

Prerequisites: Git, Python 3.12 (uv can download it), Node.js compatible with the committed Nuxt dependencies, pnpm (version in `frontend/package.json`), uv, and Go Task (`task`). Keep the committed lockfiles; do not upgrade dependencies just to start development.

On Windows, install uv and Task with:

```powershell
winget install --id astral-sh.uv --exact --source winget --accept-source-agreements --accept-package-agreements
winget install --id Task.Task --exact --source winget --accept-source-agreements --accept-package-agreements
```

Open a fresh terminal after installation so PATH includes the new tools. Install Node.js and the pnpm version specified by `frontend/package.json` if missing. From the repository root:

```powershell
task setup:py
cd frontend
pnpm install --frozen-lockfile
cd ..
```

The Python task installs dependencies with uv and installs pre-commit hooks. `Taskfile.yml` sets `UV_FROZEN=1`, preserving the Python lockfile. `task setup` is the upstream combined setup command; the explicit frontend command above also enforces its lockfile.

## Start and restart

For the preferred Docker backend, use two visible, interactive terminals from the repository root:

```powershell
# Terminal 1
docker compose -f compose.petit-chef.yml up --build backend
# Terminal 2
task ui
```

On Windows, open both windows at once with:

```powershell
powershell -ExecutionPolicy Bypass -File dev/start-petit-chef.ps1
```

The launcher keeps both windows open, checks for occupied ports, and runs each server in the foreground. Stop with Ctrl+C in the relevant window; rerun the Compose command or `task ui` there. On a supported native/Linux setup, `task py` can replace the Compose command. Always honor the owner's preference for accessible terminals, rather than hidden agent-only server sessions.

- App: http://localhost:3000
- Backend and API documentation: http://localhost:9000/docs
- Development uses SQLite by default; local application data lives in `dev/data`. Preserve it between sessions. Never use `task dev:clean` unless the owner explicitly requests deleting development data.
- Docker services are optional for default SQLite development. For PostgreSQL or email testing, run `task dev:services` in a third visible terminal and use `task py:postgres` for PostgreSQL.
- `.env` and `.dev.env` are local, ignored configuration files. Do not commit credentials, data, or virtual environments.

## Verification and troubleshooting

Confirm both services actually respond after startup; an open terminal alone does not mean a server started. Check the terminal error before changing configuration. Native Windows dependencies may need additional build prerequisites; prefer the repository's dev container when native installation cannot satisfy the lockfile, and document the exact limitation without modifying backend source or replacing pinned dependencies.

First Docker startup installs the editable project and applies existing SQLite migrations; on a Windows bind mount this can take several minutes. Wait for `Application startup complete` in the backend terminal before opening the app. The frontend's app-info plugin requires `/api/app/about` during initialization: opening it too early produces an error page and `NUXT_E1005`. Once `http://localhost:3000/api/app/about` responds successfully, reload the page.

Verified on 2026-10-08: Node 22.15.0, pnpm 11.23.0 installed on the user PATH (dependency installation initially used Codex's pnpm 11.25.0), Task 3.54.0, Docker Engine 29.6.2, Python 3.12 in Docker, locked frontend and backend dependencies. The app root, frontend-proxied app-info endpoint, and backend docs were checked for HTTP 200. No backend source or dependency lockfiles were changed.

For frontend work, use `task ui:check`. Backend source and schemas are outside this fork's customization scope. Preserve Vuetify and existing API contracts.
