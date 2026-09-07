import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { readBackupRaw } from "@/lib/backup";
import {
  compareSaves,
  isGoogleConfigured,
  loadFromGoogle,
  petFromBackupRaw,
  saveToGoogle,
} from "@/lib/google-drive";
import {
  getGoogleSyncSnap,
  markGoogleInStep,
  resumeGoogle,
  signInGoogle,
  signOutGoogle,
  subscribeGoogleSync,
} from "@/lib/google-sync";
import { loadPet } from "@/store/pet-store";
import { Cloud, CloudDownload, CloudUpload, LogOut } from "lucide-react";
import { toast } from "sonner";

export function GoogleDrivePanel({ onRestored }: { onRestored?: () => void }) {
  const { t } = useI18n();
  const [snap, setSnap] = useState(getGoogleSyncSnap);
  const [busy, setBusy] = useState(false);
  const configured = isGoogleConfigured();

  useEffect(() => subscribeGoogleSync(() => setSnap({ ...getGoogleSyncSnap() })), []);

  const locked = busy || snap.busy;
  const email = snap.email;

  function fail(err: unknown) {
    const code = err instanceof Error ? err.message : "fail";
    toast(t(code === "denied" ? "set.google.denied" : code === "need" ? "set.google.need" : "set.google.fail"));
  }

  async function signIn() {
    setBusy(true);
    try {
      await signInGoogle();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    try {
      await resumeGoogle();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await signOutGoogle();
      toast(t("set.google.outDone"));
    } catch {
      await signOutGoogle().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function saveCloud() {
    const raw = readBackupRaw();
    if (!raw) {
      toast(t("set.nothing"));
      return;
    }
    setBusy(true);
    try {
      const remote = petFromBackupRaw(await loadFromGoogle());
      const local = petFromBackupRaw(raw);
      const cmp = compareSaves(local, remote);
      if (cmp === "cloud-newer" && !window.confirm(t("set.google.older"))) return;
      if (cmp === "other-run" && !window.confirm(t("set.google.otherSave"))) return;
      await saveToGoogle(raw);
      markGoogleInStep("pushed", local);
      toast(t("set.google.saved"));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function loadCloud() {
    setBusy(true);
    try {
      const raw = await loadFromGoogle();
      if (!raw) {
        toast(t("set.google.empty"));
        return;
      }
      const remote = petFromBackupRaw(raw);
      if (!remote) {
        toast(t("set.badBackup"));
        return;
      }
      const local = petFromBackupRaw(readBackupRaw());
      const cmp = compareSaves(local, remote);
      if (cmp === "local-newer" && !window.confirm(t("set.google.newer"))) return;
      if (cmp === "other-run" && !window.confirm(t("set.google.otherLoad"))) return;
      loadPet(remote);
      markGoogleInStep("pulled", remote);
      toast(t("set.google.loaded"));
      onRestored?.();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  const status =
    snap.lastKind === "conflict"
      ? t("set.google.conflict")
      : snap.lastKind === "fail"
        ? t("set.google.fail")
        : snap.lastKind === "pulled"
          ? t("set.google.loaded")
          : snap.lastKind === "pushed"
            ? t("set.google.saved")
            : snap.lastKind === "idle"
              ? t("set.google.synced")
              : null;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4" aria-busy={locked}>
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{t("set.google")}</p>
      <p className="text-sm text-pretty text-muted">{t("set.google.d")}</p>
      {!configured ? (
        <p className="text-sm text-pretty text-muted">{t("set.google.need")}</p>
      ) : email && snap.live ? (
        <>
          <p className="text-sm text-fg">{t("set.google.as", { email })}</p>
          <p className="text-sm text-pretty text-muted">{t("set.google.auto")}</p>
          {status ? <p className="text-sm text-pretty text-muted">{status}</p> : null}
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" disabled={locked} onClick={() => void saveCloud()}>
              <CloudUpload />
              {t("set.google.save")}
            </Button>
            <Button type="button" variant="outline" disabled={locked} onClick={() => void loadCloud()}>
              <CloudDownload />
              {t("set.google.load")}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" className="self-start text-muted" disabled={locked} onClick={() => void signOut()}>
            <LogOut className="size-4" />
            {t("set.google.out")}
          </Button>
        </>
      ) : email ? (
        <>
          <p className="text-sm text-fg">{t("set.google.as", { email })}</p>
          <Button type="button" variant="outline" disabled={locked} onClick={() => void resume()}>
            <Cloud />
            {t("set.google.resume")}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="self-start text-muted" disabled={locked} onClick={() => void signOut()}>
            <LogOut className="size-4" />
            {t("set.google.out")}
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" disabled={locked} onClick={() => void signIn()}>
          <Cloud />
          {t("set.google.in")}
        </Button>
      )}
    </div>
  );
}
