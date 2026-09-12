import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PushNotificationsToggle } from "@/components/push-notifications-toggle";

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Push alerts only ever fire for Pilot Car profiles (see
  // sendPushAlertsForMatches) -- same scoping as SearchLocation -- so there's
  // nothing to toggle without one.
  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-text">Account Settings</h1>
      {profile ? (
        <PushNotificationsToggle />
      ) : (
        <p className="text-sm text-brand-muted">
          Push notifications are available once you have Pilot Car access.
        </p>
      )}
    </div>
  );
}
