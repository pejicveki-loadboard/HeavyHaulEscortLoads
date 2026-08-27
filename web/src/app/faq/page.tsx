import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — HeavyHaul Escort Loads",
  description: "Answers to common questions about posting loads, pilot car subscriptions, alerts, and how the marketplace works.",
};

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "How the marketplace works",
    items: [
      {
        q: "What is HeavyHaul Escort Loads?",
        a: "A marketplace connecting truckers and brokers hauling oversize/overweight loads with pilot car (escort) drivers and companies.",
      },
      {
        q: "Is posting a load actually free?",
        a: "Yes, always, for every Load Manager account — unlimited posts, no subscription, no card.",
      },
      {
        q: "Do truckers or brokers ever pay?",
        a: "No. Only Pilot Car company accounts have a paid subscription, for load-board access.",
      },
      {
        q: "How do I actually book a job once I find a match?",
        a: "HeavyHaul is a matching layer, not a broker. Once you reveal contact info, you negotiate and finalize the job directly with the other party, off-platform.",
      },
    ],
  },
  {
    title: "Getting started & your account",
    items: [
      {
        q: "How do I sign up?",
        a: "One email/login. Choose a Load Manager profile, a Pilot Car profile, or both.",
      },
      {
        q: "Do I need to verify my email?",
        a: "Yes, click the link in your signup email. If it doesn't arrive, resend it from your dashboard.",
      },
      {
        q: "How do I know what type of account I have?",
        a: "Your dashboard shows which profile(s) are active on your account.",
      },
      {
        q: "Can I sign up for both account types?",
        a: "Yes — one login can hold both a Load Manager and a Pilot Car profile, unlike some competitors that require two separate emails.",
      },
      {
        q: "What if I signed up as the wrong account type?",
        a: "Add the correct profile type to your existing account anytime; no need to create a new account.",
      },
      {
        q: "Is there a mobile app?",
        a: "Not yet — the site works on mobile browsers today.",
      },
    ],
  },
  {
    title: "Pricing, trial & billing",
    items: [
      {
        q: "How much does a Pilot Car subscription cost?",
        a: "$17.99/month, or $179.88 billed once a year ($14.99/month effective — about 2 months free vs. paying monthly).",
      },
      {
        q: "Do I need a credit card to start?",
        a: "No. Every Pilot Car account gets a 30-day free trial, no card required, on either plan.",
      },
      {
        q: "What happens when my trial ends?",
        a: "You'll need an active subscription to keep browsing the load board and receiving alerts. Load posting is never affected.",
      },
      {
        q: "Can I switch from monthly to annual?",
        a: "Yes, effective the billing cycle after your current paid month ends — no mid-cycle proration.",
      },
      {
        q: "How do I cancel or manage my subscription?",
        a: "Billing management, including cancellation, will be available from your account settings once subscriptions go live. Contact us in the meantime.",
      },
    ],
  },
  {
    title: "Search, alerts & the load board",
    items: [
      {
        q: "How does radius search work?",
        a: "Set a search location (city/region), a radius, and the escort position you're looking for (lead/chase/high-pole). You can set up multiple search locations.",
      },
      {
        q: "How will I know about a new matching load?",
        a: "A real-time alert fires the moment a posted load matches one of your search locations.",
      },
      {
        q: "Can I choose email, SMS, or both?",
        a: "Each search location has its own channel preference. Note: SMS delivery isn't live yet (pending a carrier account issue on our end) — email is fully live today.",
      },
      {
        q: "Why am I not receiving alerts?",
        a: "Check that the search location is active (not muted/paused), check your channel preference, and check your spam folder.",
      },
      {
        q: "How do I pause alerts for a location?",
        a: "Mark it inactive/muted from your dashboard anytime, or delete it.",
      },
      {
        q: 'What does "open" vs. "covered" mean on a load?',
        a: "Open means it still needs a pilot car; covered means the Load Manager marked it filled. Covered loads stop generating alerts, but a Load Manager can reopen one if it falls through.",
      },
      {
        q: "Do I need certification to work as a pilot car escort?",
        a: "Requirements vary by state; many require certified P/EVO training. HeavyHaul doesn't currently verify certifications or insurance on profiles — you're responsible for meeting your state's requirements for the loads you take.",
      },
    ],
  },
  {
    title: "Posting a load (Load Managers)",
    items: [
      {
        q: "How do I post a load?",
        a: "From your dashboard, fill in origin, destination, dates, dimensions, and escort position needed.",
      },
      {
        q: "Do I need to mark my load as covered once it's filled?",
        a: "Yes, recommended — it stops further alerts and keeps the board accurate.",
      },
      {
        q: "I made a mistake on a posted load — can I fix it?",
        a: "Yes, edit it anytime from your dashboard. Changing the origin or escort position re-triggers matching alerts.",
      },
      {
        q: "How do I contact support or report a problem?",
        a: "Email info@heavyhaulescortloads.com. Since deals and payment happen directly between parties off-platform, handle contract terms directly — but let us know about any bad actors so we can look into it.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 p-6">
      <div className="flex flex-col items-start gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={168}
            height={64}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <h1 className="text-3xl font-semibold text-brand-text">Frequently asked questions</h1>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-brand-text">{section.title}</h2>
          <div className="flex flex-col gap-2 rounded-lg border border-brand-border bg-brand-panel p-2">
            {section.items.map((item) => (
              <details
                key={item.q}
                className="group rounded p-3 open:bg-brand-bg/40"
              >
                <summary className="cursor-pointer list-none font-semibold text-brand-text marker:content-none">
                  <span className="mr-2 inline-block text-brand-accent transition-transform group-open:rotate-90">
                    &#9656;
                  </span>
                  {item.q}
                </summary>
                <p className="mt-2 pl-5 text-sm text-brand-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
