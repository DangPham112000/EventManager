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

Sign-in uses the ecosystem's shared [Clerk](https://clerk.com) application `yolo-ecosystem` (production instance on `dantepham.site`), so one session works across all `*.dantepham.site` apps. Its keys live in Doppler `shared/prd`.

- **Frontend:** `VITE_CLERK_PUBLISHABLE_KEY` in `frontend/.env.local` (dev) or in Doppler (production build, see [Secrets](#secrets-doppler)). Without it the app runs with no sign-in.
- **Backend:** `CLERK_SECRET_KEY` in `backend/.env` (dev) or in Doppler (production). It verifies the session token sent as `Authorization: Bearer …`.
- On first sign-in a Clerk user is linked to the existing user with the same email, or a new user is created. A stored `clerkId` from an older Clerk app is overwritten, which is how users were moved to the shared app (DAN-100).
- `USE_MOCK=true` skips auth entirely and acts as the seed user.

## AI agents (MCP)

The backend serves an [MCP](https://modelcontextprotocol.io) endpoint at `/mcp` (Streamable HTTP, stateless), so AI agents can manage a user's calendar from a prompt.

**Sign in with OAuth (easiest).** In Gemini, claude.ai, ChatGPT or Claude Desktop, add a custom connector with the URL `https://events.dantepham.site/mcp`. The client finds Clerk through `/.well-known/oauth-protected-resource/mcp`, registers itself, and sends the user through Clerk sign-in and consent; `/mcp` then accepts the Clerk OAuth access token. This needs **Dynamic client registration** turned on in the Clerk dashboard (Configure → OAuth applications) and `CLERK_PUBLISHABLE_KEY` set on the backend. OAuth tokens belong to one Clerk app, so after Event Manager moved to the shared Clerk app (DAN-100) connectors that signed in with OAuth must be connected again; API keys keep working.

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
   # Append the public half of the key stored in Doppler as VPS_SSH_KEY:
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
   ```
   Keep secrets out of this file; they come from Doppler (next step).
5. **Doppler.** Install the [Doppler CLI](https://docs.doppler.com/docs/install-cli), create a read-only service token for project `event-manager`, config `prd`, and store it for the `deploy` user, scoped to the app folder:
   ```bash
   export HISTIGNORE='doppler*'
   echo 'dp.st.prd.xxxx' | sudo -u deploy doppler configure set token --scope /opt/event-manager
   sudo -u deploy sh -c 'cd /opt/event-manager && doppler secrets --only-names'
   ```
   To run compose by hand: `cd /opt/event-manager && doppler run -- docker compose up -d`.

### GitHub Actions configuration

Settings → Secrets and variables → Actions holds a single secret:

| Name | Kind | Value |
| --- | --- | --- |
| `DOPPLER_TOKEN` | secret | Read-only Doppler service token for `event-manager` / `prd` (a separate token from the VPS one) |

Everything else the workflow needs is in Doppler (next section), so values can be read again when needed. GHCR pushes and the VPS pull use the job's own `GITHUB_TOKEN`, which expires when the job ends; there is no personal access token. If GHCR refuses it with a 403, open the package on GitHub → Package settings → Manage Actions access, and give this repository the Write role.

### Secrets (Doppler)

App secrets live in [Doppler](https://www.doppler.com), project `event-manager`, config `prd`: `CLERK_SECRET_KEY` (`${shared.prd.CLERK_SECRET_KEY}`), `CLERK_PUBLISHABLE_KEY` (`${shared.prd.CLERK_PUBLISHABLE_KEY}`), `CLERK_AUTHORIZED_PARTIES` (only `https://events.dantepham.site`, so session tokens from other ecosystem apps are refused), `PUBLIC_URL`, and the deploy job's SSH settings `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY` (references to `${shared.prd.*}`, the same for every app; masked in the logs). The frontend build reads `CLERK_PUBLISHABLE_KEY` with `DOPPLER_TOKEN` and passes it as `VITE_CLERK_PUBLISHABLE_KEY` (there is no `VITE_` copy in Doppler, because Doppler does not allow a reference to a reference); the VPS reads the rest through `doppler run`. After changing a secret, re-run the deploy workflow (a publishable key change needs the rebuild too).

### What a deploy does

Every push to `main` (except changes that only touch Markdown or `.agents/`) runs `.github/workflows/deploy.yml`; it can also be started by hand from the Actions tab. It builds and pushes both images to GHCR, copies `docker-compose.yml` and `nginx/` to `/opt/event-manager`, then over SSH logs in to GHCR with a project-local `DOCKER_CONFIG` (so other stacks' credentials are untouched), runs `docker compose pull` and `doppler run -- docker compose up -d --remove-orphans` (it stops first if Doppler is not set up for the `deploy` user), and finally `docker image prune -f`.

The prune removes only **dangling** images (old layers left untagged by the new pull). It deliberately does not use `-a`, which would also delete images that other projects on the VPS rely on and the cached layers that keep the next pull fast.

### First user

There is nothing to seed. Open the site and sign in with Clerk (Google): the first sign-in creates the user in MongoDB, or links to an existing user with the same email. Make sure Google is enabled in the Clerk dashboard and the production domain is added to the Clerk instance.
