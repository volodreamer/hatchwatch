import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BABY_MS,
  CHARACTERS,
  KUCHITA_MS,
  MARU_MS,
  TAMATCHI_MS,
  happyLossMin,
  hungerLossMin,
} from "./characters.ts";

describe("P1 stage durations", () => {
  it("uses observed wall-clock lengths, not the ROM base-time field", () => {
    assert.equal(BABY_MS, 65 * 60 * 1000);
    assert.equal(MARU_MS, 48 * 60 * 60 * 1000);
    assert.equal(TAMATCHI_MS, 72 * 60 * 60 * 1000);
    assert.equal(KUCHITA_MS, 48 * 60 * 60 * 1000);
    assert.equal(CHARACTERS.babytchi.evoMin, 65);
    assert.equal(CHARACTERS.marutchi.evoMin, 48 * 60);
    assert.equal(CHARACTERS.tamatchi.evoMin, 72 * 60);
    assert.equal(CHARACTERS.kuchitamatchi.evoMin, 48 * 60);
  });
});

describe("heart loss vs age", () => {
  it("keeps baby at 3/4 minutes", () => {
    assert.equal(hungerLossMin("babytchi", 0), 3);
    assert.equal(happyLossMin("babytchi", 1), 4);
  });

  it("subtracts one minute per year and floors at 7/9", () => {
    assert.equal(hungerLossMin("tamatchi", 0), 75);
    assert.equal(hungerLossMin("tamatchi", 3), 72);
    assert.equal(happyLossMin("tamatchi", 3), 82);
    assert.equal(hungerLossMin("mametchi", 80), 7);
    assert.equal(happyLossMin("mametchi", 90), 9);
  });
});
