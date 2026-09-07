import { PixelSprite } from "@/components/lcd/PixelSprite";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { formBlurb } from "@/lib/care-copy";
import { CHARACTERS, POOP_INTERVAL_MIN, STAGE_ORDER } from "@/lib/tama/characters";
import { TARGET_PLANS } from "@/lib/tama/evolution";
import type { AdultId, CharacterStats } from "@/lib/tama/types";
import { hourLabel } from "@/lib/utils";

export function CharacterGuide() {
  const { locale, t } = useI18n();

  function stageLength(c: CharacterStats): string {
    if (c.stage === "adult" || c.stage === "secret") return c.lifespan;
    if (c.evoMin >= 120) return t("guide.hours", { n: c.evoMin / 60 });
    return t("guide.min", { n: c.evoMin });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="tile-kicker text-xs font-medium uppercase tracking-[0.18em] text-muted">{t("guide.kicker")}</p>
        <h1 className="font-display text-3xl leading-none">{t("guide.title")}</h1>
        <p className="mt-2 text-pretty text-muted">{t("guide.lead")}</p>
      </header>

      <section className="rounded-xl bg-surface p-4 shadow-border">
        <h2 className="font-display text-xl">{t("guide.rule")}</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-pretty text-muted">
          <li>{t("guide.r1")}</li>
          <li>{t("guide.r2")}</li>
          <li>{t("guide.r3")}</li>
          <li>{t("guide.r4")}</li>
          <li>{t("guide.r5")}</li>
          <li>{t("guide.r6")}</li>
        </ul>
      </section>

      <div className="flex flex-col gap-3">
        {STAGE_ORDER.map((id) => {
          const c = CHARACTERS[id];
          const plan = id in TARGET_PLANS ? TARGET_PLANS[id as AdultId] : null;
          return (
            <article key={id} className="rounded-xl bg-surface p-4 shadow-border">
              <div className="flex items-start gap-3">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-lcd text-lcd-pixel">
                  <span className="size-14">
                    <PixelSprite id={id} />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl leading-none">{c.name}</h3>
                    <Badge variant="outline">{t(`stage.${c.stage}`)}</Badge>
                    {plan ? <Badge variant="lcd">{t(`diff.${plan.difficulty}`)}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-pretty text-muted">{formBlurb(locale, id)}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Row k={t("guide.hunger")} v={t("guide.base", { n: c.hungryLossMin })} />
                <Row k={t("guide.happy")} v={t("guide.base", { n: c.happyLossMin })} />
                <Row
                  k={t("guide.sleep")}
                  v={c.sleepHour == null ? t("guide.naps") : `${hourLabel(c.sleepHour)}–${hourLabel(c.wakeHour ?? 0)}`}
                />
                <Row k={t("guide.stage")} v={stageLength(c)} />
                <Row k={t("guide.weight")} v={t("guide.g", { n: c.minWeight })} />
                <Row k={t("guide.med")} v={t("guide.shots", { n: c.shots })} />
                <Row k={t("guide.life")} v={c.lifespan} />
                <Row
                  k={t("guide.mis")}
                  v={c.disciplineCountdown == null ? t("guide.none") : t("guide.every", { n: c.disciplineCountdown })}
                />
                <Row
                  k={t("guide.poop")}
                  v={c.id === "egg" ? t("guide.none") : t("guide.min", { n: POOP_INTERVAL_MIN[c.id] })}
                />
                <Row
                  k={t("guide.sickAt")}
                  v={!Number.isFinite(c.sicknessMin) || c.sicknessMin >= 9000 ? t("guide.none") : t("guide.min", { n: c.sicknessMin })}
                />
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-faint">{k}</dt>
      <dd className="tabular-nums text-fg">{v}</dd>
    </div>
  );
}
