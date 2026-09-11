import webpush from "web-push";

// Separate credential set from Twilio/Resend -- push has its own transport
// (VAPID-signed HTTP requests to each browser's push service) and its own
// failure mode (a 404/410 response means the subscription is gone for good,
// not a transient send failure), so it doesn't share a client factory with
// sendSms/sendEmail. Generate a keypair with `npx web-push generate-vapid-keys`.
let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must be set.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Thrown by callers' cleanup logic to distinguish "the push service says
// this registration is dead, delete it" from any other send failure.
export class PushSubscriptionGoneError extends Error {}

export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      throw new PushSubscriptionGoneError("Push subscription is no longer valid.");
    }
    throw error;
  }
}
