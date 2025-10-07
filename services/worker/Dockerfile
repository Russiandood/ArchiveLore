FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services/worker/package.json ./services/worker/package.json
COPY services/worker/src ./services/worker/src
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "--filter", "@osg/worker", "dev"]
