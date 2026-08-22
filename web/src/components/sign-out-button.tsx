"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded border border-brand-border px-3 py-1.5 text-sm text-brand-text"
    >
      Sign out
    </button>
  );
}
