import { Badge } from "@/components/ui/badge";
import { CHARACTERS } from "@/lib/tama/characters";
import { scoldAdvice } from "@/lib/tama/evolution";
import type { DerivedState } from "@/lib/tama/types";
import { cn } from "@/lib/utils";

export function MistakeBudgetCard({ derived }: { derived: DerivedState }) {
  const { pet, budget, predictedAdult, pathStatus } = derived;
  const target = CHARACTERS[pet.targetId];
  const predicted = CHARACTERS[predictedAdult];
  const scold = scoldAdvice(pet);
  const badge =
    pathStatus === "hit" ? "On target" : pathStatus === "path" ? "On path" : "Off path";
  const badgeVariant = pathStatus === "hit" ? "ok" : pathStatus === "path" ? "lcd" : "warn";

  return (
    <section className="rounded-xl bg-surface p-4 shadow-border">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Growth path</p>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <p className="mt-2 font-display text-xl leading-tight">
        Aiming for {target.name}
        <span className="text-muted"> → heading {predicted.name}</span>
      </p>
      <p className="mt-1 text-sm text-pretty text-muted">{budget.summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Care mistakes" value={String(budget.careUsed)} cap={budget.careMax} />
        <Stat label="Discipline misses" value={String(budget.discUsed)} cap={budget.discMax} min={budget.discMin} />
      </div>

      <p className="mt-4 text-sm text-pretty text-fg">{budget.stageTip}</p>
      <p
        className={cn(
          "mt-2 text-xs font-medium uppercase tracking-widest",
          scold === "scold" ? "text-ok" : scold === "ignore" ? "text-warn" : "text-muted",
        )}
      >
        {scold === "scold"
          ? "When it misbehaves: scold"
          : scold === "ignore"
            ? "When it misbehaves: let it timeout"
            : "When it misbehaves: either is fine"}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  cap,
  min,
}: {
  label: string;
  value: string;
  cap: number | null;
  min?: number | null;
}) {
  return (
    <div className="rounded-md bg-surface-2 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-2xl tabular-nums leading-none">
        {value}
        {cap != null ? <span className="text-base text-muted"> / {cap}</span> : null}
      </p>
      {min != null && min > 0 ? <p className="mt-1 text-xs text-muted">Need at least {min}</p> : null}
    </div>
  );
}
