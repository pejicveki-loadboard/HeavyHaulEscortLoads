"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

function NavTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1.5 text-sm ${
        active
          ? "bg-brand-accent text-brand-accent-text"
          : "border border-brand-border text-brand-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export function DashboardNav({
  email,
  hasLoadManagerProfile,
  hasPilotCarProfile,
}: {
  email: string;
  hasLoadManagerProfile: boolean;
  hasPilotCarProfile: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {hasLoadManagerProfile ? (
            <NavTab href="/dashboard/load-manager" active={pathname.startsWith("/dashboard/load-manager")}>
              Post Loads
            </NavTab>
          ) : (
            <Link href="/dashboard/add-load-manager" className="text-sm text-brand-accent underline">
              + Add Load Manager access
            </Link>
          )}
          {hasPilotCarProfile ? (
            <NavTab href="/dashboard/pilot-car" active={pathname.startsWith("/dashboard/pilot-car")}>
              Browse Loads
            </NavTab>
          ) : (
            <Link href="/dashboard/add-pilot-car" className="text-sm text-brand-accent underline">
              + Add Pilot Car access
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-muted">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
