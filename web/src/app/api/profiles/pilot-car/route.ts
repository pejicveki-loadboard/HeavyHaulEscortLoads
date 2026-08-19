import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EscortPosition, SubscriptionStatus } from "@/generated/prisma/enums";

const TRIAL_LENGTH_DAYS = 30;

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  homeBaseCity: z.string().trim().min(1, "City is required."),
  homeBaseState: z.string().trim().min(1, "State is required."),
  alertRadiusMiles: z.coerce.number().int().positive(),
  escortPositions: z
    .array(z.enum(EscortPosition))
    .min(1, "Select at least one escort position."),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const existing = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a Pilot Car profile." },
      { status: 409 }
    );
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_LENGTH_DAYS);

  const profile = await prisma.pilotCarProfile.create({
    data: {
      userId: session.user.id,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
      homeBaseCity: parsed.data.homeBaseCity,
      homeBaseState: parsed.data.homeBaseState,
      alertRadiusMiles: parsed.data.alertRadiusMiles,
      escortPositions: parsed.data.escortPositions as EscortPosition[],
      subscriptionStatus: SubscriptionStatus.trialing,
      trialStartedAt: now,
      trialEndsAt,
    },
  });

  return NextResponse.json({ id: profile.id }, { status: 201 });
}
