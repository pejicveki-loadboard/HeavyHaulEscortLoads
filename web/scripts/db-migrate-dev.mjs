// npm run db:migrate:dev [-- --name some_change]
// Wraps `prisma migrate dev`, refusing to run against production.
// `migrate dev` can reset (drop all data in) the target database, so it
// must never see the production URL.

import "dotenv/config"; // .env only -- same file prisma.config.ts loads
import { PROD_HOST_MARKER, die, hostPort, runPrisma } from "./db-safety.mjs";

const url = process.env.DATABASE_URL;
if (!url) die("DATABASE_URL is not set.");
if (url.includes(PROD_HOST_MARKER)) {
  die(`DATABASE_URL points at production (${hostPort(url)}). migrate dev is local-only.`);
}

console.log(`[db-safety] prisma migrate dev -> ${hostPort(url)}`);
runPrisma(["migrate", "dev", ...process.argv.slice(2)], process.env);
