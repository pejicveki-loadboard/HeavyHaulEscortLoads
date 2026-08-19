import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">HeavyHaul Escort Loads</h1>
      <p className="max-w-md text-gray-600">
        Post an oversize load or find pilot car work — one login for both.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="rounded bg-black px-5 py-2.5 text-white">
          Sign up
        </Link>
        <Link
          href="/login"
          className="rounded border border-gray-300 px-5 py-2.5"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
