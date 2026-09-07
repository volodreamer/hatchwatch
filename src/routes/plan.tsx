import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PetBoot } from "@/components/PersistGate";
import { GrowthPath } from "@/components/plan/GrowthPath";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { useI18n } from "@/hooks/use-i18n";
import { derive } from "@/lib/tama/simulate";
import { useClock } from "@/hooks/use-clock";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  const { t } = useI18n();
  const pet = usePetStore((s) => s.pet);
  const now = useClock(1000);

  return (
    <PetBoot
      empty={
        <main className="relative z-10 mx-auto min-h-dvh w-full max-w-lg bg-bg text-fg">
          <SetupWizard />
        </main>
      }
    >
      <AppShell>
        <div className="px-4 pb-6 pt-5">
          {pet ? <GrowthPath derived={derive(pet, now)} /> : null}
          <p className="mt-6 text-center text-sm text-muted">
            {t("plan.other")}{" "}
            <Link to="/" className="text-primary underline-offset-4 hover:underline">
              {t("plan.end")}
            </Link>
            {t("plan.fromHome")}
          </p>
        </div>
      </AppShell>
    </PetBoot>
  );
}
