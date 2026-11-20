// npm run db:seed:dev
// Seeds the LOCAL dev database (Docker heavyhaul-dev-db on 127.0.0.1:5433)
// with fake accounts covering each access state, plus a few loads. All
// emails are @example.com and all phones are 555-01xx fictional numbers.
// Stripe IDs are fake placeholders, never real Stripe objects.
//
// Refuses to run unless DATABASE_URL's host is 127.0.0.1/localhost.
// Safe to re-run: deletes and recreates only the seed accounts below.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { die, hostPort, isLocal } from "./db-safety.mjs";

const url = process.env.DATABASE_URL;
if (!url) die("DATABASE_URL is not set.");
if (!isLocal(url)) die(`seed is local-only; DATABASE_URL host is ${hostPort(url)}.`);
console.log(`[db-safety] seeding ${hostPort(url)}`);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

export const DEV_PASSWORD = "devpass123";
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysFromNow = (d) => new Date(now + d * DAY);

const EMAILS = {
  admin: "admin@example.com",
  newPilot: "new-pilot@example.com",
  expiredPilot: "expired-pilot@example.com",
  paidPilot: "paid-pilot@example.com",
  loadManager: "load-manager@example.com",
};

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  const emails = Object.values(EMAILS);

  // Loads don't cascade from LoadManagerProfile, so clear them first.
  await prisma.load.deleteMany({ where: { postedBy: { user: { email: { in: emails } } } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });

  const verified = { emailVerifiedAt: new Date(now) };

  await prisma.user.create({
    data: { email: EMAILS.admin, passwordHash, isAdmin: true, ...verified },
  });

  // Signed up today: 30-day trial just started, no search locations yet.
  await prisma.user.create({
    data: {
      email: EMAILS.newPilot,
      passwordHash,
      phone: "(214) 555-0101",
      pilotCarProfile: {
        create: {
          companyName: "Fresh Start Escorts (DEV)",
          phone: "(214) 555-0101",
          subscriptionStatus: "trialing",
          trialStartedAt: new Date(now),
          trialEndsAt: daysFromNow(30),
        },
      },
    },
  });

  // Trial ended 5 days ago and never subscribed. Status column is left as
  // `trialing` on purpose -- that's what real stale rows look like, and
  // hasLoadBoardAccess()/effectiveSubscriptionStatus() treat it as expired.
  await prisma.user.create({
    data: {
      email: EMAILS.expiredPilot,
      passwordHash,
      ...verified,
      phone: "(405) 555-0102",
      pilotCarProfile: {
        create: {
          companyName: "Lapsed Pilot Cars (DEV)",
          phone: "(405) 555-0102",
          createdAt: daysFromNow(-35),
          subscriptionStatus: "trialing",
          trialStartedAt: daysFromNow(-35),
          trialEndsAt: daysFromNow(-5),
          searchLocations: {
            create: {
              label: "OKC home base",
              city: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164,
              radiusMiles: 200, escortPositions: ["LEAD", "CHASE"],
            },
          },
        },
      },
    },
  });

  // Active monthly subscriber with fake Stripe test IDs.
  await prisma.user.create({
    data: {
      email: EMAILS.paidPilot,
      passwordHash,
      ...verified,
      phone: "(713) 555-0103",
      pilotCarProfile: {
        create: {
          companyName: "Steady Pay Escort Service (DEV)",
          phone: "(713) 555-0103",
          createdAt: daysFromNow(-60),
          subscriptionStatus: "active",
          trialStartedAt: daysFromNow(-60),
          trialEndsAt: daysFromNow(-30),
          paidStartedAt: daysFromNow(-40),
          planInterval: "monthly",
          currentPeriodEnd: daysFromNow(20),
          stripeCustomerId: "cus_test_DEVSEED0001",
          stripeSubscriptionId: "sub_test_DEVSEED0001",
          searchLocations: {
            create: [
              {
                label: "Truck 1 -- Houston",
                city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698,
                radiusMiles: 250, escortPositions: ["LEAD", "CHASE", "HIGH_POLE"],
              },
              {
                label: "Truck 2 -- Dallas",
                city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797,
                radiusMiles: 150, escortPositions: ["CHASE", "STEER"],
              },
            ],
          },
        },
      },
    },
  });

  const lm = await prisma.user.create({
    data: {
      email: EMAILS.loadManager,
      passwordHash,
      ...verified,
      phone: "(972) 555-0104",
      loadManagerProfile: {
        create: {
          companyName: "Big Iron Hauling (DEV)",
          phone: "(972) 555-0104",
          dotNumber: "0000001",
          mcNumber: "MC-000001",
        },
      },
    },
    include: { loadManagerProfile: true },
  });

  const C = {
    dallas: ["Dallas", "TX", 32.7767, -96.797],
    houston: ["Houston", "TX", 29.7604, -95.3698],
    okc: ["Oklahoma City", "OK", 35.4676, -97.5164],
    austin: ["Austin", "TX", 30.2672, -97.7431],
    memphis: ["Memphis", "TN", 35.1495, -90.049],
    denver: ["Denver", "CO", 39.7392, -104.9903],
  };
  const leg = (from, to) => ({
    originCity: C[from][0], originState: C[from][1], originLat: C[from][2], originLng: C[from][3],
    destinationCity: C[to][0], destinationState: C[to][1], destinationLat: C[to][2], destinationLng: C[to][3],
  });

  const loads = [
    { ...leg("houston", "dallas"), date: daysFromNow(3), escortPositions: ["LEAD", "CHASE"],
      dimensionWidthFt: 14, dimensionHeightFt: 15.5, dimensionLengthFt: 120, weightLbs: 180000,
      rate: "2.10", rateUnit: "per_mile" },
    { ...leg("dallas", "okc"), date: daysFromNow(5), escortPositions: ["HIGH_POLE", "CHASE"],
      dimensionWidthFt: 12, dimensionHeightFt: 16.2, rate: "650.00", rateUnit: "flat" },
    { ...leg("austin", "memphis"), date: daysFromNow(8), escortPositions: ["LEAD", "STEER", "THIRD_CAR"],
      dimensionWidthFt: 16, dimensionLengthFt: 160, weightLbs: 250000, rate: "2.40", rateUnit: "per_mile" },
    { ...leg("okc", "denver"), date: daysFromNow(10), escortPositions: ["ROUTE_SURVEY"] },
    { ...leg("houston", "austin"), date: daysFromNow(-4), escortPositions: ["CHASE"],
      rate: "400.00", rateUnit: "flat", status: "covered", coveredAt: daysFromNow(-6) },
  ];

  for (const load of loads) {
    await prisma.load.create({ data: { ...load, postedById: lm.loadManagerProfile.id } });
  }

  console.log(`Seeded 5 users and ${loads.length} loads. Password for all: ${DEV_PASSWORD}`);
  for (const [role, email] of Object.entries(EMAILS)) console.log(`  ${role.padEnd(13)} ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
