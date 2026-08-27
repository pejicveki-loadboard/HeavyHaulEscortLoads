import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LegalMarkdown } from "@/components/legal-markdown";

export const metadata: Metadata = {
  title: "Terms of Use — HeavyHaul Escort Loads",
  description: "Terms of Use for HeavyHaul Escort Loads.",
};

const EFFECTIVE_DATE = "August 23, 2026";

const TERMS_MD = `# Terms of Use

**Effective Date:** ${EFFECTIVE_DATE}

## 1. Who We Are

HeavyHaul Escort Loads (heavyhaulescortloads.com, the "Platform," "we," "us") is operated by Ved Trucking, LLC, a Minnesota limited liability company, doing business as HeavyHaul Escort Loads ("DBA," Minnesota Secretary of State File Number 1661834300023), located at 1202 4th Ave NE, Austin, MN 55912.

By creating an account or using the Platform, you agree to these Terms of Use. If you don't agree, don't use the Platform.

## 2. What the Platform Is

HeavyHaul Escort Loads is a matching service connecting two kinds of users:

- **Load Managers** — trucking companies and brokers who post oversize/overweight load jobs that need a pilot car (escort) driver.
- **Pilot Car Companies** — escort drivers and companies who search for and respond to those postings.

A single account may hold either or both profile types.

Load posting is free for Load Managers, unlimited, with no subscription or payment required, now or in the future for that side of the platform.

Pilot Car Company access to the load board (search, real-time alerts, and contact-reveal) requires an active subscription after a 30-day free trial. No payment method is required to start the trial.

## 3. We Are Not a Party to Any Deal

**This is the most important section.** HeavyHaul Escort Loads is a lead-generation and matching platform only. We do not broker, negotiate, arrange, insure, supervise, or guarantee any job, and we are never a party to any agreement, contract, or transaction between a Load Manager and a Pilot Car Company.

Once contact information is revealed between two users, everything that happens next — negotiating rate, agreeing to terms, performing the job, paying for the job, resolving disputes — happens entirely off-platform, directly between those two users, at their own risk and on their own judgment. We have no visibility into and no responsibility for the outcome.

## 4. No Verification of Certifications, Licensing, or Insurance

We do not currently verify pilot car certifications (P/EVO or otherwise), state licensing, or insurance coverage for any user. Requirements for pilot car escorts vary by state, and it is each user's own responsibility to know and meet the requirements that apply to a given job, and to verify the other party's qualifications and insurance before agreeing to work together.

We may add verification features in the future; until then, nothing on the Platform should be read as a certification, endorsement, or guarantee that any user is licensed, insured, or qualified for a given job.

## 5. User Accounts and Conduct

You must be at least 18 years old and able to enter into a binding contract (personally or on behalf of a business) to use the Platform.

You agree to:
- Provide accurate information about yourself, your business, and any load you post.
- Keep your account credentials secure and not share your account with others.
- Not post fraudulent, misleading, or duplicate load listings.
- Not use the Platform to harass, defraud, or abuse other users.
- Not attempt to circumvent the Platform's access controls (e.g., accessing paid load-board features without an active subscription or trial).

We may suspend or terminate any account that violates these terms, at our discretion.

## 6. Fees and Payment

Pilot Car Company subscriptions are billed at the rates shown on our [Pricing page](/pricing), which may change with notice: $17.99/month billed monthly, or $179.88 billed once a year (equivalent to $14.99/month). By subscribing, you authorize us to charge your payment method on file for the applicable amount at the start of each billing period.

**Switching from monthly to annual** takes effect at the start of the billing cycle following your current paid month — there is no mid-cycle proration; you keep your current monthly access through the period you've already paid for, then annual billing begins.

**Annual plan cancellations.** If you cancel an annual subscription partway through the year, you will not receive a refund for the remaining term, but you will keep full access to the load board through the end of the period you already paid for.

**Failed payments.** If a monthly payment fails, we'll attempt to notify you and you'll have a 3-day grace period to update your payment method before load-board access is suspended. Access resumes automatically once payment succeeds.

Load posting is, and will remain, free for Load Managers.

## 7. Disclaimers and Limitation of Liability

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE ACCURACY OF ANY LOAD POSTING, THE QUALIFICATIONS OF ANY USER, OR THE OUTCOME OF ANY JOB ARRANGED THROUGH THE PLATFORM.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEAVYHAUL ESCORT LOADS AND VED TRUCKING, LLC ARE NOT LIABLE FOR ANY DAMAGES — INCLUDING PROPERTY DAMAGE, PERSONAL INJURY, OR DEATH — ARISING FROM A JOB, TRANSACTION, OR INTERACTION BETWEEN USERS ARRANGED THROUGH THE PLATFORM, WHETHER BASED ON CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM YOUR USE OF THE PLATFORM WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM AROSE, OR (B) $100.

## 8. Indemnification

You agree to indemnify, defend, and hold harmless HeavyHaul Escort Loads and Ved Trucking, LLC, and its owners, from any claims, damages, losses, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Platform; (b) any job, transaction, or interaction you enter into with another user; (c) your violation of these Terms; or (d) your violation of any law or the rights of a third party.

## 9. Governing Law and Disputes

These Terms are governed by the laws of the State of Minnesota, without regard to conflict-of-law principles. Any dispute arising from these Terms or your use of the Platform will be resolved in the state or federal courts located in Minnesota, and you consent to the personal jurisdiction of those courts.

## 10. Changes to These Terms

We may update these terms from time to time. Material changes will be posted on this page with an updated effective date.

## 11. Contact

Questions about these terms: info@heavyhaulescortloads.com, or see our [Contact page](/contact).

---

*Ved Trucking, LLC, doing business as HeavyHaul Escort Loads. 1202 4th Ave NE, Austin, MN 55912.*
`;

export default function TermsPage() {
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
        <LegalMarkdown source={TERMS_MD} />
      </div>
    </main>
  );
}
