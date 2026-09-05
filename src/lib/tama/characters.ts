import type { AdultId, CharacterId, CharacterStats } from "./types";

export const CHARACTERS: Record<CharacterId, CharacterStats> = {
  egg: {
    id: "egg",
    name: "Egg",
    short: "Egg",
    stage: "egg",
    wakeHour: null,
    sleepHour: null,
    hungryLossMin: 999,
    happyLossMin: 999,
    sicknessMin: 9999,
    shots: 0,
    minWeight: 0,
    maxWeight: 0,
    evoMin: 5,
    disciplineCountdown: null,
    initialDiscipline: 0,
    bites: 0,
    gameWinPct: 0,
    lifespan: "5 min",
    blurb: "Set the clock. The egg hatches about five minutes later. No care yet.",
  },
  babytchi: {
    id: "babytchi",
    name: "Babytchi",
    short: "Baby",
    stage: "baby",
    wakeHour: null,
    sleepHour: null,
    hungryLossMin: 3,
    happyLossMin: 4,
    sicknessMin: 45,
    shots: 2,
    minWeight: 5,
    maxWeight: 5,
    evoMin: 65,
    disciplineCountdown: null,
    initialDiscipline: 0,
    bites: 4,
    gameWinPct: 50,
    lifespan: "65 min",
    blurb: "Always becomes Marutchi. Hearts drain every 3–4 minutes. First poop around 15 minutes, a nap around 40. Care here does not change the next form.",
  },
  marutchi: {
    id: "marutchi",
    name: "Marutchi",
    short: "Child",
    stage: "child",
    wakeHour: 9,
    sleepHour: 20,
    hungryLossMin: 50,
    happyLossMin: 60,
    sicknessMin: 990,
    shots: 2,
    minWeight: 10,
    maxWeight: 99,
    evoMin: 2880,
    disciplineCountdown: 6,
    initialDiscipline: 0,
    bites: 4,
    gameWinPct: 50,
    lifespan: "48 hours",
    blurb: "The fork. About 48 hours in this form. Under 3 care mistakes keeps the good teen (Tamatchi). 3 or more becomes Kuchitamatchi and locks out Mametchi.",
  },
  tamatchi: {
    id: "tamatchi",
    name: "Tamatchi",
    short: "Teen",
    stage: "teen",
    wakeHour: 9,
    sleepHour: 21,
    hungryLossMin: 75,
    happyLossMin: 85,
    sicknessMin: 1656,
    shots: 2,
    minWeight: 20,
    maxWeight: 99,
    evoMin: 4320,
    disciplineCountdown: 6,
    initialDiscipline: 0,
    bites: 2,
    gameWinPct: 50,
    lifespan: "72 hours",
    blurb: "Good teen. About 72 hours in this form. Can become any adult. Type 1 (under 3 discipline mistakes as Marutchi) is required for Mametchi.",
  },
  kuchitamatchi: {
    id: "kuchitamatchi",
    name: "Kuchitamatchi",
    short: "Teen",
    stage: "teen",
    wakeHour: 9,
    sleepHour: 21,
    hungryLossMin: 75,
    happyLossMin: 85,
    sicknessMin: 660,
    shots: 2,
    minWeight: 20,
    maxWeight: 99,
    evoMin: 2880,
    disciplineCountdown: 6,
    initialDiscipline: 0,
    bites: 4,
    gameWinPct: 50,
    lifespan: "48 hours",
    blurb: "Poor-care teen. About 48 hours in this form. Only Kuchipatchi, Nyorotchi, or Tarakotchi from here. Care mistakes no longer change the adult — discipline mistakes do.",
  },
  mametchi: {
    id: "mametchi",
    name: "Mametchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 81,
    happyLossMin: 91,
    sicknessMin: 3900,
    shots: 1,
    minWeight: 30,
    maxWeight: 99,
    evoMin: 4095,
    disciplineCountdown: null,
    initialDiscipline: 100,
    bites: 2,
    gameWinPct: 50,
    lifespan: "15–16 days",
    blurb: "The prize adult. Needs Tamatchi type 1, under 3 care mistakes total, and zero discipline mistakes.",
  },
  ginjirotchi: {
    id: "ginjirotchi",
    name: "Ginjirotchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 81,
    happyLossMin: 91,
    sicknessMin: 2808,
    shots: 1,
    minWeight: 30,
    maxWeight: 99,
    evoMin: 3120,
    disciplineCountdown: 7,
    initialDiscipline: 50,
    bites: 2,
    gameWinPct: 50,
    lifespan: "11–12 days",
    blurb: "Good-care adult from Tamatchi with exactly one discipline mistake (type 1) or low-discipline type 2.",
  },
  maskutchi: {
    id: "maskutchi",
    name: "Maskutchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 11,
    sleepHour: 23,
    hungryLossMin: 55,
    happyLossMin: 65,
    sicknessMin: 2592,
    shots: 1,
    minWeight: 30,
    maxWeight: 99,
    evoMin: 2880,
    disciplineCountdown: 7,
    initialDiscipline: 0,
    bites: 2,
    gameWinPct: 31,
    lifespan: "15–16 days",
    blurb: "Sleeps late (11pm–11am). Hearts drain faster than other good adults. Type 2 Maskutchi can become Bill / Oyajitchi.",
  },
  kuchipatchi: {
    id: "kuchipatchi",
    name: "Kuchipatchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 60,
    happyLossMin: 70,
    sicknessMin: 1170,
    shots: 2,
    minWeight: 20,
    maxWeight: 99,
    evoMin: 1560,
    disciplineCountdown: null,
    initialDiscipline: 100,
    bites: 2,
    gameWinPct: 69,
    lifespan: "5–6 days",
    blurb: "Chubby happy adult. Needs some care mistakes and few discipline mistakes. Easiest “healthy” poor-care result.",
  },
  nyorotchi: {
    id: "nyorotchi",
    name: "Nyorotchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 60,
    happyLossMin: 70,
    sicknessMin: 360,
    shots: 3,
    minWeight: 10,
    maxWeight: 99,
    evoMin: 780,
    disciplineCountdown: 7,
    initialDiscipline: 50,
    bites: 4,
    gameWinPct: 50,
    lifespan: "2–3 days",
    blurb: "Gets sick easily (needs 3 shots). Short life. Comes from mixed discipline mistakes on a poor-care path.",
  },
  tarakotchi: {
    id: "tarakotchi",
    name: "Tarakotchi",
    short: "Adult",
    stage: "adult",
    wakeHour: 10,
    sleepHour: 22,
    hungryLossMin: 45,
    happyLossMin: 50,
    sicknessMin: 660,
    shots: 2,
    minWeight: 20,
    maxWeight: 99,
    evoMin: 1440,
    disciplineCountdown: 7,
    initialDiscipline: 0,
    bites: 2,
    gameWinPct: 50,
    lifespan: "3–4 days",
    blurb: "The neglect adult. Fast heart drain, wakes at 10am. Lots of discipline mistakes.",
  },
  oyajitchi: {
    id: "oyajitchi",
    name: "Oyajitchi",
    short: "Secret",
    stage: "secret",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 81,
    happyLossMin: 91,
    sicknessMin: 3900,
    shots: 1,
    minWeight: 30,
    maxWeight: 99,
    evoMin: 4095,
    disciplineCountdown: null,
    initialDiscipline: 100,
    bites: 2,
    gameWinPct: 50,
    lifespan: "15–16 days",
    blurb: "Japanese secret. Raise a type-2 Tamatchi into Maskutchi (never scold), then keep it alive about 4 more days.",
  },
  bill: {
    id: "bill",
    name: "Bill",
    short: "Secret",
    stage: "secret",
    wakeHour: 9,
    sleepHour: 22,
    hungryLossMin: 81,
    happyLossMin: 91,
    sicknessMin: 3900,
    shots: 1,
    minWeight: 30,
    maxWeight: 99,
    evoMin: 4095,
    disciplineCountdown: null,
    initialDiscipline: 100,
    bites: 2,
    gameWinPct: 50,
    lifespan: "15–16 days",
    blurb: "English secret (same path as Oyajitchi). Type-2 Maskutchi, then wait. Care after Maskutchi only has to keep it alive.",
  },
};

export const ADULT_IDS: AdultId[] = [
  "mametchi",
  "ginjirotchi",
  "maskutchi",
  "kuchipatchi",
  "nyorotchi",
  "tarakotchi",
  "oyajitchi",
  "bill",
];

export const STAGE_ORDER: CharacterId[] = [
  "egg",
  "babytchi",
  "marutchi",
  "tamatchi",
  "kuchitamatchi",
  "mametchi",
  "ginjirotchi",
  "maskutchi",
  "kuchipatchi",
  "nyorotchi",
  "tarakotchi",
  "oyajitchi",
  "bill",
];

export const CARE_WINDOW_MS = 15 * 60 * 1000;
export const EGG_MS = 5 * 60 * 1000;
/** Observed P1 stage lengths (wall clock). The ROM “base time” field is a different unit and was evolving Marutchi a day early. */
export const BABY_MS = 65 * 60 * 1000;
export const MARU_MS = 48 * 60 * 60 * 1000;
export const TAMATCHI_MS = 72 * 60 * 60 * 1000;
export const KUCHITA_MS = 48 * 60 * 60 * 1000;
export const SECRET_WAIT_MS = 4 * 24 * 60 * 60 * 1000;
export const BABY_POOP_MS = 15 * 60 * 1000;
export const BABY_NAP_MS = 40 * 60 * 1000;

export const POOP_INTERVAL_MIN: Record<CharacterId, number> = {
  egg: 9999,
  babytchi: 15,
  marutchi: 90,
  tamatchi: 120,
  kuchitamatchi: 100,
  mametchi: 180,
  ginjirotchi: 180,
  maskutchi: 150,
  kuchipatchi: 150,
  nyorotchi: 90,
  tarakotchi: 90,
  oyajitchi: 180,
  bill: 180,
};

export function statsFor(id: CharacterId): CharacterStats {
  return CHARACTERS[id];
}

export function displayName(id: CharacterId): string {
  return CHARACTERS[id].name;
}

export function isAdultForm(id: CharacterId): boolean {
  return CHARACTERS[id].stage === "adult" || CHARACTERS[id].stage === "secret";
}

export function secretForRegion(region: "en" | "jp"): AdultId {
  return region === "jp" ? "oyajitchi" : "bill";
}

/** Original P1 floors once age has eaten the base interval. */
export const HUNGER_LOSS_FLOOR_MIN = 7;
export const HAPPY_LOSS_FLOOR_MIN = 9;

/** Base rate minus 1 minute per year of age. Baby stays at 3/4. */
export function hungerLossMin(form: CharacterId, age: number): number {
  const base = CHARACTERS[form].hungryLossMin;
  if (form === "egg" || form === "babytchi") return base;
  return Math.max(HUNGER_LOSS_FLOOR_MIN, base - Math.max(0, age));
}

export function happyLossMin(form: CharacterId, age: number): number {
  const base = CHARACTERS[form].happyLossMin;
  if (form === "egg" || form === "babytchi") return base;
  return Math.max(HAPPY_LOSS_FLOOR_MIN, base - Math.max(0, age));
}



