# On-Stream Game Monorepo (skeleton)

This is a slim scaffold to start coding immediately. It mirrors the Notion plan.

## Apps & Packages
- `apps/web` - Next.js app for creator/viewer portals and overlays.
- `apps/api` - Next.js app routes for HTTP APIs (or evolve to Nest later).
- `services/worker` - BullMQ worker for timers and payouts.
- `packages/db` - Prisma schema and client.
- `packages/types` - Shared TypeScript types.
- `packages/ui` - Placeholder shared UI (shadcn later).

## Quickstart
1. Install PNPM: https://pnpm.io/installation
2. Copy `.env.example` to `.env` in each app/service and fill the values.
3. `pnpm install`
4. `pnpm --filter @osg/db prisma:generate` (first time)  
5. `pnpm dev:web` (and in new terminal) `pnpm dev:api` and `pnpm dev:worker`

## Notes
- Everything is minimal by design. We’ll expand as we lock specs.
