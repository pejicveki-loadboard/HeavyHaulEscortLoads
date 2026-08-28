# Phase 3 — Pre-Launch Hardening
*Pilot Car Load Board — handed to a Claude Code session 2026-08-28*

Scope: close out two loose ends already flagged in the code itself, add
baseline abuse protection before any public launch, and seed realistic
test data. Surfaced by an audit of the actual shipped code, not a re-plan.

## Task 1 — Fix the signup account-enumeration leak (ultrareview bug_003)
web/src/app/api/auth/signup/route.ts returns a distinct 409 when an email
is already registered vs. success for a new one — letting anyone probe
which emails have accounts. The TODO left in that file on 2026-08-19 names
the fix: since email verification exists now (added 2026-08-21), return
the same generic response ("check your email to verify your account")
whether the email is new or already registered-and-unverified (fine to
resend the verification email in that case); for an existing
already-verified email, send nothing but return the identical response.
The API response must never reveal which case happened.
- [x] Update the signup route
- [x] Confirm status code + body are byte-identical for a new email vs. an
      existing verified email
- [x] Remove the TODO comment once fixed

## Task 2 — Surface permanently-failed load alerts in the admin dashboard
load-matching.ts tracks retry attempts and console.errors when an alert
exhausts retries, but nothing outside the server log shows this happened —
there's currently no way to know a driver missed an alert. First confirm
how "permanently failed" is actually represented in the data (check the
AlertSendStatus enum and the retry-limit logic — this wasn't fully
resolved from a static read). Then add a count to the admin summary view
and a table for investigating individual failures (load, search location,
channel, attempts, last attempt time).
- [x] Confirm how a permanently-failed alert is stored/detected -- there's no
      dedicated status; it's `LoadAlert.status = 'failed' AND attempts >=
      MAX_ATTEMPTS` (2), exported from load-matching.ts as the single
      source of truth for that threshold
- [x] Add it to the admin summary counts
- [x] Add a table/list view for investigating individual failures
      (/admin/failed-alerts)

## Task 3 — Baseline rate limiting on public endpoints
Nothing does this today (deliberately deferred in Phase 1). Before any
public launch, rate-limit at minimum: /api/auth/signup, login, and the
contact-reveal endpoint (web/src/app/api/loads/[id]/contact/route.ts) —
the three where unlimited requests cost something real. Keep it simple
and consistent with the existing stack: prefer a Postgres-backed
fixed/sliding-window counter over adding Redis/Upstash at this scale,
unless there's already a reason to add a cache layer. No in-memory-only
limiter — it won't be shared across Vercel's serverless instances.
IP-based is enough for launch.
- [x] Pick the storage approach, confirm it actually works on Vercel's
      serverless model -- Postgres-backed fixed-window counter
      (RateLimitHit table, atomic INSERT ... ON CONFLICT), see
      src/lib/rate-limit.ts
- [x] Apply to signup, login, contact-reveal (login is intercepted in
      the [...nextauth] catch-all route, before NextAuth's own handler --
      authorize() can't itself make NextAuth return a real 429)
- [x] Manually verify hitting the limit returns a real 429

## Task 4 — Seed realistic test data
PHASE1_PLAN.md's Week 3 called for ~20-30 realistic loads with real
geocoded coordinates across multiple states, to exercise radius search —
never done. Write scripts/seed-loads.mjs (follow the pattern of
scripts/setup-stripe-products.mjs: standalone, idempotent, safe to
re-run), using hardcoded real-city coordinates rather than burning Mapbox
API calls, spanning the 7 escort-position types and a spread of
dimensions/weights/dates.
- [x] Write the seed script (scripts/seed-loads.mjs, `npm run seed:loads`)
- [x] Run it against the dev database -- 27 loads across 16 states,
      attached to a dedicated seed Load Manager account; re-run confirmed
      idempotent (clears + recreates the same 27 rather than duplicating)
- [x] Confirm radius search returns a varied, sensible result set -- ran
      the actual browse query (via the real Mapbox geocoder) from Dallas,
      Atlanta, and Chicago: correct distance sorting, sensible counts, and
      a Miami search correctly returned zero (nothing seeded nearby)

## Also while you're in there
- [ ] Rotate STRIPE_SECRET_KEY in .env — it's currently the value borrowed
      from the Stripe CLI's cached credential during the 2026-08-28
      verification session. Generate a real standing sk_test_ key from
      the Stripe dashboard (Developers → API keys) instead.

Commit each task separately as it's finished, same as the rest of this
repo's history. Check boxes off in this file as you go, and commit the
plan update alongside the code, not as an afterthought.
