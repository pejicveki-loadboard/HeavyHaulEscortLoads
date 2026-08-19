import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoadForm } from "@/components/load-form";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditLoadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const load = await prisma.load.findFirst({
    where: { id, postedBy: { userId: session.user.id } },
  });
  if (!load) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/dashboard/load-manager" className="text-sm underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit load</h1>
      </div>
      <LoadForm
        mode="edit"
        loadId={load.id}
        redirectTo="/dashboard/load-manager"
        initialValues={{
          originCity: load.originCity,
          originState: load.originState,
          destinationCity: load.destinationCity,
          destinationState: load.destinationState,
          date: toDateInputValue(load.date),
          escortPositions: load.escortPositions,
          dimensionWidthFt: load.dimensionWidthFt,
          dimensionHeightFt: load.dimensionHeightFt,
          dimensionLengthFt: load.dimensionLengthFt,
          weightLbs: load.weightLbs,
          rate: load.rate ? load.rate.toNumber() : null,
          rateUnit: load.rateUnit,
        }}
      />
    </div>
  );
}
