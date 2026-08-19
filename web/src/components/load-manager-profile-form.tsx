"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoadManagerProfileForm({
  onCreated,
  redirectTo,
}: {
  onCreated?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/profiles/load-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, phone }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create Load Manager profile.");
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Create Load Manager profile"}
      </button>
    </form>
  );
}
