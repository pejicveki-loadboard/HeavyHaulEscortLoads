"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-brand-text">That reset link is missing a token.</h1>
        <p className="text-sm text-brand-muted">
          <Link href="/forgot-password" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Request a new reset link
          </Link>
        </p>
      </>
    );
  }

  if (success) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-brand-text">Your password has been reset.</h1>
        <p className="text-sm text-brand-muted">
          <Link href="/login" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-brand-text">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          New password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Confirm new password
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>
        {error && (
          <p className="text-sm text-red-400">
            {error}{" "}
            <Link href="/forgot-password" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
              Request a new one
            </Link>
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50 transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep disabled:hover:bg-brand-accent disabled:active:scale-100"
        >
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Image
        src="/logo-horizontal.png"
        alt="HeavyHaul Escort Loads"
        width={168}
        height={64}
        className="h-16 w-auto self-start"
        priority
      />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
