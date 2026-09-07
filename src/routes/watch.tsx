import { createFileRoute, Link } from "@tanstack/react-router";
import { PixelSprite } from "@/components/lcd/PixelSprite";
import { PetBoot } from "@/components/PersistGate";
import { useI18n } from "@/hooks/use-i18n";
import { translateAlert } from "@/lib/care-copy";
import { derive } from "@/lib/tama/simulate";
import { cn, formatDuration } from "@/lib/utils";
import { useClock } from "@/hooks/use-clock";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/watch")({ component: WatchPage });

function WatchPage() {
  const { t } = useI18n();

  return (
    <PetBoot
      empty={
        <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-fg">
          <p className="font-display text-2xl">{t("watch.none")}</p>
          <Link to="/" className="mt-3 text-primary underline-offset-4 hover:underline">
            {t("watch.start")}
          </Link>
        </main>
      }
    >
      <WatchFace />
    </PetBoot>
  );
}

function WatchFace() {
  const { locale, t } = useI18n();
  const pet = usePetStore((s) => s.pet);
  const now = useClock(1000);
  if (!pet) return null;
  const derived = derive(pet, now);
  const alert = derived.primary;
  const copy = alert ? translateAlert(locale, alert, derived) : null;
  const left = alert ? alert.dueAt - now : null;
  const urgent = alert?.urgency === "now" || alert?.urgency === "late";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-fg">
      <div className={cn("lcd-bezel w-full max-w-xs rounded-2xl", urgent && "ring-4 ring-danger")}>
      <div
        className={cn(
          "flex w-full flex-col items-center rounded-2xl bg-lcd p-6 text-lcd-pixel",
          pet.sleeping && !pet.lightsOn && "lcd-night",
        )}
      >
        <p className="font-pixel text-sm uppercase">{derived.stats.name}</p>
        <div className="mt-2 size-24">
          <PixelSprite id={pet.form} sleeping={pet.sleeping} sick={pet.sick} />
        </div>
        <p className="mt-3 text-center font-display text-xl leading-tight">
          {copy?.title ?? t("watch.clear")}
        </p>
        <p className="mt-1 font-display text-4xl tabular-nums leading-none">
          {alert?.urgency === "late" ? t("watch.now") : left != null ? formatDuration(left) : "—"}
        </p>
        <p className="mt-2 text-center font-pixel text-sm uppercase text-lcd-pixel/70">
          {copy?.hint ?? t("watch.stable")}
        </p>
      </div>
      </div>
      <Link to="/" className="mt-6 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        {t("watch.back")}
      </Link>
    </main>
  );
}
