import { toast } from "sonner";
import { readBackupRaw } from "@/lib/backup";
import {
  autoSyncAction,
  compareSaves,
  connectGoogle,
  disconnectGoogle,
  hasGoogleToken,
  isGoogleConfigured,
  loadFromGoogle,
  petFromBackupRaw,
  rememberedGoogleEmail,
  saveToGoogle,
  type GooglePrompt,
  type GoogleSyncAction,
  type SaveCmp,
} from "@/lib/google-drive";
import { t } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";
import { loadPet, usePetStore } from "@/store/pet-store";
import type { Pet } from "@/lib/tama/types";

const SAVE_DEBOUNCE_MS = 8_000;
const RECONCILE_GAP_MS = 30_000;

export type GoogleSyncKind = "pushed" | "pulled" | "idle" | "conflict" | "fail" | null;

export type GoogleSyncSnap = {
  email: string | null;
  live: boolean;
  lastKind: GoogleSyncKind;
  busy: boolean;
};

type Announce = boolean | "pull";

let snap: GoogleSyncSnap = {
  email: typeof localStorage === "undefined" ? null : rememberedGoogleEmail(),
  live: false,
  lastKind: null,
  busy: false,
};
const listeners = new Set<() => void>();
let applyingPull = false;
let lastStamp: string | null = null;
let lastReconcileAt = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let gate: Promise<void> = Promise.resolve();

function emit() {
  for (const fn of listeners) fn();
}

function tr(key: string) {
  return t(useLocaleStore.getState().locale, key);
}

function stamp(pet: Pet) {
  return `${pet.id}:${pet.hatchAt}:${pet.lastTickAt}:${pet.hunger}:${pet.happy}:${pet.form}:${pet.careMistakes}:${pet.discMistakes}:${pet.events.length}:${pet.soundOn}:${pet.notifOn}:${pet.firmware}:${pet.nickname}`;
}

function setSnap(patch: Partial<GoogleSyncSnap>) {
  snap = { ...snap, ...patch };
  emit();
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = gate.then(fn, fn);
  gate = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function getGoogleSyncSnap(): GoogleSyncSnap {
  return snap;
}

export function subscribeGoogleSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function markGoogleInStep(kind: "pushed" | "pulled", pet: Pet | null) {
  lastStamp = pet ? stamp(pet) : lastStamp;
  setSnap({ lastKind: kind, live: hasGoogleToken() });
}

function announce(action: GoogleSyncAction, mode: Announce) {
  if (mode === false) return;
  if (action === "conflict") toast(tr("set.google.conflict"));
  if (action === "pull") toast(tr("set.google.loaded"));
  if (mode === true && action === "push") toast(tr("set.google.saved"));
  if (mode === true && action === "none") toast(tr("set.google.ready"));
}

export async function reconcileGoogle(mode: Announce = false): Promise<{ cmp: SaveCmp; action: GoogleSyncAction }> {
  if (!isGoogleConfigured()) throw new Error("need");
  if (!hasGoogleToken()) {
    await connectGoogle("");
  }
  setSnap({ email: rememberedGoogleEmail(), live: hasGoogleToken(), busy: true });
  try {
    const raw = readBackupRaw();
    const local = petFromBackupRaw(raw) ?? usePetStore.getState().pet;
    const remoteRaw = await loadFromGoogle();
    const remote = petFromBackupRaw(remoteRaw);
    const cmp = compareSaves(local, remote);
    const action = autoSyncAction(cmp);
    lastReconcileAt = Date.now();

    if (action === "pull" && remote) {
      applyingPull = true;
      loadPet(remote);
      applyingPull = false;
      lastStamp = stamp(remote);
      setSnap({ lastKind: "pulled", live: true, busy: false });
      announce(action, mode);
      return { cmp, action };
    }

    if (action === "push" && raw && local) {
      await saveToGoogle(raw);
      lastStamp = stamp(local);
      setSnap({ lastKind: "pushed", live: true, busy: false });
      announce(action, mode);
      return { cmp, action };
    }

    if (action === "conflict") {
      setSnap({ lastKind: "conflict", live: true, busy: false });
      announce(action, mode);
      return { cmp, action };
    }

    if (local) lastStamp = stamp(local);
    setSnap({ lastKind: "idle", live: true, busy: false });
    return { cmp, action };
  } catch (err) {
    applyingPull = false;
    setSnap({ lastKind: "fail", live: hasGoogleToken(), busy: false });
    throw err;
  }
}

async function pushLocalIfSafe() {
  if (!hasGoogleToken() || applyingPull) return;
  const raw = readBackupRaw();
  const local = petFromBackupRaw(raw);
  if (!raw || !local) return;
  if (lastStamp === stamp(local)) return;
  setSnap({ busy: true, live: true, email: rememberedGoogleEmail() });
  try {
    const remote = petFromBackupRaw(await loadFromGoogle());
    const cmp = compareSaves(local, remote);
    const action = autoSyncAction(cmp);
    if (action === "conflict") {
      setSnap({ lastKind: "conflict", busy: false });
      return;
    }
    if (action === "pull") {
      setSnap({ busy: false });
      return;
    }
    await saveToGoogle(raw);
    lastStamp = stamp(local);
    setSnap({ lastKind: "pushed", busy: false });
  } catch {
    applyingPull = false;
    setSnap({ lastKind: "fail", live: hasGoogleToken(), busy: false });
  }
}

export function scheduleGoogleSave() {
  if (!hasGoogleToken() || applyingPull) return;
  const pet = usePetStore.getState().pet;
  if (!pet) return;
  if (lastStamp === stamp(pet)) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void enqueue(() => pushLocalIfSafe());
  }, SAVE_DEBOUNCE_MS);
}

export function flushGoogleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!hasGoogleToken() || applyingPull) return;
  void enqueue(() => pushLocalIfSafe());
}

export async function signInGoogle(prompt: GooglePrompt = "select_account"): Promise<string> {
  const email = await connectGoogle(prompt);
  setSnap({ email, live: true });
  await enqueue(() => reconcileGoogle(true));
  return email;
}

export async function resumeGoogle(): Promise<string> {
  try {
    return await signInGoogle("");
  } catch {
    return await signInGoogle("select_account");
  }
}

export async function signOutGoogle(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await disconnectGoogle();
  lastStamp = null;
  setSnap({ email: null, live: false, lastKind: null, busy: false });
}

async function trySilentBoot() {
  if (!isGoogleConfigured()) return;
  if (!rememberedGoogleEmail()) return;
  try {
    const email = await connectGoogle("none");
    setSnap({ email, live: true });
    await enqueue(() => reconcileGoogle("pull"));
  } catch {
    setSnap({ email: rememberedGoogleEmail(), live: false });
  }
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    flushGoogleSave();
    return;
  }
  if (!hasGoogleToken()) return;
  if (Date.now() - lastReconcileAt < RECONCILE_GAP_MS) return;
  void enqueue(() => reconcileGoogle(false).catch(() => undefined));
}

export function bootGoogleSync(): () => void {
  if (typeof window === "undefined") return () => undefined;
  setSnap({ email: rememberedGoogleEmail(), live: hasGoogleToken() });
  const unsubPet = usePetStore.subscribe((s, prev) => {
    if (s.pet === prev.pet) return;
    scheduleGoogleSave();
  });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flushGoogleSave);
  void trySilentBoot();
  return () => {
    unsubPet();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flushGoogleSave);
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  };
}
