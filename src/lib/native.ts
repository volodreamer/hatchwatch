import { CARE_WINDOW_MS } from "./tama/characters";
import { WARN_LEAD_MS } from "./tama/chirps";
import { derive } from "./tama/simulate";
import type { Pet } from "./tama/types";

export interface NativeAlarm {
  id: string;
  at: number;
  kind: string;
  title: string;
  body: string;
}

interface HatchwatchNative {
  schedule: (json: string) => void;
  cancelAll: () => void;
  saveFile?: (filename: string, mime: string, base64: string) => void;
}

function nativeBridge(): HatchwatchNative | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as unknown as { HatchwatchNative?: HatchwatchNative }).HatchwatchNative;
  return bridge ?? null;
}

export function isNative(): boolean {
  return nativeBridge() != null;
}

export function upcomingAlarms(pet: Pet, now: number): NativeAlarm[] {
  const d = derive(pet, now);
  const p = d.pet;
  const alarms: NativeAlarm[] = [];

  const add = (id: string, at: number | null, kind: string, title: string, body: string) => {
    if (at == null || !Number.isFinite(at)) return;
    alarms.push({ id, at, kind, title, body });
  };

  add("poop-due", p.checkPoopAt, "poop", "Look for poop", "The shell does not beep. Check the screen.");
  add("sick-due", p.checkSickAt, "sick", "Look for a skull", "The shell does not beep. Check for a skull.");
  add("disc-due", p.checkDiscAt, "discipline", "Check attention", "Misbehave may be on the shell. Confirm before the 15-minute window starts.");

  add("hunger", d.nextHungerDrainAt, "hunger", "Hunger dropping", "A hunger heart is about to fall.");
  add("happy", d.nextHappyDrainAt, "happy", "Happy dropping", "A happy heart is about to fall.");
  add("poop", d.nextPoopAt, "poop", "Look for poop", "Poop is on a timer. The shell will not beep.");
  add("sick", d.nextSicknessAt, "sick", "Look for a skull", "Scheduled sickness — not random. The shell will not beep.");

  const windowWarn = (id: string, windowAt: number | null, kind: string, title: string, body: string) => {
    if (windowAt == null) return;
    add(`${id}-warn`, windowAt + CARE_WINDOW_MS - WARN_LEAD_MS, kind, title, body);
    add(`${id}-late`, windowAt + CARE_WINDOW_MS, kind, title, body);
  };
  windowWarn("hunger", p.hungerWindowAt, "hunger", "2 minutes — hungry", "Feed a meal now or it is a care mistake.");
  windowWarn("happy", p.happyWindowAt, "happy", "2 minutes — unhappy", "Play a game now or it is a care mistake.");
  windowWarn("lights", p.sleepWindowAt && p.lightsOn ? p.sleepWindowAt : null, "lights", "2 minutes — lights", "Lights off now or it is a care mistake.");
  windowWarn("disc", p.misbehaveAt, "discipline", "2 minutes — discipline", "Scold now or wait, depending on the target.");

  if (d.nextSleepAt) add("sleep", d.nextSleepAt, "lights", "Bedtime", "Be ready to turn the lights off.");

  const seen = new Set<string>();
  return alarms
    .filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return a.at > now - 15_000;
    })
    .sort((a, b) => a.at - b.at)
    .slice(0, 24);
}

export function syncNativeAlarms(pet: Pet | null, now: number) {
  const bridge = nativeBridge();
  if (!bridge) return;
  if (!pet) {
    bridge.cancelAll();
    return;
  }
  bridge.schedule(JSON.stringify(upcomingAlarms(pet, now)));
}
