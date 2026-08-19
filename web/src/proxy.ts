import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the "middleware" file convention to "proxy" — same
// functionality, see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
// NextAuth's `auth` wrapper must be re-exported as a real named function
// declaration — Next's build-time check doesn't recognize a destructured
// const as a valid "proxy" export.
const { auth } = NextAuth(authConfig);

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args);
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*"],
};
