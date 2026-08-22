import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <Image
        src="/logo-horizontal.png"
        alt="HeavyHaul Escort Loads"
        width={320}
        height={80}
        className="h-16 w-auto"
        priority
      />
      <p className="max-w-md text-brand-muted">
        Post an oversize load or find pilot car work — one login for both.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="rounded bg-brand-accent px-5 py-2.5 text-brand-accent-text">
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded border border-brand-border px-5 py-2.5 text-brand-text"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
