import Link from "next/link";

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const message =
    status === "success"
      ? "Your email is verified."
      : status === "missing"
        ? "That verification link is missing a token."
        : "That verification link is invalid or has expired. Request a new one from your dashboard.";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{message}</h1>
      <Link href="/dashboard" className="underline">
        Go to dashboard
      </Link>
    </main>
  );
}
