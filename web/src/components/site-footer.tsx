import Link from "next/link";

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/heavyhaulescortloads",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61592629936865",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46A21.3 21.3 0 0 0 14.4 4.3c-2.24 0-3.78 1.37-3.78 3.87v2.16H8.06v2.96h2.56V21h2.88Z" />
      </svg>
    ),
  },
];

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
      <div className="mb-3 flex justify-center gap-4">
        {SOCIAL_LINKS.map((social) => (
          
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`HeavyHaul Escort Loads on ${social.name}`}
            className="text-brand-muted transition-colors hover:text-brand-accent"
          >
            <span className="block h-5 w-5">{social.icon}</span>
          </a>
        ))}
      </div>
      <p className="mx-auto max-w-2xl text-xs text-brand-muted">
        HeavyHaul Escort Loads is a nationwide marketplace connecting trucking companies and
        freight brokers hauling oversize and overweight loads with pilot car escort drivers and
        companies. Post a load for free, or subscribe as a pilot car company to search the load
        board, get real-time match alerts, and connect with load managers across the U.S.
      </p>
    </footer>
  );
}
