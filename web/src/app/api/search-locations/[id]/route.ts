import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geocodeCityState } from "@/lib/geocode";
import { AlertChannelPreference, EscortPosition } from "@/generated/prisma/enums";

const schema = z.object({
  label: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  radiusMiles: z.coerce.number().int().min(1).max(500, "Radius can't exceed 500 miles."),
  escortPositions: z
    .array(z.enum(EscortPosition))
    .min(1, "Select at least one escort position."),
  active: z.boolean(),
  alertChannel: z.enum(AlertChannelPreference),
});

async function findOwnedLocation(locationId: string, userId: string) {
  return prisma.searchLocation.findFirst({
    where: { id: locationId, profile: { userId } },
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
  const existing = await findOwnedLocation(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Search location not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  let city = parsed.data.city;
  let lat = existing.lat;
  let lng = existing.lng;
  const cityOrStateChanged =
    parsed.data.city !== existing.city || parsed.data.state !== existing.state;
  if (cityOrStateChanged || lat === null || lng === null) {
    const geocoded = await geocodeCityState(parsed.data.city, parsed.data.state);
    if (!geocoded) {
      return NextResponse.json(
        {
          error: `Couldn't find "${parsed.data.city}, ${parsed.data.state}" — check the spelling.`,
        },
        { status: 400 }
      );
    }
    // Mapbox's canonical spelling/capitalization, not the raw input -- see
    // geocode.ts.
    city = geocoded.city;
    lat = geocoded.lat;
    lng = geocoded.lng;
  }

  const updated = await prisma.searchLocation.update({
    where: { id },
    data: {
      label: parsed.data.label || null,
      city,
      state: parsed.data.state,
      lat,
      lng,
      radiusMiles: parsed.data.radiusMiles,
      escortPositions: parsed.data.escortPositions as EscortPosition[],
      active: parsed.data.active,
      alertChannel: parsed.data.alertChannel,
    },
  });

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
  const existing = await findOwnedLocation(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Search location not found." }, { status: 404 });
  }

  await prisma.searchLocation.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
