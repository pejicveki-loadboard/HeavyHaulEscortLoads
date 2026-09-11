"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "unsupported" | "off" | "on" | "subscribing" | "error";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// Entirely separate opt-in from the SMS checkbox on /signup and each
// SearchLocation's alert-channel checkboxes -- this toggles a
// PushSubscription row (browser/device), not a phone number or a
// SearchLocation.alertChannel. See src/app/api/push-subscriptions/route.ts.
export function PushNotificationsToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkExistingSubscription() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(subscription ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    checkExistingSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  // The ONLY place this feature calls Notification permission / subscribe --
  // fires solely from this checkbox's onChange, never on page load or after
  // signup/login, per the PWA requirements.
  async function subscribe() {
    setStatus("subscribing");
    setError(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push notifications are not configured yet.");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error("Failed to save push subscription.");

      setStatus("on");
    } catch {
      setStatus("off");
      setError(
        "Couldn't enable push notifications — you may have blocked the permission request in your browser."
      );
    }
  }

  async function unsubscribe() {
    setStatus("subscribing");
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("Couldn't turn off push notifications — try again.");
      setStatus("on");
    }
  }

  return (
    <section className="rounded border border-brand-border bg-brand-panel p-4">
      <h2 className="mb-1 font-semibold text-brand-text">Push Notifications</h2>
      <p className="mb-3 text-sm text-brand-muted">
        Get load-match alerts as push notifications on this device — in addition to or instead of
        email and text.
      </p>

      {status === "unsupported" ? (
        <p className="text-sm text-brand-muted">
          Push notifications aren&apos;t supported on this browser yet. Email and text alerts are
          available above.
        </p>
      ) : (
        <>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={status === "on" || status === "subscribing"}
              disabled={status === "checking" || status === "subscribing"}
              onChange={(e) => (e.target.checked ? subscribe() : unsubscribe())}
            />
            <span>Send me push notifications about load matches on this device.</span>
          </label>
          <p className="mt-2 text-sm text-brand-muted">
            You&apos;ll be asked to allow notifications in your browser. You can turn this off
            anytime, or manage it in your browser/device settings.
          </p>
          {status === "on" && (
            <p className="mt-2 text-sm text-green-500">
              Push notifications enabled ✓ — you&apos;ll get an alert here when a load matches
              your search.
            </p>
          )}
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </>
      )}
    </section>
  );
}
