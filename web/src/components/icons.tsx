// Small inline icon set for stat cards, matching the approved "Night Freight"
// design canvas (see claude/design-handoff-notes.md). Kept as plain inline SVG
// (no icon package) since it's a handful of simple glyphs reused in a few
// places -- Load Manager dashboard stats, Admin summary stats, and (once
// built) the Pilot Car dashboard.

type IconProps = { className?: string };

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4l3 3v2h-7z" />
      <circle cx="7" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M4 12.5l4.5 4.5L20 5.5" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M6 9a6 6 0 0 1 12 0v5l1.5 2.5h-15L6 14z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="5" y="3" width="14" height="18" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M4 15l1.5-5.5A2 2 0 0 1 7.4 8h9.2a2 2 0 0 1 1.9 1.5L20 15" />
      <rect x="3" y="15" width="18" height="4" rx="1" />
      <circle cx="7.5" cy="19.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="19.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
