import { createFileRoute, Link } from "@tanstack/react-router";
import { PixelSprite } from "@/components/lcd/PixelSprite";
import { derive } from "@/lib/tama/simulate";
import { cn, formatDuration } from "@/lib/utils";
import { useClock } from "@/hooks/use-clock";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/watch")({ component: WatchPage });

function WatchPage() {
  const pet = usePetStore((s) => s.pet);
  const now = useClock(1000);

  if (!pet) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
        <p className="font-display text-2xl">No run yet</p>
        <Link to="/" className="mt-3 text-primary underline-offset-4 hover:underline">
          Start on phone
        </Link>
      </main>
    );
  }

  const derived = derive(pet, now);
  const alert = derived.primary;
  const left = alert ? alert.dueAt - now : null;
  const urgent = alert?.urgency === "now" || alert?.urgency === "late";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-fg">
      <div
        className={cn(
          "flex w-full max-w-xs flex-col items-center rounded-2xl bg-lcd p-6 text-lcd-pixel",
          pet.sleeping && !pet.lightsOn && "lcd-night",
          urgent && "ring-4 ring-danger",
        )}
      >
        <p className="font-pixel text-sm uppercase">{derived.stats.name}</p>
        <div className="mt-2 size-24">
          <PixelSprite id={pet.form} sleeping={pet.sleeping} sick={pet.sick} />
        </div>
        <p className="mt-3 text-center font-display text-xl leading-tight">
          {alert?.title ?? "All clear"}
        </p>
        <p className="mt-1 font-display text-4xl tabular-nums leading-none">
          {alert?.urgency === "late" ? "NOW" : left != null ? formatDuration(left) : "—"}
        </p>
        <p className="mt-2 text-center font-pixel text-sm uppercase text-lcd-pixel/70">
          {alert?.deviceHint ?? "Hearts stable"}
        </p>
      </div>
      <Link to="/" className="mt-6 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        Back to full care
      </Link>
    </main>
  );
}
