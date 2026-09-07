package com.hatchwatch.app.engine

object Evolution {
    fun teenFromMistakes(care: Int, disc: Int): TeenKind {
        val goodCare = care < 3
        val lowDisc = disc < 3
        return when {
            goodCare && lowDisc -> TeenKind.tamatchi_t1
            goodCare && !lowDisc -> TeenKind.tamatchi_t2
            !goodCare && lowDisc -> TeenKind.kuchitamatchi_t1
            else -> TeenKind.kuchitamatchi_t2
        }
    }

    fun teenCharacter(kind: TeenKind) =
        if (kind.name.startsWith("tamatchi")) CharacterId.tamatchi else CharacterId.kuchitamatchi

    fun discForEvo(pet: Pet): Int {
        if (pet.firmware == Firmware.vintage) return maxOf(0, Math.round((100 - pet.discipline) / 25f))
        return pet.discMistakes
    }

    fun teenKindNow(pet: Pet) = pet.teenKind ?: teenFromMistakes(pet.careMistakes, discForEvo(pet))

    /** Lock teen type from the form on the shell, not leftover child math. */
    fun teenKindForForm(pet: Pet): TeenKind {
        val disc = discForEvo(pet)
        return when (pet.form) {
            CharacterId.tamatchi -> if (disc < 3) TeenKind.tamatchi_t1 else TeenKind.tamatchi_t2
            CharacterId.kuchitamatchi -> if (disc < 3) TeenKind.kuchitamatchi_t1 else TeenKind.kuchitamatchi_t2
            else -> teenKindNow(pet)
        }
    }

    fun adultFrom(kind: TeenKind, care: Int, disc: Int): CharacterId = when (kind) {
        TeenKind.tamatchi_t1 -> when {
            care < 3 && disc == 0 -> CharacterId.mametchi
            care < 3 && disc == 1 -> CharacterId.ginjirotchi
            care < 3 && disc >= 2 -> CharacterId.maskutchi
            care >= 3 && disc < 2 -> CharacterId.kuchipatchi
            care >= 3 && disc < 4 -> CharacterId.nyorotchi
            else -> CharacterId.tarakotchi
        }
        TeenKind.tamatchi_t2 -> when {
            care < 4 && disc < 2 -> CharacterId.ginjirotchi
            care < 4 && disc >= 2 -> CharacterId.maskutchi
            care >= 4 && disc < 8 -> CharacterId.nyorotchi
            else -> CharacterId.tarakotchi
        }
        TeenKind.kuchitamatchi_t1 -> when {
            disc < 2 -> CharacterId.kuchipatchi
            disc == 2 -> CharacterId.nyorotchi
            else -> CharacterId.tarakotchi
        }
        TeenKind.kuchitamatchi_t2 -> if (disc < 6) CharacterId.nyorotchi else CharacterId.tarakotchi
    }

    fun canBecomeSecret(kind: TeenKind, adult: CharacterId) =
        kind == TeenKind.tamatchi_t2 && adult == CharacterId.maskutchi

    fun isGrownForm(pet: Pet): Boolean {
        val s = Characters.stats(pet.form).stage
        return s == Stage.adult || s == Stage.secret
    }

    fun stillHeadingSecret(pet: Pet) =
        pet.form == CharacterId.maskutchi && pet.secretEligible

    fun predictedAdult(pet: Pet): CharacterId {
        val stage = Characters.stats(pet.form).stage
        if (stage == Stage.secret) return pet.form
        if (stage == Stage.adult) {
            if (pet.form == CharacterId.maskutchi && pet.secretEligible) {
                return Characters.secretForRegion(pet.region)
            }
            return pet.form
        }
        val disc = discForEvo(pet)
        if (pet.form == CharacterId.egg || pet.form == CharacterId.babytchi || pet.form == CharacterId.marutchi) {
            val kind = teenFromMistakes(pet.careMistakes, disc)
            return adultFrom(kind, pet.careMistakes, disc)
        }
        val kind = teenKindNow(pet)
        val adult = adultFrom(kind, pet.careMistakes, disc)
        if ((pet.form == CharacterId.maskutchi || adult == CharacterId.maskutchi) &&
            canBecomeSecret(kind, CharacterId.maskutchi) &&
            pet.form != CharacterId.maskutchi
        ) return CharacterId.maskutchi
        return adult
    }

    val PLANS: Map<CharacterId, TargetPlan> = mapOf(
        CharacterId.mametchi to TargetPlan(CharacterId.mametchi, "Mametchi", "strict", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.mametchi), "Perfect discipline. Almost perfect care.", listOf("Babytchi always becomes Marutchi.", "Marutchi: under 3 care mistakes, scold every misbehave.", "Tamatchi: keep care under 3. Zero discipline mistakes.", "Lights off within 15 minutes of sleep."), 2, 0, 0, "always"),
        CharacterId.ginjirotchi to TargetPlan(CharacterId.ginjirotchi, "Ginjirotchi", "precise", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.ginjirotchi), "Good care, exactly one ignored misbehave.", listOf("Keep Marutchi under 3 care mistakes.", "Allow exactly one discipline mistake.", "Scold every other misbehave.", "Type 1 with exactly 1 is the clean route."), 2, 1, 1, "once"),
        CharacterId.maskutchi to TargetPlan(CharacterId.maskutchi, "Maskutchi", "steady", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.maskutchi), "Good care, skip at least two scolds.", listOf("Marutchi: under 3 care → Tamatchi.", "Type 1: 2+ disc mistakes → Maskutchi (cannot become Bill).", "Type 2 (3+ disc as Marutchi) can become Bill.", "Sleeps 11pm–11am."), 2, 2, null, "some"),
        CharacterId.kuchipatchi to TargetPlan(CharacterId.kuchipatchi, "Kuchipatchi", "lenient", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.kuchipatchi), "A few missed meals, but still scold.", listOf("3+ care mistakes by adult evolution.", "Keep discipline mistakes under 2.", "Works from Tamatchi t1 or Kuchitamatchi t1.", "Lives 5–6 days."), null, 0, 1, "always"),
        CharacterId.nyorotchi to TargetPlan(CharacterId.nyorotchi, "Nyorotchi", "lenient", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.kuchitamatchi, CharacterId.nyorotchi), "Messy care, middling discipline.", listOf("3+ care as Marutchi.", "Type 1 Kuchitamatchi: exactly 2 disc mistakes.", "3 medicine presses to heal.", "Short life (2–3 days)."), null, 2, 3, "some"),
        CharacterId.tarakotchi to TargetPlan(CharacterId.tarakotchi, "Tarakotchi", "lenient", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.kuchitamatchi, CharacterId.tarakotchi), "Ignore the discipline calls.", listOf("Poor care as Marutchi (3+).", "Stack discipline mistakes.", "Wakes at 10am.", "Lives 3–4 days."), null, 3, null, "never"),
        CharacterId.oyajitchi to TargetPlan(CharacterId.oyajitchi, "Oyajitchi", "secret", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.maskutchi, CharacterId.oyajitchi), "Never scold. Good care. Then wait.", listOf("Never press Discipline.", "Under 3 care as Marutchi for Tamatchi type 2.", "Type 2 Tamatchi with 2+ disc → Maskutchi.", "Keep Maskutchi alive ~4 days."), 3, 3, null, "never"),
        CharacterId.bill to TargetPlan(CharacterId.bill, "Bill", "secret", listOf(CharacterId.babytchi, CharacterId.marutchi, CharacterId.tamatchi, CharacterId.maskutchi, CharacterId.bill), "Never scold. Good care. Then wait.", listOf("Same path as Oyajitchi — English shells become Bill.", "Never scold.", "Tamatchi type 2 → Maskutchi, then ~4 days.", "After Maskutchi, keep it alive."), 3, 3, null, "never"),
    )

    fun plan(id: CharacterId) = PLANS[id] ?: PLANS.getValue(CharacterId.mametchi)

    fun mistakeBudget(pet: Pet): MistakeBudget {
        val plan = plan(pet.targetId)
        val careUsed = pet.careMistakes
        val discUsed = discForEvo(pet)
        val careRemaining = plan.careMax?.let { maxOf(0, it - careUsed) }
        val discRemaining = plan.discMax?.let { maxOf(0, it - discUsed) }
        val summary = when {
            isGrownForm(pet) && !stillHeadingSecret(pet) ->
                if (pet.form == pet.targetId)
                    "Grown as ${Characters.name(pet.form)}. Care mistakes $careUsed. Discipline $discUsed."
                else
                    "Grown as ${Characters.name(pet.form)} (wanted ${Characters.name(pet.targetId)}). Care mistakes $careUsed. Discipline $discUsed."
            plan.careMax != null && careUsed > plan.careMax -> "Care mistakes over budget ($careUsed / ${plan.careMax}). ${Characters.name(pet.targetId)} is unlikely unless the device disagrees."
            plan.discMax != null && discUsed > plan.discMax -> "Too many discipline mistakes ($discUsed / max ${plan.discMax})."
            plan.discMin != null && discUsed < plan.discMin -> {
                val need = plan.discMin - discUsed
                if (plan.scold == "never") "Need $need more ignored misbehave calls. Do not scold."
                else "Need $need more discipline mistakes before adult evolution."
            }
            careRemaining != null -> "${careRemaining} care mistakes left in budget. Discipline $discUsed${if (plan.discMax == null) "+" else " / ${plan.discMax}"}."
            else -> "Care mistakes $careUsed. Discipline mistakes $discUsed."
        }
        return MistakeBudget(careUsed, discUsed, plan.careMax, plan.discMin, plan.discMax, careRemaining, discRemaining, summary, tipForStage(pet))
    }

    fun tipForStage(pet: Pet): String {
        val plan = plan(pet.targetId)
        return when (pet.form) {
            CharacterId.egg -> "Egg hatches five minutes after you set the clock."
            CharacterId.babytchi -> "Feed and play the moment it beeps. This stage does not pick the adult."
            CharacterId.marutchi -> if (plan.careMax != null && plan.careMax < 3) "Child fork: stay under 3 care mistakes. Lights off at 8pm." else "Child fork: 3 or more care mistakes becomes Kuchitamatchi."
            CharacterId.tamatchi, CharacterId.kuchitamatchi -> "Teen is the adult decision. ${plan.headline} Mistake counts keep adding from hatch."
            CharacterId.maskutchi -> if (pet.targetId == CharacterId.bill || pet.targetId == CharacterId.oyajitchi) "Keep Maskutchi alive ~4 days for the secret form. Sleep 11pm–11am." else Characters.stats(pet.form).blurb
            else -> Characters.stats(pet.form).blurb
        }
    }

    fun onTarget(pet: Pet): Boolean {
        val predicted = predictedAdult(pet)
        val disc = discForEvo(pet)
        if (pet.targetId == CharacterId.bill || pet.targetId == CharacterId.oyajitchi) {
            val kind = teenKindNow(pet)
            if (pet.form == CharacterId.egg || pet.form == CharacterId.babytchi || pet.form == CharacterId.marutchi) {
                return kind == TeenKind.tamatchi_t2 || (pet.careMistakes < 3 && disc >= 3)
            }
            return canBecomeSecret(kind, if (predicted == CharacterId.maskutchi) CharacterId.maskutchi else predicted) ||
                predicted == pet.targetId || predicted == CharacterId.maskutchi
        }
        return predicted == pet.targetId
    }

    fun pathStatus(pet: Pet): PathStatus {
        if (onTarget(pet)) return PathStatus.hit
        val plan = plan(pet.targetId)
        val disc = discForEvo(pet)
        if (plan.careMax != null && pet.careMistakes > plan.careMax) return PathStatus.off
        if (plan.discMax != null && disc > plan.discMax) return PathStatus.off
        val stage = Characters.stats(pet.form).stage
        if (stage == Stage.adult || stage == Stage.secret) return PathStatus.off
        return PathStatus.path
    }

    fun scoldAdvice(pet: Pet): String {
        val plan = plan(pet.targetId)
        val disc = discForEvo(pet)
        return when (plan.scold) {
            "always" -> "scold"
            "never" -> "ignore"
            "once" -> if (disc < (plan.discMin ?: 1)) "ignore" else "scold"
            else -> {
                val need = (plan.discMin ?: 0) - disc
                when {
                    need > 0 -> "ignore"
                    plan.discMax != null && disc >= plan.discMax -> "scold"
                    else -> "either"
                }
            }
        }
    }

    fun nextFormAfter(pet: Pet): CharacterId? = when (pet.form) {
        CharacterId.egg -> CharacterId.babytchi
        CharacterId.babytchi -> CharacterId.marutchi
        CharacterId.marutchi -> teenCharacter(teenFromMistakes(pet.careMistakes, discForEvo(pet)))
        CharacterId.tamatchi, CharacterId.kuchitamatchi -> adultFrom(teenKindNow(pet), pet.careMistakes, discForEvo(pet))
        CharacterId.maskutchi -> if (pet.secretEligible) Characters.secretForRegion(pet.region) else null
        else -> null
    }
}
