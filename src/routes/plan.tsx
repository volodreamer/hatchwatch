import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GrowthPath } from "@/components/plan/GrowthPath";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { derive } from "@/lib/tama/simulate";
import { useClock } from "@/hooks/use-clock";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  const pet = usePetStore((s) => s.pet);
  const now = useClock(1000);

  if (!pet) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-lg bg-bg text-fg">
        <SetupWizard />
      </main>
    );
  }

  const derived = derive(pet, now);
  return (
    <AppShell>
      <div className="px-4 pb-6 pt-5">
        <GrowthPath derived={derived} />
        <p className="mt-6 text-center text-sm text-muted">
          Need a different adult?{" "}
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            End the run
          </Link>{" "}
          from Home and start again.
        </p>
      </div>
    </AppShell>
  );
}
