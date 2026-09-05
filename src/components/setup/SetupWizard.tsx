import { useMemo, useState } from "react";
import { PixelSprite } from "@/components/lcd/PixelSprite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADULT_IDS, CHARACTERS } from "@/lib/tama/characters";
import { TARGET_PLANS } from "@/lib/tama/evolution";
import type { AdultId } from "@/lib/tama/types";
import { cn, toDatetimeLocalValue } from "@/lib/utils";
import { playTamaChirp } from "@/lib/audio";
import { usePetStore } from "@/store/pet-store";

const DIFF_LABEL: Record<string, string> = {
  strict: "Strict",
  precise: "Precise",
  steady: "Steady",
  lenient: "Lenient",
  secret: "Secret",
};

export function SetupWizard() {
  const startRun = usePetStore((s) => s.startRun);
  const startDemo = usePetStore((s) => s.startDemo);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<AdultId>("mametchi");
  const [when, setWhen] = useState<"hatched" | "clock" | "custom">("hatched");
  const [custom, setCustom] = useState(toDatetimeLocalValue(Date.now()));
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState<"en" | "jp">("en");

  const plan = TARGET_PLANS[target];

  const hatchAt = useMemo(() => {
    const now = Date.now();
    if (when === "hatched") return now;
    if (when === "clock") return now + 5 * 60 * 1000;
    const [datePart, timePart] = custom.split("T");
    if (!datePart || !timePart) return now;
    const [y, mo, day] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, mo - 1, day, hh, mm || 0, 0, 0).getTime();
  }, [when, custom]);

  function submit() {
    playTamaChirp();
    const clockSetAt = when === "clock" ? Date.now() : hatchAt - 5 * 60 * 1000;
    startRun({
      hatchAt,
      clockSetAt,
      targetId: target,
      region,
      nickname: nickname || "My P1",
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-10 pt-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">Gen 1 companion</p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-balance">Hatchwatch</h1>
        <p className="max-w-md text-pretty text-muted">
          Log the hatch, pick who you want, and we track hearts, discipline, and the 15-minute care window so the
          device never beats you.
        </p>
      </header>

      <ol className="flex gap-2 text-xs font-medium uppercase tracking-[0.16em] text-faint">
        <li className={cn(step === 1 && "text-primary")}>1 Character</li>
        <li className={cn(step === 2 && "text-primary")}>2 Hatch</li>
        <li className={cn(step === 3 && "text-primary")}>3 Confirm</li>
      </ol>

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Who are you raising?</p>
          <div className="grid grid-cols-2 gap-2">
            {ADULT_IDS.map((id) => {
              const c = CHARACTERS[id];
              const p = TARGET_PLANS[id];
              const active = target === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTarget(id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg bg-surface p-3 text-left shadow-border transition-[box-shadow,transform] duration-[var(--motion-quick)] active:scale-[0.98]",
                    active && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex size-16 items-center justify-center rounded-md bg-lcd p-0.5 text-lcd-pixel">
                      <span className="size-14">
                        <PixelSprite id={id} />
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted">{DIFF_LABEL[p.difficulty]}</span>
                  </div>
                  <span className="font-display text-lg leading-none">{c.name}</span>
                  <span className="text-xs text-pretty text-muted">{p.headline}</span>
                </button>
              );
            })}
          </div>
          <Button className="mt-2 w-full" size="lg" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">When did this life start?</p>
          <div className="grid gap-2">
            <Choice
              active={when === "hatched"}
              title="It just hatched"
              detail="Baby is out. Both meters start empty — feed immediately."
              onClick={() => setWhen("hatched")}
            />
            <Choice
              active={when === "clock"}
              title="I just set the clock"
              detail="Egg hatches in about 5 minutes. We will count down."
              onClick={() => setWhen("clock")}
            />
            <Choice
              active={when === "custom"}
              title="I know the exact time"
              detail="Use this if the run already started. Then match hearts on the home screen."
              onClick={() => setWhen("custom")}
            />
          </div>
          {when === "custom" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="hatch-at">Hatch date and time</Label>
              <Input
                id="hatch-at"
                type="datetime-local"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface p-4 shadow-border">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Run plan</p>
            <p className="mt-1 font-display text-2xl">{CHARACTERS[target].name}</p>
            <p className="mt-1 text-sm text-pretty text-muted">{plan.headline}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-fg">
              {plan.steps.slice(0, 3).map((s) => (
                <li key={s} className="border-l-2 border-primary/40 pl-3 text-pretty">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nick">Nickname (optional)</Label>
            <Input
              id="nick"
              placeholder="My P1"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Shell language</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={region === "en" ? "default" : "secondary"}
                onClick={() => setRegion("en")}
              >
                English (Bill)
              </Button>
              <Button
                type="button"
                variant={region === "jp" ? "default" : "secondary"}
                onClick={() => setRegion("jp")}
              >
                Japanese (Oyajitchi)
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1" onClick={submit}>
              Start watching
            </Button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          playTamaChirp();
          startDemo();
        }}
        className="text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
      >
        Preview a Marutchi run
      </button>
    </div>
  );
}

function Choice({
  active,
  title,
  detail,
  onClick,
}: {
  active: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg bg-surface p-4 text-left shadow-border transition-[box-shadow] duration-[var(--motion-quick)]",
        active && "ring-2 ring-primary",
      )}
    >
      <p className="font-medium text-fg">{title}</p>
      <p className="mt-1 text-sm text-pretty text-muted">{detail}</p>
    </button>
  );
}
