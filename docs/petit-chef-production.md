# Petit Chef production behind Caddy

Use `compose.petit-chef.production.yml` in the repository root. It matches the owner's existing layout: the `mealie/` checkout and `data/` directory sit beside each other. Compose resolves paths relative to the Compose file, so `context: .` builds this checkout and `../data:/app/data` mounts the existing data directory. Keep the existing Caddy network and upstream `remy:9000`; no host ports are published.

The bind mount requires the existing `data/` directory. Compose will not silently create an empty one if the path is wrong. Verify its location before deploying.

The production Dockerfile already defaults to `PRODUCTION=true` and `TESTING=false`. Compose makes both explicit, selects the `production` build target, disables public API documentation and signup, and keeps `BASE_URL=https://remy.sgdr.me`. This builds the customized Petit Chef frontend with Mealie 3.28.0, not an upstream image that replaces the UI. Development Compose and `task ui` are for local development only.

## Build and deploy on the production host

From the checkout, after backing up the existing application data:

```sh
docker compose -f compose.petit-chef.production.yml config --quiet
docker compose -f compose.petit-chef.production.yml build --pull remy
docker compose -f compose.petit-chef.production.yml up -d --no-deps remy
docker compose -f compose.petit-chef.production.yml logs -f remy
```

Keep the existing Compose project name when replacing an existing deployment; use the same `-p` value if one was previously supplied. Do not run the old and new Compose projects simultaneously with the same `remy` container name. If keeping the existing Compose file outside the checkout instead, keep its `context: ./mealie` and `./data:/app/data` paths and copy the new build target and environment settings into it.

Wait for application startup, then verify:

```sh
curl -fsS https://remy.sgdr.me/api/app/about
docker compose -f compose.petit-chef.production.yml exec remy sh -c 'printf "PRODUCTION=%s TESTING=%s API_DOCS=%s\n" "$PRODUCTION" "$TESTING" "$API_DOCS"'
```

The about response must report `production: true`, `allowSignup: false`, and version `3.28.0`. The container should report `PRODUCTION=true TESTING=false API_DOCS=false`. Confirm `/docs` no longer exposes Swagger, and check a login response in browser developer tools: `mealie.access_token` should have `Secure` over HTTPS. Caddy must terminate HTTPS and forward the original protocol to Mealie.

Production generates random signing secrets in the persisted `/app/data` directory. Do not paste secrets into Compose, print their contents, or delete the data directory. If a previous public instance actually ran with `PRODUCTION=false`, changing mode invalidates its old signed login tokens; existing long-lived API tokens may need recreation too. The provided original production Dockerfile did not have that development-mode problem.

Local image builds also stamp the packaged app version from `pyproject.toml`, following the upstream release workflow. The checkout's backend source remains unchanged; the image reports `3.28.0` instead of the default `develop` label.

## Frontend security hardening

The authenticated Axios client rejects requests outside the page origin before attaching its token. Login/logout redirect destinations reject external origins and control-character/encoded-separator tricks. The page and sanitized recipe links and images use `no-referrer`; sanitized links also use `noopener noreferrer` to prevent a new tab controlling its opener. Allowlisted video embeds send only the app origin, preserving provider identification without exposing paths or query tokens. Local environment files, development data, and stale frontend build outputs are excluded from Docker builds. The Dockerfile packages Nuxt's current `.output/public` output.

These changes do not revoke stolen tokens on logout, make cookies HttpOnly, restrict unauthenticated media endpoints, or impose server-side login throttling. Those require backend or reverse-proxy changes. Hiding media in the frontend would not protect the underlying URLs. No backend source was changed for this hardening.

Reference: [Docker Compose production guidance](https://docs.docker.com/compose/how-tos/production/) and [browser referrer policies](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Referrer_policy).

## Verification (2026-10-14)

The final production Docker build succeeded. A disposable container with temporary data verified version `3.28.0`, production mode, testing disabled, random signing secrets, disabled signup/API docs using the Compose settings, and the packaged Petit Chef frontend/referrer policy. Compose configuration validation passed. The frontend hardening passed 52 focused regression tests and targeted lint during implementation. No backend source changed.

Local development services were restarted in separate visible terminals; the frontend root and both direct/proxied app-info endpoints returned HTTP 200. These checks do not verify the public Caddy host or authenticated browser interactions. Deployment to the owner's production server remains a separate step.
