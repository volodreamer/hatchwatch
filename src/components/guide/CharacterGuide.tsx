import { PixelSprite } from "@/components/lcd/PixelSprite";
import { Badge } from "@/components/ui/badge";
import { CHARACTERS, STAGE_ORDER } from "@/lib/tama/characters";
import { TARGET_PLANS } from "@/lib/tama/evolution";
import type { AdultId, CharacterStats } from "@/lib/tama/types";
import { hourLabel } from "@/lib/utils";

function stageLength(c: CharacterStats): string {
  if (c.stage === "adult" || c.stage === "secret") return c.lifespan;
  if (c.evoMin >= 120) return `${c.evoMin / 60} hours`;
  return `${c.evoMin} min`;
}

export function CharacterGuide() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">P1 internals</p>
        <h1 className="font-display text-3xl leading-none">Field guide</h1>
        <p className="mt-2 text-pretty text-muted">
          Heart loss, sleep, and shots from P1 ROM notes. Stage lengths are the observed 1996 times (Marutchi 48h, Tamatchi 72h, Kuchitamatchi 48h). Log what you actually press on the shell.
        </p>
      </header>

      <section className="rounded-xl bg-surface p-4 shadow-border">
        <h2 className="font-display text-xl">The 15-minute rule</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-pretty text-muted">
          <li>Attention lights for hunger, happy, or lights-on-at-sleep. Respond within 15 minutes or it is a care mistake.</li>
          <li>Misbehave: attention on, meters not empty. Scold to raise discipline 25%. Ignore for 15 minutes = discipline mistake.</li>
          <li>Poop and sickness do not beep. Check them yourself — four poops make it sick.</li>
          <li>Hearts only drain while awake. Sleep pauses the clock.</li>
          <li>Pause the shell with A+C until SET if you cannot tend a window. Time freezes on the device.</li>
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
                    <Badge variant="outline">{c.stage}</Badge>
                    {plan ? <Badge variant="lcd">{plan.difficulty}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-pretty text-muted">{c.blurb}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Row k="Hunger drop" v={`${c.hungryLossMin} min base`} />
                <Row k="Happy drop" v={`${c.happyLossMin} min base`} />
                <Row k="Sleep" v={c.sleepHour == null ? "Naps" : `${hourLabel(c.sleepHour)}–${hourLabel(c.wakeHour ?? 0)}`} />
                <Row k="This stage" v={stageLength(c)} />
                <Row k="Min weight" v={`${c.minWeight}g`} />
                <Row k="Medicine" v={`${c.shots} shot${c.shots === 1 ? "" : "s"}`} />
                <Row k="Life" v={c.lifespan} />
                <Row k="Misbehave" v={c.disciplineCountdown == null ? "None" : `every ${c.disciplineCountdown} drops`} />
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
