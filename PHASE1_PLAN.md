# Phase 1 MVP — Week-by-Week Build Plan
*Pilot Car Load Board — for handing to a Claude Code session*

Scope: single-login auth with multiple roles per account, post a load, browse/filter load board **with basic origin+radius search**, contact reveal gated by paid/trial status, real-time email + SMS alerts fired the moment a matching load posts, **and a built-in admin dashboard for tracking signups, loads, and trial/subscription status (added 2026-08-19).** Corridor matching, dimension-based auto-flagging, and verified cert badges are still deliberately deferred past launch — see the project summary's Strategy Decision.

Target: **$14.99/mo, 200 paying subscribers.** Positioning is simpler + cheaper than the incumbents, not more features.

Target timeline: 2–3 focused weeks if you do prep before Day 1, plus roughly 1–2 extra days for the admin dashboard (added 2026-08-19 — see Week 3). Budget 3–5 weeks part-time.

---

## Access control model — read this before writing any code

This is the one architectural decision that has to be right from Day 1, because retrofitting authorization is painful. **One email/login can hold both the Load Manager and Pilot Car capabilities.** They are not mutually exclusive roles on a `role` enum — they're two independent profile records a `User` may or may not have:

- `LoadManagerProfile` — presence of this record means the user can post loads. **Always free, no subscription check, ever.**
- `PilotCarProfile` — presence of this record means the user *wants* driver/load-board access, but whether they can actually use it depends on `subscription_status` (`none | trialing | active | expired`) and `trial_ends_at`.

**The critical rule: every endpoint that returns load-board data (search, load list, load detail, contact info) must check `PilotCarProfile.subscription_status` server-side on every request** — `trialing` (and not expired) or `active` only. Never gate this in the UI alone (hiding a nav link, disabling a button) — that's trivially bypassed by hitting the API directly. A user with only a `LoadManagerProfile` and no paid/trialing `PilotCarProfile` must get a 403 from the load-board API, not just a hidden button.

Why this matters concretely: because one email can hold both profiles, a company could sign up as a Load Manager (free, no card) and then just add a Pilot Car profile hoping to browse loads without ever starting a trial or paying. The authorization check on the load-board endpoints is what prevents that — not the signup flow, not the UI.

UI implication: since one login can have both capabilities, build a simple role switcher in the nav ("Post Loads" / "Browse Loads") that only shows the options the user actually has profiles for, with an "Add Pilot Car access" or "Add Load Manager access" prompt for the one they're missing. Pilot Car Loads' own FAQ has an entry for "How do I know what account type I am?" — a sign their two-separate-emails model still confuses users. Don't inherit that confusion just because we're now single-login; make the current view/role obvious on screen at all times.

**Admin access (added 2026-08-19):** add a simple `is_admin` boolean on `User` — no separate roles table needed for launch. Admin status is set manually (directly in the database, or via a one-off script) for Vedran's and Velimir's accounts; there's no self-service way to become an admin. Any route under `/admin` checks `is_admin` server-side the same way load-board routes check subscription status — never gate it in the UI alone.

---

## Day 0 — Prep (before opening Claude Code)

- [ ] Pick and lock in the stack: **Next.js + Postgres + Prisma** (recommended — single language, easiest for Claude Code to reason about end-to-end, and Prisma migrations keep the schema honest). Rails/Django are fine alternatives but split your stack across two languages.
- [ ] Create a Postgres instance (Supabase, Neon, or Railway all give a free tier + connection string in under 5 minutes)
- [ ] Create a GitHub repo, empty, so Claude Code has somewhere to commit as it goes
- [ ] Decide auth approach: recommend **NextAuth / Auth.js with email+password** for MVP simplicity — skip social login and magic links for now
- [ ] Sign up for a Mapbox or Google Maps API key now — radius search is in scope for Week 2, not deferred, so geocoding needs to work early
- [ ] Sign up for a transactional email provider (Postmark or Resend are the easiest to wire into Next.js) — real-time load-match alerts are a Week 2 must-have, not deferred, so this needs an API key ready before Week 2 starts
- [ ] Confirm the escort-position list to launch with: **Lead, Chase, High Pole, Steer, Route Survey, Third Car, Fourth Car** (the confirmed 7 types from Pilot Car Loads' real posting form) plus our own addition of **dimensions (W/H/L) and weight** on the load, since neither competitor captures those — even if auto-flagging requirements from them is deferred, capture the raw fields now so it's not a painful migration later
- [ ] **Start the Twilio account and begin A2P 10DLC business-texting registration immediately — this is no longer optional.** SMS is now a Phase 1 launch must-have (updated 2026-08-14), and registration approval typically takes 1–2 weeks. This is realistically the **pacing bottleneck for the whole launch** — start it the same day as everything else in this list, don't wait until Week 2 when the code is ready for it.

---

## Week 1 — Data model, auth, multi-role accounts

**Goal by end of week: one user can sign up, add a Load Manager profile and/or a Pilot Car profile under the same login, and see the right dashboard(s).**

- [ ] Day 1–2: Scaffold Next.js app, connect Prisma to Postgres, define initial schema:
  - `User` (id, email, password hash, created_at, **is_admin boolean, default false — added 2026-08-19**) — no general role enum on this table
  - `LoadManagerProfile` (user_id FK, company name, phone, DOT/MC number — optional, for a future lightweight verified-poster badge, not required at launch, created_at)
  - `PilotCarProfile` (user_id FK, company name, phone, **created_at (this is "signed up" for admin-visibility purposes)**, subscription_status enum: `none | trialing | active | expired`, **trial_started_at — added 2026-08-19, set the moment the profile is created**, trial_ends_at, **paid_started_at — added 2026-08-19, set the moment `subscription_status` first transitions to `active`, null until then**, stripe_customer_id, stripe_subscription_id — Stripe columns can exist now even though Stripe wiring is Phase 2). Had an `alerts_muted` boolean here originally, but that was retired 2026-08-23 as a duplicate of `SearchLocation.active` — see below.
  - `SearchLocation` (**added 2026-08-19, redesign from Vedran** — profile_id FK → `PilotCarProfile`, one-to-many: a company can run multiple independent searches, e.g. one per truck/region, no cap on count. label — optional free text, e.g. "Truck 2 – Texas route", city/state + lat/lng (nullable until geocoded, same as before), radius_miles (int, max 500), escort position preferences — multi-select, **per-location, not shared across the profile**, active boolean default true (pause/mute a location without deleting it — this is the one and only mute switch, not a separate profile-level flag), **alert_channel enum `email | sms | both`, default `both` — added 2026-08-23 (Week 2 Day 5)**, created_at/updated_at)
  - `Load` (origin city/state + lat/lng, destination city/state + lat/lng, date, escort positions — multi-select from the 7 types above, dimensions W/H/L, weight, rate + unit, posted_by → LoadManagerProfile, status: open/covered/expired, created_at)
  - `LoadAlert` (load_id FK, **search_location_id FK — changed 2026-08-19 from pilot_car_profile_id, since matching now runs per SearchLocation**, sent_at) — a simple send log so a load never emails the same search location twice (e.g., on repost or edit) and so the Load Manager dashboard's "X notifications sent" stat has something to count. **No dedup across a profile's own locations** — a company with 3 active locations gets independently matched alerts for each.
- [ ] Day 2–3: Auth flow — one signup/login per email; after first login, prompt "What do you need? Post loads / Find loads / Both" to create the relevant profile record(s). Session handling, protected routes.
- [ ] Day 3–4: Role-aware dashboard shells and the nav role-switcher described above. Pilot Car dashboard should clearly show trial/subscription status (e.g., "14 days left in your trial") even before Stripe billing exists — hardcode `trialing` with a 30-day `trial_ends_at` (and `trial_started_at` set to now) on profile creation for now.
- [ ] Day 5: Basic account/profile edit pages for both profile types. For Pilot Car, this is a "Manage Search Locations" page (list/add/edit/pause/remove `SearchLocation` rows), not a single home-base field, per the 2026-08-19 redesign — Load Manager's edit page is a plain company name/phone form as originally planned.
- [ ] **Checkpoint:** one test account with both profiles, one with only Load Manager — confirm the Load Manager-only account gets a 403 (not just a hidden UI) if you manually hit a load-board API route. Push to GitHub, deploy a preview (Vercel is the natural pairing with Next.js).

## Week 2 — Post a load, browse/filter with radius, contact reveal

**Goal by end of week: a Load Manager can post a real load; a Pilot Car profile with trial/active status can browse, filter by radius, and reveal contact info; and matching Pilot Car profiles get a real-time email the moment that load posts — all correctly blocked for a profile without paid/trial status.**

- [ ] Day 1–2: "Post a Load" form (fields from Day 0 prep) + validation + geocode origin/destination on submit (store lat/lng) + save to DB. Show posted loads on the Load Manager's dashboard with edit/delete/mark-covered actions.
- [ ] Day 2–3: Load board browse page — **origin + radius search is must-have here, not deferred**: for saved-search alerting, a driver's `SearchLocation` rows each carry their own base + radius (e.g., 150 miles) and escort-position preferences (**redesigned 2026-08-19** — was a single home base on the profile, see Week 1 schema); board filters/sorts loads by distance using stored lat/lng (a straight-line/haversine calculation in a plain SQL query is enough at launch scale — no need for PostGIS yet). The browse page **also** needs a separate ad-hoc search — any city + radius someone types in on the spot, independent of their saved `SearchLocation`s, nothing to save. Add date-range filtering alongside both. Every request through this endpoint re-checks `PilotCarProfile.subscription_status` server-side per the access control model above.
- [ ] Day 3: Contact reveal, gated the same way — only resolves phone/contact fields in the API response for a requesting user with an active/trialing `PilotCarProfile`; the field should come back null/omitted for anyone else, not just hidden in the frontend.
- [ ] Day 4: **Real-time load-match alert — email + SMS, both at launch (updated 2026-08-14).** On load create (and on meaningful edits — new escort position added, etc.), run the same radius+escort-position match query used by browse, but against every **active `SearchLocation` belonging to a `trialing`/`active` `PilotCarProfile`** (redesigned 2026-08-19 — was matched per profile), and fire an immediate transactional email **and** SMS per match ("New load: Chase escort, Wichita KS → York NE, 234mi — view & reveal contact"). No dedup across a profile's own locations — 3 active locations on one account can each independently match and alert on the same load. `LoadAlert` needs a `channel` column (`email` | `sms`) so a send is logged per channel and never duplicated. This is the single most time-sensitive feature in the app — treat "instant" as a real requirement, not "eventually gets sent," since the whole category's complaint (per Pilot Car Loads' own App Store reviews) is loads getting covered before a driver even hears about them. **Guardrail carried over from the original SMS analysis: don't let SMS become the only delivery path — keep email as the reliable fallback**, per the cautionary tale of Load Covered's own SMS-cost crisis (see competitive analysis). Requires the Twilio A2P 10DLC registration from Day 0 prep to be approved before this can send real SMS in production — if it's still pending when you reach this day, build and test the SMS send path against Twilio's sandbox/test credentials and hold the production flip until approval lands, rather than blocking the whole day's work on it.
- [ ] Day 5: Alert preferences UI — per-location base/radius/escort-positions editing already exists from Week 1's "Manage Search Locations" page (redesigned 2026-08-19); what's actually new here is **a channel toggle (email/SMS/both)**, per `SearchLocation` (**corrected 2026-08-23** — the profile-wide `alerts_muted` field this line used to describe was retired; mute/pause is `SearchLocation.active`, which already existed and was already wired into matching since Week 1, so there's no separate mute toggle to build — just the channel preference). Editable from the "Manage Search Locations" page. Cheap to build now, and it's the fix for the "how do I stop getting alerts" complaint that shows up in Pilot Car Loads' own FAQ.
- [ ] **Checkpoint:** full loop works — Load Manager posts with real coordinates, matching trialing Pilot Car profiles get an email within seconds, that same profile can browse/filter by radius/reveal contact in-app, and a non-trialing/expired Pilot Car profile is correctly blocked at the API level (and gets no alert email). This is a demoable MVP.

## Week 3 (buffer / part-time spillover) — Admin dashboard + hardening + real data test

- [ ] **Day 1–2: Admin dashboard (added 2026-08-19, decision: build this now rather than defer it).** A set of pages under `/admin`, reachable only by accounts with `is_admin = true` (403 for everyone else, checked server-side — same rule as the subscription gate). Build:
  - **Summary view:** total Load Manager signups, total Pilot Car signups, total loads posted, and a breakdown of Pilot Car profiles by `subscription_status` (how many `trialing`, `active`, `expired`) — cheap counts against the tables that already exist from Week 1, no new schema needed beyond the `is_admin`/`trial_started_at`/`paid_started_at` fields added this week. **TODO flagged 2026-08-21:** `subscription_status` can go stale — nothing flips a profile from `trialing` to `expired` when `trial_ends_at` passes, so this raw column will overcount `trialing`/undercount `expired`. `src/lib/subscription.ts`'s `hasLoadBoardAccess()` already computes the *effective* status live (checks `trial_ends_at` itself); either reuse that logic for these counts, or add a scheduled job that actually flips expired trials, before trusting this breakdown.
  - **Users table:** searchable/sortable list of every Load Manager and Pilot Car profile, showing company name, contact email/phone, **`created_at` ("signed up")**, and for Pilot Car profiles specifically: **`trial_started_at`, `trial_ends_at`, current `subscription_status`, and `paid_started_at`** (blank/— until they actually convert from trial to paid). This is the specific requirement from the 2026-08-19 planning conversation: Vedran needs to see exactly when someone signed up and when their 30-day free trial converted into an actual paying subscription, not just their current status. Same staleness caveat applies to the displayed `subscription_status` column here.
  - **Loads table:** searchable/sortable list of every load posted, who posted it (linked to the Load Manager), status (open/covered/expired), and `created_at`.
  - Keep it plain — server-rendered tables with basic search/sort/pagination, no charts or graphs needed for launch. This is an internal tool, not a customer-facing feature, so prioritize function over polish.
  - Budget roughly 1–2 days for this. If Stripe isn't wired up yet (it's still Phase 2), `paid_started_at` will just stay null for everyone until then — that's expected, not a bug to chase.
- [ ] Seed the board with ~20–30 realistic fake loads with real geocoded coordinates spread across multiple states so radius search has something to actually filter
- [ ] Basic responsive/mobile pass on the core screens (post form, browse list, role switcher) — the admin dashboard itself doesn't need a mobile pass, it's a desktop-only internal tool
- [ ] Error states: empty search results, invalid form submissions, expired sessions, expired-trial load-board access (make sure the "please subscribe" message is clear, not a bare 403)
- [ ] Manually test: single-email dual-profile account, Load-Manager-only account, and an expired-trial Pilot Car account, on a phone and a laptop
- [ ] Have 2–3 outside eyes click through it and give first-impression feedback before touching anything past this scope

---

## What's deliberately NOT in Phase 1

- Route/corridor-based matching (radius is must-have; full corridor logic is deferred — see project summary)
- State-specific requirement auto-flagging from dimensions (raw dimension/weight fields are captured now; the auto-flagging logic itself is deferred)
- Certification/insurance upload and verified badges
- Actual Stripe billing integration (Week 1 creates the schema for it; wiring real payments is Phase 2 of the overall project plan — `paid_started_at` on the admin dashboard will only start populating once this ships)
- Rate-limiting, ToS/liability pages
- ~~Admin dashboard~~ — **moved into Phase 1 scope 2026-08-19, see Week 3.** Self-service admin roles, permission tiers, and audit logging are still deferred — the single `is_admin` boolean set manually is enough for launch.

---

## SMS cost and rollout notes (moved into Week 2 core scope, 2026-08-14)

SMS is now part of the Week 2, Day 4–5 work above rather than a post-launch fast-follow. Carried-over notes that still apply:

- Budget for real per-message cost (~$0.0079/SMS via Twilio) — at even a few hundred alerts/day this stays well under $50–100/mo, already inside the run-rate estimate in the project summary
- If A2P 10DLC approval is still pending when Week 2 arrives, don't let it block the rest of the build — implement the SMS send path against Twilio's test credentials, keep email fully functional as the production channel, and flip SMS to live traffic the moment approval comes through
- Watch for the failure mode Load Covered is currently living through: don't let SMS become the *only* delivery path — keep email as the reliable fallback so a texting-cost crunch later doesn't force an emergency migration like theirs

## How to actually run this with Claude Code

- Start each session by telling Claude Code which week/checkpoint you're on and pointing it at this file
- Commit at the end of every checkpoint, not just end of week
- Test each feature yourself before moving to the next bullet
- Specifically test the authorization boundary by hand each week (try to access load-board data from an account that shouldn't have it) — this is the one area where a subtle bug directly costs you subscription revenue
- If a task is taking much longer than budgeted, that's a sign to simplify scope, not a sign to work longer hours
