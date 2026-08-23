import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-brand-border px-6 py-6 text-center">
      <nav className="mb-3 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/pricing" className="text-brand-accent underline">
          Pricing
        </Link>
        <Link href="/faq" className="text-brand-accent underline">
          FAQ
        </Link>
        <Link href="/contact" className="text-brand-accent underline">
          Contact
        </Link>
      </nav>
      <p className="mx-auto max-w-2xl text-xs text-brand-muted">
        HeavyHaul Escort Loads is a trade name (assumed name / DBA) of{" "}
        <strong className="text-brand-text">Ved Trucking, LLC</strong>, registered with the
        Minnesota Secretary of State (Certificate of Assumed Name, File Number 1661834300023).
        Ved Trucking, LLC is based at 1202 4th Ave NE, Austin, MN 55912.
      </p>
    </footer>
  );
}
