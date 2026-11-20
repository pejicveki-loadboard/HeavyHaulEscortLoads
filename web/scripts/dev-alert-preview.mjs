// npx tsx scripts/dev-alert-preview.mjs [label] [nowISO]
// LOCAL DEV ONLY, read-only: shows which search locations a seeded load's
// alerts would go to, and whether hasAccess() lets each through. Sends
// nothing and writes nothing. Refuses any non-localhost DATABASE_URL.
import "dotenv/config";
import { die, hostPort, isLocal } from "./db-safety.mjs";

const url = process.env.DATABASE_URL;
if (!url || !isLocal(url)) die(`alert preview is local-only; DATABASE_URL host is ${url ? hostPort(url) : "unset"}.`);

const { prisma } = await import("../src/lib/prisma.ts");
const { previewAlertRecipients } = await import("../src/lib/load-matching.ts");

const [label = "", nowArg] = process.argv.slice(2);
const load = await prisma.load.findFirst({
  where: { originCity: "Dallas", destinationCity: "Oklahoma City", status: "open" },
});
if (!load) die("seeded Dallas -> Oklahoma City load not found; run npm run db:seed:dev");

const rows = await previewAlertRecipients(load.id, nowArg ? new Date(nowArg) : new Date());
console.log(`\n[${label}] Dallas, TX -> Oklahoma City, OK (${load.escortPositions.join(", ")})${nowArg ? `  now=${nowArg}` : ""}`);
for (const r of rows) {
  console.log(
    `  ${r.wouldAlert ? "ALERT" : "skip "}  ${r.email.padEnd(26)} ${r.searchLocation.padEnd(20)} ${String(r.distanceMiles).padStart(4)} mi  ${r.channels.join("+")}`
  );
}
await prisma.$disconnect();
