import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token-hash";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const ipCheck = await checkRateLimit("reset-password-ip", getClientIp(request));
  if (!ipCheck.allowed) return rateLimitResponse(ipCheck.retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  // Keyed by the token's hash, not the raw token or the (not-yet-known)
  // account -- caps repeated submissions against one specific reset link,
  // same per-identifier-axis shape as forgot-password's ip/email split.
  const tokenCheck = await checkRateLimit("reset-password-token", tokenHash);
  if (!tokenCheck.allowed) return rateLimitResponse(tokenCheck.retryAfterSeconds);

  const invalidResponse = () =>
    NextResponse.json(
      { error: "That reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: tokenHash },
  });

  if (
    !user ||
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt.getTime() < Date.now()
  ) {
    return invalidResponse();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // TODO(2026-09-03, ultrareview): this update is keyed by user.id alone,
  // not re-conditioned on passwordResetTokenHash still equalling tokenHash.
  // Two concurrent submits of the same valid token (slow-network retry, two
  // open tabs) can both pass the findUnique+expiry check above before
  // either commits, double-incrementing tokenVersion and letting whichever
  // request commits last silently overwrite the other's chosen password
  // (both get {ok:true}). A fresh forgot-password request landing between
  // another request's findUnique and update has the same problem in
  // reverse: it can null out a newer, still-unused token. Fix: make this an
  // atomic conditional write, e.g. prisma.user.updateMany({ where: { id:
  // user.id, passwordResetTokenHash: tokenHash }, data: {...} }) and treat
  // count !== 1 as invalidResponse().
  //
  // Nulling the single token column both marks this token used (it can no
  // longer be matched by hash) and invalidates any other outstanding reset
  // token for this user, since there's only ever one active at a time --
  // same shape as verify-email's post-success update. tokenVersion is
  // incremented so any session JWT already issued for this account (e.g. an
  // attacker who had a stolen cookie) stops passing the check in auth.ts's
  // session() callback.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
      tokenVersion: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true });
}
