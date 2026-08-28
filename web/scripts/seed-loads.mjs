// One-time (but safe to re-run) seed script: creates ~25 realistic loads
// with real city coordinates spanning multiple states, so radius search
// (PHASE1_PLAN.md Week 3) has something worth exercising. Coordinates are
// hardcoded city centers rather than calls through geocodeCityState, so
// this never burns a Mapbox lookup.
//
// All loads are attached to a single dedicated Load Manager account
// (seed-loads@heavyhaulescortloads.com), created if it doesn't exist yet.
// Re-running deletes and recreates that account's loads from the fixed
// list below, rather than trying to diff/upsert individual rows -- simpler,
// and the point of seed data is that it's the same known shape every time.
//
// Inserts go straight through Prisma, not the POST /api/loads route, so
// matchAndAlertLoad() never runs for these -- seeding shouldn't fire real
// emails/SMS at whatever real search locations happen to match.
//
// Usage: npx tsx scripts/seed-loads.mjs
// (needs tsx, not plain node, because it imports the generated Prisma
// client's .ts source directly -- same reason src/lib/prisma.ts's driver
// adapter pattern is used here instead of a bare `new PrismaClient()`)

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_USER_EMAIL = "seed-loads@heavyhaulescortloads.com";

// Real city-center coordinates. Deliberately spread across the
// TX/OK/KS/MO corridor, the Southeast, the Midwest, and a couple of
// Western anchors so a radius search from most major regions finds
// something within a reasonable range.
const CITIES = {
  dallas: { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797 },
  houston: { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
  sanAntonio: { city: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936 },
  austin: { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  elPaso: { city: "El Paso", state: "TX", lat: 31.7619, lng: -106.485 },
  amarillo: { city: "Amarillo", state: "TX", lat: 35.1991, lng: -101.8313 },
  oklahomaCity: { city: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164 },
  tulsa: { city: "Tulsa", state: "OK", lat: 36.154, lng: -95.9928 },
  wichita: { city: "Wichita", state: "KS", lat: 37.6872, lng: -97.3301 },
  kansasCity: { city: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786 },
  stLouis: { city: "St. Louis", state: "MO", lat: 38.627, lng: -90.1994 },
  littleRock: { city: "Little Rock", state: "AR", lat: 34.7465, lng: -92.2896 },
  memphis: { city: "Memphis", state: "TN", lat: 35.1495, lng: -90.049 },
  nashville: { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816 },
  atlanta: { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  birmingham: { city: "Birmingham", state: "AL", lat: 33.5186, lng: -86.8104 },
  jacksonville: { city: "Jacksonville", state: "FL", lat: 30.3322, lng: -81.6557 },
  tampa: { city: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572 },
  charlotte: { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431 },
  louisville: { city: "Louisville", state: "KY", lat: 38.2527, lng: -85.7585 },
  indianapolis: { city: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581 },
  columbus: { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988 },
  chicago: { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  denver: { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  phoenix: { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074 },
};

// [origin, destination, daysFromNow, escortPositions, widthFt, heightFt,
//  lengthFt, weightLbs, rate, rateUnit]
// Escort-position combos loosely follow real-world rules of thumb: wider
// loads pick up STEER, taller loads pick up HIGH_POLE, very long/complex
// routes add ROUTE_SURVEY, and only genuine superloads need THIRD_CAR /
// FOURTH_CAR -- kept rare here on purpose, same as in practice.
const LOADS = [
  ["dallas", "houston", 5, ["CHASE"], 10, 13.5, 75, 45000, 2.5, "per_mile"],
  ["houston", "sanAntonio", 7, ["LEAD", "CHASE"], 12, 14, 90, 68000, null, null],
  ["sanAntonio", "austin", 3, ["CHASE"], 9.5, 13, 60, 32000, 1200, "flat"],
  ["austin", "dallas", 10, ["LEAD", "CHASE", "STEER"], 14, 14.5, 100, 95000, null, null],
  ["dallas", "oklahomaCity", 6, ["LEAD", "CHASE", "HIGH_POLE"], 12, 16, 85, 72000, 3.1, "per_mile"],
  ["oklahomaCity", "tulsa", 4, ["CHASE"], 10, 13.5, 70, 40000, 650, "flat"],
  ["tulsa", "kansasCity", 12, ["LEAD", "CHASE"], 11, 14, 95, 80000, null, null],
  ["kansasCity", "stLouis", 8, ["CHASE", "ROUTE_SURVEY"], 13, 14.5, 110, 88000, null, null],
  ["stLouis", "memphis", 15, ["LEAD", "CHASE"], 10, 13.5, 80, 55000, 2.75, "per_mile"],
  ["memphis", "nashville", 9, ["CHASE"], 9, 13, 65, 38000, null, null],
  ["nashville", "atlanta", 20, ["LEAD", "CHASE", "HIGH_POLE", "ROUTE_SURVEY"], 15, 16.5, 130, 150000, null, null],
  ["atlanta", "birmingham", 14, ["CHASE"], 10, 13.5, 72, 42000, 900, "flat"],
  ["birmingham", "jacksonville", 25, ["LEAD", "CHASE"], 12, 14, 90, 70000, null, null],
  ["jacksonville", "tampa", 11, ["CHASE"], 9.5, 13, 68, 36000, 3.0, "per_mile"],
  ["tampa", "atlanta", 18, ["LEAD", "CHASE", "STEER", "THIRD_CAR"], 16, 15, 140, 185000, null, null],
  ["atlanta", "charlotte", 7, ["CHASE"], 10, 13.5, 75, 48000, null, null],
  ["charlotte", "louisville", 22, ["LEAD", "CHASE"], 11.5, 14, 95, 82000, 2.9, "per_mile"],
  ["louisville", "indianapolis", 6, ["CHASE"], 9, 13, 60, 34000, 550, "flat"],
  ["indianapolis", "columbus", 13, ["LEAD", "CHASE", "HIGH_POLE"], 13, 16, 100, 90000, null, null],
  ["columbus", "chicago", 17, ["LEAD", "CHASE"], 12, 14, 88, 76000, null, null],
  ["chicago", "indianapolis", 5, ["CHASE"], 10, 13.5, 70, 44000, 2.6, "per_mile"],
  ["denver", "kansasCity", 28, ["LEAD", "CHASE", "ROUTE_SURVEY", "FOURTH_CAR"], 17, 15.5, 150, 210000, null, null],
  ["phoenix", "elPaso", 9, ["LEAD", "CHASE", "STEER"], 14, 14, 105, 98000, null, null],
  ["elPaso", "amarillo", 16, ["CHASE"], 9.5, 13, 65, 39000, 750, "flat"],
  ["amarillo", "wichita", 21, ["LEAD", "CHASE"], 11, 14, 92, 79000, null, null],
  ["wichita", "oklahomaCity", 4, ["CHASE"], 10, 13.5, 73, 46000, 2.4, "per_mile"],
  ["littleRock", "memphis", 19, ["LEAD", "CHASE"], 12, 14, 90, 71000, null, null],
];

async function getOrCreateSeedLoadManager() {
  let user = await prisma.user.findUnique({ where: { email: SEED_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SEED_USER_EMAIL,
        // Never meant to be logged into -- not a real bcrypt-able password,
        // just satisfying the NOT NULL column.
        passwordHash: "seed-account-not-a-real-login",
        emailVerifiedAt: new Date(),
      },
    });
  }

  let profile = await prisma.loadManagerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.loadManagerProfile.create({
      data: {
        userId: user.id,
        companyName: "Seed Data Logistics (test)",
        phone: "555-010-0100",
      },
    });
  }
  return profile;
}

async function main() {
  const profile = await getOrCreateSeedLoadManager();

  const deleted = await prisma.load.deleteMany({ where: { postedById: profile.id } });
  console.log(`Cleared ${deleted.count} previously-seeded load(s).`);

  const now = Date.now();
  const rows = LOADS.map(
    ([originKey, destKey, daysFromNow, positions, width, height, length, weight, rate, rateUnit]) => {
      const origin = CITIES[originKey];
      const destination = CITIES[destKey];
      return {
        originCity: origin.city,
        originState: origin.state,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationCity: destination.city,
        destinationState: destination.state,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        date: new Date(now + daysFromNow * 24 * 60 * 60 * 1000),
        escortPositions: positions,
        dimensionWidthFt: width,
        dimensionHeightFt: height,
        dimensionLengthFt: length,
        weightLbs: weight,
        rate,
        rateUnit,
        postedById: profile.id,
      };
    }
  );

  await prisma.load.createMany({ data: rows });
  console.log(`Seeded ${rows.length} loads across ${new Set(rows.map((r) => r.originState)).size} origin states.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
