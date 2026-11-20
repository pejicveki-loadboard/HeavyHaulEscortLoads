import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { centralDateString, endOfCentralDay, isDateString } from "@/lib/central-date";

// Admin-only writes to Pilot Car access controls (single row or bulk).
// /api/admin is NOT covered by the proxy matcher or the /admin layout
// guard, so this handler is the only thing protecting these writes: it
// re-checks isAdmin from the DB (not the JWT) on every call.
//
// Load Manager profiles are deliberately not addressable here -- load
// posting is always free.

const MAX_IDS = 200;

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["enable", "disable", "clearFreeUntil"]),
    profileIds: z.array(z.string().min(1).max(64)).min(1).max(MAX_IDS),
  }),
  z.object({
    action: z.literal("setFreeUntil"),
    profileIds: z.array(z.string().min(1).max(64)).min(1).max(MAX_IDS),
    freeUntil: z.string().refine(isDateString, "freeUntil must be a valid YYYY-MM-DD date."),
  }),
  z.object({
    action: z.literal("setNote"),
    profileIds: z.array(z.string().min(1).max(64)).length(1),
    note: z.string().max(500),
  }),
]);

export async function POST(request: Request) {
  // Defense in depth against cross-site requests (session cookie is
  // SameSite=Lax already; JSON content-type also forces a CORS preflight).
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const profileIds = [...new Set(input.profileIds)];

  let data: {
    accessEnabled?: boolean;
    freeAccessUntil?: Date | null;
    accessNote?: string | null;
  };
  switch (input.action) {
    case "enable":
      data = { accessEnabled: true };
      break;
    case "disable":
      data = { accessEnabled: false };
      break;
    case "clearFreeUntil":
      data = { freeAccessUntil: null };
      break;
    case "setFreeUntil":
      if (input.freeUntil < centralDateString(new Date())) {
        return NextResponse.json({ error: "Free-until date can't be in the past." }, { status: 400 });
      }
      data = { freeAccessUntil: endOfCentralDay(input.freeUntil) };
      break;
    case "setNote": {
      const note = input.note.trim();
      data = { accessNote: note === "" ? null : note };
      break;
    }
  }

  // All-or-nothing: refuse if any id isn't a real Pilot Car profile, so a
  // stale selection can't silently half-apply.
  const existing = await prisma.pilotCarProfile.count({ where: { id: { in: profileIds } } });
  if (existing !== profileIds.length) {
    return NextResponse.json({ error: "One or more Pilot Car profiles were not found." }, { status: 404 });
  }

  const result = await prisma.pilotCarProfile.updateMany({
    where: { id: { in: profileIds } },
    data: { ...data, accessUpdatedAt: new Date(), accessUpdatedById: admin.id },
  });

  console.info(
    `[admin-access] admin=${admin.id} action=${input.action} profiles=${profileIds.length}`
  );
  return NextResponse.json({ updated: result.count });
}
