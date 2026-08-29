export type GeocodeResult = { lat: number; lng: number; city: string };

// Geocodes a US city/state to coordinates via Mapbox. Returns null if no
// match is found (caller should treat that as a validation error, not
// silently save a load with missing coordinates -- it would never surface
// in radius search).
//
// The returned `city` is Mapbox's canonical spelling/capitalization for the
// matched place (feature.text, e.g. "Austin"), not whatever the caller typed
// -- callers should store this instead of the raw input so "astin, mn" (or
// "AUSTIN, MN") ends up saved and displayed as "Austin, MN" rather than
// verbatim. Falls back to the raw input in the (never-observed-in-testing)
// case Mapbox returns a match with no `text` field, so a save never fails
// over this.
export async function geocodeCityState(
  city: string,
  state: string
): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MAPBOX_ACCESS_TOKEN is not set.");
  }

  const query = encodeURIComponent(`${city}, ${state}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=US&types=place&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox geocoding request failed: ${res.status}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  // Mapbox falls back to a low-confidence "best guess" instead of an empty
  // result for garbage or mismatched input (e.g. "Nonexistentcityxyz123, KS"
  // → Prince of Wales Island, AK at relevance 0.384) rather than erroring.
  // Every real city we tested -- including typos, abbreviations, and
  // "St"/"Ft" variants -- scored a clean 1; anything below that is Mapbox
  // guessing, not matching, so treat it as no result.
  if (feature.relevance < 0.99) return null;

  const [lng, lat] = feature.center as [number, number];
  return { lat, lng, city: typeof feature.text === "string" && feature.text ? feature.text : city };
}
