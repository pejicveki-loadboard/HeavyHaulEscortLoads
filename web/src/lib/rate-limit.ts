import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitConfig = { windowMs: number; max: number };

// Per-endpoint defaults -- IP-based, per PHASE3_PLAN.md Task 3. Deliberately
// generous enough not to bite a real user hammering "retry" on a bad
// connection, tight enough to blunt a script.
export const RATE_LIMITS = {
  signup: { windowMs: 15 * 60 * 1000, max: 5 },
  login: { windowMs: 15 * 60 * 1000, max: 10 },
  "contact-reveal": { windowMs: 60 * 1000, max: 20 },
  "forgot-password": { windowMs: 15 * 60 * 1000, max: 5 },
} satisfies Record<string, RateLimitConfig>;

// Vercel puts the real client address in x-forwarded-for (leftmost entry);
// request.headers is all we get in a route handler / NextAuth's authorize --
// there's no lower-level socket to read from.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// Fixed-window counter backed by Postgres (see RateLimitHit in
// schema.prisma) so the count is shared across Vercel's serverless
// instances -- an in-memory counter would reset per cold start and never
// be shared between concurrent invocations in the first place.
//
// windowStart is floored to windowMs so every request within the same
// window computes the identical boundary, which is what makes the
// INSERT ... ON CONFLICT below race-safe: concurrent requests either agree
// on the window (and increment atomically) or one of them starts the next
// window (and resets), all in a single round trip.
export async function checkRateLimit(
  scope: keyof typeof RATE_LIMITS,
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS[scope]
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `${scope}:${identifier}`;
  const windowStart = new Date(Math.floor(Date.now() / config.windowMs) * config.windowMs);

  const rows = await prisma.$queryRaw<{ count: number; window_start: Date }[]>`
    INSERT INTO rate_limit_hits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rate_limit_hits.window_start = EXCLUDED.window_start
          THEN rate_limit_hits.count + 1
          ELSE 1
        END,
        window_start = EXCLUDED.window_start
    RETURNING count, window_start
  `;

  const row = rows[0];
  const allowed = row.count <= config.max;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((row.window_start.getTime() + config.windowMs - Date.now()) / 1000));

  return { allowed, retryAfterSeconds };
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
