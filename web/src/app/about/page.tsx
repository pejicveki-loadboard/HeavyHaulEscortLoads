import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About HeavyHaul Escort Loads | Nationwide Pilot Car & Oversize Load Marketplace",
  description:
    "HeavyHaul Escort Loads connects trucking companies and brokers hauling oversize and overweight loads with pilot car escort drivers nationwide. Free load posting, real-time alerts, simple pricing.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
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

      <div className="flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-panel p-6">
        <h1 className="text-3xl font-semibold text-brand-text">About HeavyHaul Escort Loads</h1>

        <p className="text-brand-text">
          HeavyHaul Escort Loads is a nationwide online marketplace built to make finding and
          booking pilot car escorts for oversize and overweight loads simple, fast, and
          affordable. We connect trucking companies and freight brokers who need a pilot car —
          also called an escort vehicle or P/EVO — with independent pilot car drivers and
          companies ready to work.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">What We Do</h2>
        <p className="text-brand-text">
          Moving an oversize or overweight load — a wide load, high load, long load, or
          superload — often requires one or more pilot car escorts to guide traffic, watch for
          overhead obstructions, and help the load move safely and legally through every state it
          crosses. HeavyHaul Escort Loads makes that connection easy: trucking companies and
          brokers post their load details — origin, destination, dates, dimensions, and escort
          position needed (lead, chase, or high pole) — and pilot car companies search by city
          and radius to find jobs that match their service area.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">
          For Trucking Companies &amp; Brokers
        </h2>
        <p className="text-brand-text">
          Posting a load on HeavyHaul Escort Loads is free, always — no subscription, no card, no
          limit on how many loads you post. Get your oversize or overweight load in front of
          pilot car companies actively searching your route, with no cost or commitment on your
          side.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">
          For Pilot Car Companies &amp; Escort Drivers
        </h2>
        <p className="text-brand-text">
          Search the load board by city and radius, filter by escort position — lead, chase, or
          high pole — and get real-time email and SMS alerts the moment a matching load posts, so
          you&apos;re never missing work in your service area. Every pilot car account starts
          with a 30-day free trial, no credit card required, on either our monthly or annual
          plan.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">Why HeavyHaul Escort Loads</h2>
        <p className="text-brand-text">
          We built HeavyHaul Escort Loads to be simpler and more affordable than other pilot car
          load boards: one login for both posting loads and searching as a pilot car company,
          real radius-based search instead of broad regional matching, and straightforward
          pricing with no hidden fees.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">Nationwide Coverage</h2>
        <p className="text-brand-text">
          We serve trucking companies, freight brokers, and pilot car escort drivers across the
          United States — wherever oversize and overweight loads move.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-brand-text">Get Started</h2>
        <p className="text-brand-text">
          Post a load for free, or see{" "}
          <Link href="/pricing" className="text-brand-accent underline">
            pricing
          </Link>{" "}
          to start your pilot car company&apos;s free trial. Questions? Check our{" "}
          <Link href="/faq" className="text-brand-accent underline">
            FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="text-brand-accent underline">
            contact us
          </Link>{" "}
          directly.
        </p>
      </div>
    </main>
  );
}
