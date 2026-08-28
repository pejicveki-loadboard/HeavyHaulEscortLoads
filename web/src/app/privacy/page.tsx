import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";

export const metadata: Metadata = {
  title: "Privacy Policy — HeavyHaul Escort Loads",
  description: "Privacy Policy for HeavyHaul Escort Loads.",
};

const EFFECTIVE_DATE = "August 28, 2026";

const PRIVACY_MD = `# Privacy Policy

**Effective Date:** ${EFFECTIVE_DATE}

## 1. Who This Applies To

This policy covers information collected by HeavyHaul Escort Loads (heavyhaulescortloads.com and app.heavyhaulescortloads.com), operated by Ved Trucking, LLC, DBA HeavyHaul Escort Loads, 1202 4th Ave NE, Austin, MN 55912.

## 2. What We Collect

**Account information:** name, email address, company name, and account type (Load Manager and/or Pilot Car Company).

**Load and search data:** load postings (origin, destination, dates, dimensions, escort position), and Pilot Car Company search locations (city/region, radius, escort-position preference, alert-channel preference).

**Communications data:** email address for account verification and load-match alerts; phone number for SMS load-match alerts.

**Contact form submissions:** name, email, and message content when you use the [Contact page](/contact).

**Payment information:** once billing is live, we do not directly store your card details — payment processing is handled by Stripe, and we retain only what's needed for billing records (e.g., subscription status, plan type).

**Automatically collected:** a session cookie to keep you signed in, and standard server logs from our hosting provider (Vercel). We do not currently use third-party analytics or advertising trackers.

## 3. How We Use It

- To operate the core matching service: showing Load Managers to Pilot Car Companies whose search criteria match, and sending real-time alerts.
- To verify accounts (email verification) and manage your subscription/trial status.
- To respond to support requests submitted via the Contact page.
- To communicate with you about your account (e.g., trial ending, service updates).

We do not sell your personal information.

## 4. Who We Share It With

**With other users, as the core function of the product:** when you reveal contact information for a matched load, the other party's name, company, and contact details are shared with you (and vice versa). This is the intended, expected function of the Platform, not a third-party disclosure.

**With service providers who help us operate the Platform**, each only for the purpose of providing their service to us:
- **Resend** — sends transactional emails (verification, load-match alerts, contact-form notifications).
- **Twilio** — will send SMS load-match alerts once live.
- **Mapbox** — geocodes city/region names for radius search.
- **Railway** — hosts our database.
- **Vercel** — hosts the application.
- **Stripe** — will process subscription payments once live.

We do not share your information with these providers for their own marketing purposes.

**Text message (SMS) alerts.** If you opt in to SMS load-match alerts ("HeavyHaul Escort Loads Load-Match SMS Alerts"), we use your phone number only to send those alerts through Twilio. Opt-in happens from within your authenticated Pilot Car Company account, on the Search Locations page, via a per-search-location consent checkbox that is unchecked by default. We do not sell or share your mobile number with any third party for their own marketing purposes. Message frequency is recurring and varies based on how many loads match your saved search criteria. Message and data rates may apply. Reply HELP for help or STOP to cancel at any time — see our [Terms of Use](/terms) for the full program terms.

**When required by law**, or to protect the rights, safety, or property of HeavyHaul Escort Loads, our users, or the public.

## 5. Your Choices and Rights

You can review and update your account information from your dashboard. You can mute or delete a search location at any time to stop receiving alerts for it. To request access to, correction of, or deletion of your personal information, contact info@heavyhaulescortloads.com. We serve customers throughout the United States and will respond to any such request regardless of your state of residence.

## 6. Data Retention

We retain account and load data for as long as your account is active, and for up to 3 years afterward as needed for legal, accounting, or dispute-resolution purposes, after which it is deleted or anonymized.

## 7. Children

The Platform is intended for business use by adults (18+) and is not directed at children. We do not knowingly collect information from anyone under 18.

## 8. Changes to This Policy

We may update this policy from time to time. Material changes will be posted on this page with an updated effective date.

## 9. Contact

Questions about this policy: info@heavyhaulescortloads.com, or see our [Contact page](/contact).

---

*Ved Trucking, LLC, doing business as HeavyHaul Escort Loads. 1202 4th Ave NE, Austin, MN 55912.*
`;

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
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
      <div className="rounded-lg border border-brand-border bg-brand-panel p-6">
        <LegalMarkdown source={PRIVACY_MD} />
      </div>
    </main>
  );
}
