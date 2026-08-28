import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const { GET } = handlers;

// Rate-limits only the actual password-check POST (/api/auth/callback/
// credentials) -- the other paths this catch-all handles (session, csrf,
// providers, signout) aren't the login attempt itself and don't need this.
// Login can't be rate-limited inside auth.ts's authorize() the way the
// other endpoints do it in their own route handlers: authorize() has no
// way to make NextAuth's own route return a real 429, it only ever
// produces a redirect/401 on CredentialsSignin. Intercepting here, before
// NextAuth's handler runs at all, is what makes a genuine 429 possible.
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/auth/callback/credentials") {
    const { allowed, retryAfterSeconds } = await checkRateLimit("login", getClientIp(request));
    if (!allowed) return rateLimitResponse(retryAfterSeconds);
  }
  return handlers.POST(request);
}
