"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

function NavTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1.5 text-sm transition-all duration-150 active:scale-[0.97] ${
        active
          ? "bg-brand-accent text-brand-accent-text hover:bg-brand-accent-light active:bg-brand-accent-deep"
          : "border border-brand-border text-brand-muted hover:border-brand-accent hover:bg-brand-accent/8 hover:text-brand-text active:bg-brand-accent/16"
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
    <header className="mb-6 flex flex-col items-start gap-4 border-b border-brand-border pb-4">
      <Link href="/dashboard" className="shrink-0">
        <Image
          src="/logo-horizontal.png"
          alt="HeavyHaul Escort Loads"
          width={232}
          height={80}
          className="h-[72px] w-auto"
          priority
        />
      </Link>
      <div className="flex flex-wrap items-center gap-3">
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
        <span className="text-sm text-brand-muted">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
