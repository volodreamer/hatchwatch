import { useState, type ReactNode } from "react";
import { ActionPad } from "@/components/care/ActionPad";
import { MistakeBudgetCard } from "@/components/care/MistakeBudget";
import { NextCareCard } from "@/components/care/NextCareCard";
import { SettingsSheet } from "@/components/care/SettingsSheet";
import { SyncSheet } from "@/components/care/SyncSheet";
import { LcdScreen } from "@/components/lcd/LcdScreen";
import { Button } from "@/components/ui/button";
import { derive } from "@/lib/tama/simulate";
import { formatDuration } from "@/lib/utils";
import { useAudioUnlocked } from "@/hooks/use-reminders";
import { useClock } from "@/hooks/use-clock";
import { useI18n } from "@/hooks/use-i18n";
import { usePetStore } from "@/store/pet-store";
import type { ActionType } from "@/lib/tama/types";
import { armAudio, playCall } from "@/lib/audio";
import { Settings, SlidersHorizontal, Undo2, Volume2, Watch } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function HomeDashboard() {
  const { t } = useI18n();
  const pet = usePetStore((s) => s.pet);
  const log = usePetStore((s) => s.log);
  const undo = usePetStore((s) => s.undo);
  const setSound = usePetStore((s) => s.setSound);
  const now = useClock(1000);
  const unlocked = useAudioUnlocked();
  const [syncOpen, setSyncOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missOpen, setMissOpen] = useState(false);
  const derived = pet ? derive(pet, now) : null;

  if (!pet || !derived) return null;

  const needsArm = !pet.soundOn || !unlocked;

  function onLog(type: ActionType) {
    if (pet?.soundOn) armAudio();
    if (type === "miss-care") {
      setMissOpen(true);
      return;
    }
    log(type);
    if (type === "scold") {
      const next = usePetStore.getState().pet;
      toast(t("home.discToast", { n: next?.discipline ?? 0 }));
    } else if (type === "lights-off") {
      if (!pet?.sleeping) {
        toast(t("home.lightsAwake"));
      } else if (!pet.lightsOn) {
        toast(t("home.lightsAlready"));
      } else {
        toast(t("home.lightsOff"));
      }
    } else {
      const key =
        type === "meal" || type === "snack" || type === "game" || type === "clean" || type === "medicine"
          ? `home.logged.${type}`
          : "home.logged";
      toast(t(key));
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
  }

  const evoLeft = derived.nextEvolveAt ? derived.nextEvolveAt - now : null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Hatchwatch</p>
          <h1 className="font-display text-2xl leading-none">{pet.nickname}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={t("home.undo")} onClick={() => { undo(); toast(t("home.undid")); }}>
            <Undo2 className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("home.match")} onClick={() => setSyncOpen(true)}>
            <SlidersHorizontal className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label={t("home.watch")}>
            <Link to="/watch">
              <Watch className="size-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("home.settings")}
            onClick={() => setSettingsOpen(true)}
            className={needsArm ? "text-primary" : undefined}
          >
            <Settings className="size-5" />
          </Button>
        </div>
      </header>

      {needsArm ? (
        <button
          type="button"
          onClick={() => {
            const heard = playCall("drop");
            setSound(true);
            toast(heard ? t("home.armed") : t("home.armFail"));
          }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg shadow-border"
        >
          <Volume2 className="size-4" />
          {t("home.arm")}
        </button>
      ) : null}

      <LcdScreen derived={derived} />
      <NextCareCard
        derived={derived}
        onOnShell={(kind) => {
          usePetStore.getState().confirmOnShell(kind);
          toast(t("home.onShell"));
        }}
        onNotOnShell={(kind) => {
          usePetStore.getState().dismissOffShell(kind);
          toast(
            kind === "poop"
              ? t("home.poopOff")
              : kind === "sick"
                ? t("home.sickOff")
                : t("home.discOff"),
          );
        }}
      />
      <ActionPad
        onLog={onLog}
        attention={Boolean(derived.pet.misbehaveAt || derived.pet.checkDiscAt)}
        lightsHot={derived.pet.sleeping && derived.pet.lightsOn}
      />
      {missOpen ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              log("miss-care");
              setMissOpen(false);
              toast(t("home.careMiss"));
            }}
          >
            {t("home.missCare")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              log("miss-disc");
              setMissOpen(false);
              toast(t("home.discMiss"));
            }}
          >
            {t("home.missDisc")}
          </Button>
        </div>
      ) : null}
      <MistakeBudgetCard derived={derived} />

      <section className="grid grid-cols-2 gap-2">
        <Mini
          label={t("home.nextHunger")}
          value={derived.nextHungerDrainAt ? formatDuration(derived.nextHungerDrainAt - now) : pet.hunger === 0 ? t("home.empty") : "—"}
        />
        <Mini
          label={t("home.nextHappy")}
          value={derived.nextHappyDrainAt ? formatDuration(derived.nextHappyDrainAt - now) : pet.happy === 0 ? t("home.empty") : "—"}
        />
        <Mini
          label={t("home.nextPoop")}
          value={
            derived.pet.checkPoopAt
              ? t("care.check")
              : derived.nextPoopAt
                ? formatDuration(derived.nextPoopAt - now)
                : "—"
          }
        />
        <Mini
          label={t("home.nextSick")}
          value={
            derived.pet.checkSickAt
              ? t("care.check")
              : derived.pet.sick
                ? t("care.sick.t")
                : derived.nextSicknessAt
                  ? formatDuration(derived.nextSicknessAt - now)
                  : "—"
          }
        />
        <Mini
          label={t("home.sleep")}
          value={
            pet.sleeping
              ? derived.nextWakeAt
                ? t("home.wakes", { d: formatDuration(derived.nextWakeAt - now) })
                : t("home.asleep")
              : derived.nextSleepAt
                ? formatDuration(derived.nextSleepAt - now)
                : t("home.naps")
          }
        />
        <Mini label={t("home.evo")} value={evoLeft != null && evoLeft > 0 ? formatDuration(evoLeft) : "—"} />
        <Mini
          label={t("home.nextDisc")}
          value={
            derived.remainingDiscDrops == null
              ? t("home.discNone")
              : derived.remainingDiscDrops === 0
                ? t("home.discNow")
                : t("home.discDrops", { n: derived.remainingDiscDrops })
          }
        />
      </section>

      {syncOpen ? (
        <Overlay onClose={() => setSyncOpen(false)} closeLabel={t("home.close")}>
          <SyncSheet pet={derived.pet} onClose={() => setSyncOpen(false)} />
        </Overlay>
      ) : null}
      {settingsOpen ? (
        <Overlay onClose={() => setSettingsOpen(false)} closeLabel={t("home.close")}>
          <SettingsSheet pet={pet} onClose={() => setSettingsOpen(false)} />
        </Overlay>
      ) : null}
    </div>
  );
}

function Overlay({ children, onClose, closeLabel }: { children: ReactNode; onClose: () => void; closeLabel: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-3 pt-16 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label={closeLabel} onClick={onClose} />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4 shadow-border">
        {children}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2.5 shadow-border">
      <p className="tile-kicker text-xs font-medium uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-lg tabular-nums leading-tight">{value}</p>
    </div>
  );
}
