# Event Manager

## Description
Event Manager is a full-stack web application designed to help users create, manage, and discover events. It leverages Google Authentication for seamless onboarding and integrates deeply with Google Calendar to ensure users' schedules are always synchronized with the events they create or join.

## Architecture Overview
The project follows a standard decoupled Client-Server architecture utilizing GraphQL for API communication.

*   **Frontend (FE):** A Single Page Application (SPA) built with React 19 and Vite. It uses Apollo Client to fetch data from the GraphQL backend and Redux Toolkit for local state management. UI components are styled using TailwindCSS and shadcn ui.
*   **Backend (BE):** A Node.js server powered by Express and Apollo Server. It handles business logic, interacts with the MongoDB database, and communicates with Google APIs for Authentication and Calendar synchronization.
*   **Database (DB):** MongoDB, a NoSQL database, is used to store user profiles, event details, and relationships (e.g., event attendees).
*   **Deployment:** The frontend and backend are Docker images built by GitHub Actions and pushed to GHCR. On the VPS, Docker Compose runs the frontend (an nginx container that serves the static build and proxies API requests to the backend), the backend and MongoDB behind the host's nginx and Cloudflare. See [Deployment](#deployment).

## Project Structure

```
.
├── AGENTS.md               # AI Developer Context and Requirements
├── README.md               # Project Overview
├── docker-compose.yml      # Docker compose configuration
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD Pipeline configuration
├── nginx/
│   └── default.conf        # Nginx configuration for serving FE and proxying BE
├── backend/                # Backend Node.js / Express / Apollo Server app
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts        # Entry point
│       ├── config/         # DB and Env configurations
│       ├── models/         # Mongoose schema definitions (User, Event)
│       └── graphql/        # GraphQL TypeDefs and Resolvers
└── frontend/               # Frontend React / Vite app
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx        # Application entry point
        ├── App.tsx         # Main application component
        ├── components/     # Reusable UI components (shadcn, etc.)
        ├── pages/          # Page level components (Home, Dashboard, EventDetail)
        ├── store/          # Redux Toolkit configuration and slices
        ├── graphql/        # Apollo Client queries and mutations
        └── routes/         # React Router configurations
```

## Authentication (Clerk)

Sign-in uses [Clerk](https://clerk.com) (enable Google under *User & authentication → SSO connections*).

- **Frontend:** `VITE_CLERK_PUBLISHABLE_KEY` in `frontend/.env.local` (dev) or the `CLERK_PUBLISHABLE_KEY` GitHub Actions **variable** (production build). Without it the app runs with no sign-in.
- **Backend:** `CLERK_SECRET_KEY` in `backend/.env` (dev) or the `CLERK_SECRET_KEY` GitHub Actions **secret** (production). It verifies the session token sent as `Authorization: Bearer …`.
- On first sign-in a Clerk user is linked to the existing user with the same email, or a new user is created.
- `USE_MOCK=true` skips auth entirely and acts as the seed user.

## AI agents (MCP)

The backend serves an [MCP](https://modelcontextprotocol.io) endpoint at `/mcp` (Streamable HTTP, stateless), so AI agents can manage a user's calendar from a prompt.

**Sign in with OAuth (easiest).** In Gemini, claude.ai, ChatGPT or Claude Desktop, add a custom connector with the URL `https://events.dantepham.site/mcp`. The client finds Clerk through `/.well-known/oauth-protected-resource/mcp`, registers itself, and sends the user through Clerk sign-in and consent; `/mcp` then accepts the Clerk OAuth access token. This needs **Dynamic client registration** turned on in the Clerk dashboard (Configure → OAuth applications) and `CLERK_PUBLISHABLE_KEY` set on the backend.

**API key (for clients that cannot sign in, e.g. Claude Code or Cursor).**

1. Sign in and open **AI agents** in the sidebar, then create an API key. Keys start with `emk_`, are shown once, and only their SHA-256 hash is stored.
2. Add the server to the agent, sending the key as `Authorization: Bearer emk_...`:
   ```bash
   claude mcp add --transport http event-manager https://events.dantepham.site/mcp \
     --header "Authorization: Bearer emk_..."
   ```
   Clients that cannot set headers (claude.ai or ChatGPT custom connectors) can use `https://events.dantepham.site/mcp?key=emk_...` instead.

Tools: `list_events`, `get_event`, `check_availability`, `find_conflicts`, `create_event`, `update_event`, `delete_event`. Create and update refuse a time that overlaps the user's other events and list the conflicts, unless the agent passes `allowConflict: true` after asking the user. Only the event creator can update or delete it.

`MCP_TIMEZONE` (default `Asia/Ho_Chi_Minh`) sets the timezone the agent is told to assume and the one used for readable times in tool results. In mock mode (`USE_MOCK=true`) `/mcp` needs no key and acts as the seed user.

## Deployment

Production runs on a VPS shared with other projects, at `https://events.dantepham.site`.

```
Browser ─HTTPS─▶ Cloudflare (proxied, SSL "Flexible")
        ─HTTP:80─▶ host nginx ─▶ 127.0.0.1:8080 ─▶ frontend container ─▶ backend ─▶ mongodb
```

- **Cloudflare** proxies the `events` DNS record (orange cloud) and terminates HTTPS. SSL/TLS mode is **Flexible**: Cloudflare reaches the VPS over plain HTTP on port 80.
- **Host nginx** (installed on the VPS, not part of compose) owns port 80 and routes each hostname to its project. Event Manager goes to `127.0.0.1:8080`.
- **Docker Compose** (project name `event-manager`) runs `frontend`, `backend` and `mongodb`. Only the frontend publishes a port, bound to `127.0.0.1`, so nothing in this stack is reachable from the internet except through the host nginx. `nginx/default.conf` is the frontend container's config, not the host's.

### One-time VPS setup

1. **Deploy user.** Create a `deploy` user in the `docker` group, give it the app directory, and authorize the CI key:
   ```bash
   sudo adduser --disabled-password --gecos "" deploy
   sudo usermod -aG docker deploy
   sudo mkdir -p /opt/event-manager && sudo chown deploy:deploy /opt/event-manager
   # Append the public half of the key stored in the VPS_SSH_KEY secret:
   sudo -u deploy mkdir -p /home/deploy/.ssh
   sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys < ci_deploy_key.pub
   ```
2. **Host nginx.** Create `/etc/nginx/sites-available/events.conf`:
   ```nginx
   server {
       listen 80;
       server_name events.dantepham.site;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           # Cloudflare sends "https"; pass it on so OAuth metadata uses https URLs.
           proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
           proxy_buffering off;          # /mcp streams responses
           proxy_read_timeout 120s;
       }
   }
   ```
   Then enable it: `sudo ln -s /etc/nginx/sites-available/events.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx`.
3. **Cloudflare.** Add a proxied `A` record for `events` pointing at the VPS and set SSL/TLS to **Flexible**.
4. **Server env file.** Create `/opt/event-manager/.env` (owned by `deploy`, `chmod 600`). `docker compose` reads it automatically:
   ```bash
   # Lowercase owner/repo; the CI exports this too, but manual compose commands need it.
   IMAGE_PREFIX=dangpham112000/eventmanager
   # Local port the host nginx proxies to (must match events.conf).
   APP_PORT=8080
   PUBLIC_URL=https://events.dantepham.site
   CLERK_AUTHORIZED_PARTIES=https://events.dantepham.site
   # Optional: only needed to run `docker compose up` by hand. CI passes these itself.
   CLERK_SECRET_KEY=sk_live_...
   CLERK_PUBLISHABLE_KEY=pk_live_...
   ```

### GitHub Actions configuration

Settings → Secrets and variables → Actions:

| Name | Kind | Value |
| --- | --- | --- |
| `VPS_HOST` | secret | VPS IP or hostname |
| `VPS_USERNAME` | secret | `deploy` |
| `VPS_SSH_KEY` | secret | Private key whose public half is in `deploy`'s `authorized_keys` |
| `GH_PAT` | secret | Personal access token with `write:packages` (push and pull GHCR images) |
| `CLERK_SECRET_KEY` | secret | Clerk secret key (backend) |
| `CLERK_PUBLISHABLE_KEY` | variable | Clerk publishable key (inlined into the frontend build) |

### What a deploy does

Every push to `main` (except changes that only touch Markdown or `.agents/`) runs `.github/workflows/deploy.yml`; it can also be started by hand from the Actions tab. It builds and pushes both images to GHCR, copies `docker-compose.yml` and `nginx/` to `/opt/event-manager`, then over SSH logs in to GHCR with a project-local `DOCKER_CONFIG` (so other stacks' credentials are untouched), runs `docker compose pull` and `docker compose up -d --remove-orphans`, and finally `docker image prune -f`.

The prune removes only **dangling** images (old layers left untagged by the new pull). It deliberately does not use `-a`, which would also delete images that other projects on the VPS rely on and the cached layers that keep the next pull fast.

### First user

There is nothing to seed. Open the site and sign in with Clerk (Google): the first sign-in creates the user in MongoDB, or links to an existing user with the same email. Make sure Google is enabled in the Clerk dashboard and the production domain is added to the Clerk instance.
