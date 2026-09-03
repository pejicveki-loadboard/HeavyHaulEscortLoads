import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== "string" || typeof password !== "string") {
          return null;
        }
        // Signup stores emails trimmed + lowercased; match that here so
        // login isn't case/whitespace-sensitive.
        const email = rawEmail.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        return { id: user.id, email: user.email, isAdmin: user.isAdmin, tokenVersion: user.tokenVersion };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;
        token.isAdmin = Boolean((user as { isAdmin?: boolean }).isAdmin);
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
      }
      return token;
    },
    // Runs on every auth()/session read (unlike jwt(), which only runs at
    // sign-in or an explicit update()), so this is the one place that can
    // catch a JWT minted before a password reset. A mismatch means the
    // token predates a reset -- drop session.user rather than the session
    // itself, since every call site in this app already treats a missing
    // session.user as logged out (see dashboard/layout.tsx, api/loads, etc.).
    // src/proxy.ts's edge-only authConfig.authorized callback can't run this
    // check (no Prisma at the edge) and lets a stale-token request through
    // to the page, but every page/route then calls this auth() instance and
    // catches it here -- no data-exposure gap, just one layer later.
    async session({ session, token }) {
      // token.tokenVersion is absent on any JWT minted before this field
      // existed (there's no migration path for already-issued cookies), so
      // treat a missing claim as version 0 -- same as a fresh user's DB
      // default -- rather than failing every existing session on deploy.
      const claimedVersion = (token.tokenVersion as number | undefined) ?? 0;
      let versionIsCurrent = true;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { tokenVersion: true },
        });
        versionIsCurrent = dbUser !== null && dbUser.tokenVersion === claimedVersion;
      } catch (error) {
        // Fail open on a DB hiccup rather than turning a transient outage
        // into a site-wide forced logout -- this check is a hardening layer
        // on top of the JWT, not the sole authentication mechanism.
        console.error("session(): tokenVersion check failed, allowing session through", error);
      }

      if (!versionIsCurrent) {
        return { ...session, user: undefined as unknown as typeof session.user };
      }
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
