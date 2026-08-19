"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import type { EscortPosition } from "@/generated/prisma/enums";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
  "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT",
  "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function OnboardingForm({
  hasLoadManagerProfile,
  hasPilotCarProfile,
}: {
  hasLoadManagerProfile: boolean;
  hasPilotCarProfile: boolean;
}) {
  const router = useRouter();
  const [wantsLoadManager, setWantsLoadManager] = useState(false);
  const [wantsPilotCar, setWantsPilotCar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Manager fields
  const [lmCompanyName, setLmCompanyName] = useState("");
  const [lmPhone, setLmPhone] = useState("");

  // Pilot Car fields
  const [pcCompanyName, setPcCompanyName] = useState("");
  const [pcPhone, setPcPhone] = useState("");
  const [pcCity, setPcCity] = useState("");
  const [pcState, setPcState] = useState("");
  const [pcRadius, setPcRadius] = useState("150");
  const [pcPositions, setPcPositions] = useState<EscortPosition[]>([]);

  function togglePosition(value: EscortPosition) {
    setPcPositions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!wantsLoadManager && !wantsPilotCar) {
      setError("Select at least one option.");
      return;
    }

    setSubmitting(true);
    try {
      if (wantsLoadManager) {
        const res = await fetch("/api/profiles/load-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: lmCompanyName, phone: lmPhone }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to create Load Manager profile.");
          return;
        }
        // Prevent a retry (e.g. after the Pilot Car step below fails) from
        // re-submitting this already-created profile and hitting a 409
        // that masks the real error.
        setWantsLoadManager(false);
      }

      if (wantsPilotCar) {
        const res = await fetch("/api/profiles/pilot-car", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: pcCompanyName,
            phone: pcPhone,
            homeBaseCity: pcCity,
            homeBaseState: pcState,
            alertRadiusMiles: pcRadius,
            escortPositions: pcPositions,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to create Pilot Car profile.");
          return;
        }
        setWantsPilotCar(false);
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {!hasLoadManagerProfile && (
          <label className="flex items-center gap-2 rounded border border-gray-300 p-3">
            <input
              type="checkbox"
              checked={wantsLoadManager}
              onChange={(e) => setWantsLoadManager(e.target.checked)}
            />
            <span>
              <strong>Post loads</strong> — free, no subscription required
            </span>
          </label>
        )}
        {!hasPilotCarProfile && (
          <label className="flex items-center gap-2 rounded border border-gray-300 p-3">
            <input
              type="checkbox"
              checked={wantsPilotCar}
              onChange={(e) => setWantsPilotCar(e.target.checked)}
            />
            <span>
              <strong>Find loads</strong> — starts a 30-day free trial
            </span>
          </label>
        )}
      </div>

      {wantsLoadManager && (
        <fieldset className="flex flex-col gap-3 rounded border border-gray-300 p-4">
          <legend className="px-1 text-sm font-semibold">Load Manager details</legend>
          <label className="flex flex-col gap-1 text-sm">
            Company name
            <input
              required
              value={lmCompanyName}
              onChange={(e) => setLmCompanyName(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <input
              required
              value={lmPhone}
              onChange={(e) => setLmPhone(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </fieldset>
      )}

      {wantsPilotCar && (
        <fieldset className="flex flex-col gap-3 rounded border border-gray-300 p-4">
          <legend className="px-1 text-sm font-semibold">Pilot Car details</legend>
          <label className="flex flex-col gap-1 text-sm">
            Company name
            <input
              required
              value={pcCompanyName}
              onChange={(e) => setPcCompanyName(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Phone
            <input
              required
              value={pcPhone}
              onChange={(e) => setPcPhone(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              Home base city
              <input
                required
                value={pcCity}
                onChange={(e) => setPcCity(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="flex w-24 flex-col gap-1 text-sm">
              State
              <select
                required
                value={pcState}
                onChange={(e) => setPcState(e.target.value)}
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
              value={pcRadius}
              onChange={(e) => setPcRadius(e.target.value)}
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
                    checked={pcPositions.includes(pos.value)}
                    onChange={() => togglePosition(pos.value)}
                  />
                  {pos.label}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || (!wantsLoadManager && !wantsPilotCar)}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}
