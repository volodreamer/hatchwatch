import { createFileRoute } from "@tanstack/react-router";
import { HomeDashboard } from "@/components/care/HomeDashboard";
import { AppShell } from "@/components/layout/AppShell";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const pet = usePetStore((s) => s.pet);

  if (!pet) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-lg bg-bg text-fg">
        <SetupWizard />
      </main>
    );
  }

  return (
    <AppShell>
      <HomeDashboard />
    </AppShell>
  );
}
