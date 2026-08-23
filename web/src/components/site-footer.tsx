import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-brand-border px-6 py-6 text-center">
      <nav className="mb-3 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/about" className="text-brand-accent underline">
          About
        </Link>
        <Link href="/pricing" className="text-brand-accent underline">
          Pricing
        </Link>
        <Link href="/faq" className="text-brand-accent underline">
          FAQ
        </Link>
        <Link href="/contact" className="text-brand-accent underline">
          Contact
        </Link>
        <Link href="/terms" className="text-brand-accent underline">
          Terms of Use
        </Link>
        <Link href="/privacy" className="text-brand-accent underline">
          Privacy Policy
        </Link>
      </nav>
      <p className="mx-auto max-w-2xl text-xs text-brand-muted">
        HeavyHaul Escort Loads is a nationwide marketplace connecting trucking companies and
        freight brokers hauling oversize and overweight loads with pilot car escort drivers and
        companies. Post a load for free, or subscribe as a pilot car company to search the load
        board, get real-time match alerts, and connect with load managers across the U.S.
      </p>
    </footer>
  );
}
