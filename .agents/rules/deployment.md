# Event Manager — Deployment Strategy

The app runs on a VPS that is shared with other projects. Nothing in this stack may
bind a public port or touch resources that belong to other stacks. The step-by-step
setup lives in the **Deployment** section of the README; this file is the summary.

## Request path

```
Browser ─HTTPS─▶ Cloudflare (proxied, SSL mode "Flexible")
        ─HTTP:80─▶ host nginx (events.<domain> server block)
        ─▶ 127.0.0.1:8080 ─▶ frontend container (nginx: static SPA + /graphql, /mcp proxy)
        ─▶ backend:4000 ─▶ mongodb:27017   (internal compose network only)
```

- **Cloudflare** terminates HTTPS. SSL mode is *Flexible*, so Cloudflare talks to the
  origin over plain HTTP on port 80 and sends `X-Forwarded-Proto: https`.
- **Host nginx** (installed on the VPS, not in compose) owns port 80 and routes by
  hostname. The Event Manager block is `/etc/nginx/sites-available/events.conf`
  (symlinked into `sites-enabled/`) and proxies to `127.0.0.1:8080`. Other projects
  have their own blocks and ports.
- **Compose** (`docker-compose.yml`, project name `event-manager`) runs `frontend`,
  `backend` and `mongodb`. Only `frontend` publishes a port, and only on
  `127.0.0.1:${APP_PORT:-8080}`. The backend and MongoDB have no published ports.
- `nginx/default.conf` is the config of the **frontend container**, not the host. It
  serves the SPA (all routes → `index.html`) and proxies `/graphql`, `/mcp` and
  `/.well-known/oauth-*` to the backend.

## CI/CD Pipeline (GitHub Actions, `.github/workflows/deploy.yml`)

Runs on push to `main` (changes to `*.md` and `.agents/**` only do not deploy) or by
hand (`workflow_dispatch`):

1. **Build & push** the backend and frontend images to GHCR
   (`ghcr.io/<owner>/<repo>/backend|frontend:latest`, lowercased).
2. **Copy** `docker-compose.yml` and `nginx/` to `/opt/event-manager` over SCP.
3. **SSH** in as the `deploy` user, log in to GHCR with a project-local
   `DOCKER_CONFIG` (`/opt/event-manager/.docker`, so other stacks' docker login is
   untouched), then `docker compose pull` and `docker compose up -d --remove-orphans`.
4. **Cleanup** with `docker image prune -f`: removes only dangling images. Never use
   `docker image prune -a`, which would also delete images other stacks on the VPS
   still need and the layer cache that keeps pulls fast.

## Configuration

- GitHub Actions **secrets**: `VPS_HOST`, `VPS_USERNAME` (`deploy`), `VPS_SSH_KEY`,
  `GH_PAT` (GHCR push/pull), `CLERK_SECRET_KEY`.
- GitHub Actions **variable**: `CLERK_PUBLISHABLE_KEY` (baked into the frontend build).
- Server-side `/opt/event-manager/.env` (read by `docker compose`): `IMAGE_PREFIX`,
  `APP_PORT`, `PUBLIC_URL`, `CLERK_AUTHORIZED_PARTIES`, and optionally the Clerk keys
  for running compose by hand.
- Never commit secrets, the VPS IP or personal emails. The repo is public; use
  `.env.example` as the template.
