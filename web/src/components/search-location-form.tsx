"use client";

import { useState } from "react";
import Link from "next/link";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { US_STATES } from "@/lib/us-states";
import type { AlertChannelPreference, EscortPosition } from "@/generated/prisma/enums";

export type SearchLocationValues = {
  label: string | null;
  city: string;
  state: string;
  radiusMiles: number;
  escortPositions: EscortPosition[];
  active: boolean;
  alertChannel: AlertChannelPreference;
};

export function SearchLocationForm({
  mode,
  locationId,
  initialValues,
  profilePhone,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  locationId?: string;
  initialValues?: SearchLocationValues;
  // Phone number alerts are sent to (from the Pilot Car profile) -- shown
  // next to the SMS consent checkbox so a user knows exactly what number
  // they're opting in, per Twilio's A2P 10DLC web-form opt-in requirements.
  profilePhone: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [label, setLabel] = useState(initialValues?.label ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [state, setState] = useState(initialValues?.state ?? "");
  const [radiusMiles, setRadiusMiles] = useState(String(initialValues?.radiusMiles ?? 150));
  const [positions, setPositions] = useState<EscortPosition[]>(
    initialValues?.escortPositions ?? []
  );
  const [active, setActive] = useState(initialValues?.active ?? true);
  // Email and SMS are now two independent, explicitly-checked boxes rather
  // than one dropdown -- Twilio's A2P 10DLC web-form opt-in rules require
  // the SMS consent checkbox to start UNCHECKED (never pre-selected), with
  // its own consent language, frequency/rate disclosures, and opt-out
  // instructions right on the form. Email defaults on since it's the
  // primary, no-consent-required channel; SMS defaults off for new
  // locations. Editing an existing location just reflects its current
  // saved preference -- it doesn't force a fresh opt-in re-check.
  const initialChannel = initialValues?.alertChannel ?? "email";
  const [emailAlerts, setEmailAlerts] = useState(
    initialChannel === "email" || initialChannel === "both"
  );
  const [smsAlerts, setSmsAlerts] = useState(
    initialChannel === "sms" || initialChannel === "both"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function togglePosition(value: EscortPosition) {
    setPositions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!emailAlerts && !smsAlerts) {
      setError("Choose at least one alert channel (email or text).");
      return;
    }
    const alertChannel: AlertChannelPreference =
      emailAlerts && smsAlerts ? "both" : smsAlerts ? "sms" : "email";
    setSubmitting(true);
    try {
      const url =
        mode === "edit" ? `/api/search-locations/${locationId}` : "/api/search-locations";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          city,
          state,
          radiusMiles,
          escortPositions: positions,
          active,
          alertChannel,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save search location.");
        return;
      }
      onSaved?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-brand-border bg-brand-panel p-4">
      <label className="flex flex-col gap-1 text-sm">
        Label (optional)
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Truck 2 — Texas route"
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          City
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          State
          <select
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          >
            <option value="" disabled>
              --
            </option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Alert radius (miles, up to 500)
        <input
          type="number"
          min={1}
          max={500}
          required
          value={radiusMiles}
          onChange={(e) => setRadiusMiles(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        Escort positions
        <div className="flex flex-wrap gap-3">
          {ESCORT_POSITIONS.map((pos) => (
            <label key={pos.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={positions.includes(pos.value)}
                onChange={() => togglePosition(pos.value)}
              />
              {pos.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        Alert channels
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
          />
          Email alerts
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Yes, I&apos;d like to receive automated text messages from HeavyHaul Escort Loads
            about load matches for this search location. Message frequency varies based on how
            many loads match. Msg &amp; data rates may apply.
            <br />
            <span className="text-brand-muted">
              We&apos;ll text {profilePhone} — update this number from your profile if it&apos;s
              wrong. Reply HELP for help, STOP to cancel anytime. See our{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-brand-accent underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-brand-accent underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </span>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (uncheck to mute/pause this location — no alerts fire, without deleting it)
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50 transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep disabled:hover:bg-brand-accent disabled:active:scale-100"
        >
          {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Add location"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-brand-border px-4 py-2 text-brand-text transition-all duration-150 hover:border-brand-accent hover:bg-brand-accent/12 hover:text-brand-accent active:scale-[0.94] active:bg-brand-accent/22"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
