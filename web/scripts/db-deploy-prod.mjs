// npm run db:deploy:prod
// The ONLY sanctioned way to change the production schema from a dev
// machine. Reads DATABASE_URL from .env.prod-db (gitignored, chmod 600),
// shows host:port, requires typing DEPLOY, then runs `prisma migrate deploy`
// (applies pending migrations only -- never resets or seeds).

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { die, hostPort, runPrisma } from "./db-safety.mjs";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prodEnvPath = path.join(webDir, ".env.prod-db");

if (!fs.existsSync(prodEnvPath)) die(`${prodEnvPath} not found.`);
const url = dotenv.parse(fs.readFileSync(prodEnvPath)).DATABASE_URL;
if (!url) die(".env.prod-db has no DATABASE_URL.");

if (!process.stdin.isTTY) die("must be run interactively (needs typed confirmation).");

console.log(`\n[db-safety] PRODUCTION migrate deploy target: ${hostPort(url)}`);
console.log("[db-safety] Pending migrations in prisma/migrations will be applied.\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('Type "DEPLOY" to continue: ');
rl.close();
if (answer.trim() !== "DEPLOY") die("confirmation not given.");

// Explicit env override: prisma.config.ts's `dotenv/config` does not
// overwrite an already-set DATABASE_URL, so this wins over .env.
runPrisma(["migrate", "deploy"], { ...process.env, DATABASE_URL: url });
