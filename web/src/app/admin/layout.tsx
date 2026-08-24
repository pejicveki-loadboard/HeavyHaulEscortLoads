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
      <header className="mb-6 flex flex-col items-start gap-4 border-b border-brand-border pb-4">
        <Link href="/admin" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={232}
            height={80}
            className="h-20 w-auto"
            priority
          />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/admin" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Summary
          </Link>
          <Link href="/admin/users" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Users
          </Link>
          <Link href="/admin/loads" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            Loads
          </Link>
          <Link href="/dashboard" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
            &larr; Back to dashboard
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
