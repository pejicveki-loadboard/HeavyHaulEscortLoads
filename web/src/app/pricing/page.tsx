import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — HeavyHaul Escort Loads",
  description:
    "Posting loads is always free. Pilot Car load-board access starts with a 30-day free trial.",
};

const FEATURES = [
  "Unlimited search locations — one per truck or region, each with its own radius and escort-position filter",
  "Real-time email + SMS alerts the moment a matching load posts",
  "Browse and filter the live load board anytime — by city, radius, escort position, or date",
  "One-click contact reveal for any matched load",
];

function FeatureList() {
  return (
    <ul className="flex flex-col gap-2 text-sm text-brand-text">
      {FEATURES.map((feature) => (
        <li key={feature} className="flex gap-2">
          <span className="text-brand-accent">&#10003;</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-6">
      <div className="flex flex-col items-start gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={186}
            height={64}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <h1 className="text-3xl font-semibold text-brand-text">Pricing</h1>
      </div>

      <section className="rounded border border-brand-accent bg-brand-accent/10 p-6 text-center">
        <p className="text-lg font-semibold text-brand-accent">Posting loads is always free.</p>
        <p className="mt-1 text-brand-text">
          Load Managers and brokers can post unlimited loads at no cost — no subscription, no
          card required, ever. This applies no matter what you see below for Pilot Car pricing.
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-brand-text">Pilot Car subscription</h2>
          <p className="text-brand-muted">
            Find loads, get alerted the moment one matches, and reveal contact info to book it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-lg border border-brand-border bg-brand-panel p-6">
            <div>
              <h3 className="text-xl font-semibold text-brand-text">Monthly</h3>
              <p className="mt-2 text-3xl font-semibold text-brand-text">
                $17.99<span className="text-base font-normal text-brand-muted">/month</span>
              </p>
              <p className="text-sm text-brand-muted">Billed monthly. Cancel anytime.</p>
            </div>
            <FeatureList />
            <p className="text-sm text-brand-muted">30-day free trial. No card required.</p>
            <Link
              href="/signup?plan=monthly"
              className="mt-auto rounded bg-brand-accent px-4 py-2 text-center font-semibold text-brand-accent-text transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep"
            >
              Start Free Trial
            </Link>
          </div>

          <div className="relative flex flex-col gap-4 rounded-lg border-2 border-brand-accent bg-brand-panel p-6 pt-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold text-brand-accent-text">
              Recommended — Best Value
            </span>
            <div>
              <h3 className="text-xl font-semibold text-brand-text">Annual</h3>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <p className="text-3xl font-semibold text-brand-text">
                  $14.99<span className="text-base font-normal text-brand-muted">/month</span>
                </p>
                <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-xs font-semibold text-brand-accent">
                  2 months free
                </span>
              </div>
              <p className="text-sm text-brand-muted">$179.88 billed once a year.</p>
            </div>
            <FeatureList />
            <p className="text-sm text-brand-muted">30-day free trial. No card required.</p>
            <Link
              href="/signup?plan=annual"
              className="mt-auto rounded bg-brand-accent px-4 py-2 text-center font-semibold text-brand-accent-text transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      <p className="text-center text-sm text-brand-muted">
        Questions?{" "}
        <Link href="/faq" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
          See the FAQ
        </Link>
      </p>
    </main>
  );
}
