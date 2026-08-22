import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables forbidden()/unauthorized() -- used to return a real 403 for
  // non-admin accounts hitting /admin/* (Week 3 Day 1-2).
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
