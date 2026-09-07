import type { Pet } from "./tama/types";

export const BACKUP_KEY = "hatchwatch-v1";

export class BackupError extends Error {
  kind: "cutOff" | "bad";
  constructor(kind: "cutOff" | "bad") {
    super(kind);
    this.name = "BackupError";
    this.kind = kind;
  }
}

export function readBackupRaw(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(BACKUP_KEY);
}

/** Drop the care log so the JSON fits a phone paste box / old prompt restore. */
export function compactBackupRaw(raw: string): string {
  const pet = parsePet(raw);
  return JSON.stringify({ state: { pet: { ...pet, events: [] } }, version: 0 });
}

export function extractJsonObject(text: string): string {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export function looksCutOff(text: string): boolean {
  const cleaned = extractJsonObject(text);
  if (!cleaned) return false;
  const opens = (cleaned.match(/\{/g) ?? []).length;
  const closes = (cleaned.match(/\}/g) ?? []).length;
  if (opens > closes) return true;
  if (/[,:]\s*$/.test(cleaned)) return true;
  if (cleaned.startsWith("{") && !cleaned.endsWith("}")) return true;
  return false;
}

export function parsePet(text: string): Pet {
  const cleaned = extractJsonObject(text);
  try {
    const parsed = JSON.parse(cleaned) as { state?: { pet?: Pet }; pet?: Pet };
    const next = parsed.state?.pet ?? parsed.pet ?? (parsed as unknown as Pet);
    if (!next || typeof next.hatchAt !== "number" || !next.form) {
      throw new BackupError("bad");
    }
    if (!Array.isArray(next.events)) next.events = [];
    return {
      ...next,
      firmware: next.firmware === "vintage" ? "vintage" : "replica",
      checkPoopAt: next.checkPoopAt ?? null,
      checkSickAt: next.checkSickAt ?? null,
      checkDiscAt: next.checkDiscAt ?? null,
      stageSickDone: Boolean(next.stageSickDone),
    };
  } catch (err) {
    if (err instanceof BackupError) throw err;
    throw new BackupError(looksCutOff(text) ? "cutOff" : "bad");
  }
}

function backupFilename() {
  const day = new Date().toISOString().slice(0, 10);
  return `hatchwatch-${day}.json`;
}

/** Chrome reports "file unavailable" if the blob URL is revoked before the download shelf finishes. */
const BLOB_TTL_MS = 300_000;

export async function saveNamedFile(file: File): Promise<"shared" | "download" | "cancel"> {
  const native = (typeof window !== "undefined" &&
    (window as unknown as { HatchwatchNative?: { saveFile?: (n: string, m: string, b: string) => void } }).HatchwatchNative) ||
    null;
  if (native?.saveFile) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    native.saveFile(file.name, file.type || "application/octet-stream", btoa(binary));
    return "download";
  }
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (typeof nav.canShare === "function" && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Hatchwatch" });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancel";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, BLOB_TTL_MS);
  return "download";
}

export async function saveBackupFile(raw: string): Promise<"shared" | "download" | "cancel"> {
  return saveNamedFile(new File([raw], backupFilename(), { type: "application/json" }));
}

export async function saveUrlFile(
  url: string,
  filename: string,
  mime = "application/zip",
): Promise<"shared" | "download" | "cancel"> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("missing");
  const buf = await res.arrayBuffer();
  return saveNamedFile(new File([buf], filename, { type: mime }));
}
