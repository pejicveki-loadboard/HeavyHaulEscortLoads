import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { verificationEmail } from "@/lib/email-templates";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email or password." },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  // TODO: this 409 lets an unauthenticated caller enumerate registered
  // emails (unlike login, which returns a generic error either way).
  // Email verification (added 2026-08-21) gives this a real fix path now:
  // return the same generic "check your email" response regardless of
  // whether the email was taken, and gate account activation on the
  // verification link instead -- that's a separate, deliberate change to
  // the signup response shape that hasn't been made yet. See ultrareview
  // finding bug_003.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
  );

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
    },
  });

  const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
  try {
    const { subject, html } = verificationEmail(verifyUrl);
    await sendEmail({ to: email, subject, html });
  } catch (error) {
    // Don't fail signup over a transactional-email hiccup -- the account
    // still works unverified, and resend-verification covers a lost email.
    console.error("Failed to send verification email:", error);
  }

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
