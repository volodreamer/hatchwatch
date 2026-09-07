import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackupPanel } from "@/components/care/BackupPanel";
import { LangSwitch } from "@/components/ui/lang-switch";
import { ShellThemePicker } from "@/components/ui/shell-theme";
import { VersionSelect } from "@/components/ui/version-select";
import { useI18n } from "@/hooks/use-i18n";
import { armAudio, disarmAudio, playCall } from "@/lib/audio";
import { saveUrlFile } from "@/lib/backup";
import { asset } from "@/lib/asset";
import { requestNotifPermission, useAudioUnlocked } from "@/hooks/use-reminders";
import { usePetStore } from "@/store/pet-store";
import type { Pet } from "@/lib/tama/types";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const GITHUB_REPO = "https://github.com/volodreamer/hatchwatch";
const OVERLAY_ZIP = "hatchwatch-src-20260907.zip";

export function SettingsSheet({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const { t } = useI18n();
  const unlocked = useAudioUnlocked();
  const [zipBusy, setZipBusy] = useState(false);
  const setNotif = usePetStore((s) => s.setNotif);
  const setSound = usePetStore((s) => s.setSound);
  const setFirmware = usePetStore((s) => s.setFirmware);
  const reset = usePetStore((s) => s.reset);
  const armed = unlocked && pet.soundOn;

  function enableBeeps() {
    const heard = playCall("drop");
    setSound(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([80, 40, 120]);
    void requestNotifPermission().then((ok) => {
      setNotif(ok);
      toast(heard ? t("set.armed") : t("set.noChirp"));
    });
  }

  async function enableNotifs() {
    armAudio();
    const ok = await requestNotifPermission();
    setNotif(ok);
    toast(ok ? t("set.notifOn") : t("set.notifBlock"));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl">{t("set.title")}</h2>
        <p className="mt-1 text-sm text-pretty text-muted">{t("set.lead")}</p>
      </div>

      <section className="flex flex-col gap-2">
        <LangSwitch />
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <VersionSelect value={pet.firmware} onChange={setFirmware} />
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <ShellThemePicker />
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{t("set.sound")}</p>
        <p className="text-sm text-muted">{armed ? t("set.listening") : t("set.off")}</p>
        <div className="grid grid-cols-2 gap-2">
          {pet.soundOn && unlocked ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSound(false);
                disarmAudio();
                toast(t("set.muted"));
              }}
            >
              <VolumeX className="size-4" />
              {t("set.mute")}
            </Button>
          ) : (
            <Button type="button" onClick={enableBeeps}>
              <Volume2 className="size-4" />
              {t("set.arm")}
            </Button>
          )}
          {!pet.notifOn ? (
            <Button type="button" variant="secondary" onClick={() => void enableNotifs()}>
              <Bell className="size-4" />
              {t("set.alerts")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNotif(false);
                toast(t("set.alertsOff"));
              }}
            >
              <Bell className="size-4" />
              {t("set.alertsOn")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              playCall("drop");
              toast(t("set.drop"));
            }}
          >
            {t("set.test3")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              playCall("warn");
              toast(t("set.warn"));
            }}
          >
            {t("set.test5")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <BackupPanel onRestored={onClose} />
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted">{t("set.zips")}</p>
        <p className="text-sm text-pretty text-muted">{t("set.zipHint")}</p>
        <Button
          type="button"
          disabled={zipBusy}
          onClick={() => {
            setZipBusy(true);
            void saveUrlFile(asset(OVERLAY_ZIP), OVERLAY_ZIP)
              .then((how) => {
                if (how === "cancel") toast(t("set.zipFail"));
                else toast(t("set.zipSaved"));
              })
              .catch(() => toast(t("set.zipFail")))
              .finally(() => setZipBusy(false));
          }}
        >
          {t("set.zip")}
        </Button>
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          github.com/volodreamer/hatchwatch
        </a>
        <a
          href={asset("privacy.html")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {t("set.privacy")}
        </a>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("set.end.q"))) {
              reset();
              onClose();
            }
          }}
          className="py-2 text-left text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {t("set.end")}
        </button>
      </section>

      <Button variant="secondary" onClick={onClose}>
        {t("set.close")}
      </Button>
    </div>
  );
}
