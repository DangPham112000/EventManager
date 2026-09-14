FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --filter backend

COPY backend/ ./backend/
RUN pnpm --filter backend run build

FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app
COPY --from=build /app/ ./
RUN pnpm install --frozen-lockfile --filter backend --prod

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
