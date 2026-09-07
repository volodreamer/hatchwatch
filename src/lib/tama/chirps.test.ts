import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chirpEvents, type ChirpSnapshot } from "./chirps.ts";

const CARE_WINDOW_MS = 15 * 60 * 1000;

const WARN = 2 * 60 * 1000;
const t0 = 1_700_000_000_000;

function snap(partial: Partial<ChirpSnapshot> = {}): ChirpSnapshot {
  return {
    now: t0,
    hunger: 3,
    happy: 3,
    hungerAt: t0 - 10_000,
    happyAt: t0 - 10_000,
    hungerWindowAt: null,
    happyWindowAt: null,
    sleepWindowAt: null,
    misbehaveAt: null,
    checkPoopAt: null,
    checkSickAt: null,
    checkDiscAt: null,
    ...partial,
  };
}

describe("chirpEvents", () => {
  it("does not drop-chirp on the first snapshot", () => {
    const fired = new Set<string>();
    const out = chirpEvents(null, snap({ hunger: 0, hungerWindowAt: t0, now: t0 + 400 }), fired);
    assert.deepEqual(
      out.filter((e) => e.kind === "drop"),
      [],
    );
  });

  it("plays a drop chirp when hunger falls", () => {
    const fired = new Set<string>();
    const prev = snap({ hunger: 3, hungerAt: t0 - 60_000 });
    const next = snap({ hunger: 2, hungerAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.kind, "drop");
    assert.equal(out[0]?.alertKind, "hunger");
    assert.deepEqual(chirpEvents(next, { ...next, now: t0 + 1000 }, fired), []);
  });

  it("plays one drop when the last heart empties and the window opens", () => {
    const fired = new Set<string>();
    const prev = snap({ hunger: 1, hungerAt: t0 - 60_000 });
    const next = snap({ hunger: 0, hungerAt: t0, hungerWindowAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.kind, "drop");
  });

  it("plays a warning once, two minutes before the penalty", () => {
    const fired = new Set<string>();
    const windowAt = t0;
    const prev = snap({ hunger: 0, hungerWindowAt: windowAt, now: windowAt + CARE_WINDOW_MS - WARN - 5_000 });
    const crossing = snap({ hunger: 0, hungerWindowAt: windowAt, now: windowAt + CARE_WINDOW_MS - WARN + 200 });
    const out = chirpEvents(prev, crossing, fired);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.kind, "warn");
    assert.equal(out[0]?.alertKind, "hunger");
    const later = snap({ hunger: 0, hungerWindowAt: windowAt, now: windowAt + CARE_WINDOW_MS - 30_000 });
    assert.deepEqual(chirpEvents(crossing, later, fired), []);
  });

  it("warns on first open if already inside the last two minutes", () => {
    const fired = new Set<string>();
    const windowAt = t0 - (CARE_WINDOW_MS - 60_000);
    const next = snap({ hunger: 0, hungerWindowAt: windowAt, now: t0 });
    const out = chirpEvents(null, next, fired);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.kind, "warn");
  });

  it("does not warn after the window has already expired", () => {
    const fired = new Set<string>();
    const windowAt = t0 - CARE_WINDOW_MS - 1;
    const out = chirpEvents(null, snap({ hunger: 0, hungerWindowAt: windowAt, now: t0 }), fired);
    assert.deepEqual(out, []);
  });

  it("plays a drop when the lights window opens", () => {
    const fired = new Set<string>();
    const prev = snap();
    const next = snap({ sleepWindowAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out[0]?.kind, "drop");
    assert.equal(out[0]?.alertKind, "lights");
  });

  it("does not loop while a window stays open", () => {
    const fired = new Set<string>();
    const windowAt = t0;
    let prev = snap({ hunger: 0, hungerWindowAt: windowAt, now: windowAt + 1000 });
    for (let i = 2; i < 12; i++) {
      const next = snap({ hunger: 0, hungerWindowAt: windowAt, now: windowAt + i * 60_000 });
      const out = chirpEvents(prev, next, fired);
      assert.deepEqual(out, []);
      prev = next;
    }
  });

  it("drop-chirps when poop is due (shell is silent)", () => {
    const fired = new Set<string>();
    const prev = snap();
    const next = snap({ checkPoopAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out[0]?.kind, "drop");
    assert.equal(out[0]?.alertKind, "poop");
  });

  it("drop-chirps when the sickness timer fires (shell is silent)", () => {
    const fired = new Set<string>();
    const prev = snap();
    const next = snap({ checkSickAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out[0]?.alertKind, "sick");
  });

  it("drop-chirps when attention is predicted", () => {
    const fired = new Set<string>();
    const prev = snap();
    const next = snap({ checkDiscAt: t0, now: t0 });
    const out = chirpEvents(prev, next, fired);
    assert.equal(out[0]?.alertKind, "discipline");
  });
});
