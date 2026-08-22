"use client";

import { useState } from "react";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { US_STATES } from "@/lib/us-states";
import type { EscortPosition } from "@/generated/prisma/enums";

type SavedLocation = {
  id: string;
  label: string | null;
  city: string;
  state: string;
  radiusMiles: number;
  escortPositions: EscortPosition[];
};

type BrowseResult = {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  date: string;
  escortPositions: EscortPosition[];
  weightLbs: number | null;
  rate: number | null;
  rateUnit: string | null;
  postedByCompanyName: string;
  distanceMiles: number;
};

function positionLabels(positions: EscortPosition[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

export function BrowseLoadsPanel({ savedLocations }: { savedLocations: SavedLocation[] }) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("150");
  const [positions, setPositions] = useState<EscortPosition[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<BrowseResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  function togglePosition(value: EscortPosition) {
    setPositions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  function applySavedLocation(locationId: string) {
    const loc = savedLocations.find((l) => l.id === locationId);
    if (!loc) return;
    setCity(loc.city);
    setState(loc.state);
    setRadiusMiles(String(loc.radiusMiles));
    setPositions(loc.escortPositions);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const params = new URLSearchParams({ city, state, radiusMiles });
      if (positions.length > 0) params.set("escortPositions", positions.join(","));
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/loads/browse?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        return;
      }
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  }

  async function revealContact(loadId: string) {
    setRevealingId(loadId);
    try {
      const res = await fetch(`/api/loads/${loadId}/contact`);
      const data = await res.json();
      if (res.ok) {
        setRevealed((prev) => ({ ...prev, [loadId]: data.phone }));
      }
    } finally {
      setRevealingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded border border-brand-border bg-brand-panel p-4">
        {savedLocations.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            Use a saved search location
            <select
              onChange={(e) => e.target.value && applySavedLocation(e.target.value)}
              defaultValue=""
              className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
            >
              <option value="">-- pick one to pre-fill, or search ad-hoc below --</option>
              {savedLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label || `${loc.city}, ${loc.state}`}
                </option>
              ))}
            </select>
          </label>
        )}

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
          <label className="flex w-32 flex-col gap-1 text-sm">
            Radius (mi)
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
        </div>

        <div className="flex flex-col gap-1 text-sm">
          Escort positions (optional — leave blank to see all)
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
            Date from (optional)
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Date to (optional)
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded bg-brand-accent px-4 py-2 text-sm text-brand-accent-text disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results && (
        <div className="flex flex-col gap-3">
          {results.length === 0 && (
            <p className="text-sm text-brand-muted">No open loads match that search.</p>
          )}
          {results.map((load) => (
            <div key={load.id} className="rounded border border-brand-border bg-brand-panel p-4">
              <p className="font-semibold text-brand-text">
                {load.originCity}, {load.originState} &rarr; {load.destinationCity},{" "}
                {load.destinationState}
                <span className="ml-2 text-sm font-normal text-brand-muted">
                  {load.distanceMiles} mi away
                </span>
              </p>
              <p className="text-sm text-brand-muted">
                {new Date(load.date).toLocaleDateString()} · {positionLabels(load.escortPositions)}
                {load.weightLbs ? ` · ${load.weightLbs.toLocaleString()} lbs` : ""}
                {load.rate
                  ? ` · $${load.rate.toLocaleString()}${
                      load.rateUnit === "per_mile" ? "/mi" : " flat"
                    }`
                  : ""}
                {` · posted by ${load.postedByCompanyName}`}
              </p>
              <div className="mt-2">
                {revealed[load.id] ? (
                  <span className="text-sm font-semibold text-brand-text">
                    Contact: {revealed[load.id]}
                  </span>
                ) : (
                  <button
                    onClick={() => revealContact(load.id)}
                    disabled={revealingId === load.id}
                    className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50"
                  >
                    {revealingId === load.id ? "Revealing..." : "Reveal contact"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
