import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.APP_BASE_URL;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/email-verified?status=missing`);
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (
    !user ||
    !user.emailVerificationTokenExpiresAt ||
    user.emailVerificationTokenExpiresAt.getTime() < Date.now()
  ) {
    return NextResponse.redirect(`${baseUrl}/email-verified?status=invalid`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  return NextResponse.redirect(`${baseUrl}/email-verified?status=success`);
}
