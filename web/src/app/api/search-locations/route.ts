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
  active: z.boolean().optional(),
  alertChannel: z.enum(AlertChannelPreference).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "You need a Pilot Car profile first." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const geocoded = await geocodeCityState(parsed.data.city, parsed.data.state);
  if (!geocoded) {
    return NextResponse.json(
      {
        error: `Couldn't find "${parsed.data.city}, ${parsed.data.state}" — check the spelling.`,
      },
      { status: 400 }
    );
  }

  const location = await prisma.searchLocation.create({
    data: {
      profileId: profile.id,
      label: parsed.data.label || null,
      // Mapbox's canonical spelling/capitalization, not the raw input --
      // see geocode.ts.
      city: geocoded.city,
      state: parsed.data.state,
      lat: geocoded.lat,
      lng: geocoded.lng,
      radiusMiles: parsed.data.radiusMiles,
      escortPositions: parsed.data.escortPositions as EscortPosition[],
      active: parsed.data.active ?? true,
      // Default to email-only, never a pre-selected SMS opt-in, per Twilio's
      // A2P 10DLC web-form consent requirements -- the form always sends an
      // explicit value now, but keep this safe as a fallback.
      alertChannel: parsed.data.alertChannel ?? AlertChannelPreference.email,
    },
  });

  return NextResponse.json({ id: location.id }, { status: 201 });
}
