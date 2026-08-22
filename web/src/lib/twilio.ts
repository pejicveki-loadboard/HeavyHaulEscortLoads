import Twilio from "twilio";

// Twilio's Compliance Profile (A2P 10DLC) is still pending review, so real
// SMS sends stay off by default. TWILIO_SMS_LIVE must be explicitly "true"
// to use the live account credentials -- everything else (including this
// var simply being unset) uses the Test Account SID/Token, which never
// sends a real message or incurs cost regardless of registration status.
// This is a deliberate second safety layer on top of "which credentials
// are configured" -- flip it only once the Compliance Profile clears.
function isLiveModeEnabled(): boolean {
  return process.env.TWILIO_SMS_LIVE === "true";
}

function getClient(): Twilio.Twilio {
  const live = isLiveModeEnabled();
  const accountSid = live
    ? process.env.TWILIO_LIVE_ACCOUNT_SID
    : process.env.TWILIO_TEST_ACCOUNT_SID;
  const authToken = live
    ? process.env.TWILIO_LIVE_AUTH_TOKEN
    : process.env.TWILIO_TEST_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      `Twilio ${live ? "live" : "test"} credentials are not configured.`
    );
  }
  return Twilio(accountSid, authToken);
}

export async function sendSms({ to, body }: { to: string; body: string }) {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("TWILIO_FROM_NUMBER is not set.");

  const client = getClient();
  return client.messages.create({ to, from, body });
}
