FROM node:20-slim
WORKDIR /app

# Copy root workspace metadata (these paths are resolved relative to the build context = repo root)
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml tsconfig.base.json ./

# Copy workspaces needed at runtime
COPY packages ./packages
COPY services/worker/package.json ./services/worker/package.json
COPY services/worker/src ./services/worker/src

# Install once at the workspace root (brings in tsx, bullmq, ioredis, etc.)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --frozen-lockfile

# IMPORTANT: let Dockerfile's CMD run the script (don't override in fly.toml)
CMD ["pnpm", "--filter", "@osg/worker", "dev"]
