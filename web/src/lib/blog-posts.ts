// Plain data array, not a CMS -- matches how FAQ (src/app/faq/page.tsx) and
// pricing content are structured elsewhere in this app. Add a post by
// appending an object here; /blog and /blog/[slug] both read from this.
//
// body is a small typed block union rather than plain strings so posts can
// include real tables/blockquotes/lists -- there's no markdown renderer in
// this app, so these blocks are rendered directly by blog/[slug]/page.tsx.
// Inline **bold** / *italic* markers inside block text are still supported
// (see renderInline in blog/[slug]/page.tsx).
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; ordered?: boolean; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  // Doubles as both the index page's excerpt and the post's meta
  // description -- one post doesn't need two near-duplicate summaries.
  excerpt: string;
  date: string; // ISO yyyy-mm-dd
  body: BlogBlock[];
  cta?: { label: string; href: string };
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "losing-your-text-load-alerts",
    title: "Losing your text load alerts? Here's what to do.",
    excerpt:
      "If your load board is dropping text alerts for an app-only replacement, here's what to look for in an alternative — and one that still sends real texts.",
    date: "2026-09-01",
    body: [
      {
        type: "p",
        text: "If your load board is moving away from text alerts — switching to an app that only works while it's open and running, or that only supports one device at a time — that's a real step down if you're used to a text landing the second a load matches, wherever you are, phone locked or not.",
      },
      {
        type: "p",
        text: "HeavyHaul Escort Loads sends real text alerts, matched to your specific city and radius rather than a broad region. Posting stays free for load managers/brokers, and pilot car companies get a 30-day free trial with no card required — $17.99/month after that, or $14.99/month effective if you prepay a year.",
      },
      {
        type: "p",
        text: "If you're dealing with a sudden change to how your alerts work, it might be worth trying something that still sends a real text the moment a load matches your route.",
      },
    ],
    cta: { label: "Sign up free →", href: "/signup" },
  },
  {
    slug: "labor-day-2026-oversize-load-restrictions",
    title: "Labor Day 2026: Oversize & Overweight Load Travel Restrictions You Need to Know",
    excerpt:
      "State-by-state Labor Day 2026 travel restrictions for oversize and overweight loads — permit rules, escort scheduling, and what to check before you dispatch.",
    date: "2026-09-02",
    body: [
      {
        type: "p",
        text: "**Labor Day 2026 is Monday, September 7 — and for oversize and overweight trucking, the holiday weekend can create significant travel restrictions, permit-office closures, and scheduling challenges.**",
      },
      {
        type: "p",
        text: "If you're dispatching an oversize load, planning a heavy-haul move, or lining up pilot car escorts, plan ahead. A route that's normally available may be restricted during the Labor Day holiday period, and some states begin restrictions as early as Friday, September 4. **Restrictions are not the same in every state** — each one sets its own rules for permitted oversize and overweight movements.",
      },
      {
        type: "blockquote",
        text: "This guide is for planning purposes only. Always verify current permit conditions with each state DOT before travel — restrictions can change, and your specific permit governs, not this list.",
      },
      { type: "h2", text: "Why Labor Day Matters for Oversize Loads" },
      {
        type: "p",
        text: "Moving an oversize or overweight load already requires careful planning: permits, approved routes, pilot cars or police escorts, route surveys, utility coordination, bridge and clearance verification, and specific travel hours. A holiday weekend adds another layer on top.",
      },
      {
        type: "p",
        text: "Some states prohibit certain permitted movements entirely; others allow travel with a valid permit. Some restrictions only kick in past a particular width, height, length, or weight threshold.",
      },
      {
        type: "p",
        text: "**Having a valid permit does not automatically mean you can travel during a holiday restriction** — one of the biggest mistakes dispatchers and carriers make.",
      },
      { type: "h2", text: "2026 Labor Day Oversize Load Restrictions" },
      {
        type: "p",
        text: "The following are examples of Labor Day restrictions currently published for 2026. Rules can vary based on the load and route, so carriers should always verify the specific permit conditions before moving.",
      },
      {
        type: "table",
        headers: ["State", "2026 Labor Day Restriction"],
        rows: [
          ["**Alabama**", "No travel from sunset Sept. 5 until sunrise Sept. 8"],
          ["**Arkansas**", "No travel Sept. 5–7, with certain overweight-only exceptions"],
          ["**Arizona**", "Restrictions begin at noon Sept. 4 for certain dimensions"],
          ["**California**", "Restrictions apply to escorted loads during specified periods beginning Sept. 4"],
          ["**Colorado**", "Restrictions vary depending on the type of extra-legal movement"],
          ["**Connecticut**", "No travel from noon Sept. 4 until daylight Sept. 8"],
          ["**Delaware**", "No travel from noon Sept. 6 until 9 a.m. Sept. 8"],
          ["**Georgia**", "No travel Sept. 7"],
          ["**Illinois**", "Restrictions apply to permitted movements with dimensions exceeding legal limits"],
          ["**Indiana**", "No travel from noon Sept. 4 until 30 minutes before sunrise Sept. 8, with exceptions"],
          ["**Iowa**", "No travel from noon Sept. 4 until 30 minutes before sunrise Sept. 8"],
          ["**Maryland**", "No travel from noon Sept. 4 until 9 a.m. Sept. 8"],
          ["**Michigan**", "No travel from noon Sept. 4 until sunrise Sept. 8"],
          ["**Minnesota**", "Restrictions apply to loads over 12'6\" wide or 110' long"],
          ["**Missouri**", "No travel from noon Sept. 4 until 30 minutes before sunrise Sept. 8"],
          ["**New Jersey**", "No travel Sept. 4 and Sept. 7"],
          ["**New York**", "No travel from noon Sept. 4 until 30 minutes before sunrise Sept. 8, with certain overweight-only exceptions"],
          ["**Ohio**", "No travel from noon Sept. 4 until sunrise Sept. 8, with certain overweight-only exceptions"],
          ["**Pennsylvania**", "No travel from noon Sept. 4 until sunrise Sept. 8"],
          ["**South Carolina**", "No travel Sept. 7"],
          ["**Tennessee**", "Restrictions apply to escorted travel beginning noon Sept. 4"],
          ["**Texas**", "No travel Sept. 7 for loads exceeding certain width, height, or length limits"],
          ["**Utah**", "Restrictions apply to certain dimensions beginning Sept. 4"],
          ["**Virginia**", "No travel from noon Sept. 4 until sunrise Sept. 8"],
          ["**Washington**", "No travel from noon Sept. 6 until sunrise Sept. 8"],
          ["**Wisconsin**", "Restrictions apply to certain dimensions and specific counties"],
          ["**Wyoming**", "No travel for escorted loads Sept. 5–7"],
        ],
      },
      {
        type: "p",
        text: "This is only a snapshot — restrictions can differ by load dimensions, route, permit type, and whether the movement requires an escort.",
      },
      { type: "h2", text: "Not Every State Shuts Down — But Don't Assume You're Clear" },
      {
        type: "p",
        text: "**North Carolina** lists Labor Day 2026 travel as authorized by previously issued permits, and **Kansas, Kentucky, Louisiana, and South Dakota** similarly allow travel with a valid permit under their own rules.",
      },
      {
        type: "p",
        text: "**Minnesota** is a good example of why the exact load dimensions matter: its 2026 rules restrict holiday travel only for oversize vehicles exceeding 12'6\" wide or 110' long (overweight-only movements generally aren't restricted unless the permit says otherwise). The restriction itself runs 2 p.m. Sunday, September 6 until 2 a.m. Tuesday, September 8.",
      },
      {
        type: "p",
        text: "In other words: \"Labor Day means no oversize loads\" isn't accurate. **The actual restrictions depend on the state and the load** — Oregon, for instance, restricts non-divisible loads over 8'6\" wide from noon Friday, September 4 through 30 minutes before sunrise Tuesday, September 8, with separate rules again for triple-trailer combinations and long-log/pole/piling movements; North Dakota's Labor Day restriction only applies to movements exceeding 16 feet wide, running noon Saturday, September 5 through sunrise Tuesday, September 8. A legal-width truck can travel in both states while a wider load has to sit still — the difference comes down to a single dimension.",
      },
      { type: "h2", text: "Permit Offices May Also Be Closed" },
      {
        type: "p",
        text: "Labor Day is a federal holiday, and many state transportation agencies close their permit offices on Monday, September 7. That's a real problem if you wait until the last minute to obtain or modify a permit — Texas DMV, for example, lists its Oversize/Overweight Permit Office as closed September 7, with delays likely for anything requiring TxDOT coordination while they're closed.",
      },
      { type: "h2", text: "Pilot Cars and Escorts Can Become a Scheduling Problem" },
      {
        type: "p",
        text: "Holiday restrictions don't just affect the truck — they affect the pilot car and escort operators needed to move permitted loads. When restrictions compress the hours available for legal travel, carriers try to squeeze more loads into the windows that remain, which can spike demand for qualified escorts all at once:",
      },
      {
        type: "list",
        items: [
          "**Friday** — normal operations may be allowed in the morning, followed by afternoon restrictions in many states.",
          "**Saturday & Sunday** — some states continue restrictions, others allow limited movement.",
          "**Monday (Labor Day)** — many states impose full- or partial-day restrictions.",
          "**Tuesday** — restrictions may continue into the morning before normal travel resumes.",
        ],
      },
      {
        type: "p",
        text: "Multiple carriers competing for escorts in the same narrow windows is exactly the kind of bottleneck worth planning around.",
      },
      { type: "h2", text: "Don't Forget Holiday Traffic" },
      {
        type: "p",
        text: "Even a legally permitted move gets harder with holiday traffic. Forecasts for the 2026 holiday weekend point to particularly heavy travel Thursday afternoon/evening and Friday, with congestion notably higher in some metro areas. For an oversize load, that means longer travel times, harder lane changes, more complicated escort operations, and a higher risk of missing a permitted travel window entirely.",
      },
      { type: "h2", text: "How Dispatchers Should Prepare" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Check every state on the route** — not just the origin state, including any state the load will only pass through for a few hours.",
          "**Check the exact permit conditions** — width, height, length, gross and axle weights, overhang, travel hours, holiday restrictions, route-specific rules.",
          "**Confirm the permit before the holiday** — if the permit office is closed, a last-minute change may not be possible.",
          "**Schedule pilot cars early** — holiday weekends shrink the available travel windows and spike demand for escorts.",
          "**Build in extra time** — holiday traffic, weigh stations, construction, fuel stops, escort coordination, weather, and state-line delays all add up.",
          "**Have a backup plan** — move before the restriction starts, move after it ends, stage the truck safely, adjust the route, or reschedule.",
        ],
      },
      { type: "h2", text: "Planning an Oversize Load? Find Your Escorts Before the Last Minute." },
      {
        type: "p",
        text: "One of the easiest ways to cut down on holiday-weekend headaches is lining up your pilot car or escort service early, instead of having a dispatcher spend hours calling around.",
      },
      {
        type: "p",
        text: "**HeavyHaulEscortLoads.com** connects carriers, brokers, and dispatchers with pilot car and escort operators for upcoming loads. Post your load with the route and requirements, and let escort operators find it.",
      },
      {
        type: "p",
        text: "Whether you're moving a wide load, a long load, or another permitted oversize shipment, handling your escort requirements early is the difference between a smooth dispatch and a last-minute scramble.",
      },
      { type: "h2", text: "Always Check the Current State Rules" },
      {
        type: "p",
        text: "Holiday restriction lists are useful for planning, but they don't replace the actual permit or current state transportation-agency requirements. Restrictions can vary by load dimensions, route, permit type, escort requirements, and special exemptions — verify the current requirements for every state on your route before dispatching.",
      },
      {
        type: "p",
        text: "**Labor Day 2026 is Monday, September 7. Plan your permits. Plan your route. Plan your travel window. And plan your escorts early.**",
      },
      { type: "h2", text: "Sources" },
      {
        type: "list",
        items: [
          "U.S. Office of Personnel Management — 2026 Federal Holiday Schedule",
          "Minnesota Department of Transportation — 2026 Oversize/Overweight Holiday Restrictions",
          "Oregon Department of Transportation — 2026 Travel Restrictions",
          "North Dakota Highway Patrol — 2026 Oversize Travel Restrictions",
          "Texas Department of Motor Vehicles — Holiday Hours & Movement Restrictions",
          "2026 State Holiday Restriction Summary — Permit America",
        ],
      },
    ],
    cta: { label: "Post your load free →", href: "/signup" },
  },
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
