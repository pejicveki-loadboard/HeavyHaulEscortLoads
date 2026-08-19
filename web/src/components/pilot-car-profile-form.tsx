"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { US_STATES } from "@/lib/us-states";
import type { EscortPosition } from "@/generated/prisma/enums";

export function PilotCarProfileForm({
  onCreated,
  redirectTo,
}: {
  onCreated?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radius, setRadius] = useState("150");
  const [positions, setPositions] = useState<EscortPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

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
      const res = await fetch("/api/profiles/pilot-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          phone,
          homeBaseCity: city,
          homeBaseState: state,
          alertRadiusMiles: radius,
          escortPositions: positions,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create Pilot Car profile.");
        return;
      }
      setCreated(true);
      onCreated?.();
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
        Pilot Car profile created — your 30-day trial has started.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-gray-300 p-4">
      <label className="flex flex-col gap-1 text-sm">
        Company name
        <input
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Phone
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Home base city
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          State
          <select
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
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
        Alert radius (miles)
        <input
          type="number"
          min={1}
          required
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Create Pilot Car profile"}
      </button>
    </form>
  );
}
