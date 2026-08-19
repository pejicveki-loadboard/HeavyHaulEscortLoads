import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { geocodeCityState } from "@/lib/geocode";
import { EscortPosition, RateUnit } from "@/generated/prisma/enums";

// Blank string -> null (explicitly clear the field); key absent entirely ->
// undefined (leave the field untouched, matters for partial PATCH updates);
// otherwise coerce to a positive number.
export const optionalPositiveNumber = z.preprocess(
  (val) => (val === "" ? null : val),
  z.coerce.number().positive().nullable().optional()
);

const optionalRateUnit = z.preprocess(
  (val) => (val === "" ? null : val),
  z.enum(RateUnit).nullable().optional()
);

export const loadFieldsSchema = z.object({
  originCity: z.string().trim().min(1, "Origin city is required."),
  originState: z.string().trim().min(1, "Origin state is required."),
  destinationCity: z.string().trim().min(1, "Destination city is required."),
  destinationState: z.string().trim().min(1, "Destination state is required."),
  date: z.coerce.date({ error: "A valid date is required." }),
  escortPositions: z
    .array(z.enum(EscortPosition))
    .min(1, "Select at least one escort position."),
  dimensionWidthFt: optionalPositiveNumber,
  dimensionHeightFt: optionalPositiveNumber,
  dimensionLengthFt: optionalPositiveNumber,
  weightLbs: optionalPositiveNumber,
  rate: optionalPositiveNumber,
  rateUnit: optionalRateUnit,
});

function requireRateUnitWithRate(data: { rate?: number | null; rateUnit?: RateUnit | null }) {
  return !data.rate || data.rateUnit;
}

export const loadSchema = loadFieldsSchema.refine(requireRateUnitWithRate, {
  message: "Select a rate unit when entering a rate.",
  path: ["rateUnit"],
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "You need a Load Manager profile first." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [origin, destination] = await Promise.all([
    geocodeCityState(data.originCity, data.originState),
    geocodeCityState(data.destinationCity, data.destinationState),
  ]);
  if (!origin) {
    return NextResponse.json(
      { error: `Couldn't find "${data.originCity}, ${data.originState}" — check the spelling.` },
      { status: 400 }
    );
  }
  if (!destination) {
    return NextResponse.json(
      {
        error: `Couldn't find "${data.destinationCity}, ${data.destinationState}" — check the spelling.`,
      },
      { status: 400 }
    );
  }

  const load = await prisma.load.create({
    data: {
      postedById: profile.id,
      originCity: data.originCity,
      originState: data.originState,
      originLat: origin.lat,
      originLng: origin.lng,
      destinationCity: data.destinationCity,
      destinationState: data.destinationState,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      date: data.date,
      escortPositions: data.escortPositions as EscortPosition[],
      dimensionWidthFt: data.dimensionWidthFt ?? null,
      dimensionHeightFt: data.dimensionHeightFt ?? null,
      dimensionLengthFt: data.dimensionLengthFt ?? null,
      weightLbs: data.weightLbs ?? null,
      rate: data.rate ?? null,
      rateUnit: data.rateUnit ?? null,
    },
  });

  return NextResponse.json({ id: load.id }, { status: 201 });
}
