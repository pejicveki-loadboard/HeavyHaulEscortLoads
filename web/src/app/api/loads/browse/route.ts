import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geocodeCityState } from "@/lib/geocode";
import { hasLoadBoardAccess } from "@/lib/subscription";
import { EscortPosition } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

const querySchema = z.object({
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  radiusMiles: z.coerce.number().int().min(1).max(500, "Radius can't exceed 500 miles."),
  escortPositions: z.array(z.enum(EscortPosition)).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

type BrowseRow = {
  id: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  date: Date;
  escort_positions: string[];
  dimension_width_ft: number | null;
  dimension_height_ft: number | null;
  dimension_length_ft: number | null;
  weight_lbs: number | null;
  rate: Prisma.Decimal | null;
  rate_unit: string | null;
  posted_by_company_name: string;
  distance_miles: number;
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile || !hasLoadBoardAccess(profile)) {
    return NextResponse.json(
      { error: "An active or trialing Pilot Car subscription is required to browse loads." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    radiusMiles: searchParams.get("radiusMiles") ?? undefined,
    escortPositions: searchParams.get("escortPositions")
      ? searchParams.get("escortPositions")!.split(",")
      : undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid search parameters." },
      { status: 400 }
    );
  }
  const q = parsed.data;

  const center = await geocodeCityState(q.city, q.state);
  if (!center) {
    return NextResponse.json(
      { error: `Couldn't find "${q.city}, ${q.state}" — check the spelling.` },
      { status: 400 }
    );
  }

  const dateFromClause = q.dateFrom
    ? Prisma.sql`AND l.date >= ${q.dateFrom}`
    : Prisma.empty;
  const dateToClause = q.dateTo ? Prisma.sql`AND l.date <= ${q.dateTo}` : Prisma.empty;
  const positionsClause =
    q.escortPositions && q.escortPositions.length > 0
      ? Prisma.sql`AND l.escort_positions && ${q.escortPositions}::"EscortPosition"[]`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<BrowseRow[]>`
    SELECT * FROM (
      SELECT
        l.id, l.origin_city, l.origin_state, l.destination_city, l.destination_state,
        l.date, array_to_json(l.escort_positions) as escort_positions,
        l.dimension_width_ft, l.dimension_height_ft,
        l.dimension_length_ft, l.weight_lbs, l.rate, l.rate_unit,
        lm.company_name as posted_by_company_name,
        (3959 * acos(least(1, greatest(-1,
          cos(radians(${center.lat})) * cos(radians(l.origin_lat)) * cos(radians(l.origin_lng) - radians(${center.lng}))
          + sin(radians(${center.lat})) * sin(radians(l.origin_lat))
        )))) as distance_miles
      FROM loads l
      JOIN load_manager_profiles lm ON lm.id = l.posted_by_id
      WHERE l.status = 'open'
        ${dateFromClause}
        ${dateToClause}
        ${positionsClause}
    ) sub
    WHERE distance_miles <= ${q.radiusMiles}
    ORDER BY distance_miles ASC
    LIMIT 100
  `;

  const results = rows.map((row) => ({
    id: row.id,
    originCity: row.origin_city,
    originState: row.origin_state,
    destinationCity: row.destination_city,
    destinationState: row.destination_state,
    date: row.date,
    escortPositions: row.escort_positions,
    dimensionWidthFt: row.dimension_width_ft,
    dimensionHeightFt: row.dimension_height_ft,
    dimensionLengthFt: row.dimension_length_ft,
    weightLbs: row.weight_lbs,
    rate: row.rate ? row.rate.toNumber() : null,
    rateUnit: row.rate_unit,
    postedByCompanyName: row.posted_by_company_name,
    distanceMiles: Math.round(row.distance_miles * 10) / 10,
  }));

  return NextResponse.json({ results });
}
