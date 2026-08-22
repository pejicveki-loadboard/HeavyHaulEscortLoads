// Best-effort US phone normalization to E.164 for Twilio. Signup only
// requires a non-empty string (see profile forms), so numbers may be
// formatted any which way -- this assumes a 10-digit US number when no
// country code is present, matching the app's US-only scope.
export function normalizePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}
