# Event Manager

## Description
Event Manager is a full-stack web application designed to help users create, manage, and discover events. It leverages Google Authentication for seamless onboarding and integrates deeply with Google Calendar to ensure users' schedules are always synchronized with the events they create or join.

## Architecture Overview
The project follows a standard decoupled Client-Server architecture utilizing GraphQL for API communication.

*   **Frontend (FE):** A Single Page Application (SPA) built with React 19 and Vite. It uses Apollo Client to fetch data from the GraphQL backend and Redux Toolkit for local state management. UI components are styled using TailwindCSS and shadcn ui.
*   **Backend (BE):** A Node.js server powered by Express and Apollo Server. It handles business logic, interacts with the MongoDB database, and communicates with Google APIs for Authentication and Calendar synchronization.
*   **Database (DB):** MongoDB, a NoSQL database, is used to store user profiles, event details, and relationships (e.g., event attendees).
*   **Deployment:** The application is containerized using Docker. An Nginx reverse proxy serves the frontend static build and routes API requests to the backend. The entire infrastructure can be spun up using Docker Compose. A GitHub Actions pipeline automates the build, push, and deployment process to a remote VPS.

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

1. Sign in and open **AI agents** in the sidebar, then create an API key. Keys start with `emk_`, are shown once, and only their SHA-256 hash is stored.
2. Add the server to the agent, sending the key as `Authorization: Bearer emk_...`:
   ```bash
   claude mcp add --transport http event-manager https://events.dantepham.site/mcp \
     --header "Authorization: Bearer emk_..."
   ```
   Clients that cannot set headers (claude.ai or ChatGPT custom connectors) can use `https://events.dantepham.site/mcp?key=emk_...` instead.

Tools: `list_events`, `get_event`, `check_availability`, `find_conflicts`, `create_event`, `update_event`, `delete_event`. Create and update refuse a time that overlaps the user's other events and list the conflicts, unless the agent passes `allowConflict: true` after asking the user. Only the event creator can update or delete it.

`MCP_TIMEZONE` (default `Asia/Ho_Chi_Minh`) sets the timezone the agent is told to assume and the one used for readable times in tool results. In mock mode (`USE_MOCK=true`) `/mcp` needs no key and acts as the seed user.
