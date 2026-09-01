import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geocodeCityState } from "@/lib/geocode";
import { matchAndAlertLoad } from "@/lib/load-matching";
import { hasLoadBoardAccess } from "@/lib/subscription";
import { EscortPosition, LoadStatus } from "@/generated/prisma/enums";
import { loadFieldsSchema } from "../route";

const updateSchema = loadFieldsSchema.partial().extend({
  status: z.enum(LoadStatus).optional(),
});

async function findOwnedLoad(loadId: string, userId: string) {
  return prisma.load.findFirst({
    where: { id: loadId, postedBy: { userId } },
  });
}

// Same haversine formula as the raw SQL in matchAndAlertLoad/browse, kept in
// sync manually since this is the one spot doing the distance math in JS
// instead of the query itself (a single-row lookup by id, not a scan).
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const cosAngle =
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2) - toRad(lng1)) +
    Math.sin(toRad(lat1)) * Math.sin(toRad(lat2));
  return 3959 * Math.acos(Math.min(1, Math.max(-1, cosAngle)));
}

// Deep-link target for the SMS/email alert links (see loadMatchSmsBody /
// loadMatchEmail in load-matching.ts) -- lets the dashboard show the exact
// load that was alerted on instead of dumping the user on an empty search
// form. Deliberately not folded into /api/loads/browse: that endpoint's
// schema requires city/state/radius for a geo scan, a fundamentally
// different query shape than "fetch this one row by id."
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile || !hasLoadBoardAccess(profile)) {
    return NextResponse.json(
      { error: "An active or trialing Pilot Car subscription is required to view loads." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const searchLocationId = new URL(request.url).searchParams.get("searchLocationId");

  const load = await prisma.load.findUnique({
    where: { id },
    select: {
      id: true,
      originCity: true,
      originState: true,
      originLat: true,
      originLng: true,
      destinationCity: true,
      destinationState: true,
      date: true,
      escortPositions: true,
      dimensionWidthFt: true,
      dimensionHeightFt: true,
      dimensionLengthFt: true,
      weightLbs: true,
      rate: true,
      rateUnit: true,
      status: true,
      postedBy: { select: { companyName: true } },
    },
  });
  if (!load || load.status !== "open") {
    return NextResponse.json({ error: "That load isn't available anymore." }, { status: 404 });
  }

  // Only trust a searchLocationId that actually belongs to this viewer --
  // otherwise it's just an unauthenticated distance oracle for other
  // accounts' saved locations.
  let distanceMiles: number | null = null;
  if (searchLocationId) {
    const location = await prisma.searchLocation.findFirst({
      where: { id: searchLocationId, profileId: profile.id },
    });
    if (location?.lat != null && location.lng != null) {
      distanceMiles =
        Math.round(haversineMiles(location.lat, location.lng, load.originLat, load.originLng) * 10) / 10;
    }
  }

  return NextResponse.json({
    result: {
      id: load.id,
      originCity: load.originCity,
      originState: load.originState,
      destinationCity: load.destinationCity,
      destinationState: load.destinationState,
      date: load.date,
      escortPositions: load.escortPositions,
      dimensionWidthFt: load.dimensionWidthFt,
      dimensionHeightFt: load.dimensionHeightFt,
      dimensionLengthFt: load.dimensionLengthFt,
      weightLbs: load.weightLbs,
      rate: load.rate ? load.rate.toNumber() : null,
      rateUnit: load.rateUnit,
      postedByCompanyName: load.postedBy.companyName,
      distanceMiles,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedLoad(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.rate && !data.rateUnit && !existing.rateUnit) {
    return NextResponse.json(
      { error: "Select a rate unit when entering a rate." },
      { status: 400 }
    );
  }

  // originCity/destinationCity below default to the raw parsed value (only
  // relevant if geocoding is skipped entirely, which can't actually happen
  // given the `if` guards) and are overwritten with Mapbox's canonical
  // spelling/capitalization once geocoding runs -- see geocode.ts.
  let originCity = data.originCity;
  let originLat = existing.originLat;
  let originLng = existing.originLng;
  if (data.originCity !== undefined || data.originState !== undefined) {
    const city = data.originCity ?? existing.originCity;
    const state = data.originState ?? existing.originState;
    const origin = await geocodeCityState(city, state);
    if (!origin) {
      return NextResponse.json(
        { error: `Couldn't find "${city}, ${state}" — check the spelling.` },
        { status: 400 }
      );
    }
    originCity = origin.city;
    originLat = origin.lat;
    originLng = origin.lng;
  }

  let destinationCity = data.destinationCity;
  let destinationLat = existing.destinationLat;
  let destinationLng = existing.destinationLng;
  if (data.destinationCity !== undefined || data.destinationState !== undefined) {
    const city = data.destinationCity ?? existing.destinationCity;
    const state = data.destinationState ?? existing.destinationState;
    const destination = await geocodeCityState(city, state);
    if (!destination) {
      return NextResponse.json(
        { error: `Couldn't find "${city}, ${state}" — check the spelling.` },
        { status: 400 }
      );
    }
    destinationCity = destination.city;
    destinationLat = destination.lat;
    destinationLng = destination.lng;
  }

  // Track when a load actually became covered (not just when it was
  // posted), so the dashboard's "Covered this month" stat can filter on
  // the real transition instead of approximating from createdAt. Cleared
  // back to null on reopen so re-covering later gets a fresh timestamp.
  let coveredAt = existing.coveredAt;
  if (data.status === "covered" && existing.status !== "covered") {
    coveredAt = new Date();
  } else if (data.status !== undefined && data.status !== "covered" && existing.status === "covered") {
    coveredAt = null;
  }

  // Specifically covered -> open, not the broader "reopened" check below
  // (which also matches the never-actually-reachable expired -> open case
  // today) -- a fresh alert cycle should only start for a load that was
  // genuinely covered and is now back on the market. See Load.alertCycle.
  const reopenedFromCovered = data.status === "open" && existing.status === "covered";

  const updated = await prisma.load.update({
    where: { id },
    data: {
      originCity,
      originState: data.originState,
      originLat,
      originLng,
      destinationCity,
      destinationState: data.destinationState,
      destinationLat,
      destinationLng,
      date: data.date,
      escortPositions: data.escortPositions as EscortPosition[] | undefined,
      dimensionWidthFt: data.dimensionWidthFt,
      dimensionHeightFt: data.dimensionHeightFt,
      dimensionLengthFt: data.dimensionLengthFt,
      weightLbs: data.weightLbs,
      rate: data.rate,
      rateUnit: data.rateUnit,
      status: data.status,
      coveredAt,
      alertCycle: reopenedFromCovered ? { increment: 1 } : undefined,
    },
  });

  // "Meaningful edit" per PHASE1_PLAN.md: origin moved, escort positions
  // changed, or the load was reopened -- any of these can surface it to
  // search locations that didn't match before. matchAndAlertLoad's
  // insert-first LoadAlert dedup means re-running this is always safe
  // (already-alerted channels are skipped), so no need to be clever here.
  const originChanged = data.originCity !== undefined || data.originState !== undefined;
  const escortPositionsChanged = data.escortPositions !== undefined;
  const reopened = data.status === "open" && existing.status !== "open";
  if (originChanged || escortPositionsChanged || reopened) {
    try {
      await matchAndAlertLoad(updated.id);
    } catch (error) {
      console.error(`Failed to match/alert load ${updated.id}:`, error);
    }
  }

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOwnedLoad(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  await prisma.load.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
