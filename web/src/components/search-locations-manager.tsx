"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchLocationForm, type SearchLocationValues } from "@/components/search-location-form";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import type { EscortPosition } from "@/generated/prisma/enums";

type SearchLocationRow = SearchLocationValues & { id: string };

function positionLabels(positions: EscortPosition[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

const CHANNEL_LABELS: Record<SearchLocationRow["alertChannel"], string> = {
  both: "Email + SMS",
  email: "Email only",
  sms: "SMS only",
};

export function SearchLocationsManager({ locations }: { locations: SearchLocationRow[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function togglePause(location: SearchLocationRow) {
    setBusyId(location.id);
    try {
      await fetch(`/api/search-locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...location, active: !location.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this search location? This can't be undone.")) return;
    setBusyId(id);
    try {
      await fetch(`/api/search-locations/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {locations.length === 0 && (
        <p className="text-sm text-brand-muted">
          No search locations yet. Add one to start receiving load alerts.
        </p>
      )}

      {locations.map((location) =>
        editingId === location.id ? (
          <SearchLocationForm
            key={location.id}
            mode="edit"
            locationId={location.id}
            initialValues={location}
            onSaved={() => {
              setEditingId(null);
              router.refresh();
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={location.id} className="rounded border border-brand-border bg-brand-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-text">
                  {location.label || `${location.city}, ${location.state}`}
                  {!location.active && (
                    <span className="ml-2 rounded bg-brand-border px-2 py-0.5 text-xs text-brand-muted">
                      Paused
                    </span>
                  )}
                </p>
                <p className="text-sm text-brand-muted">
                  {location.city}, {location.state} · {location.radiusMiles} mi ·{" "}
                  {positionLabels(location.escortPositions) || "no positions selected"} ·{" "}
                  {CHANNEL_LABELS[location.alertChannel]}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(location.id)}
                  className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text"
                >
                  Edit
                </button>
                <button
                  onClick={() => togglePause(location)}
                  disabled={busyId === location.id}
                  className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text disabled:opacity-50"
                >
                  {location.active ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  disabled={busyId === location.id}
                  className="rounded border border-red-800 px-3 py-1.5 text-sm text-red-400 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {showAddForm ? (
        <SearchLocationForm
          mode="create"
          onSaved={() => {
            setShowAddForm(false);
            router.refresh();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="self-start rounded border border-brand-border px-4 py-2 text-sm text-brand-text"
        >
          + Add search location
        </button>
      )}
    </div>
  );
}
