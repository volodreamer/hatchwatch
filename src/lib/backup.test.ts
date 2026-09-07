import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compactBackupRaw, extractJsonObject, looksCutOff, parsePet } from "./backup.ts";
import type { Pet } from "./tama/types.ts";

function samplePet(events = 0): Pet {
  const hatchAt = 1_700_000_000_000;
  const pet: Pet = {
    id: "p1",
    nickname: "P1",
    hatchAt,
    clockSetAt: hatchAt - 5 * 60_000,
    targetId: "mametchi",
    region: "en",
    createdAt: hatchAt,
    lastTickAt: hatchAt,
    firmware: "replica",
    form: "babytchi",
    teenKind: null,
    stageStartedAt: hatchAt,
    secretEligible: true,
    hunger: 4,
    hungerAt: hatchAt,
    happy: 4,
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
    hungerWindowAt: null,
    happyWindowAt: null,
    sleepWindowAt: null,
    misbehaveAt: null,
    checkPoopAt: null,
    checkSickAt: null,
    checkDiscAt: null,
    stageSickDone: false,
    heartDecrements: 0,
    snackCount: 0,
    events: [],
    notifOn: false,
    soundOn: true,
  };
  if (events <= 0) return pet;
  return {
    ...pet,
    events: Array.from({ length: events }, (_, i) => ({
      id: `evt-${i}-abcdefghijkl`,
      at: hatchAt + i * 60_000,
      type: "meal" as const,
      note: "Fed after the hunger beep on the shell",
      meta: { hearts: 3, source: "log" },
    })),
  };
}

function persist(pet: Pet): string {
  return JSON.stringify({ state: { pet }, version: 0 });
}

describe("parsePet", () => {
  it("reads zustand persist JSON", () => {
    const pet = parsePet(persist(samplePet()));
    assert.equal(pet.form, "babytchi");
    assert.equal(pet.nickname, "P1");
  });

  it("reads a bare pet object", () => {
    const pet = parsePet(JSON.stringify(samplePet()));
    assert.equal(pet.hatchAt, 1_700_000_000_000);
  });

  it("strips BOM and surrounding junk", () => {
    const inner = persist(samplePet());
    const pet = parsePet(`\uFEFFCopied:\n${inner}\nok`);
    assert.equal(pet.form, "babytchi");
  });

  it("fills missing events", () => {
    const raw = persist(samplePet());
    const parsed = JSON.parse(raw) as { state: { pet: Pet } };
    delete (parsed.state.pet as { events?: Pet["events"] }).events;
    const pet = parsePet(JSON.stringify(parsed));
    assert.deepEqual(pet.events, []);
  });

  it("rejects garbage", () => {
    assert.throws(() => parsePet("hello"), (err: { kind?: string }) => err.kind === "bad");
  });

  it("flags a cut-off persist blob", () => {
    const raw = persist(samplePet(40));
    const cut = raw.slice(0, 400);
    assert.equal(looksCutOff(cut), true);
    assert.throws(() => parsePet(cut), (err: { kind?: string }) => err.kind === "cutOff");
  });
});

describe("compactBackupRaw", () => {
  it("drops the care log and stays small enough for a phone paste box", () => {
    const raw = persist(samplePet(200));
    assert.ok(raw.length > 20_000);
    const short = compactBackupRaw(raw);
    assert.ok(short.length < 2_000, `short backup is ${short.length} chars`);
    const pet = parsePet(short);
    assert.deepEqual(pet.events, []);
    assert.equal(pet.form, "babytchi");
    assert.equal(pet.hunger, parsePet(raw).hunger);
  });
});

describe("extractJsonObject", () => {
  it("keeps the inner object when a note wraps it", () => {
    const inner = '{"state":{"pet":{"hatchAt":1}},"version":0}';
    assert.equal(extractJsonObject(`backup ${inner} done`), inner);
  });
});
