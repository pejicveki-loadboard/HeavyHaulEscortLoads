"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center gap-6 p-6 md:w-1/2">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={139}
            height={48}
            className="h-12 w-auto self-start"
            priority
          />
          <h1 className="text-2xl font-semibold text-brand-text">Log in</h1>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-brand-border bg-brand-panel px-3 py-2 text-brand-text"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-brand-accent px-4 py-2 text-brand-accent-text disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="text-sm text-brand-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-accent underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden md:block md:w-1/2">
        <Image src="/login-hero.jpg" alt="" fill priority className="object-cover" />
      </div>
    </main>
  );
}
