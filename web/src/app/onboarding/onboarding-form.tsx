"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadManagerProfileForm } from "@/components/load-manager-profile-form";
import { PilotCarProfileForm } from "@/components/pilot-car-profile-form";

export function OnboardingForm({
  hasLoadManagerProfile,
  hasPilotCarProfile,
  initialPhone,
}: {
  hasLoadManagerProfile: boolean;
  hasPilotCarProfile: boolean;
  initialPhone?: string;
}) {
  const router = useRouter();
  const [wantsLoadManager, setWantsLoadManager] = useState(false);
  const [wantsPilotCar, setWantsPilotCar] = useState(false);
  const [createdLoadManager, setCreatedLoadManager] = useState(false);
  const [createdPilotCar, setCreatedPilotCar] = useState(false);

  // Each form submits independently, so once everything the user selected
  // has been created, move on automatically instead of requiring a shared
  // "Continue" step.
  useEffect(() => {
    const loadManagerDone = !wantsLoadManager || createdLoadManager;
    const pilotCarDone = !wantsPilotCar || createdPilotCar;
    const selectedSomething = wantsLoadManager || wantsPilotCar;
    if (selectedSomething && loadManagerDone && pilotCarDone) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [wantsLoadManager, wantsPilotCar, createdLoadManager, createdPilotCar, router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {!hasLoadManagerProfile && (
          <label className="flex items-center gap-2 rounded border border-brand-border bg-brand-panel p-3 text-brand-text">
            <input
              type="checkbox"
              checked={wantsLoadManager}
              onChange={(e) => setWantsLoadManager(e.target.checked)}
            />
            <span>
              <strong>Post loads</strong> — free, no subscription required
            </span>
          </label>
        )}
        {!hasPilotCarProfile && (
          <label className="flex items-center gap-2 rounded border border-brand-border bg-brand-panel p-3 text-brand-text">
            <input
              type="checkbox"
              checked={wantsPilotCar}
              onChange={(e) => setWantsPilotCar(e.target.checked)}
            />
            <span>
              <strong>Find loads</strong> — starts a 30-day free trial
            </span>
          </label>
        )}
      </div>

      {wantsLoadManager && (
        <LoadManagerProfileForm onCreated={() => setCreatedLoadManager(true)} />
      )}

      {wantsPilotCar && (
        <PilotCarProfileForm
          onCreated={() => setCreatedPilotCar(true)}
          initialValues={initialPhone ? { companyName: "", phone: initialPhone } : undefined}
        />
      )}
    </div>
  );
}
