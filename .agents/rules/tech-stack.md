# Event Manager — Tech Stack

## Frontend
- **Framework:** React 19 with Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS, shadcn/ui
- **Routing:** React Router DOM
- **Data Fetching:** Apollo Client (GraphQL)
- **State Management:** Redux Toolkit
- **Utilities:** lodash

## Backend
- **Runtime:** Node.js
- **Framework:** Express
- **API Layer:** Apollo Server (GraphQL)
- **Language:** TypeScript

## Database
- **Database:** MongoDB (via Mongoose ODM)

## Deployment & Infrastructure
- **Containerization:** Docker, Docker Compose
- **Reverse Proxy / Static Serving:** Nginx
- **CI/CD:** GitHub Actions

## Monorepo Structure
This project uses a pnpm workspace monorepo with the following packages:
- `frontend/` — React application
- `backend/` — Node.js/Express API server
- `nginx/` — Nginx configuration
