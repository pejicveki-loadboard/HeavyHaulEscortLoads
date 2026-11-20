@AGENTS.md

## Local dev safety

- **Local DB:** Docker container `heavyhaul-dev-db` (postgres:16), bound to `127.0.0.1:5433`, volume `heavyhaul-dev-pgdata`. `web/.env`'s `DATABASE_URL` points here, so `next dev`, the Prisma CLI (via `prisma.config.ts` → `dotenv/config` → `.env`) and the `scripts/*` all default to the local DB.
- **Production DB credentials live only in `web/.env.prod-db`** (gitignored, chmod 600). Never copy that URL into `.env`, a shell export, a command line, or any other file, and never print it — show host:port at most.
- **Production migrations only via `npm run db:deploy:prod`** (shows host:port, requires typing `DEPLOY`, runs `prisma migrate deploy`). Vercel builds only run `prisma generate`, not `migrate deploy`, so run this before deploying code that depends on a new migration.
- **Never run `prisma migrate dev`, `migrate reset`, `db push`, any seed, or ad-hoc/backfill scripts against production.** Use `npm run db:migrate:dev` (refuses `rlwy.net` URLs) and `npm run db:seed:dev` (refuses non-localhost hosts).
- **Reserved ports — do not use:** `3001` and `55432`. The dev server runs on `3000`.
- Seeded dev logins (all `@example.com`, password `devpass123`): `admin@`, `new-pilot@` (fresh trial), `expired-pilot@` (trial ended), `paid-pilot@` (active, fake Stripe IDs), `load-manager@`.
