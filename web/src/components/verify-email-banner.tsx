"use client";

import { useState } from "react";

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded border border-brand-accent bg-brand-accent/10 p-3 text-sm">
      <span className="text-brand-accent">
        {status === "sent"
          ? "Verification email sent — check your inbox."
          : "Please verify your email address."}
      </span>
      {status !== "sent" && (
        <button
          onClick={resend}
          disabled={status === "sending"}
          className="shrink-0 rounded border border-brand-accent px-3 py-1 text-brand-accent disabled:opacity-50 transition-all duration-150 hover:border-brand-accent-light hover:bg-brand-accent/14 hover:text-brand-accent-light active:scale-[0.94] active:border-brand-accent-deep active:bg-brand-accent/24 active:text-brand-accent-deep disabled:hover:bg-transparent disabled:hover:border-brand-accent disabled:hover:text-brand-accent disabled:active:scale-100"
        >
          {status === "sending" ? "Sending..." : status === "error" ? "Try again" : "Resend email"}
        </button>
      )}
    </div>
  );
}
