package com.hatchwatch.app.engine

internal fun urgencyFor(dueAt: Long, now: Long, window: Boolean = false): Urgency {
    val left = dueAt - now
    return if (window) {
        if (left <= 0) Urgency.late else Urgency.now
    } else when {
        left <= 0 -> Urgency.now
        left <= 8L * 60 * 1000 -> Urgency.soon
        else -> Urgency.idle
    }
}

fun simDerive(pet: Pet, now: Long): DerivedState {
    val p = Simulate.catchUp(pet, now)
    val s = Characters.stats(p.form)
    val (wake, sleep) = Simulate.schedule(p)
    val nextHunger = if (p.sleeping) null else Simulate.nextDrainAt(p.hungerAt, p.hunger, Characters.hungerLossMin(p.form, p.age), wake, sleep)
    val nextHappy = if (p.sleeping) null else Simulate.nextDrainAt(p.happyAt, p.happy, Characters.happyLossMin(p.form, p.age), wake, sleep)
    val poopAt = Simulate.nextPoopAt(p)
    val sickAt = Simulate.nextSicknessAt(p)
    val evoAt = Simulate.evolutionDueAt(p)
    val slAt = Clock.nextSleepAt(now, wake, sleep)
    val wkAt = Clock.nextWakeAt(now, wake, sleep)
    val alerts = mutableListOf<CareAlert>()

    if (p.form == CharacterId.egg && p.hatchAt > now) {
        alerts += CareAlert("hatch", AlertKind.hatch, "Egg hatching", "Be ready to feed — both meters start empty.", p.hatchAt, urgencyFor(p.hatchAt, now), "No buttons yet")
    }
    if (p.hungerWindowAt != null) {
        val due = p.hungerWindowAt + Characters.CARE_WINDOW_MS
        alerts += CareAlert("hunger-call", AlertKind.hunger, "Hungry — 15 minute window", "Empty hunger hearts. Feed a meal before the call times out.", due, urgencyFor(due, now, true), "Food → Meal  (B)")
    } else if (nextHunger != null && p.hunger == 1) {
        alerts += CareAlert("hunger-soon", AlertKind.hunger, "Last hunger heart", "Next drop empties the meter and starts a care call.", nextHunger, urgencyFor(nextHunger, now), "Food → Meal  (B)")
    } else if (nextHunger != null) {
        alerts += CareAlert("hunger-drain", AlertKind.hunger, "Hunger dropping", "${p.hunger} hearts left · one drops every ${Characters.hungerLossMin(p.form, p.age)} min awake.", nextHunger, urgencyFor(nextHunger, now), "Food → Meal  (B)")
    }
    if (p.happyWindowAt != null) {
        val due = p.happyWindowAt + Characters.CARE_WINDOW_MS
        alerts += CareAlert("happy-call", AlertKind.happy, "Unhappy — 15 minute window", "Empty happy hearts. Play a game or give a snack.", due, urgencyFor(due, now, true), "Game  (win 3 of 5)")
    } else if (nextHappy != null && p.happy == 1) {
        alerts += CareAlert("happy-soon", AlertKind.happy, "Last happy heart", "Next drop starts a care call.", nextHappy, urgencyFor(nextHappy, now), "Game  (win 3 of 5)")
    }
    if (p.sleepWindowAt != null && p.lightsOn) {
        val due = p.sleepWindowAt + Characters.CARE_WINDOW_MS
        alerts += CareAlert("lights", AlertKind.lights, "Turn the lights off", "It fell asleep with the lights on. Off within 15 minutes or it is a care mistake.", due, urgencyFor(due, now, true), "Lights icon  (B)")
    } else if (slAt != null && slAt - now < 30L * 60 * 1000) {
        alerts += CareAlert("sleep-soon", AlertKind.lights, "Bedtime soon", "${s.name} sleeps at ${s.sleepHour.toString().padStart(2, '0')}:00.", slAt, urgencyFor(slAt, now), "Lights icon  (B)")
    }
    if (p.checkDiscAt != null) {
        alerts += CareAlert("disc-due", AlertKind.discipline, "Check attention", "After enough heart drops the shell may call with hearts still showing. Confirm before the 15-minute scold window starts.", p.checkDiscAt, Urgency.now, "Look, then Discipline")
    } else if (p.misbehaveAt != null) {
        val due = p.misbehaveAt + Characters.CARE_WINDOW_MS
        alerts += CareAlert("disc", AlertKind.discipline, "Misbehaving", "Attention is on but meters are not empty. Scold only if your target wants discipline.", due, urgencyFor(due, now, true), "Discipline icon  (B)")
    }
    if (p.checkPoopAt != null) {
        alerts += CareAlert("poop-due", AlertKind.poop, "Look for poop", "Poop is due on a timer — not random. The device will not beep.", p.checkPoopAt, Urgency.now, "Duck icon  (B)")
    } else if (p.poop > 0) {
        alerts += CareAlert("poop", AlertKind.poop, if (p.poop >= 3) "Poop piling up" else "Needs a clean", "${p.poop} on screen. Four at once makes a skull.", now, if (p.poop >= 3) Urgency.now else Urgency.soon, "Duck icon  (B)")
    }
    if (p.checkSickAt != null) {
        alerts += CareAlert("sick-due", AlertKind.sick, "Look for a skull", "Each form has a ROM sickness timer (not dice), plus four poops. No beep.", p.checkSickAt, Urgency.now, "Syringe icon  (B)")
    } else if (p.sick) {
        alerts += CareAlert("sick", AlertKind.sick, "Sick", "Skull icon. Give medicine ${s.shots} time(s) on the shell. No beep.", now, Urgency.now, "Syringe icon  (B)")
    }
    if (evoAt != null && evoAt - now < 6L * 60 * 60 * 1000) {
        val nxt = Evolution.nextFormAfter(p)
        alerts += CareAlert("evo", AlertKind.evolve, if (nxt != null) "Evolving into ${Characters.name(nxt)}" else "Evolution soon", "Mistake counts at this moment lock the next form.", evoAt, urgencyFor(evoAt, now), "Just watch")
    }
    val rank = mapOf(Urgency.late to 0, Urgency.now to 1, Urgency.soon to 2, Urgency.idle to 3)
    alerts.sortWith(compareBy({ rank[it.urgency] ?: 9 }, { it.dueAt }))
    val primary = alerts.find { it.urgency == Urgency.late || it.urgency == Urgency.now } ?: alerts.firstOrNull()
    val predictedTeen = if (p.form in setOf(CharacterId.marutchi, CharacterId.babytchi, CharacterId.egg)) Evolution.teenKindNow(p) else p.teenKind
    val predictedAdult = if (p.form == CharacterId.maskutchi && p.secretEligible) Characters.secretForRegion(p.region) else Evolution.predictedAdult(p)
    return DerivedState(
        pet = p, stats = s, now = now,
        nextHungerDrainAt = nextHunger, nextHappyDrainAt = nextHappy,
        nextPoopAt = poopAt, nextSicknessAt = sickAt, remainingDiscDrops = Simulate.remainingDiscDrops(p),
        nextEvolveAt = evoAt, nextSleepAt = slAt, nextWakeAt = wkAt,
        alerts = alerts, primary = primary, predictedTeen = predictedTeen, predictedAdult = predictedAdult,
        onTarget = Evolution.onTarget(p), pathStatus = Evolution.pathStatus(p), budget = Evolution.mistakeBudget(p),
    )
}

fun simUpcomingAlarms(pet: Pet, now: Long): List<NativeAlarm> {
    val d = simDerive(pet, now)
    val p = d.pet
    val out = mutableListOf<NativeAlarm>()
    fun add(id: String, at: Long?, kind: String, title: String, body: String, warn: Boolean = false) {
        if (at != null && at > now - 5_000) out += NativeAlarm(id, at, kind, title, body, warn)
    }
    add("poop-due", p.checkPoopAt, "poop", "Look for poop", "The shell will not beep.", false)
    add("sick-due", p.checkSickAt, "sick", "Look for a skull", "The shell will not beep.", false)
    add("disc-due", p.checkDiscAt, "discipline", "Check attention", "Look at the shell.", false)
    add("hunger", d.nextHungerDrainAt, "hunger", "Hunger dropping", "A hunger heart is about to fall.", false)
    add("happy", d.nextHappyDrainAt, "happy", "Happy dropping", "A happy heart is about to fall.", false)
    add("poop", d.nextPoopAt, "poop", "Look for poop", "Poop is on a timer. The shell will not beep.", false)
    add("sick", d.nextSicknessAt, "sick", "Look for a skull", "Scheduled skull. The shell will not beep.", false)
    if (!p.sleeping) {
        add("sleep", d.nextSleepAt, "lights", "It fell asleep", "Turn the lights off within 15 minutes.", false)
    } else if (p.lightsOn) {
        val due = p.sleepWindowAt ?: now
        add("sleep", due, "lights", "It fell asleep", "Turn the lights off within 15 minutes.", false)
    }
    fun window(id: String, at: Long?, kind: String, title: String, body: String) {
        if (at == null) return
        add("$id-warn", at + Characters.CARE_WINDOW_MS - Characters.WARN_LEAD_MS, kind, "2 minutes — $title", body, true)
        add("$id-late", at + Characters.CARE_WINDOW_MS, kind, title, body, false)
    }
    window("hunger", p.hungerWindowAt, "hunger", "hungry", "Feed a meal now or it is a care mistake.")
    window("happy", p.happyWindowAt, "happy", "unhappy", "Play a game now or it is a care mistake.")
    window("lights", p.sleepWindowAt?.takeIf { p.lightsOn }, "lights", "lights", "Lights off now or it is a care mistake.")
    window("disc", p.misbehaveAt, "discipline", "discipline", "Scold now or wait, depending on the target.")
    return out.distinctBy { it.id }.sortedBy { it.at }.take(16)
}

fun simFormatDuration(ms: Long): String {
    val sign = if (ms < 0) "-" else ""
    val abs = kotlin.math.abs(ms)
    val totalSec = abs / 1000
    val h = totalSec / 3600
    val m = (totalSec % 3600) / 60
    val s = totalSec % 60
    return when {
        h > 0 -> "$sign${h}h ${m.toString().padStart(2, '0')}m"
        m > 0 -> "$sign${m}m ${s.toString().padStart(2, '0')}s"
        else -> "$sign${s}s"
    }
}
