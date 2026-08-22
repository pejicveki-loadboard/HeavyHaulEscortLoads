import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import type { EscortPosition } from "@/generated/prisma/enums";

function positionLabels(positions: EscortPosition[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

export function verificationEmail(verifyUrl: string) {
  return {
    subject: "Verify your email — HeavyHaul Escort Loads",
    html: `
      <p>Welcome to HeavyHaul Escort Loads.</p>
      <p><a href="${verifyUrl}">Click here to verify your email address</a>. This link expires in 24 hours.</p>
      <p>If you didn't create this account, you can ignore this email.</p>
    `,
  };
}

export function loadMatchEmail({
  originCity,
  originState,
  destinationCity,
  destinationState,
  escortPositions,
  distanceMiles,
  loadUrl,
}: {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
  distanceMiles: number;
  loadUrl: string;
}) {
  const positions = positionLabels(escortPositions);
  const subject = `New load: ${positions}, ${originCity} ${originState} → ${destinationCity} ${destinationState}, ${Math.round(distanceMiles)}mi`;
  return {
    subject,
    html: `
      <p>A new load matching your search just posted:</p>
      <p>
        <strong>${originCity}, ${originState} &rarr; ${destinationCity}, ${destinationState}</strong><br>
        ${Math.round(distanceMiles)} miles from your search location · ${positions}
      </p>
      <p><a href="${loadUrl}">View &amp; reveal contact</a></p>
    `,
  };
}

export function loadMatchSmsBody({
  originCity,
  originState,
  destinationCity,
  destinationState,
  escortPositions,
  distanceMiles,
}: {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
  distanceMiles: number;
}) {
  const positions = positionLabels(escortPositions);
  return `New load: ${positions} escort, ${originCity} ${originState} -> ${destinationCity} ${destinationState}, ${Math.round(distanceMiles)}mi -- view & reveal contact at ${process.env.APP_BASE_URL}/dashboard/pilot-car`;
}
