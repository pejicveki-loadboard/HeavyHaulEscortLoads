"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

function NavTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded px-3 py-1.5 text-sm ${
        active ? "bg-black text-white" : "border border-gray-300 text-gray-700"
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
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        {hasLoadManagerProfile ? (
          <NavTab href="/dashboard/load-manager" active={pathname.startsWith("/dashboard/load-manager")}>
            Post Loads
          </NavTab>
        ) : (
          <Link href="/dashboard/add-load-manager" className="text-sm underline">
            + Add Load Manager access
          </Link>
        )}
        {hasPilotCarProfile ? (
          <NavTab href="/dashboard/pilot-car" active={pathname.startsWith("/dashboard/pilot-car")}>
            Browse Loads
          </NavTab>
        ) : (
          <Link href="/dashboard/add-pilot-car" className="text-sm underline">
            + Add Pilot Car access
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
