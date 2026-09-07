package com.hatchwatch.app.engine

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.min
import kotlin.random.Random

object Simulate {
    private fun uid() = "${System.currentTimeMillis().toString(36)}-${Random.nextInt(0x100000).toString(36)}"

    fun normalize(raw: Pet) = raw.copy(
        firmware = if (raw.firmware == Firmware.vintage) Firmware.vintage else Firmware.replica,
        checkPoopAt = raw.checkPoopAt,
        checkSickAt = raw.checkSickAt,
        checkDiscAt = raw.checkDiscAt,
        stageSickDone = raw.stageSickDone,
    )

    private fun push(pet: Pet, type: ActionType, at: Long, note: String? = null) = pet.copy(
        events = (listOf(CareEvent(uid(), at, type, note)) + pet.events).take(200),
    )

    private fun schedule(pet: Pet): Pair<Int?, Int?> {
        val s = Characters.stats(pet.form)
        return s.wakeHour to s.sleepHour
    }

    fun createPet(
        hatchAt: Long,
        clockSetAt: Long = hatchAt - Characters.EGG_MS,
        targetId: CharacterId,
        region: String,
        firmware: Firmware = Firmware.replica,
        nickname: String = "My P1",
        now: Long = System.currentTimeMillis(),
    ): Pet {
        val hatched = now >= hatchAt
        val form = if (hatched) CharacterId.babytchi else CharacterId.egg
        var pet = Pet(
            id = uid(),
            nickname = nickname.ifBlank { "My P1" },
            hatchAt = hatchAt,
            clockSetAt = clockSetAt,
            targetId = targetId,
            region = region,
            firmware = firmware,
            createdAt = now,
            lastTickAt = min(now, hatchAt),
            form = form,
            teenKind = null,
            stageStartedAt = if (hatched) hatchAt else clockSetAt,
            secretEligible = false,
            hunger = 0, hungerAt = hatchAt,
            happy = 0, happyAt = hatchAt,
            discipline = 0, weight = 5,
            careMistakes = 0, discMistakes = 0,
            poop = 0, poopAt = hatchAt,
            sick = false, medicineGiven = 0,
            sleeping = false, lightsOn = true, age = 0,
            hungerWindowAt = if (hatched) hatchAt else null,
            happyWindowAt = if (hatched) hatchAt else null,
            sleepWindowAt = null, misbehaveAt = null, heartDecrements = 0,
            checkPoopAt = null, checkSickAt = null, checkDiscAt = null,
            stageSickDone = false, snackCount = 0, events = emptyList(),
            notifOn = true, soundOn = true,
        )
        pet = if (!hatched) push(pet, ActionType.hatch, hatchAt, "Egg is waiting")
        else push(pet, ActionType.hatch, hatchAt, "Hatched as Babytchi")
        return catchUp(pet, now)
    }

    fun createDemoPet(now: Long = System.currentTimeMillis()): Pet {
        val hatchAt = now - (Characters.BABY_MS + 95L * 60 * 1000)
        val stageStartedAt = hatchAt + Characters.BABY_MS
        return Pet(
            id = uid(), nickname = "Demo", hatchAt = hatchAt,
            clockSetAt = hatchAt - Characters.EGG_MS,
            targetId = CharacterId.mametchi, region = "en", firmware = Firmware.replica,
            createdAt = now, lastTickAt = now, form = CharacterId.marutchi, teenKind = null,
            stageStartedAt = stageStartedAt, secretEligible = false,
            hunger = 1, hungerAt = now - 42L * 60 * 1000,
            happy = 2, happyAt = now - 18L * 60 * 1000,
            discipline = 25, weight = 12, careMistakes = 0, discMistakes = 0,
            poop = 1, poopAt = now - 40L * 60 * 1000, sick = false, medicineGiven = 0,
            sleeping = false, lightsOn = true, age = 1,
            hungerWindowAt = null, happyWindowAt = null, sleepWindowAt = null, misbehaveAt = null,
            heartDecrements = 3, checkPoopAt = null, checkSickAt = null, checkDiscAt = null,
            stageSickDone = false, snackCount = 0,
            events = listOf(
                CareEvent(uid(), hatchAt, ActionType.hatch, "Hatched as Babytchi"),
                CareEvent(uid(), stageStartedAt, ActionType.evolve, "Evolved into Marutchi"),
                CareEvent(uid(), now - 40L * 60 * 1000, ActionType.poop, "Poop ×1"),
            ),
            notifOn = true, soundOn = true,
        )
    }

    private fun nextDrainAt(lastAt: Long, hearts: Int, lossMin: Int, wake: Int?, sleep: Int?): Long? {
        if (hearts <= 0) return null
        return Clock.addAwakeMs(lastAt, lossMin * 60L * 1000, wake, sleep)
    }

    fun nextPoopAt(pet: Pet): Long? {
        if (pet.form == CharacterId.egg || pet.checkPoopAt != null) return null
        val interval = (Characters.POOP_INTERVAL_MIN[pet.form] ?: 180) * 60L * 1000
        val (wake, sleep) = schedule(pet)
        return Clock.addAwakeMs(pet.poopAt, interval, wake, sleep)
    }

    fun nextSicknessAt(pet: Pet): Long? {
        if (pet.form == CharacterId.egg || pet.sick || pet.stageSickDone || pet.checkSickAt != null) return null
        val min = Characters.stats(pet.form).sicknessMin
        if (min >= 9000) return null
        val (wake, sleep) = schedule(pet)
        return Clock.addAwakeMs(pet.stageStartedAt, min * 60L * 1000, wake, sleep)
    }

    fun remainingDiscDrops(pet: Pet): Int? {
        val c = Characters.stats(pet.form).disciplineCountdown ?: return null
        if (pet.firmware == Firmware.vintage && pet.discipline >= 100) return null
        if (pet.checkDiscAt != null || pet.misbehaveAt != null) return 0
        return maxOf(0, c - pet.heartDecrements)
    }

    fun evolutionDueAt(pet: Pet): Long? = when (pet.form) {
        CharacterId.egg -> pet.hatchAt
        CharacterId.babytchi -> pet.stageStartedAt + Characters.BABY_MS
        CharacterId.marutchi -> pet.stageStartedAt + Characters.MARU_MS
        CharacterId.tamatchi -> pet.stageStartedAt + Characters.TAMATCHI_MS
        CharacterId.kuchitamatchi -> pet.stageStartedAt + Characters.KUCHITA_MS
        CharacterId.maskutchi -> if (pet.secretEligible) pet.stageStartedAt + Characters.SECRET_WAIT_MS else null
        else -> null
    }

    private fun evolve(pet: Pet, at: Long): Pet {
        val next = Evolution.nextFormAfter(pet) ?: return pet
        var p = pet
        when (p.form) {
            CharacterId.egg -> {
                p = p.copy(
                    form = CharacterId.babytchi, stageStartedAt = at,
                    hunger = 0, happy = 0, hungerAt = at, happyAt = at,
                    hungerWindowAt = at, happyWindowAt = at, weight = 5,
                )
                return push(p, ActionType.hatch, at, "Hatched as Babytchi")
            }
            CharacterId.marutchi -> {
                val kind = Evolution.teenFromMistakes(p.careMistakes, Evolution.discForEvo(p))
                p = p.copy(
                    teenKind = kind,
                    form = Evolution.teenCharacter(kind),
                    discipline = if (kind.name.endsWith("t1")) maxOf(p.discipline, 50) else p.discipline,
                )
            }
            CharacterId.tamatchi, CharacterId.kuchitamatchi -> {
                val kind = p.teenKind ?: Evolution.teenFromMistakes(p.careMistakes, Evolution.discForEvo(p))
                p = p.copy(
                    form = Evolution.adultFrom(kind, p.careMistakes, Evolution.discForEvo(p)),
                    secretEligible = Evolution.canBecomeSecret(kind, Evolution.adultFrom(kind, p.careMistakes, Evolution.discForEvo(p))),
                )
            }
            else -> p = p.copy(form = next)
        }
        val s = Characters.stats(p.form)
        p = p.copy(
            stageStartedAt = at,
            weight = maxOf(p.weight, s.minWeight),
            medicineGiven = 0, heartDecrements = 0, snackCount = 0,
            misbehaveAt = null, checkPoopAt = null, checkSickAt = null, checkDiscAt = null,
            stageSickDone = false, hungerAt = at, happyAt = at,
            sleeping = Clock.isSleepingAt(at, s.wakeHour, s.sleepHour),
        )
        return push(p, ActionType.evolve, at, "Evolved into ${s.name}")
    }

    private fun countCareMiss(pet: Pet, at: Long, reason: String): Pet {
        val p = pet.copy(careMistakes = pet.careMistakes + 1)
        return push(p, ActionType.miss_care, at, reason)
    }

    private fun countDiscMiss(pet: Pet, at: Long): Pet {
        var p = pet.copy(misbehaveAt = null, checkDiscAt = null, heartDecrements = 0)
        if (p.firmware == Firmware.vintage) {
            return push(p, ActionType.miss_disc, at, "Vintage: ignored scold does not add a discipline mistake")
        }
        p = p.copy(discMistakes = pet.discMistakes + 1)
        return push(p, ActionType.miss_disc, at, "Ignored a misbehave call")
    }

    private fun dropHeart(pet: Pet, meter: String, at: Long): Pet {
        var p = pet
        p = if (meter == "hunger") {
            val h = maxOf(0, p.hunger - 1)
            p.copy(hunger = h, hungerAt = at, hungerWindowAt = if (h == 0) at else p.hungerWindowAt)
        } else {
            val h = maxOf(0, p.happy - 1)
            p.copy(happy = h, happyAt = at, happyWindowAt = if (h == 0) at else p.happyWindowAt)
        }
        p = p.copy(heartDecrements = p.heartDecrements + 1)
        val s = Characters.stats(p.form)
        val countdown = s.disciplineCountdown
        if (countdown != null && p.misbehaveAt == null && p.checkDiscAt == null && p.hunger > 0 && p.happy > 0 && p.heartDecrements >= countdown) {
            p = if (p.firmware == Firmware.vintage && p.discipline >= 100) p.copy(heartDecrements = 0)
            else p.copy(checkDiscAt = at)
        }
        return p
    }

    private fun applyTimePoint(pet: Pet, at: Long): Pet {
        var p = pet
        val s = Characters.stats(p.form)
        val due = evolutionDueAt(p)
        if (due != null && at >= due) {
            return evolve(p.copy(lastTickAt = at), at)
        }
        if (p.form == CharacterId.babytchi) {
            val sinceHatch = at - p.hatchAt
            if (sinceHatch >= Characters.BABY_POOP_MS && p.poop == 0 && p.checkPoopAt == null &&
                p.events.none { it.type == ActionType.poop || it.type == ActionType.confirm }
            ) {
                p = push(p.copy(checkPoopAt = at), ActionType.poop, at, "First poop is due — look at the shell")
            }
            if (sinceHatch >= Characters.BABY_NAP_MS && p.age == 0) {
                p = push(p.copy(age = 1), ActionType.nap, at, "Baby nap — age +1")
            }
        }
        val sleepingNow = Clock.isSleepingAt(at, s.wakeHour, s.sleepHour)
        if (sleepingNow && !p.sleeping) {
            val fmt = SimpleDateFormat("HH:mm", Locale.getDefault())
            val until = fmt.format(Date(at + Characters.CARE_WINDOW_MS))
            return push(
                p.copy(sleeping = true, sleepWindowAt = at, lightsOn = true, lastTickAt = at),
                ActionType.sleep, at, "Sleeping — lights off before $until",
            )
        }
        if (!sleepingNow && p.sleeping) {
            val age = p.age + 1
            return push(
                p.copy(sleeping = false, age = age, lightsOn = true, sleepWindowAt = null, lastTickAt = at),
                ActionType.wake, at, "Woke up — age $age",
            )
        }
        if (p.sleepWindowAt != null && p.lightsOn && at - p.sleepWindowAt >= Characters.CARE_WINDOW_MS) {
            p = countCareMiss(p, at, "Did not turn the lights off").copy(sleepWindowAt = null)
        }
        if (p.hungerWindowAt != null && at - p.hungerWindowAt >= Characters.CARE_WINDOW_MS) {
            p = countCareMiss(p, at, "Missed a hunger call").copy(hungerWindowAt = null)
        }
        if (p.happyWindowAt != null && at - p.happyWindowAt >= Characters.CARE_WINDOW_MS) {
            p = countCareMiss(p, at, "Missed a happy call").copy(happyWindowAt = null)
        }
        if (p.misbehaveAt != null && at - p.misbehaveAt >= Characters.CARE_WINDOW_MS) {
            p = countDiscMiss(p, at)
        }
        if (!p.sleeping) {
            val (wake, sleep) = schedule(p)
            val hungerDue = nextDrainAt(p.hungerAt, p.hunger, Characters.hungerLossMin(p.form, p.age), wake, sleep)
            if (hungerDue != null && at >= hungerDue) p = dropHeart(p, "hunger", at)
            val happyDue = nextDrainAt(p.happyAt, p.happy, Characters.happyLossMin(p.form, p.age), wake, sleep)
            if (happyDue != null && at >= happyDue) p = dropHeart(p, "happy", at)
            val poopDue = nextPoopAt(p)
            if (poopDue != null && at >= poopDue && p.poop < 4 && p.checkPoopAt == null) {
                p = push(p.copy(checkPoopAt = at), ActionType.poop, at, "Poop is due — look at the shell (no beep)")
            }
            val sickDue = nextSicknessAt(p)
            if (sickDue != null && at >= sickDue && p.checkSickAt == null) {
                p = push(p.copy(checkSickAt = at), ActionType.sick, at, "Scheduled skull — look at the shell (no beep)")
            }
        }
        return p.copy(lastTickAt = at)
    }

    private fun nextEventAt(pet: Pet, from: Long): Long? {
        val s = Characters.stats(pet.form)
        val (wake, sleep) = schedule(pet)
        val candidates = mutableListOf<Long>()
        evolutionDueAt(pet)?.takeIf { it > from }?.let { candidates += it }
        Clock.nextSleepAt(from + 1, wake, sleep)?.let { candidates += it }
        Clock.nextWakeAt(from + 1, wake, sleep)?.let { candidates += it }
        pet.hungerWindowAt?.let { candidates += it + Characters.CARE_WINDOW_MS }
        pet.happyWindowAt?.let { candidates += it + Characters.CARE_WINDOW_MS }
        if (pet.sleepWindowAt != null && pet.lightsOn) candidates += pet.sleepWindowAt + Characters.CARE_WINDOW_MS
        pet.misbehaveAt?.let { candidates += it + Characters.CARE_WINDOW_MS }
        if (!pet.sleeping && !Clock.isSleepingAt(from + 1, wake, sleep)) {
            nextDrainAt(pet.hungerAt, pet.hunger, Characters.hungerLossMin(pet.form, pet.age), wake, sleep)?.let { candidates += it }
            nextDrainAt(pet.happyAt, pet.happy, Characters.happyLossMin(pet.form, pet.age), wake, sleep)?.let { candidates += it }
            nextPoopAt(pet)?.let { candidates += it }
            nextSicknessAt(pet)?.let { candidates += it }
        }
        if (pet.form == CharacterId.babytchi) {
            val poopT = pet.hatchAt + Characters.BABY_POOP_MS
            val napT = pet.hatchAt + Characters.BABY_NAP_MS
            if (poopT > from) candidates += poopT
            if (napT > from) candidates += napT
        }
        return candidates.filter { it > from }.minOrNull()
    }

    fun catchUp(pet: Pet, now: Long): Pet {
        var p = normalize(pet)
        if (now <= p.lastTickAt) return p.copy(lastTickAt = now)
        var guard = 0
        while (guard++ < 2500) {
            val n = nextEventAt(p, p.lastTickAt)
            if (n == null || n > now) {
                val s = Characters.stats(p.form)
                return p.copy(lastTickAt = now, sleeping = Clock.isSleepingAt(now, s.wakeHour, s.sleepHour))
            }
            p = applyTimePoint(p, n)
        }
        return p.copy(lastTickAt = now)
    }

    fun applyAction(pet: Pet, type: ActionType, at: Long): Pet {
        var p = catchUp(pet, at)
        val s = Characters.stats(p.form)
        return when (type) {
            ActionType.meal -> {
                if (p.sleeping) return push(p, type, at, "Sleeping — meal ignored on the device")
                if (p.hunger >= 4) return push(p, type, at, "Full — it may refuse the meal")
                p = p.copy(hunger = min(4, p.hunger + 1), hungerAt = at, hungerWindowAt = null, weight = min(s.maxWeight, p.weight + 1))
                push(p, type, at, "Meal · hunger ${p.hunger}/4 · ${p.weight}g")
            }
            ActionType.snack -> {
                if (p.sleeping) return push(p, type, at, "Sleeping — snack ignored on the device")
                p = p.copy(
                    happy = min(4, p.happy + 1), happyAt = at, happyWindowAt = null,
                    weight = min(s.maxWeight, p.weight + 2), snackCount = p.snackCount + 1,
                )
                val replicaSnack = p.firmware == Firmware.replica &&
                    p.form in setOf(CharacterId.marutchi, CharacterId.tamatchi, CharacterId.kuchitamatchi) &&
                    p.snackCount >= 4 && !p.sick && p.checkSickAt == null
                if (replicaSnack) p = p.copy(checkSickAt = at)
                push(p, type, at, "Snack · happy ${p.happy}/4 · ${p.weight}g")
            }
            ActionType.game -> {
                if (p.sleeping) return push(p, type, at, "Sleeping — game ignored")
                p = p.copy(happy = min(4, p.happy + 1), happyAt = at, happyWindowAt = null, weight = maxOf(s.minWeight, p.weight - 1))
                push(p, type, at, "Game won · happy ${p.happy}/4 · ${p.weight}g")
            }
            ActionType.clean -> {
                val had = p.poop
                p = p.copy(poop = 0, poopAt = at, checkPoopAt = null)
                push(p, type, at, if (had > 0) "Cleaned $had poop" else "Cleaned — nothing there")
            }
            ActionType.scold -> {
                p = p.copy(discipline = min(100, p.discipline + 25), misbehaveAt = null, checkDiscAt = null, heartDecrements = 0)
                push(p, type, at, "Scolded · discipline ${p.discipline}%")
            }
            ActionType.medicine -> {
                if (!p.sick) return push(p, type, at, "Not sick")
                p = p.copy(medicineGiven = p.medicineGiven + 1)
                if (p.medicineGiven >= s.shots) {
                    p = p.copy(sick = false, medicineGiven = 0, checkSickAt = null, stageSickDone = true)
                    push(p, ActionType.heal, at, "Recovered")
                } else push(p, type, at, "Medicine ${p.medicineGiven}/${s.shots}")
            }
            ActionType.lights_off -> push(p.copy(lightsOn = false, sleepWindowAt = null), type, at, "Lights off")
            ActionType.miss_care -> countCareMiss(p, at, "Logged a care mistake")
                .copy(hungerWindowAt = null, happyWindowAt = null, sleepWindowAt = null)
            ActionType.miss_disc -> countDiscMiss(p, at)
            ActionType.sick -> push(p.copy(sick = true, medicineGiven = 0), type, at, "Marked sick")
            else -> p
        }
    }

    fun undoLastCare(pet: Pet): Pet {
        val last = pet.events.find {
            it.type in setOf(
                ActionType.meal, ActionType.snack, ActionType.game, ActionType.clean,
                ActionType.scold, ActionType.medicine, ActionType.lights_off,
                ActionType.miss_care, ActionType.miss_disc, ActionType.sick,
            )
        } ?: return pet
        var p = pet.copy(events = pet.events.filter { it.id != last.id })
        when (last.type) {
            ActionType.miss_care -> p = p.copy(careMistakes = maxOf(0, p.careMistakes - 1))
            ActionType.miss_disc -> p = p.copy(discMistakes = maxOf(0, p.discMistakes - 1))
            ActionType.meal -> p = p.copy(hunger = maxOf(0, p.hunger - 1), weight = maxOf(Characters.stats(p.form).minWeight, p.weight - 1))
            ActionType.snack -> p = p.copy(happy = maxOf(0, p.happy - 1), weight = maxOf(Characters.stats(p.form).minWeight, p.weight - 2), snackCount = maxOf(0, p.snackCount - 1))
            ActionType.game -> p = p.copy(happy = maxOf(0, p.happy - 1), weight = min(Characters.stats(p.form).maxWeight, p.weight + 1))
            ActionType.scold -> p = p.copy(discipline = maxOf(0, p.discipline - 25))
            ActionType.lights_off -> p = p.copy(lightsOn = true)
            ActionType.sick -> p = p.copy(sick = false)
            else -> {}
        }
        return push(p, ActionType.undo_miss, System.currentTimeMillis(), "Undid ${last.type}")
    }

    fun dismissOffShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()): Pet {
        val p = normalize(pet).copy(lastTickAt = at)
        return when (kind) {
            "poop" -> push(p.copy(poop = 0, poopAt = at, checkPoopAt = null), ActionType.sync, at, "No poop on the shell — next check from now")
            "sick" -> push(p.copy(sick = false, medicineGiven = 0, checkSickAt = null, stageSickDone = true), ActionType.sync, at, "No skull on the shell")
            else -> push(p.copy(misbehaveAt = null, checkDiscAt = null, heartDecrements = 0), ActionType.sync, at, "No attention on the shell")
        }
    }

    fun confirmOnShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()): Pet {
        var p = normalize(pet).copy(lastTickAt = at)
        return when (kind) {
            "poop" -> {
                p = p.copy(poop = min(4, p.poop + 1), poopAt = at, checkPoopAt = null)
                p = push(p, ActionType.confirm, at, "Poop on the shell ×${p.poop}")
                if (p.poop >= 4 && !p.sick) {
                    p = p.copy(sick = true, medicineGiven = 0, stageSickDone = true, checkSickAt = null)
                    p = push(p, ActionType.sick, at, "Four poops — skull")
                }
                p
            }
            "sick" -> push(p.copy(sick = true, medicineGiven = 0, checkSickAt = null, stageSickDone = true), ActionType.confirm, at, "Skull on the shell")
            else -> push(p.copy(checkDiscAt = null, misbehaveAt = at, heartDecrements = 0), ActionType.confirm, at, "Attention on the shell — 15 min to scold")
        }
    }

    fun syncPet(pet: Pet, patch: SyncPatch, at: Long = System.currentTimeMillis(), restartStage: Boolean = false, attention: Boolean? = null): Pet {
        val formChanged = patch.form != null && patch.form != pet.form
        var p = pet.copy(
            hunger = patch.hunger ?: pet.hunger,
            happy = patch.happy ?: pet.happy,
            discipline = patch.discipline ?: pet.discipline,
            weight = patch.weight ?: pet.weight,
            careMistakes = patch.careMistakes ?: pet.careMistakes,
            discMistakes = patch.discMistakes ?: pet.discMistakes,
            poop = patch.poop ?: pet.poop,
            sick = patch.sick ?: pet.sick,
            form = patch.form ?: pet.form,
            age = patch.age ?: pet.age,
            lastTickAt = at,
        )
        if (patch.hunger != null && patch.hunger != pet.hunger) {
            p = p.copy(hungerAt = at, hungerWindowAt = if (p.hunger == 0) at else null)
        }
        if (patch.happy != null && patch.happy != pet.happy) {
            p = p.copy(happyAt = at, happyWindowAt = if (p.happy == 0) at else null)
        }
        if (patch.poop != null && patch.poop != pet.poop) p = p.copy(poopAt = at)
        if (patch.sick == false) p = p.copy(medicineGiven = 0)
        p = when (attention) {
            false -> p.copy(misbehaveAt = null, heartDecrements = 0)
            true -> if (p.misbehaveAt == null) p.copy(misbehaveAt = at) else p
            null -> p
        }
        if (formChanged || restartStage) {
            p = p.copy(
                stageStartedAt = at, heartDecrements = 0, misbehaveAt = null,
                hungerAt = at, happyAt = at, weight = maxOf(p.weight, Characters.stats(p.form).minWeight),
            )
        }
        if (p.form == CharacterId.tamatchi || p.form == CharacterId.kuchitamatchi) {
            p = p.copy(teenKind = Evolution.teenKindForForm(p))
        }
        if (formChanged) {
            val stage = Characters.stats(p.form).stage
            if (stage == Stage.adult || stage == Stage.secret) {
                p = p.copy(
                    secretEligible = p.form == CharacterId.maskutchi &&
                        (p.targetId == CharacterId.bill || p.targetId == CharacterId.oyajitchi) &&
                        Evolution.canBecomeSecret(Evolution.teenKindNow(p), CharacterId.maskutchi),
                )
            }
        }
        val note = when {
            formChanged -> "Matched ${Characters.name(p.form)} · mistakes carry over"
            restartStage -> "Matched · stage timer restarted"
            else -> "Matched to the device"
        }
        return push(p, ActionType.sync, at, note)
    }

    private fun urgencyFor(dueAt: Long, now: Long, window: Boolean = false): Urgency {
        val left = dueAt - now
        return if (window) {
            if (left <= 0) Urgency.late else Urgency.now
        } else when {
            left <= 0 -> Urgency.now
            left <= 8L * 60 * 1000 -> Urgency.soon
            else -> Urgency.idle
        }
    }

    fun derive(pet: Pet, now: Long): DerivedState {
        val p = catchUp(pet, now)
        val s = Characters.stats(p.form)
        val (wake, sleep) = schedule(p)
        val nextHunger = if (p.sleeping) null else nextDrainAt(p.hungerAt, p.hunger, Characters.hungerLossMin(p.form, p.age), wake, sleep)
        val nextHappy = if (p.sleeping) null else nextDrainAt(p.happyAt, p.happy, Characters.happyLossMin(p.form, p.age), wake, sleep)
        val poopAt = nextPoopAt(p)
        val sickAt = nextSicknessAt(p)
        val evoAt = evolutionDueAt(p)
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
            nextPoopAt = poopAt, nextSicknessAt = sickAt, remainingDiscDrops = remainingDiscDrops(p),
            nextEvolveAt = evoAt, nextSleepAt = slAt, nextWakeAt = wkAt,
            alerts = alerts, primary = primary, predictedTeen = predictedTeen, predictedAdult = predictedAdult,
            onTarget = Evolution.onTarget(p), pathStatus = Evolution.pathStatus(p), budget = Evolution.mistakeBudget(p),
        )
    }

    fun upcomingAlarms(pet: Pet, now: Long): List<NativeAlarm> {
        val d = derive(pet, now)
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

    fun formatDuration(ms: Long): String {
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
}
