import { createFileRoute } from "@tanstack/react-router";
import { CharacterGuide } from "@/components/guide/CharacterGuide";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/guide")({ component: GuidePage });

function GuidePage() {
  return (
    <AppShell>
      <div className="px-4 pb-6 pt-5">
        <CharacterGuide />
      </div>
    </AppShell>
  );
}
