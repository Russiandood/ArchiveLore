# Less-Babysitting Deployment (Vercel + Fly.io + Neon + Upstash)

## Components
- **Web (Next.js)**: Vercel
- **API (Next.js API host)**: Fly.io (`apps/api`)
- **Worker (BullMQ)**: Fly.io (`services/worker`)
- **Postgres**: Neon (managed serverless Postgres)
- **Redis**: Upstash (managed Redis)

## Region picks
Choose regions close to your audience:
- Vercel: SFO1 or LAX1
- Fly.io: sea (Seattle) or sjc
- Neon: aws-us-west-2
- Upstash: us-west-1

## Provision
1. **Neon Postgres**
   - Create project → copy `DATABASE_URL`.
2. **Upstash Redis**
   - Create database → copy `REDIS_URL` or REST creds.
3. **Vercel (apps/web)**
   - Deploy and set `NEXT_PUBLIC_API_BASE=https://<your-api-app>.fly.dev`.
4. **Fly.io (apps/api)**
   - `flyctl launch` in `apps/api` (uses `fly.toml`), then:
   - `flyctl secrets set DATABASE_URL=... REDIS_URL=... TWITCH_CLIENT_ID=... TWITCH_CLIENT_SECRET=... EVENTSUB_SECRET=...`
   - `flyctl deploy`
5. **Fly.io (services/worker)**
   - `flyctl launch` in `services/worker`.
   - `flyctl secrets set REDIS_URL=...`
   - `flyctl deploy`

## Health checks
- API: `https://<your-api-app>.fly.dev/api/health`
- Worker logs: `flyctl logs -a osg-worker`
