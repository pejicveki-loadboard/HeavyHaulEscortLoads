"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InitialValues = {
  companyName: string;
  phone: string;
  dotNumber: string | null;
  mcNumber: string | null;
};

export function LoadManagerProfileForm({
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
  const [dotNumber, setDotNumber] = useState(initialValues?.dotNumber ?? "");
  const [mcNumber, setMcNumber] = useState(initialValues?.mcNumber ?? "");
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
      const res = await fetch("/api/profiles/load-manager", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, phone, dotNumber, mcNumber }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save Load Manager profile.");
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
      <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
        Load Manager profile created.
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
          DOT number (optional)
          <input
            value={dotNumber}
            onChange={(e) => setDotNumber(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          MC number (optional)
          <input
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create Load Manager profile"}
      </button>
    </form>
  );
}
