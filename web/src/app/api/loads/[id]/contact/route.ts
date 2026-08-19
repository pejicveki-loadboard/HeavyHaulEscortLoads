import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasLoadBoardAccess } from "@/lib/subscription";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile || !hasLoadBoardAccess(profile)) {
    return NextResponse.json(
      { error: "An active or trialing Pilot Car subscription is required." },
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
