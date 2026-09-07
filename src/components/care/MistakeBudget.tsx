import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { translateBudget, translateTip } from "@/lib/care-copy";
import { CHARACTERS } from "@/lib/tama/characters";
import { isGrownForm, scoldAdvice, stillHeadingSecret } from "@/lib/tama/evolution";
import type { DerivedState } from "@/lib/tama/types";
import { cn } from "@/lib/utils";

export function MistakeBudgetCard({ derived }: { derived: DerivedState }) {
  const { locale, t } = useI18n();
  const { pet, budget, predictedAdult, pathStatus } = derived;
  const target = CHARACTERS[pet.targetId];
  const predicted = CHARACTERS[predictedAdult];
  const scold = scoldAdvice(pet);
  const grown = isGrownForm(pet);
  const secretOpen = stillHeadingSecret(pet);
  const badge =
    pathStatus === "hit" ? t("path.hit") : pathStatus === "path" ? t("path.path") : t("path.off");
  const badgeVariant = pathStatus === "hit" ? "ok" : pathStatus === "path" ? "lcd" : "warn";
  const formName = CHARACTERS[pet.form].name;
  const showHeading = secretOpen || (!grown && predicted.id !== target.id);

  return (
    <section className="rounded-xl bg-surface p-4 shadow-border">
      <div className="flex items-center justify-between gap-2">
        <p className="tile-kicker text-xs font-medium uppercase tracking-widest text-muted">{t("path.title")}</p>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>
      <p className="mt-2 font-display text-xl leading-tight">
        {grown ? t("path.grew", { name: formName }) : t("path.aim", { name: target.name })}
        {showHeading ? <span className="text-muted">{t("path.heading", { name: predicted.name })}</span> : null}
      </p>
      {grown && !secretOpen && pet.form !== pet.targetId ? (
        <p className="mt-1 text-sm text-pretty text-muted">{t("path.wanted", { name: target.name })}</p>
      ) : null}
      <p className="mt-1 text-sm text-pretty text-muted">{translateBudget(locale, pet)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label={t("path.care")} value={String(budget.careUsed)} cap={budget.careMax} minLabel={t("path.needMin")} />
        <Stat
          label={t("path.disc")}
          value={String(budget.discUsed)}
          cap={budget.discMax}
          min={budget.discMin}
          minLabel={t("path.needMin")}
        />
      </div>

      <p className="mt-4 text-sm text-pretty text-fg">{translateTip(locale, pet)}</p>
      <p
        className={cn(
          "mt-2 text-xs font-medium uppercase tracking-widest",
          grown && !secretOpen
            ? "text-muted"
            : scold === "scold"
              ? "text-ok"
              : scold === "ignore"
                ? "text-warn"
                : "text-muted",
        )}
      >
        {grown && !secretOpen
          ? t("path.grown")
          : scold === "scold"
            ? t("path.scold")
            : scold === "ignore"
              ? t("path.ignore")
              : t("path.either")}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  cap,
  min,
  minLabel,
}: {
  label: string;
  value: string;
  cap: number | null;
  min?: number | null;
  minLabel: string;
}) {
  return (
    <div className="rounded-md bg-surface-2 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-2xl tabular-nums leading-none">
        {value}
        {cap != null ? <span className="text-base text-muted"> / {cap}</span> : null}
      </p>
      {min != null && min > 0 ? (
        <p className="mt-1 text-xs text-muted">{minLabel.replace("{n}", String(min))}</p>
      ) : null}
    </div>
  );
}
