import type { DerivedState } from "@/lib/tama/types";
import { cn, pad2 } from "@/lib/utils";
import { LcdText } from "./LcdText";
import { PixelSprite, PoopPixels } from "./PixelSprite";
import { DisciplineBar, HeartsRow } from "./HeartsRow";

export function LcdScreen({ derived }: { derived: DerivedState }) {
  const { pet, stats, now } = derived;
  const d = new Date(now);
  const urgent = derived.primary?.urgency === "now" || derived.primary?.urgency === "late";
  const lightsOff = pet.sleeping && !pet.lightsOn;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-lcd p-3 text-lcd-pixel shadow-[inset_0_0_0_2px_var(--color-lcd-dim)]",
        lightsOff && "lcd-night",
        urgent && "ring-2 ring-danger/70",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 3px)",
        }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="font-pixel text-sm uppercase text-lcd-pixel/70">
            {stats.stage} · age {pet.age}
          </p>
          <h2 className="font-display text-3xl leading-none">{stats.name}</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <LcdText text={`${pad2(d.getHours())}:${pad2(d.getMinutes())}`} pixel={3} />
          <LcdText text={`${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`} pixel={2} className="opacity-70" />
        </div>
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div className={cn("relative size-32 shrink-0 text-lcd-pixel", pet.sleeping && "translate-y-0.5")}>
          <PixelSprite id={pet.form} sleeping={pet.sleeping} sick={pet.sick} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
          <HeartsRow label="Hungry" value={pet.hunger} />
          <HeartsRow label="Happy" value={pet.happy} />
          <DisciplineBar value={pet.discipline} />
          <div className="flex items-center justify-between text-lcd-pixel/80">
            <span className="font-pixel text-sm tabular-nums">{pet.weight}g</span>
            {pet.sleeping && pet.lightsOn ? (
              <span className="font-pixel text-sm text-danger">Lights</span>
            ) : pet.sleeping ? (
              <span className="font-pixel text-sm">Night</span>
            ) : pet.sick ? (
              <span className="font-pixel text-sm">Sick</span>
            ) : (
              <span className="font-pixel text-sm">Awake</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-2 grid grid-cols-[8rem_1fr] items-center gap-3">
        <PoopPixels count={pet.poop} />
        <div className="justify-self-end text-right">
          {pet.misbehaveAt ? (
            <span className="font-pixel text-sm uppercase">Attention</span>
          ) : pet.sleeping && pet.lightsOn ? (
            <span className="font-pixel text-sm uppercase text-danger">Lights on</span>
          ) : pet.sleeping ? (
            <span className="font-pixel text-sm uppercase">Lights off</span>
          ) : (
            <span className="font-pixel text-sm uppercase text-lcd-pixel/50">{pet.nickname}</span>
          )}
        </div>
      </div>
    </div>
  );
}
