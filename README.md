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
