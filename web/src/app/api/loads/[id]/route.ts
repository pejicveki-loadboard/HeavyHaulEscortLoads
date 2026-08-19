import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geocodeCityState } from "@/lib/geocode";
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
    originLat = origin.lat;
    originLng = origin.lng;
  }

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
    destinationLat = destination.lat;
    destinationLng = destination.lng;
  }

  const updated = await prisma.load.update({
    where: { id },
    data: {
      originCity: data.originCity,
      originState: data.originState,
      originLat,
      originLng,
      destinationCity: data.destinationCity,
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
  const existing = await findOwnedLoad(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  await prisma.load.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
