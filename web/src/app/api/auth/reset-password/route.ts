import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  const invalidResponse = () =>
    NextResponse.json(
      { error: "That reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashToken(token) },
  });

  if (
    !user ||
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt.getTime() < Date.now()
  ) {
    return invalidResponse();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Nulling the single token column both marks this token used (it can no
  // longer be matched by hash) and invalidates any other outstanding reset
  // token for this user, since there's only ever one active at a time --
  // same shape as verify-email's post-success update.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
