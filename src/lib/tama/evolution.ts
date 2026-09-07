import { CHARACTERS, displayName, secretForRegion } from "./characters.ts";
import type { AdultId, CharacterId, MistakeBudget, PathStatus, Pet, TargetPlan, TeenKind } from "./types.ts";

export function teenFromMistakes(care: number, disc: number): TeenKind {
  const goodCare = care < 3;
  const lowDisc = disc < 3;
  if (goodCare && lowDisc) return "tamatchi-t1";
  if (goodCare && !lowDisc) return "tamatchi-t2";
  if (!goodCare && lowDisc) return "kuchitamatchi-t1";
  return "kuchitamatchi-t2";
}

export function teenCharacter(kind: TeenKind): CharacterId {
  return kind.startsWith("tamatchi") ? "tamatchi" : "kuchitamatchi";
}

/**
 * Replica: hidden discipline-mistake counter (ignored scolds).
 * Vintage: the visible bar is what evolution used — map empty pips to an equivalent miss count.
 */
export function discForEvo(pet: Pet): number {
  if (pet.firmware === "vintage") return Math.max(0, Math.round((100 - pet.discipline) / 25));
  return pet.discMistakes;
}

export function teenKindNow(pet: Pet): TeenKind {
  return pet.teenKind ?? teenFromMistakes(pet.careMistakes, discForEvo(pet));
}

export function adultFrom(
  kind: TeenKind,
  care: number,
  disc: number,
  _region: "en" | "jp",
): CharacterId {
  if (kind === "tamatchi-t1") {
    if (care < 3 && disc === 0) return "mametchi";
    if (care < 3 && disc === 1) return "ginjirotchi";
    if (care < 3 && disc >= 2) return "maskutchi";
    if (care >= 3 && disc < 2) return "kuchipatchi";
    if (care >= 3 && disc < 4) return "nyorotchi";
    return "tarakotchi";
  }
  if (kind === "tamatchi-t2") {
    if (care < 4 && disc < 2) return "ginjirotchi";
    if (care < 4 && disc >= 2) return "maskutchi";
    if (care >= 4 && disc < 8) return "nyorotchi";
    return "tarakotchi";
  }
  if (kind === "kuchitamatchi-t1") {
    if (disc < 2) return "kuchipatchi";
    if (disc === 2) return "nyorotchi";
    return "tarakotchi";
  }
  if (disc < 6) return "nyorotchi";
  return "tarakotchi";
}

export function canBecomeSecret(kind: TeenKind, adult: CharacterId): boolean {
  return kind === "tamatchi-t2" && adult === "maskutchi";
}

export function predictedAdult(pet: Pet): CharacterId {
  const stage = CHARACTERS[pet.form].stage;
  if (stage === "secret") return pet.form;
  if (stage === "adult") {
    if (pet.form === "maskutchi" && pet.secretEligible) {
      return secretForRegion(pet.region);
    }
    return pet.form;
  }
  const disc = discForEvo(pet);
  if (pet.form === "egg" || pet.form === "babytchi" || pet.form === "marutchi") {
    const kind = teenFromMistakes(pet.careMistakes, disc);
    return adultFrom(kind, pet.careMistakes, disc, pet.region);
  }
  const kind = teenKindNow(pet);
  const adult = adultFrom(kind, pet.careMistakes, disc, pet.region);
  if (
    (pet.form === "maskutchi" || adult === "maskutchi") &&
    canBecomeSecret(kind, "maskutchi") &&
    pet.form !== "maskutchi"
  ) {
    return "maskutchi";
  }
  return adult;
}

export function isGrownForm(pet: Pet): boolean {
  const stage = CHARACTERS[pet.form].stage;
  return stage === "adult" || stage === "secret";
}

export function stillHeadingSecret(pet: Pet): boolean {
  return pet.form === "maskutchi" && pet.secretEligible;
}

export function teenKindForForm(pet: Pet): TeenKind {
  const disc = discForEvo(pet);
  if (pet.form === "tamatchi") return disc < 3 ? "tamatchi-t1" : "tamatchi-t2";
  if (pet.form === "kuchitamatchi") return disc < 3 ? "kuchitamatchi-t1" : "kuchitamatchi-t2";
  return teenKindNow(pet);
}

export const TARGET_PLANS: Record<AdultId, TargetPlan> = {
  mametchi: {
    id: "mametchi",
    name: "Mametchi",
    difficulty: "strict",
    path: ["babytchi", "marutchi", "tamatchi", "mametchi"],
    headline: "Perfect discipline. Almost perfect care.",
    steps: [
      "Babytchi always becomes Marutchi — just keep it alive. Hearts drop every 3–4 minutes.",
      "Marutchi: stay under 3 care mistakes and scold every misbehave (0 discipline mistakes) so you get Tamatchi type 1.",
      "Tamatchi: keep total care mistakes under 3. Never ignore a misbehave call. Zero discipline mistakes evolves Mametchi.",
      "Lights off within 15 minutes of sleep (8pm child, 9pm teen, 10pm adult) or it counts as a care mistake.",
    ],
    careMax: 2,
    discMin: 0,
    discMax: 0,
    scold: "always",
  },
  ginjirotchi: {
    id: "ginjirotchi",
    name: "Ginjirotchi",
    difficulty: "precise",
    path: ["babytchi", "marutchi", "tamatchi", "ginjirotchi"],
    headline: "Good care, exactly one ignored misbehave.",
    steps: [
      "Keep Marutchi under 3 care mistakes for Tamatchi type 1.",
      "Allow exactly one discipline mistake across child + teen (ignore one misbehave call).",
      "Scold every other misbehave. Stay under 3 care mistakes total.",
      "Type 2 Tamatchi can also yield Ginjirotchi if care stays under 4 and discipline mistakes stay under 2 — but type 1 with exactly 1 is the clean route.",
    ],
    careMax: 2,
    discMin: 1,
    discMax: 1,
    scold: "once",
  },
  maskutchi: {
    id: "maskutchi",
    name: "Maskutchi",
    difficulty: "steady",
    path: ["babytchi", "marutchi", "tamatchi", "maskutchi"],
    headline: "Good care, skip at least two scolds.",
    steps: [
      "Marutchi: under 3 care mistakes → Tamatchi.",
      "Type 1: 2 or more discipline mistakes and under 3 care mistakes → Maskutchi (cannot become Bill).",
      "Type 2 (3+ discipline mistakes as Marutchi) → Maskutchi that can become Bill / Oyajitchi.",
      "Adult Maskutchi sleeps 11pm–11am and loses hearts faster. Plan the later bedtime.",
    ],
    careMax: 2,
    discMin: 2,
    discMax: null,
    scold: "some",
  },
  kuchipatchi: {
    id: "kuchipatchi",
    name: "Kuchipatchi",
    difficulty: "lenient",
    path: ["babytchi", "marutchi", "tamatchi", "kuchipatchi"],
    headline: "A few missed meals, but still scold.",
    steps: [
      "Let 3 or more care mistakes land (miss hunger/happy/lights calls) by the adult evolution.",
      "Keep discipline mistakes under 2 — still scold misbehaves.",
      "Works from Tamatchi type 1 or Kuchitamatchi type 1.",
      "Kuchipatchi lives 5–6 days. Hearts drain a bit faster than the top adults.",
    ],
    careMax: null,
    discMin: 0,
    discMax: 1,
    scold: "always",
  },
  nyorotchi: {
    id: "nyorotchi",
    name: "Nyorotchi",
    difficulty: "lenient",
    path: ["babytchi", "marutchi", "kuchitamatchi", "nyorotchi"],
    headline: "Messy care, middling discipline.",
    steps: [
      "3+ care mistakes as Marutchi for Kuchitamatchi, or 3+ care as Tamatchi type 1.",
      "Type 1 Kuchitamatchi: exactly 2 discipline mistakes. Type 1 Tamatchi: 2–3 discipline mistakes.",
      "Gets sick often — 3 medicine presses to heal. Check the skull even when it is not beeping.",
      "Short life (2–3 days). Fast sickness timer.",
    ],
    careMax: null,
    discMin: 2,
    discMax: 3,
    scold: "some",
  },
  tarakotchi: {
    id: "tarakotchi",
    name: "Tarakotchi",
    difficulty: "lenient",
    path: ["babytchi", "marutchi", "kuchitamatchi", "tarakotchi"],
    headline: "Ignore the discipline calls.",
    steps: [
      "Poor care as Marutchi (3+ care mistakes) is the easy on-ramp.",
      "Stack discipline mistakes: 3+ on Kuchitamatchi type 1, 6+ on type 2, or 4+ on Tamatchi type 1.",
      "Wakes at 10am, hearts drop every 45–50 minutes. Still clean poop or it will sicken.",
      "Lives 3–4 days.",
    ],
    careMax: null,
    discMin: 3,
    discMax: null,
    scold: "never",
  },
  oyajitchi: {
    id: "oyajitchi",
    name: "Oyajitchi",
    difficulty: "secret",
    path: ["babytchi", "marutchi", "tamatchi", "maskutchi", "oyajitchi"],
    headline: "Never scold. Good care. Then wait.",
    steps: [
      "Never press Discipline. Every ignored misbehave is a discipline mistake — that is the point.",
      "Keep care mistakes low as Marutchi (under 3) so you get Tamatchi type 2 (3+ disc, good care).",
      "Stay under 4 care mistakes through teen. Type 2 Tamatchi with 2+ disc → Maskutchi that can secret-evolve.",
      "Keep Maskutchi alive about 4 days (around age 10). Japanese shells become Oyajitchi.",
    ],
    careMax: 3,
    discMin: 3,
    discMax: null,
    scold: "never",
  },
  bill: {
    id: "bill",
    name: "Bill",
    difficulty: "secret",
    path: ["babytchi", "marutchi", "tamatchi", "maskutchi", "bill"],
    headline: "Never scold. Good care. Then wait.",
    steps: [
      "Same path as Oyajitchi — English shells become Bill.",
      "Never scold. Keep care mistakes under 3 as Marutchi and under 4 through Tamatchi.",
      "You want Tamatchi type 2 → Maskutchi, then survive ~4 days.",
      "After Maskutchi, care only has to keep it alive until the secret evolution.",
    ],
    careMax: 3,
    discMin: 3,
    discMax: null,
    scold: "never",
  },
};

export function planFor(id: AdultId): TargetPlan {
  return TARGET_PLANS[id];
}

export function mistakeBudget(pet: Pet): MistakeBudget {
  const plan = TARGET_PLANS[pet.targetId];
  const careUsed = pet.careMistakes;
  const discUsed = discForEvo(pet);
  const careMax = plan.careMax;
  const discMin = plan.discMin;
  const discMax = plan.discMax;
  const careRemaining = careMax == null ? null : Math.max(0, careMax - careUsed);
  const discRemaining = discMax == null ? null : Math.max(0, discMax - discUsed);

  let summary: string;
  if (isGrownForm(pet) && !stillHeadingSecret(pet)) {
    summary =
      pet.form === pet.targetId
        ? `Grown as ${displayName(pet.form)}. Care mistakes ${careUsed}. Discipline ${discUsed}.`
        : `Grown as ${displayName(pet.form)} (wanted ${displayName(pet.targetId)}). Care mistakes ${careUsed}. Discipline ${discUsed}.`;
  } else if (careMax != null && careUsed > careMax) {
    summary = `Care mistakes over budget (${careUsed} / ${careMax}). ${displayName(pet.targetId)} is unlikely unless the device disagrees.`;
  } else if (discMax != null && discUsed > discMax) {
    summary = `Too many discipline mistakes (${discUsed} / max ${discMax}).`;
  } else if (discMin != null && discUsed < discMin) {
    const need = discMin - discUsed;
    summary =
      plan.scold === "never"
        ? `Need ${need} more ignored misbehave calls. Do not scold.`
        : `Need ${need} more discipline mistakes before adult evolution.`;
  } else if (careRemaining != null) {
    const disc = `${discUsed}${discMax == null ? "+" : ` / ${discMax}`}`;
    summary = `${careRemaining} care mistakes left in budget. Discipline ${disc}.`;
  } else {
    summary = `Care mistakes ${careUsed}. Discipline mistakes ${discUsed}.`;
  }

  return {
    careUsed,
    discUsed,
    careMax,
    discMin,
    discMax,
    careRemaining,
    discRemaining,
    summary,
    stageTip: tipForStage(pet),
  };
}

function tipForStage(pet: Pet): string {
  const plan = TARGET_PLANS[pet.targetId];
  const form = pet.form;
  if (form === "egg") return "Egg hatches five minutes after you set the clock. Sit tight.";
  if (form === "babytchi") {
    return "Feed and play the moment it beeps. Hearts drop every 3–4 minutes. This stage does not pick the adult.";
  }
  if (form === "marutchi") {
    if (plan.careMax != null && plan.careMax < 3) {
      return "Child fork: stay under 3 care mistakes. Lights off at 8pm. Scold or skip according to your target.";
    }
    return "Child fork: 3 or more care mistakes becomes Kuchitamatchi. Use that if you want a poor-care adult.";
  }
  if (form === "tamatchi" || form === "kuchitamatchi") {
    return `Teen is the adult decision. ${plan.headline} Sleep 9pm–9am. Mistake counts keep adding from hatch — P1 never resets them.`;
  }
  if (form === "maskutchi" && (pet.targetId === "bill" || pet.targetId === "oyajitchi")) {
    return "Keep Maskutchi alive ~4 days for the secret form. Sleep 11pm–11am.";
  }
  return `${CHARACTERS[form].name} sleep ${CHARACTERS[form].sleepHour ?? "—"}:00–${CHARACTERS[form].wakeHour ?? "—"}:00. Clean poop even though it will not beep.`;
}

export function onTarget(pet: Pet): boolean {
  const predicted = predictedAdult(pet);
  const disc = discForEvo(pet);
  if (pet.targetId === "bill" || pet.targetId === "oyajitchi") {
    const kind = teenKindNow(pet);
    if (pet.form === "egg" || pet.form === "babytchi" || pet.form === "marutchi") {
      return kind === "tamatchi-t2" || (pet.careMistakes < 3 && disc >= 3);
    }
    return (
      canBecomeSecret(kind, predicted === "maskutchi" ? "maskutchi" : predicted) ||
      predicted === pet.targetId ||
      predicted === "maskutchi"
    );
  }
  return predicted === pet.targetId;
}

export function pathStatus(pet: Pet): PathStatus {
  if (onTarget(pet)) return "hit";
  const plan = TARGET_PLANS[pet.targetId];
  const disc = discForEvo(pet);
  if (plan.careMax != null && pet.careMistakes > plan.careMax) return "off";
  if (plan.discMax != null && disc > plan.discMax) return "off";
  const stage = CHARACTERS[pet.form].stage;
  if (stage === "adult" || stage === "secret") return "off";
  return "path";
}

export function scoldAdvice(pet: Pet): "scold" | "ignore" | "either" {
  const plan = TARGET_PLANS[pet.targetId];
  const disc = discForEvo(pet);
  if (plan.scold === "always") return "scold";
  if (plan.scold === "never") return "ignore";
  if (plan.scold === "once") {
    if (disc < (plan.discMin ?? 1)) return "ignore";
    return "scold";
  }
  const need = (plan.discMin ?? 0) - disc;
  if (need > 0) return "ignore";
  if (plan.discMax != null && disc >= plan.discMax) return "scold";
  return "either";
}

export function nextFormAfter(pet: Pet): CharacterId | null {
  if (pet.form === "egg") return "babytchi";
  if (pet.form === "babytchi") return "marutchi";
  if (pet.form === "marutchi") {
    return teenCharacter(teenFromMistakes(pet.careMistakes, discForEvo(pet)));
  }
  if (pet.form === "tamatchi" || pet.form === "kuchitamatchi") {
    const kind = teenKindNow(pet);
    return adultFrom(kind, pet.careMistakes, discForEvo(pet), pet.region);
  }
  if (pet.form === "maskutchi" && pet.secretEligible) {
    return secretForRegion(pet.region);
  }
  return null;
}
