import { PixelSprite } from "@/components/lcd/PixelSprite";
import { Badge } from "@/components/ui/badge";
import { CHARACTERS } from "@/lib/tama/characters";
import { TARGET_PLANS } from "@/lib/tama/evolution";
import type { DerivedState } from "@/lib/tama/types";
import { cn } from "@/lib/utils";

export function GrowthPath({ derived }: { derived: DerivedState }) {
  const plan = TARGET_PLANS[derived.pet.targetId];
  const current = derived.pet.form;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Target</p>
        <h1 className="font-display text-3xl leading-none">{plan.name}</h1>
        <p className="mt-2 text-pretty text-muted">{plan.headline}</p>
      </header>

      <ol className="flex flex-col gap-0">
        {plan.path.map((id, i) => {
          const c = CHARACTERS[id];
          const isNow = current === id;
          return (
            <li key={`${id}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-16 items-center justify-center rounded-md",
                    isNow ? "bg-lcd text-lcd-pixel" : "bg-surface-2 text-muted",
                  )}
                >
                  <span className="size-14">
                    <PixelSprite id={id} />
                  </span>
                </span>
                {i < plan.path.length - 1 ? <span className="h-6 w-px bg-border" /> : null}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg leading-none">{c.name}</p>
                  {isNow ? <Badge variant="lcd">Now</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-pretty text-muted">{c.blurb}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-faint">
                  {c.sleepHour != null
                    ? `Sleep ${String(c.sleepHour).padStart(2, "0")}:00–${String(c.wakeHour).padStart(2, "0")}:00 · hearts ${c.hungryLossMin}/${c.happyLossMin} min`
                    : `Hearts every ${c.hungryLossMin}/${c.happyLossMin} min`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="rounded-xl bg-surface p-4 shadow-border">
        <h2 className="font-display text-xl">How to hit it</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {plan.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-pretty">
              <span className="font-display text-primary">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl bg-surface p-4 shadow-border">
        <h2 className="font-display text-xl">Mistake budget</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">Care mistakes</dt>
            <dd className="font-display text-2xl tabular-nums">
              {derived.budget.careUsed}
              {plan.careMax != null ? <span className="text-base text-muted"> / {plan.careMax}</span> : <span className="text-base text-muted"> (flex)</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Discipline misses</dt>
            <dd className="font-display text-2xl tabular-nums">
              {derived.budget.discUsed}
              {plan.discMax != null ? (
                <span className="text-base text-muted">
                  {" "}
                  / {plan.discMin ?? 0}–{plan.discMax}
                </span>
              ) : plan.discMin != null ? (
                <span className="text-base text-muted"> ≥ {plan.discMin}</span>
              ) : null}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-pretty text-muted">
          Care mistakes: empty hunger or happy for 15 minutes, or lights left on at sleep. Discipline mistakes: ignored
          misbehave calls. Counts carry from child into teen on the original P1.
        </p>
      </section>
    </div>
  );
}
