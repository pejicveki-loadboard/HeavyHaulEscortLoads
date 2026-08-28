import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

const TRIAL_LENGTH_DAYS = 30;

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
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

  // Carry over the signup-page SMS opt-in (if any) as this profile's own
  // durable consent record -- read from the User row rather than trusting
  // anything the client sends here, since consent itself was already
  // captured at signup and shouldn't be re-grantable via this endpoint.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { smsConsentedAt: true },
  });

  const profile = await prisma.pilotCarProfile.create({
    data: {
      userId: session.user.id,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
      smsConsentedAt: user?.smsConsentedAt ?? null,
      subscriptionStatus: SubscriptionStatus.trialing,
      trialStartedAt: now,
      trialEndsAt,
    },
  });

  return NextResponse.json({ id: profile.id }, { status: 201 });
}

export async function PATCH(request: Request) {
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

  try {
    const profile = await prisma.pilotCarProfile.update({
      where: { userId: session.user.id },
      data: {
        companyName: parsed.data.companyName,
        phone: parsed.data.phone,
      },
    });
    return NextResponse.json({ id: profile.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json(
        { error: "No Pilot Car profile found." },
        { status: 404 }
      );
    }
    throw e;
  }
}
