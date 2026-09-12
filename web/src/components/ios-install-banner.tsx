"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "heavyhaul-ios-install-dismissed";

// iOS Safari never fires beforeinstallprompt like Android Chrome does, so
// the only way to tell someone about Add to Home Screen there is to say so
// ourselves -- but only to that actual audience: Safari specifically (not
// Chrome/Firefox-on-iOS, which are just Safari's engine under a different
// UI and can't install this way either, but showing Safari-specific
// instructions to them would be wrong), on iOS, and not already installed.
function shouldShowIosBanner(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const isStandalone =
    "standalone" in navigator && (navigator as unknown as { standalone?: boolean }).standalone;
  return isIos && isSafari && !isStandalone;
}

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;
    // One-time client-only feature detection (navigator.userAgent doesn't
    // exist during SSR) -- not derived-from-props state, so the usual fix
    // for this rule doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(shouldShowIosBanner());
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-brand-border bg-brand-panel p-3 text-sm text-brand-text shadow-lg">
      <span>
        Add HeavyHaul to your home screen: tap <strong>Share</strong> →{" "}
        <strong>Add to Home Screen</strong>.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded border border-brand-border px-2 py-1 text-brand-muted transition-colors duration-150 hover:border-brand-accent hover:text-brand-accent"
      >
        Dismiss
      </button>
    </div>
  );
}
