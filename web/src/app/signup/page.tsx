"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          phone: phone || undefined,
          smsConsent,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created, but sign-in failed. Try logging in.");
        router.push("/login");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

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
      <h1 className="text-2xl font-semibold text-brand-text">Create your account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          Password
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
          Confirm password
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
          />
        </label>

        <div className="flex flex-col gap-2 rounded border border-brand-border bg-brand-panel p-3">
          <label className="flex flex-col gap-1 text-sm">
            Phone number <span className="text-brand-muted">(optional, Pilot Car Companies only)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Yes, I&apos;d like to receive automated text messages from HeavyHaul Escort
              Loads about load matches (HeavyHaul Escort Loads Load-Match SMS Alerts). Message
              frequency varies based on how many loads match. Msg &amp; data rates may apply.
              <br />
              <span className="text-brand-muted">
                Reply HELP for help, STOP to cancel anytime. See our{" "}
                <Link href="/terms" target="_blank" className="text-brand-accent underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-brand-accent underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50 transition-all duration-150 hover:bg-brand-accent-light active:scale-[0.97] active:bg-brand-accent-deep disabled:hover:bg-brand-accent disabled:active:scale-100"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-brand-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
          Log in
        </Link>
      </p>
    </main>
  );
}
