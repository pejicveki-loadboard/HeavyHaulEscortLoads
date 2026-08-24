"use client";

import { useState } from "react";
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
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit";
  locationId?: string;
  initialValues?: SearchLocationValues;
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
  const [alertChannel, setAlertChannel] = useState<AlertChannelPreference>(
    initialValues?.alertChannel ?? "both"
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
      <label className="flex flex-col gap-1 text-sm">
        Alert channel
        <select
          value={alertChannel}
          onChange={(e) => setAlertChannel(e.target.value as AlertChannelPreference)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        >
          <option value="both">Email + SMS</option>
          <option value="email">Email only</option>
          <option value="sms">SMS only</option>
        </select>
      </label>
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
