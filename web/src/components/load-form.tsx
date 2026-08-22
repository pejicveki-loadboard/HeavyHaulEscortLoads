"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { US_STATES } from "@/lib/us-states";
import type { EscortPosition, RateUnit } from "@/generated/prisma/enums";

export type LoadValues = {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  date: string; // "YYYY-MM-DD"
  escortPositions: EscortPosition[];
  dimensionWidthFt: number | null;
  dimensionHeightFt: number | null;
  dimensionLengthFt: number | null;
  weightLbs: number | null;
  rate: number | null;
  rateUnit: RateUnit | null;
};

export function LoadForm({
  mode,
  loadId,
  initialValues,
  redirectTo,
}: {
  mode: "create" | "edit";
  loadId?: string;
  initialValues?: LoadValues;
  redirectTo: string;
}) {
  const router = useRouter();
  const [originCity, setOriginCity] = useState(initialValues?.originCity ?? "");
  const [originState, setOriginState] = useState(initialValues?.originState ?? "");
  const [destinationCity, setDestinationCity] = useState(initialValues?.destinationCity ?? "");
  const [destinationState, setDestinationState] = useState(initialValues?.destinationState ?? "");
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [positions, setPositions] = useState<EscortPosition[]>(
    initialValues?.escortPositions ?? []
  );
  const [widthFt, setWidthFt] = useState(initialValues?.dimensionWidthFt?.toString() ?? "");
  const [heightFt, setHeightFt] = useState(initialValues?.dimensionHeightFt?.toString() ?? "");
  const [lengthFt, setLengthFt] = useState(initialValues?.dimensionLengthFt?.toString() ?? "");
  const [weightLbs, setWeightLbs] = useState(initialValues?.weightLbs?.toString() ?? "");
  const [rate, setRate] = useState(initialValues?.rate?.toString() ?? "");
  const [rateUnit, setRateUnit] = useState(initialValues?.rateUnit ?? "");
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
      const url = mode === "edit" ? `/api/loads/${loadId}` : "/api/loads";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCity,
          originState,
          destinationCity,
          destinationState,
          date,
          escortPositions: positions,
          dimensionWidthFt: widthFt,
          dimensionHeightFt: heightFt,
          dimensionLengthFt: lengthFt,
          weightLbs,
          rate,
          rateUnit,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save load.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-brand-border bg-brand-panel p-4">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Origin city
          <input
            required
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          State
          <select
            required
            value={originState}
            onChange={(e) => setOriginState(e.target.value)}
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
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Destination city
          <input
            required
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          State
          <select
            required
            value={destinationState}
            onChange={(e) => setDestinationState(e.target.value)}
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
        Date
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Width (ft, optional)
          <input
            type="number"
            min={0}
            step="0.1"
            value={widthFt}
            onChange={(e) => setWidthFt(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Height (ft, optional)
          <input
            type="number"
            min={0}
            step="0.1"
            value={heightFt}
            onChange={(e) => setHeightFt(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Length (ft, optional)
          <input
            type="number"
            min={0}
            step="0.1"
            value={lengthFt}
            onChange={(e) => setLengthFt(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Weight (lbs, optional)
        <input
          type="number"
          min={0}
          value={weightLbs}
          onChange={(e) => setWeightLbs(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Rate (optional)
          <input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex w-40 flex-col gap-1 text-sm">
          Rate unit
          <select
            value={rateUnit}
            onChange={(e) => setRateUnit(e.target.value as RateUnit | "")}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          >
            <option value="">--</option>
            <option value="flat">Flat</option>
            <option value="per_mile">Per mile</option>
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50"
      >
        {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Post load"}
      </button>
    </form>
  );
}
