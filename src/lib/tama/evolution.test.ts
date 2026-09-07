import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isGrownForm, pathStatus, predictedAdult, stillHeadingSecret } from "./evolution.ts";
import { createPet, derive, syncPet } from "./simulate.ts";
import type { Pet } from "./types.ts";

const t0 = Date.parse("2026-09-01T12:00:00");

function base(over: Partial<Pet> = {}): Pet {
  const pet = createPet({
    hatchAt: t0,
    targetId: "mametchi",
    region: "en",
    firmware: "replica",
    now: t0,
  });
  return { ...pet, ...over };
}

describe("predictedAdult after growth", () => {
  it("locks to the grown form even when mistakes would pick someone else", () => {
    const pet = base({
      form: "maskutchi",
      careMistakes: 4,
      discMistakes: 1,
      teenKind: "tamatchi-t1",
      secretEligible: false,
    });
    assert.equal(predictedAdult(pet), "maskutchi");
    assert.equal(isGrownForm(pet), true);
    assert.equal(pathStatus(pet), "off");
    assert.equal(derive(pet, t0).predictedAdult, "maskutchi");
  });

  it("still heads toward Bill from secret-eligible Maskutchi", () => {
    const pet = base({
      form: "maskutchi",
      targetId: "bill",
      region: "en",
      careMistakes: 2,
      discMistakes: 3,
      teenKind: "tamatchi-t2",
      secretEligible: true,
    });
    assert.equal(stillHeadingSecret(pet), true);
    assert.equal(predictedAdult(pet), "bill");
  });

  it("keeps predicting from mistakes before the adult form", () => {
    const pet = base({
      form: "tamatchi",
      careMistakes: 4,
      discMistakes: 1,
      teenKind: "tamatchi-t1",
    });
    assert.equal(predictedAdult(pet), "kuchipatchi");
    assert.equal(isGrownForm(pet), false);
  });
});

describe("sync to a grown form", () => {
  it("does not keep a Mametchi run secret-eligible just because form is Maskutchi", () => {
    const pet = base({
      form: "tamatchi",
      careMistakes: 4,
      discMistakes: 2,
      teenKind: "tamatchi-t1",
    });
    const synced = syncPet(pet, { form: "maskutchi" }, t0, { restartStage: true });
    assert.equal(synced.form, "maskutchi");
    assert.equal(synced.secretEligible, false);
    assert.equal(predictedAdult(synced), "maskutchi");
  });
});
