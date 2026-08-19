import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SearchLocationsManager } from "@/components/search-locations-manager";

export default async function SearchLocationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.pilotCarProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard/add-pilot-car");

  const locations = await prisma.searchLocation.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/pilot-car" className="text-sm underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Manage search locations</h1>
        <p className="text-gray-600">
          Each location is matched and alerted independently — add one per truck or region.
        </p>
      </div>
      <SearchLocationsManager locations={locations} />
    </div>
  );
}
