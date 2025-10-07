# Multi-stage build for Next.js API host
FROM node:20-slim AS deps
WORKDIR /app

# Root-level workspace metadata
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml tsconfig.base.json ./

# Workspaces
COPY packages ./packages
COPY apps/api/package.json ./apps/api/package.json

# Install (workspace-aware)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --frozen-lockfile

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app /app
COPY apps/api ./apps/api
RUN corepack enable && pnpm --filter @osg/api build

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/.next/standalone ./
COPY --from=build /app/apps/api/.next/static ./apps/api/.next/static
EXPOSE 3001
CMD ["node", "server.js"]
