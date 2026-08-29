// One-time (but safe to re-run) backfill: re-geocodes every existing Load
// and SearchLocation row and overwrites `city` with Mapbox's canonical
// spelling/capitalization (feature.text) wherever it differs from what's
// currently stored -- fixes rows saved before geocodeCityState() started
// returning/being used for the canonical name (e.g. "astin, mn" -> "Austin"),
// including plain casing issues ("austin" -> "Austin").
//
// Only touches `city` columns. Coordinates are also refreshed from the same
// geocode call as a side effect, but they should already match -- this
// isn't a coordinate-correctness pass. State is never touched: both forms
// constrain it to a valid two-letter code via a <select>, so it was never
// free text to begin with.
//
// A row whose current city/state no longer geocodes (relevance < 0.99) is
// left untouched and logged as a warning rather than blocked or deleted --
// that shouldn't happen for anything that made it through the API's own
// geocoding gate when it was created, but the backfill shouldn't destroy
// data over it if it ever does.
//
// Usage: npx tsx scripts/backfill-city-names.mjs

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { geocodeCityState } from "../src/lib/geocode.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Small delay between Mapbox calls -- there's no meaningful rate-limit risk
// at this data volume, but it costs nothing to be polite.
const DELAY_MS = 50;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillLoads() {
  const loads = await prisma.load.findMany({
    select: { id: true, originCity: true, originState: true, destinationCity: true, destinationState: true },
  });

  let checked = 0;
  let changed = 0;
  let failed = 0;

  for (const load of loads) {
    checked++;
    const data = {};

    const origin = await geocodeCityState(load.originCity, load.originState);
    await sleep(DELAY_MS);
    if (!origin) {
      failed++;
      console.warn(
        `  [load ${load.id}] origin "${load.originCity}, ${load.originState}" no longer geocodes -- left as-is.`
      );
    } else if (origin.city !== load.originCity) {
      data.originCity = origin.city;
      data.originLat = origin.lat;
      data.originLng = origin.lng;
    }

    const destination = await geocodeCityState(load.destinationCity, load.destinationState);
    await sleep(DELAY_MS);
    if (!destination) {
      failed++;
      console.warn(
        `  [load ${load.id}] destination "${load.destinationCity}, ${load.destinationState}" no longer geocodes -- left as-is.`
      );
    } else if (destination.city !== load.destinationCity) {
      data.destinationCity = destination.city;
      data.destinationLat = destination.lat;
      data.destinationLng = destination.lng;
    }

    if (Object.keys(data).length > 0) {
      await prisma.load.update({ where: { id: load.id }, data });
      changed++;
      console.log(
        `  [load ${load.id}] ${load.originCity} -> ${data.originCity ?? load.originCity}, ` +
          `${load.destinationCity} -> ${data.destinationCity ?? load.destinationCity}`
      );
    }
  }

  console.log(`Loads: checked ${checked}, updated ${changed}, failed to re-geocode ${failed}.`);
}

async function backfillSearchLocations() {
  const locations = await prisma.searchLocation.findMany({
    select: { id: true, city: true, state: true },
  });

  let checked = 0;
  let changed = 0;
  let failed = 0;

  for (const location of locations) {
    checked++;
    const geocoded = await geocodeCityState(location.city, location.state);
    await sleep(DELAY_MS);
    if (!geocoded) {
      failed++;
      console.warn(
        `  [search location ${location.id}] "${location.city}, ${location.state}" no longer geocodes -- left as-is.`
      );
      continue;
    }
    if (geocoded.city !== location.city) {
      await prisma.searchLocation.update({
        where: { id: location.id },
        data: { city: geocoded.city, lat: geocoded.lat, lng: geocoded.lng },
      });
      changed++;
      console.log(`  [search location ${location.id}] ${location.city} -> ${geocoded.city}`);
    }
  }

  console.log(`Search locations: checked ${checked}, updated ${changed}, failed to re-geocode ${failed}.`);
}

async function main() {
  if (!process.env.MAPBOX_ACCESS_TOKEN) {
    console.error("MAPBOX_ACCESS_TOKEN is not set -- add it to .env first.");
    process.exit(1);
  }

  console.log("Backfilling loads...");
  await backfillLoads();

  console.log("Backfilling search locations...");
  await backfillSearchLocations();
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
