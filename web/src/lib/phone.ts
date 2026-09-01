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

// Validates a plausible 10-digit US number (optionally with a leading 1),
// matching the same assumption normalizePhoneToE164 already makes for this
// app's US-only scope. Not full E.164/international validation -- just
// enough to reject obviously-wrong input like "5555555" before it's saved
// or handed to Twilio.
export function isValidUsPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return false;
}

// Pretty-prints an E.164 US number for display, e.g. "+15077880949" ->
// "+1 (507) 788-0949". Falls back to the raw value for anything that isn't
// an 11-digit +1 number, matching the app's US-only scope.
export function formatPhoneDisplay(e164: string): string {
  const match = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!match) return e164;
  const [, area, prefix, line] = match;
  return `+1 (${area}) ${prefix}-${line}`;
}
