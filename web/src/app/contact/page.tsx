import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us — HeavyHaul Escort Loads",
  description: "Get in touch with HeavyHaul Escort Loads.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <div className="flex flex-col items-start gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-horizontal.png"
            alt="HeavyHaul Escort Loads"
            width={168}
            height={64}
            className="h-16 w-auto"
            priority
          />
        </Link>
        <h1 className="text-3xl font-semibold text-brand-text">Contact us</h1>
        <p className="text-brand-muted">
          Questions, feedback, or something not working right? Send us a message and we&apos;ll
          get back to you.
        </p>
      </div>

      <div className="rounded-lg border border-brand-border bg-brand-panel p-6">
        <ContactForm />
      </div>

      <p className="text-sm text-brand-muted">
        Prefer email? Reach us directly at{" "}
        <a href="mailto:info@heavyhaulescortloads.com" className="text-brand-accent underline transition-colors duration-150 hover:text-brand-accent-light active:text-brand-accent-deep">
          info@heavyhaulescortloads.com
        </a>
        .
      </p>
    </main>
  );
}
