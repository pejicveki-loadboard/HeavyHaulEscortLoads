// Plain data array, not a CMS -- matches how FAQ (src/app/faq/page.tsx) and
// pricing content are structured elsewhere in this app. Add a post by
// appending an object here; /blog and /blog/[slug] both read from this.
export type BlogPost = {
  slug: string;
  title: string;
  // Doubles as both the index page's excerpt and the post's meta
  // description -- one post doesn't need two near-duplicate summaries.
  excerpt: string;
  date: string; // ISO yyyy-mm-dd
  body: string[]; // paragraphs
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
      "If your load board is moving away from text alerts — switching to an app that only works while it's open and running, or that only supports one device at a time — that's a real step down if you're used to a text landing the second a load matches, wherever you are, phone locked or not.",
      "HeavyHaul Escort Loads sends real text alerts, matched to your specific city and radius rather than a broad region. Posting stays free for load managers/brokers, and pilot car companies get a 30-day free trial with no card required — $17.99/month after that, or $14.99/month effective if you prepay a year.",
      "If you're dealing with a sudden change to how your alerts work, it might be worth trying something that still sends a real text the moment a load matches your route.",
    ],
    cta: { label: "Sign up free →", href: "/signup" },
  },
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
