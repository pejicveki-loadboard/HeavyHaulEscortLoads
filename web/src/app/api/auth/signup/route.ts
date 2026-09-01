import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { verificationEmail } from "@/lib/email-templates";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { isValidUsPhone } from "@/lib/phone";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  // Both optional -- the SMS opt-in section on /signup is not required to
  // create an account. smsConsent true without a phone is just ignored.
  phone: z
    .string()
    .trim()
    .min(1)
    .optional()
    .refine((val) => val === undefined || isValidUsPhone(val), "Enter a valid 10-digit US phone number."),
  smsConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit("signup", getClientIp(request));
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email or password." },
      { status: 400 }
    );
  }
  const { email, password, phone, smsConsent } = parsed.data;

  // Fixed per ultrareview bug_003: this used to return a distinct 409 for a
  // taken email, letting anyone enumerate registered accounts. Every branch
  // below now returns this exact same response -- new email, already
  // registered-and-unverified, or already registered-and-verified are all
  // indistinguishable from outside.
  const genericResponse = () =>
    NextResponse.json({ message: "Check your email to verify your account." }, { status: 200 });

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.emailVerifiedAt) {
    // Already registered and verified -- do nothing (no email, no write),
    // but still return the generic response.
    return genericResponse();
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
  );

  if (existing) {
    // Registered but never verified -- resend the verification email only.
    // Never touch passwordHash here: this endpoint is unauthenticated, so
    // overwriting it would let anyone hijack someone else's pending signup
    // just by "signing up" again with a password of their choosing.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
      },
    });
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
        // Only set on brand-new accounts -- same reasoning as passwordHash
        // above: this endpoint is unauthenticated, so an "existing but
        // unverified" resubmission must never overwrite fields the original
        // requester already set.
        phone: phone || null,
        smsConsentedAt: smsConsent && phone ? new Date() : null,
      },
    });
  }

  const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
  try {
    const { subject, html } = verificationEmail(verifyUrl);
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    // Don't fail signup over a transactional-email hiccup -- the account
    // still works unverified, and resend-verification covers a lost email.
    console.error("Failed to send verification email:", error);
  }

  return genericResponse();
}
