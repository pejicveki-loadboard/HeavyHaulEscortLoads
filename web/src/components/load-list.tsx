"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import type { EscortPosition, LoadStatus } from "@/generated/prisma/enums";

export type LoadRow = {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  date: string; // ISO
  escortPositions: EscortPosition[];
  weightLbs: number | null;
  rate: number | null;
  rateUnit: string | null;
  status: LoadStatus;
};

function positionLabels(positions: EscortPosition[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

export function LoadList({ loads }: { loads: LoadRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleCovered(load: LoadRow) {
    setBusyId(load.id);
    try {
      await fetch(`/api/loads/${load.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: load.status === "open" ? "covered" : "open" }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this load? This can't be undone.")) return;
    setBusyId(id);
    try {
      await fetch(`/api/loads/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (loads.length === 0) {
    return (
      <p className="text-sm text-brand-muted">
        You haven&apos;t posted any loads yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {loads.map((load) => (
        <li key={load.id} className="rounded border border-brand-border bg-brand-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-brand-text">
                {load.originCity}, {load.originState} &rarr; {load.destinationCity},{" "}
                {load.destinationState}
                {load.status === "open" && (
                  <span className="ml-2 rounded bg-brand-accent/15 px-2 py-0.5 text-xs text-brand-accent">
                    Open
                  </span>
                )}
                {load.status === "covered" && (
                  <span className="ml-2 rounded bg-green-900 px-2 py-0.5 text-xs text-green-300">
                    Covered
                  </span>
                )}
                {load.status === "expired" && (
                  <span className="ml-2 rounded bg-brand-border px-2 py-0.5 text-xs text-brand-muted">
                    Expired
                  </span>
                )}
              </p>
              <p className="text-sm text-brand-muted">
                {new Date(load.date).toLocaleDateString()} · {positionLabels(load.escortPositions)}
                {load.weightLbs ? ` · ${load.weightLbs.toLocaleString()} lbs` : ""}
                {load.rate
                  ? ` · $${load.rate.toLocaleString()}${
                      load.rateUnit === "per_mile" ? "/mi" : " flat"
                    }`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/dashboard/load-manager/loads/${load.id}/edit`}
                className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text transition-all duration-150 hover:border-brand-accent hover:bg-brand-accent/12 hover:text-brand-accent active:scale-[0.94] active:bg-brand-accent/22"
              >
                Edit
              </Link>
              <button
                onClick={() => toggleCovered(load)}
                disabled={busyId === load.id}
                className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text transition-all duration-150 hover:border-brand-accent hover:bg-brand-accent/12 hover:text-brand-accent active:scale-[0.94] active:bg-brand-accent/22 disabled:opacity-50 disabled:hover:bg-transparent disabled:active:scale-100"
              >
                {load.status === "open" ? "Mark covered" : "Reopen"}
              </button>
              <button
                onClick={() => handleDelete(load.id)}
                disabled={busyId === load.id}
                className="rounded border border-red-800 px-3 py-1.5 text-sm text-red-400 transition-all duration-150 hover:border-[#e04b4b] hover:bg-[#e04b4b]/14 hover:text-[#ff9d9d] active:bg-[#e04b4b]/26 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
