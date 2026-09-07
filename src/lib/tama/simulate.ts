import {
  BABY_MS,
  BABY_NAP_MS,
  BABY_POOP_MS,
  CARE_WINDOW_MS,
  CHARACTERS,
  EGG_MS,
  KUCHITA_MS,
  MARU_MS,
  POOP_INTERVAL_MIN,
  SECRET_WAIT_MS,
  TAMATCHI_MS,
  happyLossMin,
  hungerLossMin,
  statsFor,
} from "./characters.ts";
import { addAwakeMs, isSleepingAt, nextSleepAt, nextWakeAt } from "./clock.ts";
import {
  adultFrom,
  canBecomeSecret,
  discForEvo,
  mistakeBudget,
  nextFormAfter,
  onTarget,
  pathStatus,
  predictedAdult,
  teenCharacter,
  teenKindForForm,
  teenKindNow,
} from "./evolution.ts";
import type {
  ActionType,
  CareAlert,
  CareEvent,
  CharacterId,
  DerivedState,
  Firmware,
  Pet,
  Urgency,
} from "./types.ts";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushEvent(pet: Pet, type: ActionType, at: number, note?: string, meta?: CareEvent["meta"]): Pet {
  return {
    ...pet,
    events: [{ id: uid(), at, type, note, meta }, ...pet.events].slice(0, 200),
  };
}

function stats(pet: Pet) {
  return statsFor(pet.form);
}

function schedule(pet: Pet) {
  const s = stats(pet);
  return { wake: s.wakeHour, sleep: s.sleepHour };
}

/** Old backups lack firmware / check fields. */
export function normalizePet(raw: Pet): Pet {
  return {
    ...raw,
    firmware: raw.firmware === "vintage" ? "vintage" : "replica",
    checkPoopAt: raw.checkPoopAt ?? null,
    checkSickAt: raw.checkSickAt ?? null,
    checkDiscAt: raw.checkDiscAt ?? null,
    stageSickDone: Boolean(raw.stageSickDone),
  };
}

export function createPet(opts: {
  hatchAt: number;
  clockSetAt?: number;
  targetId: Pet["targetId"];
  region: Pet["region"];
  firmware?: Firmware;
  nickname?: string;
  now?: number;
}): Pet {
  const now = opts.now ?? Date.now();
  const hatchAt = opts.hatchAt;
  const clockSetAt = opts.clockSetAt ?? hatchAt - EGG_MS;
  const hatched = now >= hatchAt;
  const form: CharacterId = hatched ? "babytchi" : "egg";
  const pet: Pet = {
    id: uid(),
    nickname: opts.nickname?.trim() || "My P1",
    hatchAt,
    clockSetAt,
    targetId: opts.targetId,
    region: opts.region,
    firmware: opts.firmware ?? "replica",
    createdAt: now,
    lastTickAt: Math.min(now, hatchAt),
    form,
    teenKind: null,
    stageStartedAt: hatched ? hatchAt : clockSetAt,
    secretEligible: false,
    hunger: 0,
    hungerAt: hatchAt,
    happy: 0,
    happyAt: hatchAt,
    discipline: 0,
    weight: 5,
    careMistakes: 0,
    discMistakes: 0,
    poop: 0,
    poopAt: hatchAt,
    sick: false,
    medicineGiven: 0,
    sleeping: false,
    lightsOn: true,
    age: 0,
    hungerWindowAt: hatched ? hatchAt : null,
    happyWindowAt: hatched ? hatchAt : null,
    sleepWindowAt: null,
    misbehaveAt: null,
    heartDecrements: 0,
    checkPoopAt: null,
    checkSickAt: null,
    checkDiscAt: null,
    stageSickDone: false,
    snackCount: 0,
    events: [],
    notifOn: false,
    soundOn: true,
  };
  let seeded = pet;
  if (!hatched) {
    seeded = pushEvent(seeded, "hatch", hatchAt, "Egg is waiting");
  } else {
    seeded = pushEvent(seeded, "hatch", hatchAt, "Hatched as Babytchi");
    seeded.hungerWindowAt = hatchAt;
    seeded.happyWindowAt = hatchAt;
  }
  return catchUp(seeded, now);
}

export function createDemoPet(now = Date.now()): Pet {
  const hatchAt = now - (BABY_MS + 95 * 60 * 1000);
  const stageStartedAt = hatchAt + BABY_MS;
  const pet: Pet = {
    id: uid(),
    nickname: "Demo",
    hatchAt,
    clockSetAt: hatchAt - EGG_MS,
    targetId: "mametchi",
    region: "en",
    firmware: "replica",
    createdAt: now,
    lastTickAt: now,
    form: "marutchi",
    teenKind: null,
    stageStartedAt,
    secretEligible: false,
    hunger: 1,
    hungerAt: now - 42 * 60 * 1000,
    happy: 2,
    happyAt: now - 18 * 60 * 1000,
    discipline: 25,
    weight: 12,
    careMistakes: 0,
    discMistakes: 0,
    poop: 1,
    poopAt: now - 40 * 60 * 1000,
    sick: false,
    medicineGiven: 0,
    sleeping: false,
    lightsOn: true,
    age: 1,
    hungerWindowAt: null,
    happyWindowAt: null,
    sleepWindowAt: null,
    misbehaveAt: null,
    heartDecrements: 3,
    checkPoopAt: null,
    checkSickAt: null,
    checkDiscAt: null,
    stageSickDone: false,
    snackCount: 0,
    events: [
      { id: uid(), at: hatchAt, type: "hatch", note: "Hatched as Babytchi" },
      { id: uid(), at: stageStartedAt, type: "evolve", note: "Evolved into Marutchi", meta: { form: "marutchi" } },
      { id: uid(), at: now - 40 * 60 * 1000, type: "poop", note: "Poop ×1" },
    ],
    notifOn: false,
    soundOn: true,
  };
  return pet;
}

function nextDrainAt(
  lastAt: number,
  hearts: number,
  lossMin: number,
  wake: number | null,
  sleep: number | null,
): number | null {
  if (hearts <= 0) return null;
  return addAwakeMs(lastAt, lossMin * 60 * 1000, wake, sleep);
}

function nextPoopAt(pet: Pet): number | null {
  if (pet.form === "egg") return null;
  if (pet.checkPoopAt != null) return null;
  const interval = POOP_INTERVAL_MIN[pet.form] * 60 * 1000;
  const { wake, sleep } = schedule(pet);
  return addAwakeMs(pet.poopAt, interval, wake, sleep);
}

/** ROM "base time to sickness" — once per stage, not random. Awake minutes from stage start. */
export function nextSicknessAt(pet: Pet): number | null {
  if (pet.form === "egg" || pet.sick || pet.stageSickDone || pet.checkSickAt != null) return null;
  const min = stats(pet).sicknessMin;
  if (!Number.isFinite(min) || min >= 9000) return null;
  const { wake, sleep } = schedule(pet);
  return addAwakeMs(pet.stageStartedAt, min * 60 * 1000, wake, sleep);
}

export function remainingDiscDrops(pet: Pet): number | null {
  const c = stats(pet).disciplineCountdown;
  if (c == null) return null;
  if (pet.firmware === "vintage" && pet.discipline >= 100) return null;
  if (pet.checkDiscAt != null || pet.misbehaveAt != null) return 0;
  return Math.max(0, c - pet.heartDecrements);
}

export function evolutionDueAt(pet: Pet): number | null {
  if (pet.form === "egg") return pet.hatchAt;
  if (pet.form === "babytchi") return pet.stageStartedAt + BABY_MS;
  if (pet.form === "marutchi") return pet.stageStartedAt + MARU_MS;
  if (pet.form === "tamatchi") return pet.stageStartedAt + TAMATCHI_MS;
  if (pet.form === "kuchitamatchi") return pet.stageStartedAt + KUCHITA_MS;
  if (pet.form === "maskutchi" && pet.secretEligible) {
    return pet.stageStartedAt + SECRET_WAIT_MS;
  }
  return null;
}

function evolve(pet: Pet, at: number): Pet {
  const next = nextFormAfter(pet);
  if (!next) return pet;
  let p: Pet = { ...pet };
  if (p.form === "egg") {
    p.form = "babytchi";
    p.stageStartedAt = at;
    p.hunger = 0;
    p.happy = 0;
    p.hungerAt = at;
    p.happyAt = at;
    p.hungerWindowAt = at;
    p.happyWindowAt = at;
    p.weight = 5;
    p = pushEvent(p, "hatch", at, "Hatched as Babytchi");
    return p;
  }
  if (p.form === "marutchi") {
    const kind = teenKindNow(p);
    p.teenKind = kind;
    p.form = teenCharacter(kind);
    p.discipline = kind.endsWith("t1") ? Math.max(p.discipline, 50) : p.discipline;
  } else if (p.form === "tamatchi" || p.form === "kuchitamatchi") {
    const kind = teenKindNow(p);
    p.form = adultFrom(kind, p.careMistakes, discForEvo(p), p.region);
    p.secretEligible = canBecomeSecret(kind, p.form);
  } else {
    p.form = next;
  }
  const s = statsFor(p.form);
  p.stageStartedAt = at;
  p.weight = Math.max(p.weight, s.minWeight);
  p.medicineGiven = 0;
  p.heartDecrements = 0;
  p.misbehaveAt = null;
  p.checkPoopAt = null;
  p.checkSickAt = null;
  p.checkDiscAt = null;
  p.stageSickDone = false;
  p.snackCount = 0;
  p.hungerAt = at;
  p.happyAt = at;
  p.sleeping = isSleepingAt(at, s.wakeHour, s.sleepHour);
  p = pushEvent(p, "evolve", at, `Evolved into ${s.name}`, { form: p.form });
  return p;
}

function countCareMiss(pet: Pet, at: number, reason: string): Pet {
  let p: Pet = { ...pet, careMistakes: pet.careMistakes + 1 };
  p = pushEvent(p, "miss-care", at, reason, { total: p.careMistakes });
  return p;
}

function countDiscMiss(pet: Pet, at: number): Pet {
  let p: Pet = {
    ...pet,
    misbehaveAt: null,
    checkDiscAt: null,
    heartDecrements: 0,
  };
  if (p.firmware === "vintage") {
    return pushEvent(p, "miss-disc", at, "Vintage: ignored scold does not add a discipline mistake");
  }
  p = { ...p, discMistakes: pet.discMistakes + 1 };
  p = pushEvent(p, "miss-disc", at, "Ignored a misbehave call", { total: p.discMistakes });
  return p;
}

function dropHeart(pet: Pet, meter: "hunger" | "happy", at: number): Pet {
  let p: Pet = { ...pet };
  if (meter === "hunger") {
    p.hunger = Math.max(0, p.hunger - 1);
    p.hungerAt = at;
    if (p.hunger === 0) p.hungerWindowAt = at;
  } else {
    p.happy = Math.max(0, p.happy - 1);
    p.happyAt = at;
    if (p.happy === 0) p.happyWindowAt = at;
  }
  p.heartDecrements += 1;
  const s = stats(p);
  if (
    s.disciplineCountdown != null &&
    p.misbehaveAt == null &&
    p.checkDiscAt == null &&
    p.hunger > 0 &&
    p.happy > 0 &&
    p.heartDecrements >= s.disciplineCountdown
  ) {
    if (p.firmware === "vintage" && p.discipline >= 100) {
      p.heartDecrements = 0;
    } else {
      p.checkDiscAt = at;
    }
  }
  return p;
}

function applyTimePoint(pet: Pet, at: number): Pet {
  let p: Pet = { ...pet };
  const s = stats(p);
  const due = evolutionDueAt(p);
  if (due != null && at >= due) {
    p.lastTickAt = at;
    return evolve(p, at);
  }

  if (p.form === "babytchi") {
    const sinceHatch = at - p.hatchAt;
    if (sinceHatch >= BABY_POOP_MS && p.poop === 0 && p.checkPoopAt == null && p.events.every((e) => e.type !== "poop" && e.type !== "confirm")) {
      p.checkPoopAt = at;
      p = pushEvent(p, "poop", at, "First poop is due — look at the shell");
    }
    if (sinceHatch >= BABY_NAP_MS && p.age === 0) {
      p.age = 1;
      p = pushEvent(p, "nap", at, "Baby nap — age +1");
    }
  }

  const sleepingNow = isSleepingAt(at, s.wakeHour, s.sleepHour);
  if (sleepingNow && !p.sleeping) {
    p.sleeping = true;
    p.sleepWindowAt = at;
    p.lightsOn = true;
    p = pushEvent(p, "sleep", at, `Sleeping — lights off before ${new Date(at + CARE_WINDOW_MS).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    p.lastTickAt = at;
    return p;
  }
  if (!sleepingNow && p.sleeping) {
    p.sleeping = false;
    p.age += 1;
    p.lightsOn = true;
    p.sleepWindowAt = null;
    p = pushEvent(p, "wake", at, `Woke up — age ${p.age}`);
    p.lastTickAt = at;
    return p;
  }

  if (
    p.sleepWindowAt != null &&
    p.lightsOn &&
    at - p.sleepWindowAt >= CARE_WINDOW_MS
  ) {
    p = countCareMiss(p, at, "Did not turn the lights off");
    p.sleepWindowAt = null;
  }

  if (p.hungerWindowAt != null && at - p.hungerWindowAt >= CARE_WINDOW_MS) {
    p = countCareMiss(p, at, "Missed a hunger call");
    p.hungerWindowAt = null;
  }
  if (p.happyWindowAt != null && at - p.happyWindowAt >= CARE_WINDOW_MS) {
    p = countCareMiss(p, at, "Missed a happy call");
    p.happyWindowAt = null;
  }
  if (p.misbehaveAt != null && at - p.misbehaveAt >= CARE_WINDOW_MS) {
    p = countDiscMiss(p, at);
  }

  if (!p.sleeping) {
    const { wake, sleep } = schedule(p);
    const hungerDue = nextDrainAt(p.hungerAt, p.hunger, hungerLossMin(p.form, p.age), wake, sleep);
    if (hungerDue != null && at >= hungerDue) {
      p = dropHeart(p, "hunger", at);
    }
    const happyDue = nextDrainAt(p.happyAt, p.happy, happyLossMin(p.form, p.age), wake, sleep);
    if (happyDue != null && at >= happyDue) {
      p = dropHeart(p, "happy", at);
    }
    const poopDue = nextPoopAt(p);
    if (poopDue != null && at >= poopDue && p.poop < 4 && p.checkPoopAt == null) {
      p.checkPoopAt = at;
      p = pushEvent(p, "poop", at, "Poop is due — look at the shell (no beep)");
    }
    const sickDue = nextSicknessAt(p);
    if (sickDue != null && at >= sickDue && p.checkSickAt == null) {
      p.checkSickAt = at;
      p = pushEvent(p, "sick", at, "Scheduled skull — look at the shell (no beep)");
    }
  }

  p.lastTickAt = at;
  return p;
}

function nextEventAt(pet: Pet, from: number): number | null {
  const s = stats(pet);
  const { wake, sleep } = schedule(pet);
  const candidates: number[] = [];
  const due = evolutionDueAt(pet);
  if (due != null && due > from) candidates.push(due);

  const sl = nextSleepAt(from + 1, wake, sleep);
  if (sl != null) candidates.push(sl);
  const wk = nextWakeAt(from + 1, wake, sleep);
  if (wk != null) candidates.push(wk);

  if (pet.hungerWindowAt != null) candidates.push(pet.hungerWindowAt + CARE_WINDOW_MS);
  if (pet.happyWindowAt != null) candidates.push(pet.happyWindowAt + CARE_WINDOW_MS);
  if (pet.sleepWindowAt != null && pet.lightsOn) candidates.push(pet.sleepWindowAt + CARE_WINDOW_MS);
  if (pet.misbehaveAt != null) candidates.push(pet.misbehaveAt + CARE_WINDOW_MS);

  if (!pet.sleeping && !isSleepingAt(from + 1, wake, sleep)) {
    const hd = nextDrainAt(pet.hungerAt, pet.hunger, hungerLossMin(pet.form, pet.age), wake, sleep);
    const hp = nextDrainAt(pet.happyAt, pet.happy, happyLossMin(pet.form, pet.age), wake, sleep);
    if (hd != null) candidates.push(hd);
    if (hp != null) candidates.push(hp);
    const po = nextPoopAt(pet);
    if (po != null) candidates.push(po);
    const sk = nextSicknessAt(pet);
    if (sk != null) candidates.push(sk);
  }

  if (pet.form === "babytchi") {
    const poopT = pet.hatchAt + BABY_POOP_MS;
    const napT = pet.hatchAt + BABY_NAP_MS;
    if (poopT > from) candidates.push(poopT);
    if (napT > from) candidates.push(napT);
  }

  const future = candidates.filter((t) => t > from);
  if (future.length === 0) return null;
  return Math.min(...future);
}

export function catchUp(pet: Pet, now: number): Pet {
  let p: Pet = { ...normalizePet(pet), events: [...pet.events] };
  if (now <= p.lastTickAt) {
    p.lastTickAt = now;
    return p;
  }
  let guard = 0;
  while (guard++ < 2500) {
    const n = nextEventAt(p, p.lastTickAt);
    if (n == null || n > now) {
      p.lastTickAt = now;
      const s = stats(p);
      p.sleeping = isSleepingAt(now, s.wakeHour, s.sleepHour);
      return p;
    }
    p = applyTimePoint(p, n);
  }
  p.lastTickAt = now;
  return p;
}

export function applyAction(pet: Pet, type: ActionType, at: number): Pet {
  let p = catchUp({ ...pet, events: [...pet.events] }, at);
  const s = stats(p);

  switch (type) {
    case "meal": {
      if (p.sleeping) return pushEvent(p, "meal", at, "Sleeping — meal ignored on the device");
      if (p.hunger >= 4) return pushEvent(p, "meal", at, "Full — it may refuse the meal");
      p.hunger = Math.min(4, p.hunger + 1);
      p.hungerAt = at;
      p.hungerWindowAt = null;
      p.weight = Math.min(s.maxWeight, p.weight + 1);
      const note =
        p.misbehaveAt != null
          ? `Meal · hunger ${p.hunger}/4 · ${p.weight}g (shell ate — scold if it was refusing)`
          : `Meal · hunger ${p.hunger}/4 · ${p.weight}g`;
      p = pushEvent(p, "meal", at, note);
      return p;
    }
    case "snack": {
      if (p.sleeping) return pushEvent(p, "snack", at, "Sleeping — snack ignored on the device");
      p.happy = Math.min(4, p.happy + 1);
      p.happyAt = at;
      p.happyWindowAt = null;
      p.weight = Math.min(s.maxWeight, p.weight + 2);
      p.snackCount += 1;
      const warn =
        p.firmware === "replica" &&
        (p.form === "babytchi" || p.form === "marutchi" || p.form === "tamatchi" || p.form === "kuchitamatchi") &&
        p.snackCount >= 4
          ? " Replica: too many snacks can sicken a child/teen. Look for a skull."
          : "";
      p = pushEvent(p, "snack", at, `Snack · happy ${p.happy}/4 · ${p.weight}g.${warn}`);
      if (
        p.firmware === "replica" &&
        (p.form === "marutchi" || p.form === "tamatchi" || p.form === "kuchitamatchi") &&
        p.snackCount >= 4 &&
        !p.sick &&
        p.checkSickAt == null
      ) {
        p.checkSickAt = at;
      }
      return p;
    }
    case "game": {
      if (p.sleeping) return pushEvent(p, "game", at, "Sleeping — game ignored");
      p.happy = Math.min(4, p.happy + 1);
      p.happyAt = at;
      p.happyWindowAt = null;
      p.weight = Math.max(s.minWeight, p.weight - 1);
      const note =
        p.misbehaveAt != null
          ? `Game won · happy ${p.happy}/4 · ${p.weight}g (shell played — scold if it was refusing)`
          : `Game won · happy ${p.happy}/4 · ${p.weight}g`;
      p = pushEvent(p, "game", at, note);
      return p;
    }
    case "clean": {
      const had = p.poop;
      p.poop = 0;
      p.poopAt = at;
      p.checkPoopAt = null;
      p = pushEvent(p, "clean", at, had ? `Cleaned ${had} poop${had === 1 ? "" : "s"}` : "Cleaned — nothing there");
      return p;
    }
    case "scold": {
      const from = p.discipline;
      p.discipline = Math.min(100, p.discipline + 25);
      p.misbehaveAt = null;
      p.checkDiscAt = null;
      p.heartDecrements = 0;
      p = pushEvent(p, "scold", at, `Scolded · discipline ${p.discipline}%`, { from, to: p.discipline });
      return p;
    }
    case "medicine": {
      if (!p.sick) return pushEvent(p, "medicine", at, "Not sick");
      p.medicineGiven += 1;
      if (p.medicineGiven >= s.shots) {
        p.sick = false;
        p.medicineGiven = 0;
        p.checkSickAt = null;
        p.stageSickDone = true;
        p = pushEvent(p, "heal", at, "Recovered");
      } else {
        p = pushEvent(p, "medicine", at, `Medicine ${p.medicineGiven}/${s.shots}`);
      }
      return p;
    }
    case "lights-off": {
      p.lightsOn = false;
      p.sleepWindowAt = null;
      p = pushEvent(p, "lights-off", at, "Lights off");
      return p;
    }
    case "miss-care": {
      p = countCareMiss(p, at, "Logged a care mistake");
      p.hungerWindowAt = null;
      p.happyWindowAt = null;
      p.sleepWindowAt = null;
      return p;
    }
    case "miss-disc": {
      return countDiscMiss(p, at);
    }
    case "sick": {
      p.sick = true;
      p.medicineGiven = 0;
      return pushEvent(p, "sick", at, "Marked sick");
    }
    default:
      return p;
  }
}

export function undoLastCare(pet: Pet): Pet {
  const last = pet.events.find((e) =>
    ["meal", "snack", "game", "clean", "scold", "medicine", "lights-off", "miss-care", "miss-disc", "sick"].includes(
      e.type,
    ),
  );
  if (!last) return pet;
  const p: Pet = { ...pet, events: pet.events.filter((e) => e.id !== last.id) };
  if (last.type === "miss-care") p.careMistakes = Math.max(0, p.careMistakes - 1);
  if (last.type === "miss-disc") p.discMistakes = Math.max(0, p.discMistakes - 1);
  if (last.type === "meal") {
    p.hunger = Math.max(0, p.hunger - 1);
    p.weight = Math.max(stats(p).minWeight, p.weight - 1);
  }
  if (last.type === "snack") {
    p.happy = Math.max(0, p.happy - 1);
    p.weight = Math.max(stats(p).minWeight, p.weight - 2);
    p.snackCount = Math.max(0, p.snackCount - 1);
  }
  if (last.type === "game") {
    p.happy = Math.max(0, p.happy - 1);
    p.weight = Math.min(stats(p).maxWeight, p.weight + 1);
  }
  if (last.type === "scold" && !last.note?.startsWith("Nothing")) {
    p.discipline = Math.max(0, p.discipline - 25);
  }
  if (last.type === "lights-off") p.lightsOn = true;
  if (last.type === "sick") p.sick = false;
  return pushEvent(p, "undo-miss", Date.now(), `Undid ${last.type}`);
}

/** Shell does not show this. Clears the icon without a scold, shot, or duck. */
export function dismissOffShell(pet: Pet, kind: "poop" | "sick" | "discipline", at = Date.now()): Pet {
  const p: Pet = { ...normalizePet(pet), lastTickAt: at };
  if (kind === "poop") {
    p.poop = 0;
    p.poopAt = at;
    p.checkPoopAt = null;
    return pushEvent(p, "sync", at, "No poop on the shell — next check from now");
  }
  if (kind === "sick") {
    p.sick = false;
    p.medicineGiven = 0;
    p.checkSickAt = null;
    p.stageSickDone = true;
    return pushEvent(p, "sync", at, "No skull on the shell");
  }
  p.misbehaveAt = null;
  p.checkDiscAt = null;
  p.heartDecrements = 0;
  return pushEvent(p, "sync", at, "No attention on the shell");
}

/** User looked: the shell matches the prediction. Starts the real 15-min window for discipline. */
export function confirmOnShell(pet: Pet, kind: "poop" | "sick" | "discipline", at = Date.now()): Pet {
  let p: Pet = { ...normalizePet(pet), lastTickAt: at };
  if (kind === "poop") {
    p.poop = Math.min(4, p.poop + 1);
    p.poopAt = at;
    p.checkPoopAt = null;
    p = pushEvent(p, "confirm", at, `Poop on the shell ×${p.poop}`);
    if (p.poop >= 4 && !p.sick) {
      p.sick = true;
      p.medicineGiven = 0;
      p.stageSickDone = true;
      p.checkSickAt = null;
      p = pushEvent(p, "sick", at, "Four poops — skull");
    }
    return p;
  }
  if (kind === "sick") {
    p.sick = true;
    p.medicineGiven = 0;
    p.checkSickAt = null;
    p.stageSickDone = true;
    return pushEvent(p, "confirm", at, "Skull on the shell");
  }
  p.checkDiscAt = null;
  p.misbehaveAt = at;
  p.heartDecrements = 0;
  return pushEvent(p, "confirm", at, "Attention on the shell — 15 min to scold");
}

export function syncPet(
  pet: Pet,
  patch: Partial<
    Pick<
      Pet,
      | "hunger"
      | "happy"
      | "discipline"
      | "weight"
      | "careMistakes"
      | "discMistakes"
      | "poop"
      | "sick"
      | "form"
      | "age"
      | "sleeping"
    >
  >,
  at = Date.now(),
  opts?: { restartStage?: boolean; attention?: boolean },
): Pet {
  const formChanged = patch.form != null && patch.form !== pet.form;
  const p: Pet = { ...pet, ...patch, lastTickAt: at };
  if (patch.hunger != null && patch.hunger !== pet.hunger) {
    p.hungerAt = at;
    p.hungerWindowAt = p.hunger === 0 ? at : null;
  }
  if (patch.happy != null && patch.happy !== pet.happy) {
    p.happyAt = at;
    p.happyWindowAt = p.happy === 0 ? at : null;
  }
  if (patch.poop != null && patch.poop !== pet.poop) {
    p.poopAt = at;
  }
  if (patch.sick === false) {
    p.medicineGiven = 0;
  }
  if (opts?.attention === false) {
    p.misbehaveAt = null;
    p.heartDecrements = 0;
  } else if (opts?.attention === true && p.misbehaveAt == null) {
    p.misbehaveAt = at;
  }
  if (formChanged || opts?.restartStage) {
    p.stageStartedAt = at;
    p.heartDecrements = 0;
    p.misbehaveAt = null;
    p.hungerAt = at;
    p.happyAt = at;
    p.weight = Math.max(p.weight, statsFor(p.form).minWeight);
  }
  if (p.form === "tamatchi" || p.form === "kuchitamatchi") {
    p.teenKind = teenKindForForm(p);
  }
  if (formChanged && (statsFor(p.form).stage === "adult" || statsFor(p.form).stage === "secret")) {
    p.secretEligible =
      p.form === "maskutchi" &&
      (p.targetId === "bill" || p.targetId === "oyajitchi") &&
      canBecomeSecret(teenKindNow(p), "maskutchi");
  }
  const note = formChanged
    ? `Matched ${statsFor(p.form).name} · mistakes carry over`
    : opts?.restartStage
      ? "Matched · stage timer restarted"
      : "Matched to the device";
  return pushEvent(p, "sync", at, note, { form: p.form });
}

function urgencyFor(dueAt: number, now: number, window = false): Urgency {
  const left = dueAt - now;
  if (window) {
    if (left <= 0) return "late";
    if (left <= 5 * 60 * 1000) return "now";
    return "now";
  }
  if (left <= 0) return "now";
  if (left <= 8 * 60 * 1000) return "soon";
  return "idle";
}

export function derive(pet: Pet, now: number): DerivedState {
  const p = catchUp(pet, now);
  const s = stats(p);
  const { wake, sleep } = schedule(p);
  const nextHungerDrainAt = p.sleeping
    ? null
    : nextDrainAt(p.hungerAt, p.hunger, hungerLossMin(p.form, p.age), wake, sleep);
  const nextHappyDrainAt = p.sleeping
    ? null
    : nextDrainAt(p.happyAt, p.happy, happyLossMin(p.form, p.age), wake, sleep);
  const poopAt = nextPoopAt(p);
  const sickAt = nextSicknessAt(p);
  const evoAt = evolutionDueAt(p);
  const slAt = nextSleepAt(now, wake, sleep);
  const wkAt = nextWakeAt(now, wake, sleep);

  const alerts: CareAlert[] = [];

  if (p.form === "egg" && p.hatchAt > now) {
    alerts.push({
      id: "hatch",
      kind: "hatch",
      title: "Egg hatching",
      detail: "Be ready to feed — both meters start empty.",
      dueAt: p.hatchAt,
      urgency: urgencyFor(p.hatchAt, now),
      deviceHint: "No buttons yet",
    });
  }

  if (p.hungerWindowAt != null) {
    const due = p.hungerWindowAt + CARE_WINDOW_MS;
    alerts.push({
      id: "hunger-call",
      kind: "hunger",
      title: "Hungry — 15 minute window",
      detail: "Empty hunger hearts. Feed a meal before the call times out.",
      dueAt: due,
      urgency: urgencyFor(due, now, true),
      deviceHint: "Food → Meal  (B)",
    });
  } else if (nextHungerDrainAt != null && p.hunger === 1) {
    alerts.push({
      id: "hunger-soon",
      kind: "hunger",
      title: "Last hunger heart",
      detail: "Next drop empties the meter and starts a care call.",
      dueAt: nextHungerDrainAt,
      urgency: urgencyFor(nextHungerDrainAt, now),
      deviceHint: "Food → Meal  (B)",
    });
  } else if (nextHungerDrainAt != null) {
    alerts.push({
      id: "hunger-drain",
      kind: "hunger",
      title: "Hunger dropping",
      detail: `${p.hunger} heart${p.hunger === 1 ? "" : "s"} left · one drops every ${hungerLossMin(p.form, p.age)} min awake.`,
      dueAt: nextHungerDrainAt,
      urgency: urgencyFor(nextHungerDrainAt, now),
      deviceHint: "Food → Meal  (B)",
    });
  }

  if (p.happyWindowAt != null) {
    const due = p.happyWindowAt + CARE_WINDOW_MS;
    alerts.push({
      id: "happy-call",
      kind: "happy",
      title: "Unhappy — 15 minute window",
      detail: "Empty happy hearts. Play a game (preferred) or give a snack.",
      dueAt: due,
      urgency: urgencyFor(due, now, true),
      deviceHint: "Game  (win 3 of 5)",
    });
  } else if (nextHappyDrainAt != null && p.happy === 1) {
    alerts.push({
      id: "happy-soon",
      kind: "happy",
      title: "Last happy heart",
      detail: "Next drop starts a care call. Prefer a game over snacks to keep weight down.",
      dueAt: nextHappyDrainAt,
      urgency: urgencyFor(nextHappyDrainAt, now),
      deviceHint: "Game  (win 3 of 5)",
    });
  }

  if (p.sleepWindowAt != null && p.lightsOn) {
    const due = p.sleepWindowAt + CARE_WINDOW_MS;
    alerts.push({
      id: "lights",
      kind: "lights",
      title: "Turn the lights off",
      detail: "It fell asleep with the lights on. Off within 15 minutes or it is a care mistake.",
      dueAt: due,
      urgency: urgencyFor(due, now, true),
      deviceHint: "Lights icon  (B)",
    });
  } else if (slAt != null && slAt - now < 30 * 60 * 1000) {
    alerts.push({
      id: "sleep-soon",
      kind: "lights",
      title: "Bedtime soon",
      detail: `${s.name} sleeps at ${String(s.sleepHour).padStart(2, "0")}:00. Be ready to hit lights.`,
      dueAt: slAt,
      urgency: urgencyFor(slAt, now),
      deviceHint: "Lights icon  (B)",
    });
  }

  if (p.checkDiscAt != null) {
    alerts.push({
      id: "disc-due",
      kind: "discipline",
      title: "Check attention",
      detail: "After enough heart drops the shell may light attention with hearts still showing. Look now. The 15-minute scold window starts only after you confirm it is on the shell.",
      dueAt: p.checkDiscAt,
      urgency: "now",
      deviceHint: "Look, then Discipline if it is calling",
    });
  } else if (p.misbehaveAt != null) {
    const due = p.misbehaveAt + CARE_WINDOW_MS;
    alerts.push({
      id: "disc",
      kind: "discipline",
      title: "Misbehaving",
      detail: "Attention is on but meters are not empty. Scold only if your target wants discipline.",
      dueAt: due,
      urgency: urgencyFor(due, now, true),
      deviceHint: "Discipline icon  (B)",
    });
  }

  if (p.checkPoopAt != null) {
    alerts.push({
      id: "poop-due",
      kind: "poop",
      title: "Look for poop",
      detail: "Poop is due on a timer — not random. The device will not beep. Confirm if it is on the screen.",
      dueAt: p.checkPoopAt,
      urgency: "now",
      deviceHint: "Duck icon  (B)",
    });
  } else if (p.poop > 0) {
    alerts.push({
      id: "poop",
      kind: "poop",
      title: p.poop >= 3 ? "Poop piling up" : "Needs a clean",
      detail: `${p.poop} on screen. Four at once makes a skull. Clean with the duck.`,
      dueAt: now,
      urgency: p.poop >= 3 ? "now" : "soon",
      deviceHint: "Duck icon  (B)",
    });
  }

  if (p.checkSickAt != null) {
    alerts.push({
      id: "sick-due",
      kind: "sick",
      title: "Look for a skull",
      detail: "Each form has a ROM sickness timer (not random), plus four poops or too many snacks. No beep.",
      dueAt: p.checkSickAt,
      urgency: "now",
      deviceHint: "Syringe icon  (B)",
    });
  } else if (p.sick) {
    alerts.push({
      id: "sick",
      kind: "sick",
      title: "Sick",
      detail: `Skull icon. Give medicine ${s.shots} time${s.shots === 1 ? "" : "s"} on the shell. No beep.`,
      dueAt: now,
      urgency: "now",
      deviceHint: "Syringe icon  (B)",
    });
  }

  if (evoAt != null && evoAt - now < 6 * 60 * 60 * 1000) {
    const nxt = nextFormAfter(p);
    alerts.push({
      id: "evo",
      kind: "evolve",
      title: nxt ? `Evolving into ${CHARACTERS[nxt].name}` : "Evolution soon",
      detail: "Mistake counts at this moment lock the next form.",
      dueAt: evoAt,
      urgency: urgencyFor(evoAt, now),
      deviceHint: "Just watch",
    });
  }

  const rank: Record<Urgency, number> = { late: 0, now: 1, soon: 2, idle: 3 };
  alerts.sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.dueAt - b.dueAt);
  const primary = alerts.find((a) => a.urgency === "late" || a.urgency === "now") ?? alerts[0] ?? null;

  return {
    pet: p,
    stats: s,
    now,
    nextHungerDrainAt,
    nextHappyDrainAt,
    nextPoopAt: poopAt,
    nextSicknessAt: sickAt,
    remainingDiscDrops: remainingDiscDrops(p),
    nextEvolveAt: evoAt,
    nextSleepAt: slAt,
    nextWakeAt: wkAt,
    alerts,
    primary,
    predictedTeen: p.form === "marutchi" || p.form === "babytchi" || p.form === "egg" ? teenKindNow(p) : p.teenKind,
    predictedAdult: predictedAdult(p),
    onTarget: onTarget(p),
    pathStatus: pathStatus(p),
    budget: mistakeBudget(p),
  };
}

export function stageLabel(id: CharacterId): string {
  return CHARACTERS[id].stage.replace(/^\w/, (c) => c.toUpperCase());
}
