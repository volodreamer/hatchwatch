import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHARACTERS, POOP_INTERVAL_MIN, hungerLossMin, happyLossMin } from "./characters.ts";
import { discForEvo } from "./evolution.ts";
import {
  applyAction,
  catchUp,
  confirmOnShell,
  createDemoPet,
  createPet,
  derive,
  dismissOffShell,
  nextSicknessAt,
  syncPet,
} from "./simulate.ts";
import type { Pet } from "./types.ts";

const t0 = Date.parse("2026-09-01T12:00:00");

function baby(now = t0): Pet {
  return createPet({
    hatchAt: now,
    targetId: "mametchi",
    region: "en",
    firmware: "replica",
    now,
  });
}

describe("P1 poop is a timer, not random", () => {
  it("uses 30 min baby interval so the second poop is at 45 min", () => {
    assert.equal(POOP_INTERVAL_MIN.babytchi, 30);
  });

  it("does not place poop until the shell is confirmed", () => {
    const pet = baby();
    const due = derive(pet, t0 + 16 * 60 * 1000);
    assert.ok(due.pet.checkPoopAt, "checkPoopAt should be set");
    assert.equal(due.pet.poop, 0);
    const confirmed = confirmOnShell(due.pet, "poop", t0 + 16 * 60 * 1000);
    assert.equal(confirmed.poop, 1);
    assert.equal(confirmed.checkPoopAt, null);
  });

  it("dismissing a phantom poop does not increment the pile", () => {
    const pet = baby();
    const due = derive(pet, t0 + 16 * 60 * 1000);
    const dismissed = dismissOffShell(due.pet, "poop", t0 + 16 * 60 * 1000);
    assert.equal(dismissed.poop, 0);
    assert.equal(dismissed.checkPoopAt, null);
  });

  it("four confirmed poops make a skull", () => {
    let p: Pet = { ...createDemoPet(t0), poop: 3, checkPoopAt: t0, sick: false };
    p = confirmOnShell(p, "poop", t0);
    assert.equal(p.poop, 4);
    assert.equal(p.sick, true);
  });
});

describe("P1 sickness is not random", () => {
  it("uses the observed 33-minute baby skull, not a dice roll", () => {
    assert.equal(CHARACTERS.babytchi.sicknessMin, 33);
    const pet = baby();
    const at = nextSicknessAt(pet);
    assert.ok(at);
    assert.equal(at, t0 + 33 * 60 * 1000);
  });

  it("sets checkSickAt instead of auto-sicking", () => {
    const pet = baby();
    const due = derive(pet, t0 + 34 * 60 * 1000);
    assert.ok(due.pet.checkSickAt);
    assert.equal(due.pet.sick, false);
    const confirmed = confirmOnShell(due.pet, "sick", t0 + 34 * 60 * 1000);
    assert.equal(confirmed.sick, true);
    assert.equal(confirmed.stageSickDone, true);
  });

  it("replica snacks on child/teen prompt a skull check after 4", () => {
    let p = createDemoPet(t0);
    p = { ...p, snackCount: 3, firmware: "replica", form: "marutchi", sick: false, checkSickAt: null };
    p = applyAction(p, "snack", t0);
    assert.ok(p.checkSickAt);
    assert.equal(p.sick, false);
  });
});

describe("P1 misbehave is a heart-drop countdown, not random", () => {
  it("replica ignored scold counts a discipline mistake", () => {
    let p = createDemoPet(t0);
    p = { ...p, firmware: "replica", misbehaveAt: t0 - 16 * 60 * 1000, discMistakes: 0, lastTickAt: t0 - 16 * 60 * 1000 };
    p = catchUp(p, t0);
    assert.equal(p.discMistakes, 1);
    assert.equal(p.misbehaveAt, null);
  });

  it("vintage ignored scold does not count a discipline mistake", () => {
    let p = createDemoPet(t0);
    p = { ...p, firmware: "vintage", misbehaveAt: t0 - 16 * 60 * 1000, discMistakes: 0, lastTickAt: t0 - 16 * 60 * 1000 };
    p = catchUp(p, t0);
    assert.equal(p.discMistakes, 0);
  });

  it("vintage maps an empty discipline bar to equivalent misses", () => {
    const p = { ...createDemoPet(t0), firmware: "vintage" as const, discipline: 0, discMistakes: 0 };
    assert.equal(discForEvo(p), 4);
    const full = { ...p, discipline: 100 };
    assert.equal(discForEvo(full), 0);
  });

  it("predicts remaining heart drops until attention", () => {
    const p = createDemoPet(t0);
    const d = derive({ ...p, heartDecrements: 2, hunger: 3, happy: 3 }, t0);
    assert.equal(d.remainingDiscDrops, 4);
  });
});

describe("heart drop clock is free-running", () => {
  it("meal does not reset the hunger countdown", () => {
    const intervalMs = hungerLossMin("marutchi", 1) * 60 * 1000;
    let p: Pet = {
      ...createDemoPet(t0),
      hunger: 3,
      hungerAt: t0,
      lastTickAt: t0,
      sleeping: false,
      hungerWindowAt: null,
    };
    const feedAt = t0 + 20 * 60 * 1000;
    p = applyAction(p, "meal", feedAt);
    assert.equal(p.hunger, 4);
    assert.equal(p.hungerAt, t0);
    const d = derive(p, feedAt);
    assert.equal(d.nextHungerDrainAt, t0 + intervalMs);
  });

  it("game does not reset the happy countdown", () => {
    const intervalMs = happyLossMin("marutchi", 1) * 60 * 1000;
    let p: Pet = {
      ...createDemoPet(t0),
      happy: 2,
      happyAt: t0,
      lastTickAt: t0,
      sleeping: false,
      happyWindowAt: null,
    };
    const playAt = t0 + 20 * 60 * 1000;
    p = applyAction(p, "game", playAt);
    assert.equal(p.happy, 3);
    assert.equal(p.happyAt, t0);
    const d = derive(p, playAt);
    assert.equal(d.nextHappyDrainAt, t0 + intervalMs);
  });

  it("matching heart counts never restarts the drop clock", () => {
    let p: Pet = {
      ...createDemoPet(t0),
      hunger: 3,
      hungerAt: t0,
      lastTickAt: t0,
      sleeping: false,
    };
    p = syncPet(p, { hunger: 2 }, t0 + 5 * 60 * 1000);
    assert.equal(p.hunger, 2);
    assert.equal(p.hungerAt, t0, "matching a lower count does not reset leftover");
    p = syncPet(p, { hunger: 4 }, t0 + 10 * 60 * 1000);
    assert.equal(p.hunger, 4);
    assert.equal(p.hungerAt, t0, "matching a feed does not reset leftover");
  });

  it("keeps the drop grid while the meter is empty", () => {
    const intervalMs = hungerLossMin("marutchi", 1) * 60 * 1000;
    let p: Pet = {
      ...createDemoPet(t0),
      hunger: 0,
      hungerAt: t0,
      lastTickAt: t0,
      sleeping: false,
      hungerWindowAt: t0,
    };
    const later = t0 + intervalMs + 60 * 1000;
    p = catchUp(p, later);
    assert.equal(p.hunger, 0);
    assert.ok(p.hungerAt > t0, "empty ticks still advance the clock");
    p = applyAction(p, "meal", later);
    assert.equal(p.hunger, 1);
    const d = derive(p, later);
    assert.ok(d.nextHungerDrainAt != null);
    const left = d.nextHungerDrainAt! - later;
    assert.ok(left > 0 && left < intervalMs, `leftover should be under one interval, got ${left}`);
  });
});
