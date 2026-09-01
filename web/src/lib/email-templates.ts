import { ESCORT_POSITIONS } from "@/lib/escort-positions";
import { formatPhoneDisplay } from "@/lib/phone";
import type { EscortPosition } from "@/generated/prisma/enums";

function positionLabels(positions: EscortPosition[]) {
  return positions
    .map((p) => ESCORT_POSITIONS.find((pos) => pos.value === p)?.label ?? p)
    .join(", ");
}

// Contact-form submissions are free text from an unauthenticated visitor, so
// unlike the other templates here (which only interpolate system-controlled
// values), this one needs real HTML escaping before it goes into an email
// body.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactFormEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  // Subject is a header, not HTML -- strip newlines instead of HTML-escaping
  // to prevent header injection.
  const subjectName = name.replace(/[\r\n]/g, " ").trim();
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  return {
    subject: `Contact form: ${subjectName}`,
    html: `
      <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
  };
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
  locationLabel,
  loadUrl,
  posterPhone,
}: {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
  distanceMiles: number;
  locationLabel: string;
  loadUrl: string;
  posterPhone: string;
}) {
  const positions = positionLabels(escortPositions);
  const subject = `New load: ${positions}, ${originCity} ${originState} → ${destinationCity} ${destinationState}, ${Math.round(distanceMiles)}mi`;
  return {
    subject,
    html: `
      <p>A new load matching your search just posted:</p>
      <p>
        <strong>${originCity}, ${originState} &rarr; ${destinationCity}, ${destinationState}</strong><br>
        ${Math.round(distanceMiles)} miles from ${locationLabel} · ${positions}
      </p>
      <p><a href="tel:${posterPhone}">Call ${formatPhoneDisplay(posterPhone)}</a></p>
      <p><a href="${loadUrl}">View &amp; reveal contact</a></p>
    `,
  };
}

export function paymentFailedEmail({ graceDays, billingUrl }: { graceDays: number; billingUrl: string }) {
  return {
    subject: "Action needed — your payment failed",
    html: `
      <p>We couldn't charge your card for your Pilot Car subscription.</p>
      <p>
        You'll keep full access to the load board for <strong>${graceDays} days</strong> while
        you update your payment method. After that, access is paused until the payment goes
        through.
      </p>
      <p><a href="${billingUrl}">Update your payment method</a></p>
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
  locationLabel,
  loadUrl,
  posterPhone,
}: {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  escortPositions: EscortPosition[];
  distanceMiles: number;
  locationLabel: string;
  loadUrl: string;
  posterPhone: string;
}) {
  const positions = positionLabels(escortPositions);
  // "HeavyHaul Escort Loads: " prefix is a workaround, not cosmetic -- US/CA
  // carriers don't support alphanumeric sender ID, so the sender otherwise
  // shows as a bare phone number with no indication of who it's from.
  return `HeavyHaul Escort Loads: New load: ${positions} escort, ${originCity} ${originState} -> ${destinationCity} ${destinationState}, ${Math.round(distanceMiles)}mi from ${locationLabel}. Call ${posterPhone}. View & reveal contact at ${loadUrl} Reply STOP to opt out.`;
}
