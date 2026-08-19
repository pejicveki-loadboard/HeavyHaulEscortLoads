import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  dotNumber: z.string().trim().optional(),
  mcNumber: z.string().trim().optional(),
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

  const existing = await prisma.loadManagerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a Load Manager profile." },
      { status: 409 }
    );
  }

  const profile = await prisma.loadManagerProfile.create({
    data: {
      userId: session.user.id,
      companyName: parsed.data.companyName,
      phone: parsed.data.phone,
      dotNumber: parsed.data.dotNumber || null,
      mcNumber: parsed.data.mcNumber || null,
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
    const profile = await prisma.loadManagerProfile.update({
      where: { userId: session.user.id },
      data: {
        companyName: parsed.data.companyName,
        phone: parsed.data.phone,
        dotNumber: parsed.data.dotNumber || null,
        mcNumber: parsed.data.mcNumber || null,
      },
    });
    return NextResponse.json({ id: profile.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json(
        { error: "No Load Manager profile found." },
        { status: 404 }
      );
    }
    throw e;
  }
}
