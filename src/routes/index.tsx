import { createFileRoute } from "@tanstack/react-router";
import { HomeDashboard } from "@/components/care/HomeDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { PetBoot } from "@/components/PersistGate";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PetBoot
      empty={
        <main className="relative z-10 mx-auto min-h-dvh w-full max-w-lg bg-bg text-fg">
          <SetupWizard />
        </main>
      }
    >
      <AppShell>
        <HomeDashboard />
      </AppShell>
    </PetBoot>
  );
}
