"use client";

import { useState } from "react";

const MESSAGE_MAX_LENGTH = 2000;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot -- hidden from real users
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded border border-green-800 bg-green-950 p-4 text-sm text-green-400">
        Thanks — your message is on its way. We&apos;ll reply to the email address you gave us.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          required
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
        />
        <span className="self-end text-xs text-brand-muted">
          {message.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </label>

      {/* Honeypot -- visually hidden from sighted users and off the tab
          order, but present in the DOM (not type="hidden") so bots that
          skip obviously-hidden fields still fill it in. */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="self-start rounded bg-brand-accent px-4 py-2 font-semibold text-brand-accent-text disabled:opacity-50 transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep disabled:hover:bg-brand-accent disabled:active:scale-100"
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
