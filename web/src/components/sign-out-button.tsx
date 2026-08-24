"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text transition-all duration-150 hover:border-brand-accent hover:bg-brand-accent/12 hover:text-brand-accent active:scale-[0.94] active:bg-brand-accent/22"
    >
      Sign out
    </button>
  );
}
