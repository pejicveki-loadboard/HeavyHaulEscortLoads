import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    // Optional, not required: auth.ts's session() callback drops this on a
    // tokenVersion mismatch (a JWT that predates a password reset), so
    // every reader has to guard for its absence -- which every current call
    // site already does via `if (!session?.user)`.
    user?: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin?: boolean;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isAdmin?: boolean;
    tokenVersion?: number;
  }
}
