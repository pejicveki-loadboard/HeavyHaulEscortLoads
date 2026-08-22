import { redirect } from "next/navigation";
import { forbidden } from "next/navigation";
import Image from "next/image";
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
      <header className="mb-6 flex items-center justify-between border-b border-brand-border pb-4">
        <div className="flex items-center gap-4">
          <Image src="/icon-32.png" alt="" width={24} height={24} className="rounded" />
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-brand-accent underline">
              Summary
            </Link>
            <Link href="/admin/users" className="text-brand-accent underline">
              Users
            </Link>
            <Link href="/admin/loads" className="text-brand-accent underline">
              Loads
            </Link>
          </nav>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-accent underline">
          &larr; Back to dashboard
        </Link>
      </header>
      {children}
    </main>
  );
}
