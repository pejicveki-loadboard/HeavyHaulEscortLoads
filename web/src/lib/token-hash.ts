import crypto from "crypto";

// Shared by forgot-password (writes the hash) and reset-password (looks it
// up) so the two routes can't drift on the hashing scheme.
export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
