// Shared helpers for the db:* npm scripts. Never print a full connection
// string -- only host:port -- so credentials don't end up in terminal
// scrollback, CI logs, or an AI assistant's context.

import { spawnSync } from "node:child_process";

export const PROD_HOST_MARKER = "rlwy.net";
export const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function hostPort(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}`;
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

export function isLocal(url) {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function die(msg) {
  console.error(`\n[db-safety] REFUSING: ${msg}\n`);
  process.exit(1);
}

// Runs the locally installed prisma CLI with the given env, inheriting stdio.
export function runPrisma(args, env) {
  const res = spawnSync("npx", ["prisma", ...args], { stdio: "inherit", env });
  process.exit(res.status ?? 1);
}
