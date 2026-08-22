import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-brand-text">403 — Forbidden</h1>
      <p className="text-brand-muted">You don&apos;t have access to this page.</p>
      <Link href="/dashboard" className="text-brand-accent underline">
        Go to dashboard
      </Link>
    </main>
  );
}
