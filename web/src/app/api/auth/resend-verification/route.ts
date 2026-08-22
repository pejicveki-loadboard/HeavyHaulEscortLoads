import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { verificationEmail } from "@/lib/email-templates";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "Email is already verified." }, { status: 409 });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(
    Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
    },
  });

  const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;
  const { subject, html } = verificationEmail(verifyUrl);
  await sendEmail({ to: user.email, subject, html });

  return NextResponse.json({ ok: true });
}
