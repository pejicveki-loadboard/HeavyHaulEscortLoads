// Fails loudly at server startup if a load-bearing env var is missing,
// instead of the app booting fine and only failing on the specific request
// path that needs it. Added 2026-08-22 after three separate production
// outages in one week (RESEND_FROM_EMAIL, APP_BASE_URL, MAPBOX_ACCESS_TOKEN)
// that were each silent until a real user hit the affected feature.
//
// Deliberately a hard failure, not a warning: every request to this
// instance fails until the var is fixed and redeployed, which is a bigger
// blast radius than "one feature quietly breaks" -- but it's discovered
// immediately (as a crashed deploy/function), not days later from a user
// report. Worth that tradeoff pre-launch; revisit if it's ever too blunt
// for a live app with real traffic.
//
// Twilio's vars are deliberately NOT here: SMS is allowed to be
// unconfigured right now (pending A2P 10DLC approval) and already fails
// per-attempt with a clear, caught log line -- that's expected degraded
// mode, not a bug to hard-fail the whole app over.
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "MAPBOX_ACCESS_TOKEN",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "APP_BASE_URL",
] as const;

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Check Vercel's Production/Preview environment settings.`
    );
  }
}
