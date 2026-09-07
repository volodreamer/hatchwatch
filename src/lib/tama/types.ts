export type Stage = "egg" | "baby" | "child" | "teen" | "adult" | "secret";

export type CharacterId =
  | "egg"
  | "babytchi"
  | "marutchi"
  | "tamatchi"
  | "kuchitamatchi"
  | "mametchi"
  | "ginjirotchi"
  | "maskutchi"
  | "kuchipatchi"
  | "nyorotchi"
  | "tarakotchi"
  | "oyajitchi"
  | "bill";

export type Firmware = "vintage" | "replica";

export type AdultId =
  | "mametchi"
  | "ginjirotchi"
  | "maskutchi"
  | "kuchipatchi"
  | "nyorotchi"
  | "tarakotchi"
  | "oyajitchi"
  | "bill";

export type TeenKind = "tamatchi-t1" | "tamatchi-t2" | "kuchitamatchi-t1" | "kuchitamatchi-t2";

export type ActionType =
  | "meal"
  | "snack"
  | "game"
  | "clean"
  | "scold"
  | "medicine"
  | "lights-off"
  | "miss-care"
  | "miss-disc"
  | "undo-miss"
  | "sick"
  | "heal"
  | "evolve"
  | "poop"
  | "sleep"
  | "wake"
  | "hatch"
  | "sync"
  | "nap"
  | "confirm";

export interface CareEvent {
  id: string;
  at: number;
  type: ActionType;
  note?: string;
  meta?: Record<string, string | number | boolean>;
}

export interface CharacterStats {
  id: CharacterId;
  name: string;
  short: string;
  stage: Stage;
  wakeHour: number | null;
  sleepHour: number | null;
  hungryLossMin: number;
  happyLossMin: number;
  sicknessMin: number;
  shots: number;
  minWeight: number;
  maxWeight: number;
  evoMin: number;
  disciplineCountdown: number | null;
  initialDiscipline: number;
  bites: number;
  gameWinPct: number;
  lifespan: string;
  blurb: string;
}

export interface Pet {
  id: string;
  nickname: string;
  hatchAt: number;
  clockSetAt: number;
  targetId: AdultId;
  region: "en" | "jp";
  firmware: Firmware;
  createdAt: number;
  lastTickAt: number;

  form: CharacterId;
  teenKind: TeenKind | null;
  stageStartedAt: number;
  secretEligible: boolean;

  hunger: number;
  hungerAt: number;
  happy: number;
  happyAt: number;
  discipline: number;
  weight: number;
  careMistakes: number;
  discMistakes: number;
  poop: number;
  poopAt: number;
  sick: boolean;
  medicineGiven: number;
  sleeping: boolean;
  lightsOn: boolean;
  age: number;

  hungerWindowAt: number | null;
  happyWindowAt: number | null;
  sleepWindowAt: number | null;
  misbehaveAt: number | null;
  heartDecrements: number;
  /** Predicted poop — not yet confirmed on the shell. The device does not beep. */
  checkPoopAt: number | null;
  /** Predicted skull — ROM sickness timer, not RNG. Confirm on the shell. */
  checkSickAt: number | null;
  /** Predicted attention-with-hearts. Confirm before the 15-min scold window starts. */
  checkDiscAt: number | null;
  /** ROM fires one scheduled sickness per stage. */
  stageSickDone: boolean;

  snackCount: number;
  events: CareEvent[];
  notifOn: boolean;
  soundOn: boolean;
}

export type PathStatus = "hit" | "path" | "off";
export type Urgency = "idle" | "soon" | "now" | "late";

export interface CareAlert {
  id: string;
  kind: "hunger" | "happy" | "lights" | "discipline" | "poop" | "sick" | "evolve" | "hatch";
  title: string;
  detail: string;
  dueAt: number;
  urgency: Urgency;
  deviceHint: string;
}

export interface DerivedState {
  pet: Pet;
  stats: CharacterStats;
  now: number;
  nextHungerDrainAt: number | null;
  nextHappyDrainAt: number | null;
  nextPoopAt: number | null;
  nextSicknessAt: number | null;
  remainingDiscDrops: number | null;
  nextEvolveAt: number | null;
  nextSleepAt: number | null;
  nextWakeAt: number | null;
  alerts: CareAlert[];
  primary: CareAlert | null;
  predictedTeen: TeenKind | null;
  predictedAdult: CharacterId;
  onTarget: boolean;
  pathStatus: PathStatus;
  budget: MistakeBudget;
}

export interface MistakeBudget {
  careUsed: number;
  discUsed: number;
  careMax: number | null;
  discMin: number | null;
  discMax: number | null;
  careRemaining: number | null;
  discRemaining: number | null;
  summary: string;
  stageTip: string;
}

export interface TargetPlan {
  id: AdultId;
  name: string;
  difficulty: "strict" | "precise" | "steady" | "lenient" | "secret";
  path: CharacterId[];
  headline: string;
  steps: string[];
  careMax: number | null;
  discMin: number | null;
  discMax: number | null;
  scold: "always" | "once" | "never" | "some";
}
