import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import {
  BackupError,
  compactBackupRaw,
  readBackupRaw,
  parsePet,
  saveBackupFile,
} from "@/lib/backup";
import type { Pet } from "@/lib/tama/types";
import { loadPet } from "@/store/pet-store";
import { GoogleDrivePanel } from "@/components/care/GoogleDrivePanel";
import { ClipboardPaste, Copy, Download, FolderOpen } from "lucide-react";
import { toast } from "sonner";

function applyPet(pet: Pet) {
  loadPet(pet);
}

export function BackupPanel({ onRestored }: { onRestored?: () => void }) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [openPaste, setOpenPaste] = useState(false);

  async function saveFile() {
    const raw = readBackupRaw();
    if (!raw) {
      toast(t("set.nothing"));
      return;
    }
    const result = await saveBackupFile(raw);
    if (result === "cancel") return;
    toast(t("set.savedFile"));
  }

  async function copyShort() {
    const raw = readBackupRaw();
    if (!raw) {
      toast(t("set.nothing"));
      return;
    }
    const short = compactBackupRaw(raw);
    setDraft(short);
    setOpenPaste(true);
    window.setTimeout(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.select();
    }, 0);
    try {
      await navigator.clipboard.writeText(short);
      toast(t("set.copiedShort", { n: short.length }));
    } catch {
      toast(t("set.copyManual"));
    }
  }

  function restoreText(text: string) {
    try {
      applyPet(parsePet(text));
      toast(t("set.restored"));
      onRestored?.();
    } catch (err) {
      toast(err instanceof BackupError && err.kind === "cutOff" ? t("set.cutOff") : t("set.badBackup"));
    }
  }

  async function restoreClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setOpenPaste(true);
        toast(t("set.noClip"));
        return;
      }
      restoreText(text);
    } catch {
      setOpenPaste(true);
      toast(t("set.noClip"));
    }
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      restoreText(String(reader.result ?? ""));
    };
    reader.onerror = () => toast(t("set.badBackup"));
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{t("set.backup")}</p>
      <p className="text-sm text-pretty text-muted">{t("set.backup.d")}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => void saveFile()}>
          <Download />
          {t("set.saveFile")}
        </Button>
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <FolderOpen />
          {t("set.openFile")}
        </Button>
        <Button type="button" variant="outline" onClick={() => void copyShort()}>
          <Copy />
          {t("set.copy")}
        </Button>
        <Button type="button" variant="outline" onClick={() => void restoreClipboard()}>
          <ClipboardPaste />
          {t("set.restoreClip")}
        </Button>
      </div>
      <Button type="button" variant="ghost" size="sm" className="self-start text-muted" onClick={() => setOpenPaste((v) => !v)}>
        {t("set.restore")}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json,text/plain"
        className="hidden"
        onChange={(e) => {
          onPickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {openPaste ? (
        <div className="flex flex-col gap-2">
          <textarea
            ref={areaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("set.pasteHere")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="min-h-32 w-full resize-y rounded-md bg-surface-2 px-3 py-2 font-mono text-xs leading-relaxed text-fg shadow-border placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          />
          {draft.trim() ? <p className="text-xs text-muted">{t("set.chars", { n: draft.length })}</p> : null}
          <Button
            type="button"
            onClick={() => {
              if (!draft.trim()) {
                toast(t("set.nothing"));
                return;
              }
              restoreText(draft);
            }}
          >
            {t("set.restoreGo")}
          </Button>
        </div>
      ) : null}
      <GoogleDrivePanel onRestored={onRestored} />
    </div>
  );
}
