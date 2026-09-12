import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Push subscriptions are scoped to a PilotCarProfile because load-match
// alerts (the only thing that triggers a push today) are a pilot-car-side
// concept -- same scoping as SearchLocation, but this table has no other
// relationship to it. See prisma/schema.prisma's "Web push (PWA)" section
// for why this is intentionally its own table rather than reusing anything
// SMS/email-alert-related.
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// TODO (known, deliberately deferred -- narrow edge cases on an opt-in,
// additive feature, not launch blockers): neither POST nor DELETE verifies
// that the calling browser actually owns `endpoint` before binding/unbinding
// it to the caller's profile. Shared root cause across three cases:
//  - On a shared/reused device, User B logging in after User A enabled push
//    there sees the checkbox read as "on" (browser-side subscription still
//    exists) even though this row's profileId is still A's -- B's DELETE
//    below then silently matches zero rows (profileId mismatch) instead of
//    actually detaching the device.
//  - POST's upsert reassigns profileId to whoever calls it with a given
//    endpoint, with no proof of ownership -- if an endpoint string ever
//    leaked to another authenticated user, they could redirect that
//    subscription's notifications to themselves.
// A real fix needs some proof-of-possession for the endpoint (e.g. a
// server-issued token round-tripped through the subscribe flow) rather than
// trusting whatever endpoint the client claims.
async function requireProfile() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };

  const profile = await prisma.pilotCarProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return {
      error: NextResponse.json({ error: "You need a Pilot Car profile first." }, { status: 400 }),
    };
  }
  return { profile };
}

export async function POST(request: Request) {
  const { profile, error } = await requireProfile();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  // Upsert on endpoint: re-checking the checkbox after an earlier unsubscribe
  // (or the browser silently re-issuing the same endpoint) shouldn't 500 on
  // the unique constraint.
  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      profileId: profile.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    update: {
      profileId: profile.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { profile, error } = await requireProfile();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, profileId: profile.id },
  });

  return NextResponse.json({ ok: true });
}
