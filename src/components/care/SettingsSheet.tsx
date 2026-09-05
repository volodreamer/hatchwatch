import { Button } from "@/components/ui/button";
import { armAudio, disarmAudio, playCall } from "@/lib/audio";
import { requestNotifPermission, useAudioUnlocked } from "@/hooks/use-reminders";
import { usePetStore } from "@/store/pet-store";
import type { Pet } from "@/lib/tama/types";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const BACKUP_KEY = "hatchwatch-v1";

export function SettingsSheet({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const unlocked = useAudioUnlocked();
  const setNotif = usePetStore((s) => s.setNotif);
  const setSound = usePetStore((s) => s.setSound);
  const reset = usePetStore((s) => s.reset);
  const armed = unlocked && pet.soundOn;

  function enableBeeps() {
    const heard = playCall("drop");
    setSound(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([80, 40, 120]);
    void requestNotifPermission().then((ok) => {
      setNotif(ok);
      toast(
        heard
          ? "Beeps armed. 3 chirps on a drop, 5 chirps with 2 minutes left. Keep Hatchwatch open."
          : "No chirp — turn media volume up (not just the ringer) and tap again.",
      );
    });
  }

  async function enableNotifs() {
    armAudio();
    const ok = await requestNotifPermission();
    setNotif(ok);
    toast(ok ? "Phone alerts on. Best if Hatchwatch stays open." : "Notifications blocked in the browser settings.");
  }

  async function copyBackup() {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) {
      toast("Nothing saved yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(raw);
      toast("Run copied. Paste it into a note.");
    } catch {
      window.prompt("Copy this backup", raw);
    }
  }

  function restoreBackup() {
    const text = window.prompt("Paste a Hatchwatch backup");
    if (!text) return;
    try {
      const parsed = JSON.parse(text) as { state?: { pet?: Pet }; pet?: Pet };
      const next = parsed.state?.pet ?? parsed.pet ?? (parsed as unknown as Pet);
      if (!next || typeof next.hatchAt !== "number" || !next.form) {
        throw new Error("bad backup");
      }
      usePetStore.setState({ pet: next });
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ state: { pet: next }, version: 0 }));
      toast("Run restored");
      onClose();
    } catch {
      toast("That backup could not be read");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl">Settings</h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          3 chirps when a heart drops. 5 lower chirps with 2 minutes left before a mistake.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Sound</p>
        <p className="text-sm text-muted">{armed ? "Listening for care calls." : "Beeps are off until you arm them."}</p>
        <div className="grid grid-cols-2 gap-2">
          {pet.soundOn && unlocked ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSound(false);
                disarmAudio();
                toast("Beeps muted");
              }}
            >
              <VolumeX className="size-4" />
              Mute
            </Button>
          ) : (
            <Button type="button" onClick={enableBeeps}>
              <Volume2 className="size-4" />
              Arm beeps
            </Button>
          )}
          {!pet.notifOn ? (
            <Button type="button" variant="secondary" onClick={() => void enableNotifs()}>
              <Bell className="size-4" />
              Alerts
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNotif(false);
                toast("Alerts off");
              }}
            >
              <Bell className="size-4" />
              Alerts on
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              playCall("drop");
              toast("Drop — 3 chirps");
            }}
          >
            Test 3 chirps
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              playCall("warn");
              toast("Warning — 5 chirps");
            }}
          >
            Test 5 chirps
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Backup</p>
        <p className="text-sm text-pretty text-muted">
          This run lives on this phone. Removing the home-screen icon does not delete it. Copy a backup before clearing site data.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => void copyBackup()}>
            Copy backup
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={restoreBackup}>
            Restore
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("End this run? Logs will be cleared.")) {
              reset();
              onClose();
            }
          }}
          className="py-2 text-left text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          End run
        </button>
      </section>

      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
