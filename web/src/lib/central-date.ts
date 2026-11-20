// Calendar-date helpers pinned to US Central time (the business's timezone,
// same basis as FREE_ACCESS_UNTIL). An admin picking "free until 2027-03-15"
// means access through the END of March 15 Central, i.e. until midnight
// starting March 16 Central -- correct across CST/CDT.

const TZ = "America/Chicago";

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// "YYYY-MM-DD" of an instant, as seen in Central time.
export function centralDateString(instant: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return instant.toLocaleDateString("en-CA", { timeZone: TZ });
}

// The instant of midnight Central that starts the day AFTER `date`.
export function endOfCentralDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  // Midnight Central is 05:00Z (CDT) or 06:00Z (CST). Try CST first and
  // step back an hour if that lands at 01:00 local (i.e. it's CDT).
  const guess = new Date(Date.UTC(y, m - 1, d + 1, 6));
  const localHour = Number(
    guess.toLocaleString("en-US", { timeZone: TZ, hour: "2-digit", hour12: false })
  );
  return localHour === 1 ? new Date(guess.getTime() - 60 * 60 * 1000) : guess;
}

// Inverse for display: the last Central calendar day a grant covers.
export function lastCoveredCentralDate(until: Date): string {
  return centralDateString(new Date(until.getTime() - 1));
}
