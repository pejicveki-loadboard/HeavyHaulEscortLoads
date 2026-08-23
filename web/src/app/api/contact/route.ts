import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { contactFormEmail } from "@/lib/email-templates";

const CONTACT_INBOX = "info@heavyhaulescortloads.com";
const MESSAGE_MAX_LENGTH = 2000;

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(MESSAGE_MAX_LENGTH, `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`),
  // Honeypot: real visitors never see or fill this field (hidden via CSS,
  // not type="hidden" or display:none, so bots that skip obviously-hidden
  // fields still fall for it). Any non-empty value here means a bot filled
  // out the form.
  website: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 400 }
    );
  }
  const { name, email, message, website } = parsed.data;

  // Silently succeed without sending anything -- responding identically to
  // a real submission means a bot never learns this field gives it away.
  if (website && website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  try {
    const { subject, html } = contactFormEmail({ name, email, message });
    await sendEmail({ to: CONTACT_INBOX, subject, html, replyTo: email });
  } catch (error) {
    console.error("Failed to send contact form email:", error);
    return NextResponse.json(
      { error: "Couldn't send your message right now. Please try again or email us directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
