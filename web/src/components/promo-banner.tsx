"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROMO_COPY_SHORT, isPromoActive } from "@/lib/access";

// sessionStorage, not localStorage: "Dismiss" hides the banner for the rest
// of this visit only; it shows again on the next one.
const DISMISSED_KEY = "heavyhaul-promo-banner-dismissed";

// Site-wide free-access promo banner (root layout: public and signed-in
// pages). It renders on the server so first-time visitors get it with no
// layout jump, then hides itself in the browser if it was dismissed this
// visit, or if the promo has ended since the page was built.
export function PromoBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      // Storage blocked (private mode): just keep showing it.
    }
    // One-time client-only check (sessionStorage and the browser's clock
    // don't exist during SSR), the same reason as the iOS install banner.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (dismissed || !isPromoActive()) setVisible(false);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Nothing to remember it in; it stays hidden until the next page load.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Free access"
      className="flex items-center justify-between gap-3 border-b border-brand-accent/40 bg-brand-accent/10 px-4 py-2 text-sm text-brand-text"
    >
      <p className="min-w-0">
        {PROMO_COPY_SHORT}{" "}
        <Link
          href="/pricing"
          className="whitespace-nowrap text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep"
        >
          See pricing
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss free access banner"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-lg text-brand-muted transition-colors duration-150 hover:text-brand-accent active:text-brand-accent-deep"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
