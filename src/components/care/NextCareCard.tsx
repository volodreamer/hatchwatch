import type { CareAlert, DerivedState } from "@/lib/tama/types";
import { WARN_LEAD_MS } from "@/lib/tama/chirps";
import { cn, formatDuration } from "@/lib/utils";
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
}: {
  derived: DerivedState;
  onNotOnShell?: (kind: "poop" | "sick" | "discipline") => void;
}) {
  const alert = derived.primary;
  if (!alert) {
    return (
      <section className="rounded-xl bg-surface p-4 shadow-border">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Next care</p>
        <p className="mt-1 font-display text-2xl text-fg">All clear</p>
        <p className="mt-1 text-sm text-muted">No call window is open. Hearts will keep draining while it is awake.</p>
      </section>
    );
  }
  const Icon = ICONS[alert.kind];
  const left = alert.dueAt - derived.now;
  const urgent = alert.urgency === "now" || alert.urgency === "late";
  const isWindow = WINDOW_IDS.has(alert.id);
  const canDismiss =
    (alert.kind === "poop" || alert.kind === "sick" || alert.kind === "discipline") && onNotOnShell;
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
            {alert.urgency === "late" ? "Missed window" : alert.urgency === "now" ? "Do this now" : "Upcoming"}
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-balance">{alert.title}</h2>
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
          ? "Overdue"
          : alert.kind === "poop" || alert.kind === "sick"
            ? "Check the shell"
            : formatDuration(left)}
      </p>
      <p className="mt-1 text-sm text-pretty text-muted">{alert.detail}</p>
      {isWindow && left > WARN_LEAD_MS ? (
        <p className="mt-1 text-sm text-muted">5 warning chirps when 2 min remain.</p>
      ) : null}
      {isWindow && left > 0 && left <= WARN_LEAD_MS ? (
        <p className="mt-1 text-sm text-danger">Last 2 minutes — 5 chirps. Act now.</p>
      ) : null}
      <p className="mt-3 text-xs font-medium uppercase tracking-widest text-faint">{alert.deviceHint}</p>
      {canDismiss ? (
        <button
          type="button"
          onClick={() => {
            if (alert.kind === "poop" || alert.kind === "sick" || alert.kind === "discipline") {
              onNotOnShell(alert.kind);
            }
          }}
          className="mt-3 min-h-11 w-full rounded-md bg-surface-2 px-3 text-sm font-medium text-fg shadow-border"
        >
          Not on the shell
        </button>
      ) : null}
    </section>
  );
}
