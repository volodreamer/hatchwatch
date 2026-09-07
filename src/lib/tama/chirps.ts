import type { Pet } from "./types.ts";

/** Keep in sync with CARE_WINDOW_MS in characters.ts */
const CARE_WINDOW_MS = 15 * 60 * 1000;

export const WARN_LEAD_MS = 2 * 60 * 1000;

export type ChirpKind = "drop" | "warn";
export type ChirpAlertKind = "hunger" | "happy" | "lights" | "discipline" | "poop" | "sick";

export interface ChirpSnapshot {
  now: number;
  hunger: number;
  happy: number;
  hungerAt: number;
  happyAt: number;
  hungerWindowAt: number | null;
  happyWindowAt: number | null;
  sleepWindowAt: number | null;
  misbehaveAt: number | null;
  checkPoopAt: number | null;
  checkSickAt: number | null;
  checkDiscAt: number | null;
}

export interface ChirpEvent {
  kind: ChirpKind;
  alertKind: ChirpAlertKind;
  key: string;
}

export function snapshotFromPet(pet: Pet, now: number): ChirpSnapshot {
  return {
    now,
    hunger: pet.hunger,
    happy: pet.happy,
    hungerAt: pet.hungerAt,
    happyAt: pet.happyAt,
    hungerWindowAt: pet.hungerWindowAt,
    happyWindowAt: pet.happyWindowAt,
    sleepWindowAt: pet.sleepWindowAt,
    misbehaveAt: pet.misbehaveAt,
    checkPoopAt: pet.checkPoopAt,
    checkSickAt: pet.checkSickAt,
    checkDiscAt: pet.checkDiscAt,
  };
}

function pushUnique(out: ChirpEvent[], fired: Set<string>, event: ChirpEvent) {
  if (fired.has(event.key)) return;
  fired.add(event.key);
  out.push(event);
}

function remaining(windowAt: number, now: number) {
  return windowAt + CARE_WINDOW_MS - now;
}

/**
 * Discrete care chirps — never a looping alarm.
 * - 3-note drop when a heart falls, a call window opens, or a silent shell event is due
 * - 5-note warning once, 2 minutes before a 15-minute penalty
 * Poop and sickness never beep on the shell — the phone must.
 */
export function chirpEvents(prev: ChirpSnapshot | null, next: ChirpSnapshot, fired: Set<string>): ChirpEvent[] {
  const events: ChirpEvent[] = [];
  const drops: ChirpEvent[] = [];

  if (prev) {
    if (next.hunger < prev.hunger) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "hunger", key: `drop:hunger:${next.hungerAt}` });
    } else if (!prev.hungerWindowAt && next.hungerWindowAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "hunger", key: `drop:hunger:${next.hungerWindowAt}` });
    }

    if (next.happy < prev.happy) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "happy", key: `drop:happy:${next.happyAt}` });
    } else if (!prev.happyWindowAt && next.happyWindowAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "happy", key: `drop:happy:${next.happyWindowAt}` });
    }

    if (!prev.sleepWindowAt && next.sleepWindowAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "lights", key: `drop:lights:${next.sleepWindowAt}` });
    }
    if (!prev.misbehaveAt && next.misbehaveAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "discipline", key: `drop:disc:${next.misbehaveAt}` });
    }
    if (!prev.checkDiscAt && next.checkDiscAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "discipline", key: `drop:disc-check:${next.checkDiscAt}` });
    }
    if (!prev.checkPoopAt && next.checkPoopAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "poop", key: `drop:poop:${next.checkPoopAt}` });
    }
    if (!prev.checkSickAt && next.checkSickAt) {
      pushUnique(drops, fired, { kind: "drop", alertKind: "sick", key: `drop:sick:${next.checkSickAt}` });
    }
  }

  if (drops.length) events.push(drops[0]);

  const checkWarn = (alertKind: ChirpAlertKind, windowAt: number | null) => {
    if (windowAt == null) return;
    const left = remaining(windowAt, next.now);
    if (left <= 0 || left > WARN_LEAD_MS) return;
    pushUnique(events, fired, { kind: "warn", alertKind, key: `warn:${alertKind}:${windowAt}` });
  };

  checkWarn("hunger", next.hungerWindowAt);
  checkWarn("happy", next.happyWindowAt);
  checkWarn("lights", next.sleepWindowAt);
  checkWarn("discipline", next.misbehaveAt);

  return events;
}

export const CHIRP_LABEL: Record<ChirpKind, Partial<Record<ChirpAlertKind, { title: string; body: string }>>> = {
  drop: {
    hunger: { title: "Hunger dropped", body: "A hunger heart just fell. Feed before the 15-minute call runs out." },
    happy: { title: "Happy dropped", body: "A happy heart just fell. Play a game before the call times out." },
    lights: { title: "It fell asleep", body: "Turn the lights off within 15 minutes." },
    discipline: { title: "Check attention", body: "Misbehave is due after heart drops — not random. Look at the shell." },
    poop: { title: "Look for poop", body: "Poop is on a timer. The shell will not beep." },
    sick: { title: "Look for a skull", body: "A sickness timer fired — not dice. The shell will not beep." },
  },
  warn: {
    hunger: { title: "2 minutes — hungry", body: "Feed a meal now or it is a care mistake." },
    happy: { title: "2 minutes — unhappy", body: "Play a game now or it is a care mistake." },
    lights: { title: "2 minutes — lights", body: "Lights off now or it is a care mistake." },
    discipline: { title: "2 minutes — discipline", body: "Scold now or wait, depending on the target." },
  },
};
