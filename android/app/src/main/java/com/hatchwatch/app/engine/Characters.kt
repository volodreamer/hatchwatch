package com.hatchwatch.app.engine

object Characters {
    const val CARE_WINDOW_MS = 15L * 60 * 1000
    const val EGG_MS = 5L * 60 * 1000
    const val BABY_MS = 65L * 60 * 1000
    const val MARU_MS = 48L * 60 * 60 * 1000
    const val TAMATCHI_MS = 72L * 60 * 60 * 1000
    const val KUCHITA_MS = 48L * 60 * 60 * 1000
    const val SECRET_WAIT_MS = 4L * 24 * 60 * 60 * 1000
    const val BABY_POOP_MS = 15L * 60 * 1000
    const val BABY_NAP_MS = 40L * 60 * 1000
    const val HUNGER_FLOOR = 7
    const val HAPPY_FLOOR = 9
    const val WARN_LEAD_MS = 2L * 60 * 1000

    val ADULT_IDS = listOf(
        CharacterId.mametchi, CharacterId.ginjirotchi, CharacterId.maskutchi,
        CharacterId.kuchipatchi, CharacterId.nyorotchi, CharacterId.tarakotchi,
        CharacterId.oyajitchi, CharacterId.bill,
    )

    val STAGE_ORDER = CharacterId.entries

    private fun c(
        id: CharacterId, name: String, short: String, stage: Stage,
        wake: Int?, sleep: Int?, hungry: Int, happy: Int, sick: Int,
        shots: Int, minW: Int, maxW: Int, evo: Int, disc: Int?,
        initDisc: Int, bites: Int, win: Int, life: String, blurb: String,
    ) = CharacterStats(
        id, name, short, stage, wake, sleep, hungry, happy, sick,
        shots, minW, maxW, evo, disc, initDisc, bites, win, life, blurb,
    )

    val ALL: Map<CharacterId, CharacterStats> = listOf(
        c(CharacterId.egg, "Egg", "Egg", Stage.egg, null, null, 999, 999, 9999, 0, 0, 0, 5, null, 0, 0, 0, "5 min", "Set the clock. The egg hatches about five minutes later. No care yet."),
        c(CharacterId.babytchi, "Babytchi", "Baby", Stage.baby, null, null, 3, 4, 33, 2, 5, 5, 65, null, 0, 4, 50, "65 min", "Always becomes Marutchi. Hearts drain every 3–4 minutes. First poop at 15 minutes, again at 45. Skull around 33 minutes. Nap around 40."),
        c(CharacterId.marutchi, "Marutchi", "Child", Stage.child, 9, 20, 50, 60, 990, 2, 10, 99, 2880, 6, 0, 4, 50, "48 hours", "The fork. About 48 hours. Under 3 care mistakes keeps Tamatchi. 3 or more becomes Kuchitamatchi."),
        c(CharacterId.tamatchi, "Tamatchi", "Teen", Stage.teen, 9, 21, 75, 85, 1656, 2, 20, 99, 4320, 6, 0, 2, 50, "72 hours", "Good teen. About 72 hours. Type 1 is required for Mametchi."),
        c(CharacterId.kuchitamatchi, "Kuchitamatchi", "Teen", Stage.teen, 9, 21, 75, 85, 660, 2, 20, 99, 2880, 6, 0, 4, 50, "48 hours", "Poor-care teen. About 48 hours. Only Kuchipatchi, Nyorotchi, or Tarakotchi."),
        c(CharacterId.mametchi, "Mametchi", "Adult", Stage.adult, 9, 22, 81, 91, 3900, 1, 30, 99, 4095, null, 100, 2, 50, "15–16 days", "The prize adult. Tamatchi type 1, under 3 care, zero discipline mistakes."),
        c(CharacterId.ginjirotchi, "Ginjirotchi", "Adult", Stage.adult, 9, 22, 81, 91, 2808, 1, 30, 99, 3120, 7, 50, 2, 50, "11–12 days", "Good-care adult from Tamatchi with exactly one discipline mistake."),
        c(CharacterId.maskutchi, "Maskutchi", "Adult", Stage.adult, 11, 23, 55, 65, 2592, 1, 30, 99, 2880, 7, 0, 2, 31, "15–16 days", "Sleeps 11pm–11am. Type 2 can become Bill / Oyajitchi."),
        c(CharacterId.kuchipatchi, "Kuchipatchi", "Adult", Stage.adult, 9, 22, 60, 70, 1170, 2, 20, 99, 1560, null, 100, 2, 69, "5–6 days", "Chubby happy adult. Some care mistakes, few discipline mistakes."),
        c(CharacterId.nyorotchi, "Nyorotchi", "Adult", Stage.adult, 9, 22, 60, 70, 360, 3, 10, 99, 780, 7, 50, 4, 50, "2–3 days", "Gets sick easily. 3 shots. Short life."),
        c(CharacterId.tarakotchi, "Tarakotchi", "Adult", Stage.adult, 10, 22, 45, 50, 660, 2, 20, 99, 1440, 7, 0, 2, 50, "3–4 days", "The neglect adult. Fast heart drain, wakes at 10am."),
        c(CharacterId.oyajitchi, "Oyajitchi", "Secret", Stage.secret, 9, 22, 81, 91, 3900, 1, 30, 99, 4095, null, 100, 2, 50, "15–16 days", "Japanese secret. Type-2 Tamatchi into Maskutchi, then wait ~4 days."),
        c(CharacterId.bill, "Bill", "Secret", Stage.secret, 9, 22, 81, 91, 3900, 1, 30, 99, 4095, null, 100, 2, 50, "15–16 days", "English secret. Same path as Oyajitchi."),
    ).associateBy { it.id }

    fun stats(id: CharacterId) = ALL.getValue(id)
    fun name(id: CharacterId) = stats(id).name
    fun secretForRegion(region: String) = if (region == "jp") CharacterId.oyajitchi else CharacterId.bill

    val POOP_INTERVAL_MIN = mapOf(
        CharacterId.egg to 9999,
        CharacterId.babytchi to 30,
        CharacterId.marutchi to 90,
        CharacterId.tamatchi to 120,
        CharacterId.kuchitamatchi to 100,
        CharacterId.mametchi to 180,
        CharacterId.ginjirotchi to 180,
        CharacterId.maskutchi to 150,
        CharacterId.kuchipatchi to 150,
        CharacterId.nyorotchi to 90,
        CharacterId.tarakotchi to 90,
        CharacterId.oyajitchi to 180,
        CharacterId.bill to 180,
    )

    fun hungerLossMin(form: CharacterId, age: Int): Int {
        val base = stats(form).hungryLossMin
        if (form == CharacterId.egg || form == CharacterId.babytchi) return base
        return maxOf(HUNGER_FLOOR, base - maxOf(0, age))
    }

    fun happyLossMin(form: CharacterId, age: Int): Int {
        val base = stats(form).happyLossMin
        if (form == CharacterId.egg || form == CharacterId.babytchi) return base
        return maxOf(HAPPY_FLOOR, base - maxOf(0, age))
    }
}
