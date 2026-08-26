"use client";

import { useState } from "react";

type PlanInterval = "monthly" | "annual";

const PLAN_LABEL: Record<PlanInterval, string> = {
  monthly: "Monthly ($17.99/mo)",
  annual: "Annual ($179.88/yr — $14.99/mo, 2 months free)",
};

function useBillingAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, body?: unknown) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return null;
      }
      return data;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, error };
}

// Shown when there's no billing-active subscription yet -- covers a fresh
// trial, an expired trial, or a fully expired/cancelled past subscription.
export function SubscribePanel() {
  const { run, pending, error } = useBillingAction();

  async function subscribe(interval: PlanInterval) {
    const data = await run("/api/billing/checkout", { interval });
    if (data?.url) window.location.assign(data.url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["monthly", "annual"] as const).map((interval) => (
          <button
            key={interval}
            type="button"
            disabled={pending}
            onClick={() => subscribe(interval)}
            className="rounded border border-brand-border bg-brand-panel p-4 text-left transition-all duration-150 hover:border-brand-accent active:scale-[0.98] disabled:opacity-50"
          >
            <p className="font-semibold text-brand-text">{PLAN_LABEL[interval]}</p>
            <p className="mt-1 text-sm text-brand-accent">
              {pending ? "Redirecting to checkout..." : "Subscribe"}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Shown for an active/past_due subscription -- plan switch, cancel, and a
// link out to Stripe's Customer Portal for payment-method updates.
export function ManageSubscriptionPanel({
  planInterval,
  pendingPlanInterval,
  cancelAtPeriodEnd,
}: {
  planInterval: PlanInterval;
  pendingPlanInterval: PlanInterval | null;
  cancelAtPeriodEnd: boolean;
}) {
  const { run, pending, error } = useBillingAction();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const otherInterval: PlanInterval = planInterval === "monthly" ? "annual" : "monthly";

  async function switchPlan() {
    const data = await run("/api/billing/change-plan", { interval: otherInterval });
    if (data) {
      setDone(
        `Switching to ${PLAN_LABEL[otherInterval]} at your next billing date (${new Date(
          data.effectiveAt
        ).toLocaleDateString()}).`
      );
    }
  }

  async function confirmCancel() {
    const data = await run("/api/billing/cancel");
    if (data) {
      setDone(
        data.accessUntil
          ? `Cancelled. No refund, but you'll keep access until ${new Date(
              data.accessUntil
            ).toLocaleDateString()}.`
          : "Cancelled. You'll keep access through the end of your current paid term."
      );
      setConfirmingCancel(false);
    }
  }

  async function openPortal() {
    const data = await run("/api/billing/portal");
    if (data?.url) window.location.assign(data.url);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={openPortal}
          className="rounded border border-brand-border px-4 py-2 text-sm text-brand-text transition-all duration-150 hover:border-brand-accent active:scale-[0.97] disabled:opacity-50"
        >
          Update payment method
        </button>

        {!cancelAtPeriodEnd && !pendingPlanInterval && (
          <button
            type="button"
            disabled={pending}
            onClick={switchPlan}
            className="rounded border border-brand-border px-4 py-2 text-sm text-brand-text transition-all duration-150 hover:border-brand-accent active:scale-[0.97] disabled:opacity-50"
          >
            Switch to {otherInterval === "monthly" ? "Monthly" : "Annual"}
          </button>
        )}

        {!cancelAtPeriodEnd && !confirmingCancel && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingCancel(true)}
            className="rounded border border-red-900 px-4 py-2 text-sm text-red-400 transition-all duration-150 hover:border-red-700 active:scale-[0.97] disabled:opacity-50"
          >
            Cancel subscription
          </button>
        )}
      </div>

      {confirmingCancel && (
        <div className="rounded border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
          <p>
            This won&apos;t be refunded — you&apos;ll keep access through the end of your current
            paid term, then it won&apos;t renew.
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={confirmCancel}
              className="rounded bg-red-700 px-3 py-1.5 text-white transition-all duration-150 hover:bg-red-600 active:scale-[0.97] disabled:opacity-50"
            >
              {pending ? "Cancelling..." : "Confirm cancel"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              className="rounded border border-brand-border px-3 py-1.5 text-brand-text transition-all duration-150 hover:border-brand-accent active:scale-[0.97]"
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {done && <p className="text-sm text-green-400">{done}</p>}
    </div>
  );
}
