"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InitialValues = {
  companyName: string;
  phone: string;
};

export function PilotCarProfileForm({
  mode = "create",
  initialValues,
  onCreated,
  redirectTo,
}: {
  mode?: "create" | "edit";
  initialValues?: InitialValues;
  onCreated?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/profiles/pilot-car", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save Pilot Car profile.");
        return;
      }

      if (mode === "edit") {
        setSaved(true);
      } else {
        setCreated(true);
        onCreated?.();
      }

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
      <p className="rounded border border-green-800 bg-green-950 p-3 text-sm text-green-400">
        Pilot Car profile created — your 30-day trial has started.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-brand-border bg-brand-panel p-4">
      <label className="flex flex-col gap-1 text-sm">
        Company name
        <input
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Phone
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Saved.</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50 transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep disabled:hover:bg-brand-accent disabled:active:scale-100"
      >
        {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create Pilot Car profile"}
      </button>
    </form>
  );
}
