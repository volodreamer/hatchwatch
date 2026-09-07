import { useEffect, useMemo, useState } from "react";
import { BackupPanel } from "@/components/care/BackupPanel";
import { PixelSprite } from "@/components/lcd/PixelSprite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangSwitch } from "@/components/ui/lang-switch";
import { ShellThemePicker } from "@/components/ui/shell-theme";
import { VersionSelect } from "@/components/ui/version-select";
import { useI18n } from "@/hooks/use-i18n";
import { planHeadline, planSteps } from "@/lib/care-copy";
import { asset } from "@/lib/asset";
import { ADULT_IDS, CHARACTERS } from "@/lib/tama/characters";
import { TARGET_PLANS } from "@/lib/tama/evolution";
import type { AdultId, Firmware } from "@/lib/tama/types";
import { cn, toDatetimeLocalValue } from "@/lib/utils";
import { playTamaChirp } from "@/lib/audio";
import { peekSavedPet, recoverPetFromStorage, usePetStore } from "@/store/pet-store";

export function SetupWizard() {
  const { locale, t } = useI18n();
  const startRun = usePetStore((s) => s.startRun);
  const startDemo = usePetStore((s) => s.startDemo);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [target, setTarget] = useState<AdultId>("mametchi");
  const [when, setWhen] = useState<"hatched" | "clock" | "custom">("hatched");
  const [custom, setCustom] = useState(toDatetimeLocalValue(Date.now()));
  const [nickname, setNickname] = useState("");
  const [region, setRegion] = useState<"en" | "jp">("en");
  const [firmware, setFirmware] = useState<Firmware>("replica");
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(peekSavedPet());
  }, []);

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
      firmware,
      nickname: nickname || t("setup.nick.ph"),
    });
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-10 pt-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">{t("setup.kicker")}</p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-balance">Hatchwatch</h1>
        <p className="max-w-md text-pretty text-muted">{t("setup.blurb")}</p>
        <div className="mt-2 flex flex-col gap-4">
          <LangSwitch />
          <ShellThemePicker />
        </div>
      </header>

      {hasSaved ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-border">
          <p className="font-display text-lg">{t("setup.resume")}</p>
          <p className="text-sm text-pretty text-muted">{t("setup.resume.d")}</p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!recoverPetFromStorage()) setHasSaved(false);
            }}
          >
            {t("setup.resume")}
          </Button>
        </div>
      ) : null}

      <ol className="flex gap-2 text-xs font-medium uppercase tracking-[0.16em] text-faint">
        <li className={cn(step === 1 && "text-primary")}>{t("setup.step1")}</li>
        <li className={cn(step === 2 && "text-primary")}>{t("setup.step2")}</li>
        <li className={cn(step === 3 && "text-primary")}>{t("setup.step3")}</li>
      </ol>

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{t("setup.who")}</p>
          <div className="grid grid-cols-2 gap-2">
            {ADULT_IDS.map((id) => {
              const c = CHARACTERS[id];
              const active = target === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTarget(id)}
                  className={cn(
                    "relative z-10 flex flex-col items-start gap-2 rounded-lg bg-surface p-3 text-left shadow-border transition-[box-shadow,transform] duration-[var(--motion-quick)] active:scale-[0.98]",
                    active && "ring-2 ring-primary",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex size-16 items-center justify-center rounded-md bg-lcd p-0.5 text-lcd-pixel">
                      <span className="size-14">
                        <PixelSprite id={id} />
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-widest text-muted">{t(`diff.${TARGET_PLANS[id].difficulty}`)}</span>
                  </div>
                  <span className="font-display text-lg leading-none">{c.name}</span>
                  <span className="text-xs text-pretty text-muted">{planHeadline(locale, id)}</span>
                </button>
              );
            })}
          </div>
          <Button className="mt-2 w-full" size="lg" onClick={() => setStep(2)}>
            {t("setup.continue")}
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t("setup.when")}</p>
          <div className="grid gap-2">
            <Choice
              active={when === "hatched"}
              title={t("setup.hatched")}
              detail={t("setup.hatched.d")}
              onClick={() => setWhen("hatched")}
            />
            <Choice
              active={when === "clock"}
              title={t("setup.clock")}
              detail={t("setup.clock.d")}
              onClick={() => setWhen("clock")}
            />
            <Choice
              active={when === "custom"}
              title={t("setup.custom")}
              detail={t("setup.custom.d")}
              onClick={() => setWhen("custom")}
            />
          </div>
          {when === "custom" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="hatch-at">{t("setup.hatchAt")}</Label>
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
              {t("setup.back")}
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              {t("setup.continue")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface p-4 shadow-border">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{t("setup.runPlan")}</p>
            <p className="mt-1 font-display text-2xl">{CHARACTERS[target].name}</p>
            <p className="mt-1 text-sm text-pretty text-muted">{planHeadline(locale, target)}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-fg">
              {planSteps(locale, target).slice(0, 3).map((s) => (
                <li key={s} className="border-l-2 border-primary/40 pl-3 text-pretty">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nick">{t("setup.nick")}</Label>
            <Input
              id="nick"
              placeholder={t("setup.nick.ph")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("setup.shellLang")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={region === "en" ? "default" : "secondary"}
                onClick={() => setRegion("en")}
              >
                {t("setup.shell.en")}
              </Button>
              <Button
                type="button"
                variant={region === "jp" ? "default" : "secondary"}
                onClick={() => setRegion("jp")}
              >
                {t("setup.shell.jp")}
              </Button>
            </div>
          </div>
          <VersionSelect value={firmware} onChange={setFirmware} />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              {t("setup.back")}
            </Button>
            <Button className="flex-1" onClick={submit}>
              {t("setup.start")}
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
        className="relative z-10 py-3 text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
      >
        {t("setup.demo")}
      </button>

      <div className="relative z-10 border-t border-border pt-4">
        <BackupPanel />
        <a
          href={asset("privacy.html")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {t("set.privacy")}
        </a>
      </div>
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
        "relative z-10 rounded-lg bg-surface p-4 text-left shadow-border transition-[box-shadow] duration-[var(--motion-quick)]",
        active && "ring-2 ring-primary",
      )}
    >
      <p className="font-medium text-fg">{title}</p>
      <p className="mt-1 text-sm text-pretty text-muted">{detail}</p>
    </button>
  );
}
