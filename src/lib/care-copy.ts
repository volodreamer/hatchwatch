import { t, type Locale } from "@/lib/i18n";
import { CHARACTERS, hungerLossMin } from "@/lib/tama/characters";
import { nextFormAfter, TARGET_PLANS } from "@/lib/tama/evolution";
import type { AdultId, CareAlert, CharacterId, DerivedState, Pet } from "@/lib/tama/types";

export function translateAlert(locale: Locale, alert: CareAlert, derived: DerivedState) {
  const tr = (key: string, vars?: Record<string, string | number>) => t(locale, key, vars);
  const p = derived.pet;
  const s = derived.stats;
  switch (alert.id) {
    case "hatch":
      return { title: tr("care.hatch.t"), detail: tr("care.hatch.d"), hint: tr("care.hatch.h") };
    case "hunger-call":
      return { title: tr("care.hungerCall.t"), detail: tr("care.hungerCall.d"), hint: tr("hint.food") };
    case "hunger-soon":
      return { title: tr("care.hungerSoon.t"), detail: tr("care.hungerSoon.d"), hint: tr("hint.food") };
    case "hunger-drain":
      return {
        title: tr("care.hungerDrain.t"),
        detail: tr("care.hungerDrain.d", { n: p.hunger, min: hungerLossMin(p.form, p.age) }),
        hint: tr("hint.food"),
      };
    case "happy-call":
      return { title: tr("care.happyCall.t"), detail: tr("care.happyCall.d"), hint: tr("hint.game") };
    case "happy-soon":
      return { title: tr("care.happySoon.t"), detail: tr("care.happySoon.d"), hint: tr("hint.game") };
    case "lights":
      return { title: tr("care.lights.t"), detail: tr("care.lights.d"), hint: tr("hint.lights") };
    case "sleep-soon":
      return {
        title: tr("care.bed.t"),
        detail: tr("care.bed.d", { name: s.name, hh: String(s.sleepHour ?? 0).padStart(2, "0") }),
        hint: tr("hint.lights"),
      };
    case "disc":
      return { title: tr("care.disc.t"), detail: tr("care.disc.d"), hint: tr("hint.disc") };
    case "disc-due":
      return { title: tr("care.discDue.t"), detail: tr("care.discDue.d"), hint: tr("hint.disc") };
    case "poop-due":
      return { title: tr("care.poopDue.t"), detail: tr("care.poopDue.d"), hint: tr("hint.duck") };
    case "poop":
      return {
        title: p.poop >= 3 ? tr("care.poop.pile") : tr("care.poop.t"),
        detail: tr("care.poop.d", { n: p.poop }),
        hint: tr("hint.duck"),
      };
    case "sick-due":
      return { title: tr("care.sickDue.t"), detail: tr("care.sickDue.d"), hint: tr("hint.shot") };
    case "sick":
      return {
        title: tr("care.sick.t"),
        detail: tr("care.sick.d", { n: s.shots }),
        hint: tr("hint.shot"),
      };
    case "evo": {
      const nxt = nextFormAfter(p);
      return {
        title: nxt ? tr("care.evo.t", { name: CHARACTERS[nxt].name }) : tr("care.evo.soon"),
        detail: tr("care.evo.d"),
        hint: tr("hint.watch"),
      };
    }
    default:
      return { title: alert.title, detail: alert.detail, hint: alert.deviceHint };
  }
}

export function translateBudget(locale: Locale, pet: Pet) {
  const plan = TARGET_PLANS[pet.targetId];
  const careUsed = pet.careMistakes;
  const discUsed = pet.discMistakes;
  const careMax = plan.careMax;
  const discMin = plan.discMin;
  const discMax = plan.discMax;
  const careRemaining = careMax == null ? null : Math.max(0, careMax - careUsed);
  const name = CHARACTERS[pet.targetId].name;
  if (careMax != null && careUsed > careMax) {
    return t(locale, "budget.careOver", { used: careUsed, max: careMax, name });
  }
  if (discMax != null && discUsed > discMax) {
    return t(locale, "budget.discOver", { used: discUsed, max: discMax });
  }
  if (discMin != null && discUsed < discMin) {
    const need = discMin - discUsed;
    return plan.scold === "never"
      ? t(locale, "budget.needIgnore", { n: need })
      : t(locale, "budget.needDisc", { n: need });
  }
  if (careRemaining != null) {
    const disc = `${discUsed}${discMax == null ? "+" : ` / ${discMax}`}`;
    return t(locale, "budget.careLeft", { n: careRemaining, disc });
  }
  return t(locale, "budget.plain", { care: careUsed, disc: discUsed });
}

export function translateTip(locale: Locale, pet: Pet) {
  const form = pet.form;
  const plan = TARGET_PLANS[pet.targetId];
  if (form === "egg") return t(locale, "tip.egg");
  if (form === "babytchi") return t(locale, "tip.baby");
  if (form === "marutchi") {
    if (plan.careMax != null && plan.careMax < 3) return t(locale, "tip.maruGood");
    return t(locale, "tip.maruPoor");
  }
  if (form === "tamatchi" || form === "kuchitamatchi") return t(locale, "tip.teen");
  if (form === "maskutchi" && (pet.targetId === "bill" || pet.targetId === "oyajitchi")) {
    return t(locale, "tip.secret");
  }
  return t(locale, "tip.adult", { name: CHARACTERS[form].name });
}

export function planHeadline(locale: Locale, id: AdultId) {
  return t(locale, `plan.${id}.h`);
}

export function planSteps(locale: Locale, id: AdultId) {
  return [0, 1, 2, 3].map((i) => t(locale, `plan.${id}.${i}`));
}

export function formBlurb(locale: Locale, id: CharacterId) {
  return t(locale, `blurb.${id}`);
}

export function chirpCopy(locale: Locale, kind: "drop" | "warn", alertKind: string) {
  return {
    title: t(locale, `chirp.${kind}.${alertKind}.t`),
    body: t(locale, `chirp.${kind}.${alertKind}.b`),
  };
}
