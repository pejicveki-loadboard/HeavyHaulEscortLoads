import { redirect } from "next/navigation";
import { forbidden } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.isAdmin) forbidden();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="underline">
            Summary
          </Link>
          <Link href="/admin/users" className="underline">
            Users
          </Link>
          <Link href="/admin/loads" className="underline">
            Loads
          </Link>
        </nav>
        <Link href="/dashboard" className="text-sm underline">
          &larr; Back to dashboard
        </Link>
      </header>
      {children}
    </main>
  );
}
