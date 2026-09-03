import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { resetPasswordEmail } from "@/lib/email-templates";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { hashToken } from "@/lib/token-hash";

const RESET_TOKEN_TTL_MINUTES = 30;

// Every response below is padded up to this floor so the "account exists"
// path (extra DB update + Resend call) and the "no such account" path take
// comparable wall-clock time -- otherwise the JSON body being identical
// doesn't matter, since response latency alone reveals whether the email is
// registered. Set above the real path's typical cost (DB update + email
// send); the residual signal only reopens if the real path occasionally
// runs slower than this, which padding can't fix without capping it.
const MIN_RESPONSE_MS = 600;

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function padToMinDuration<T>(startedAt: number, result: T): Promise<T> {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed);
  return result;
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  const ipCheck = await checkRateLimit("forgot-password-ip", getClientIp(request));
  if (!ipCheck.allowed) return rateLimitResponse(ipCheck.retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email } = parsed.data;

  const emailCheck = await checkRateLimit("forgot-password-email", email);
  if (!emailCheck.allowed) return rateLimitResponse(emailCheck.retryAfterSeconds);

  // Never reveal whether an account exists -- every branch below returns
  // this exact same response (padded to the same minimum duration, see
  // MIN_RESPONSE_MS above), same reasoning as signup's genericResponse.
  const genericResponse = () =>
    NextResponse.json(
      { message: "If that email is on file, we've sent a reset link." },
      { status: 200 }
    );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return padToMinDuration(startedAt, genericResponse());

  const rawToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  try {
    // Overwriting the single token column invalidates any older, still-unused
    // reset token for this user -- same shape as emailVerificationToken.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetTokenExpiresAt,
      },
    });

    const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${rawToken}`;
    const { subject, html } = resetPasswordEmail(resetUrl);
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    // Don't fail the request over a DB hiccup or a transactional-email
    // failure, and don't leak either as a distinct status/timing from the
    // "no such account" path -- same reasoning as signup, and required for
    // MIN_RESPONSE_MS's anti-enumeration padding to hold on every path.
    console.error("forgot-password: failed to issue/send reset token:", error);
  }

  return padToMinDuration(startedAt, genericResponse());
}
