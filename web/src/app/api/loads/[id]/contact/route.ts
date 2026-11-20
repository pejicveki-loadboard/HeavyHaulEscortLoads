import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ACCESS_ENDED_MESSAGE, ACCESS_PAUSED_MESSAGE, accessDenialReason } from "@/lib/access";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed, retryAfterSeconds } = await checkRateLimit("contact-reveal", getClientIp(request));
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  const denied = profile ? accessDenialReason(profile) : "no_subscription";
  if (!profile || denied) {
    return NextResponse.json(
      { error: denied === "admin_off" ? ACCESS_PAUSED_MESSAGE : ACCESS_ENDED_MESSAGE },
      { status: 403 }
    );
  }

  const { id } = await params;
  const load = await prisma.load.findUnique({
    where: { id },
    select: { postedBy: { select: { phone: true } } },
  });
  if (!load) {
    return NextResponse.json({ error: "Load not found." }, { status: 404 });
  }

  return NextResponse.json({ phone: load.postedBy.phone });
}
