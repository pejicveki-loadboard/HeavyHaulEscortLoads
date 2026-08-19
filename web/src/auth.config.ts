import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt here) — shared by middleware and the
// full auth.ts. Providers are added in auth.ts, where the DB-backed
// authorize() callback lives.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = ["/dashboard", "/onboarding", "/admin"];
      const isProtected = protectedPrefixes.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix)
      );
      return isProtected ? isLoggedIn : true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
