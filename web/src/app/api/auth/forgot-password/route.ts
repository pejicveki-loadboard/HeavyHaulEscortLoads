import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { resetPasswordEmail } from "@/lib/email-templates";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const RESET_TOKEN_TTL_MINUTES = 30;

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: Request) {
  const ipCheck = await checkRateLimit("forgot-password", `ip:${getClientIp(request)}`);
  if (!ipCheck.allowed) return rateLimitResponse(ipCheck.retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email } = parsed.data;

  const emailCheck = await checkRateLimit("forgot-password", `email:${email}`);
  if (!emailCheck.allowed) return rateLimitResponse(emailCheck.retryAfterSeconds);

  // Never reveal whether an account exists -- every branch below returns
  // this exact same response, same reasoning as signup's genericResponse.
  const genericResponse = () =>
    NextResponse.json(
      { message: "If that email is on file, we've sent a reset link." },
      { status: 200 }
    );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse();

  const rawToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

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
  try {
    const { subject, html } = resetPasswordEmail(resetUrl);
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    // Don't fail the request over a transactional-email hiccup, and don't
    // leak that failure to the client either -- same reasoning as signup.
    console.error("Failed to send password reset email:", error);
  }

  return genericResponse();
}
