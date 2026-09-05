import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { formatClock, formatDateTime } from "@/lib/utils";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/log")({ component: LogPage });

const LABELS: Record<string, string> = {
  meal: "Meal",
  snack: "Snack",
  game: "Game",
  clean: "Clean",
  scold: "Scold",
  medicine: "Medicine",
  "lights-off": "Lights off",
  "miss-care": "Care mistake",
  "miss-disc": "Discipline mistake",
  sick: "Sick",
  heal: "Healed",
  evolve: "Evolution",
  poop: "Poop",
  sleep: "Sleep",
  wake: "Wake",
  hatch: "Hatch",
  sync: "Synced",
  nap: "Nap",
  "undo-miss": "Undo",
};

function LogPage() {
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
      <div className="px-4 pb-6 pt-5">
        <header className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">History</p>
          <h1 className="font-display text-3xl leading-none">Care log</h1>
          <p className="mt-2 text-sm text-muted">
            Hatched {formatDateTime(pet.hatchAt)} · {pet.careMistakes} care / {pet.discMistakes} disc
          </p>
        </header>
        {pet.events.length === 0 ? (
          <p className="text-sm text-muted">Nothing logged yet. Meals, games, and misses will show up here.</p>
        ) : (
          <ol className="flex flex-col">
            {pet.events.map((e) => (
              <li key={e.id} className="flex gap-3 border-b border-border py-3">
                <time className="w-14 shrink-0 font-display tabular-nums text-muted">{formatClock(e.at)}</time>
                <div>
                  <p className="font-medium">{LABELS[e.type] ?? e.type}</p>
                  {e.note ? <p className="text-sm text-pretty text-muted">{e.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </AppShell>
  );
}
