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
import { usePetStore } from "@/store/pet-store";
import type { ActionType } from "@/lib/tama/types";
import { armAudio, playCall } from "@/lib/audio";
import { Settings, SlidersHorizontal, Undo2, Volume2, Watch } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function HomeDashboard() {
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
      toast(`Discipline ${next?.discipline ?? 0}%`);
    } else if (type === "lights-off") {
      if (!pet?.sleeping) {
        toast("Lights off. It is awake — no sleep window.");
      } else if (!pet.lightsOn) {
        toast("Lights were already off");
      } else {
        toast("Lights OFF — 15 min window closed");
      }
    } else {
      const labels: Partial<Record<ActionType, string>> = {
        meal: "Meal logged",
        snack: "Snack logged",
        game: "Game logged",
        clean: "Cleaned",
        medicine: "Medicine",
      };
      toast(labels[type] ?? "Logged");
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
          <Button variant="ghost" size="icon" aria-label="Undo last" onClick={() => { undo(); toast("Undid last log"); }}>
            <Undo2 className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Match device" onClick={() => setSyncOpen(true)}>
            <SlidersHorizontal className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Watch face">
            <Link to="/watch">
              <Watch className="size-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
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
            toast(heard ? "Beeps armed — 3 on a drop, 5 at two minutes left." : "Turn media volume up and tap again.");
          }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-fg shadow-border"
        >
          <Volume2 className="size-4" />
          Arm care beeps
        </button>
      ) : null}

      <LcdScreen derived={derived} />
      <NextCareCard
        derived={derived}
        onNotOnShell={(kind) => {
          usePetStore.getState().dismissOffShell(kind);
          toast(
            kind === "poop"
              ? "Poop cleared — shell is clean"
              : kind === "sick"
                ? "Skull cleared — not sick on the shell"
                : "Attention cleared — no scold, no miss",
          );
        }}
      />
      <ActionPad
        onLog={onLog}
        attention={Boolean(derived.pet.misbehaveAt)}
        lightsHot={derived.pet.sleeping && derived.pet.lightsOn}
      />
      {missOpen ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              log("miss-care");
              setMissOpen(false);
              toast("Care mistake logged");
            }}
          >
            Care mistake
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              log("miss-disc");
              setMissOpen(false);
              toast("Discipline miss logged");
            }}
          >
            Discipline miss
          </Button>
        </div>
      ) : null}
      <MistakeBudgetCard derived={derived} />

      <section className="grid grid-cols-2 gap-2">
        <Mini
          label="Next hunger drop"
          value={derived.nextHungerDrainAt ? formatDuration(derived.nextHungerDrainAt - now) : pet.hunger === 0 ? "Empty" : "—"}
        />
        <Mini
          label="Next happy drop"
          value={derived.nextHappyDrainAt ? formatDuration(derived.nextHappyDrainAt - now) : pet.happy === 0 ? "Empty" : "—"}
        />
        <Mini
          label="Sleep"
          value={
            pet.sleeping
              ? derived.nextWakeAt
                ? `Wakes ${formatDuration(derived.nextWakeAt - now)}`
                : "Asleep"
              : derived.nextSleepAt
                ? formatDuration(derived.nextSleepAt - now)
                : "Naps"
          }
        />
        <Mini label="Evolution" value={evoLeft != null && evoLeft > 0 ? formatDuration(evoLeft) : "—"} />
      </section>

      {syncOpen ? (
        <Overlay onClose={() => setSyncOpen(false)}>
          <SyncSheet pet={derived.pet} onClose={() => setSyncOpen(false)} />
        </Overlay>
      ) : null}
      {settingsOpen ? (
        <Overlay onClose={() => setSettingsOpen(false)}>
          <SettingsSheet pet={pet} onClose={() => setSettingsOpen(false)} />
        </Overlay>
      ) : null}
    </div>
  );
}

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70 p-3 pt-16 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-4 shadow-border">
        {children}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2.5 shadow-border">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-lg tabular-nums leading-tight">{value}</p>
    </div>
  );
}
