"use client";

import { useEffect } from "react";

// Registering a service worker never prompts the user for anything -- only
// requesting Notification permission / calling pushManager.subscribe() does
// that, and this component does neither. Those stay gated behind the
// Account Settings push checkbox (see PushNotificationsToggle) so the
// native permission prompt only ever fires on an explicit user action, per
// the PWA requirements.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    }
  }, []);

  return null;
}
