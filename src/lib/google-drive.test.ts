import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareSaves } from "./google-drive.ts";
import type { Pet } from "./tama/types.ts";

function pet(over: Partial<Pet> = {}): Pet {
  return {
    id: "p1",
    nickname: "P1",
    hatchAt: 1_700_000_000_000,
    clockSetAt: 1_700_000_000_000,
    targetId: "mametchi",
    region: "en",
    createdAt: 1_700_000_000_000,
    lastTickAt: 1_700_000_000_000,
    firmware: "replica",
    form: "babytchi",
    teenKind: null,
    stageStartedAt: 1_700_000_000_000,
    secretEligible: true,
    hunger: 4,
    hungerAt: 1_700_000_000_000,
    happy: 4,
    happyAt: 1_700_000_000_000,
    discipline: 0,
    weight: 5,
    careMistakes: 0,
    discMistakes: 0,
    poop: 0,
    poopAt: 1_700_000_000_000,
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
    ...over,
  };
}

describe("compareSaves", () => {
  it("treats missing sides", () => {
    assert.equal(compareSaves(null, null), "none");
    assert.equal(compareSaves(pet(), null), "local-only");
    assert.equal(compareSaves(null, pet()), "cloud-only");
  });

  it("uses lastTickAt for the same run", () => {
    const local = pet({ lastTickAt: 20 });
    const older = pet({ lastTickAt: 10 });
    const newer = pet({ lastTickAt: 30 });
    assert.equal(compareSaves(local, local), "same");
    assert.equal(compareSaves(local, older), "local-newer");
    assert.equal(compareSaves(local, newer), "cloud-newer");
  });

  it("flags a different run", () => {
    assert.equal(compareSaves(pet({ id: "a" }), pet({ id: "b" })), "other-run");
    assert.equal(compareSaves(pet({ hatchAt: 1 }), pet({ hatchAt: 2 })), "other-run");
  });
});
