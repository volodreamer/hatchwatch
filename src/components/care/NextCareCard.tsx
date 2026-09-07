import type { CareAlert, DerivedState } from "@/lib/tama/types";
import { WARN_LEAD_MS } from "@/lib/tama/chirps";
import { translateAlert } from "@/lib/care-copy";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { Bell, Clock, HeartPulse, Moon, Sparkles, Syringe, Utensils } from "lucide-react";

const ICONS: Record<CareAlert["kind"], typeof Bell> = {
  hunger: Utensils,
  happy: HeartPulse,
  lights: Moon,
  discipline: Bell,
  poop: Sparkles,
  sick: Syringe,
  evolve: Sparkles,
  hatch: Clock,
};

const WINDOW_IDS = new Set(["hunger-call", "happy-call", "lights", "disc"]);

export function NextCareCard({
  derived,
  onNotOnShell,
  onOnShell,
}: {
  derived: DerivedState;
  onNotOnShell?: (kind: "poop" | "sick" | "discipline") => void;
  onOnShell?: (kind: "poop" | "sick" | "discipline") => void;
}) {
  const { locale, t } = useI18n();
  const alert = derived.primary;
  if (!alert) {
    return (
      <section className="rounded-xl bg-surface p-4 shadow-border">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{t("care.next")}</p>
        <p className="mt-1 font-display text-2xl text-fg">{t("care.clear")}</p>
        <p className="mt-1 text-sm text-muted">{t("care.clear.d")}</p>
      </section>
    );
  }
  const copy = translateAlert(locale, alert, derived);
  const Icon = ICONS[alert.kind];
  const left = alert.dueAt - derived.now;
  const urgent = alert.urgency === "now" || alert.urgency === "late";
  const isWindow = WINDOW_IDS.has(alert.id);
  const checkIds = new Set(["poop-due", "sick-due", "disc-due"]);
  const canDismiss =
    (alert.kind === "poop" || alert.kind === "sick" || alert.kind === "discipline") && onNotOnShell;
  const canConfirm = checkIds.has(alert.id) && onOnShell;
  return (
    <section
      className={cn(
        "rounded-xl p-4 shadow-border",
        urgent ? "animate-care-pulse bg-danger/15 text-fg" : alert.urgency === "soon" ? "bg-warn/10 text-fg" : "bg-surface text-fg",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {alert.urgency === "late" ? t("care.missed") : alert.urgency === "now" ? t("care.now") : t("care.soon")}
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-balance">{copy.title}</h2>
        </div>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-md",
            urgent ? "bg-danger text-fg" : "bg-surface-2 text-primary",
          )}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl tabular-nums tracking-tight">
        {alert.urgency === "late"
          ? t("care.overdue")
          : alert.kind === "poop" || alert.kind === "sick"
            ? t("care.check")
            : formatDuration(left)}
      </p>
      <p className="mt-1 text-sm text-pretty text-muted">{copy.detail}</p>
      {isWindow && left > WARN_LEAD_MS ? (
        <p className="mt-1 text-sm text-muted">{t("care.warnSoon")}</p>
      ) : null}
      {isWindow && left > 0 && left <= WARN_LEAD_MS ? (
        <p className="mt-1 text-sm text-danger">{t("care.warnNow")}</p>
      ) : null}
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-faint">{copy.hint}</p>
      {canDismiss ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {canConfirm ? (
            <button
              type="button"
              onClick={() => {
                if (alert.kind === "poop" || alert.kind === "sick" || alert.kind === "discipline") {
                  onOnShell?.(alert.kind);
                }
              }}
              className="min-h-11 rounded-md bg-primary px-3 text-sm font-medium text-primary-fg shadow-border"
            >
              {t("care.onShell")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (alert.kind === "poop" || alert.kind === "sick" || alert.kind === "discipline") {
                onNotOnShell(alert.kind);
              }
            }}
            className={cn(
              "min-h-11 rounded-md bg-surface-2 px-3 text-sm font-medium text-fg shadow-border",
              !canConfirm && "col-span-2",
            )}
          >
            {t("care.notOnShell")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
