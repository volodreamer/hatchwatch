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

    internal fun push(pet: Pet, type: ActionType, at: Long, note: String? = null) = pet.copy(
        events = (listOf(CareEvent(uid(), at, type, note)) + pet.events).take(200),
    )

    internal fun schedule(pet: Pet): Pair<Int?, Int?> {
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

    internal fun nextDrainAt(lastAt: Long, hearts: Int, lossMin: Int, wake: Int?, sleep: Int?): Long? {
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

    internal fun countCareMiss(pet: Pet, at: Long, reason: String): Pet {
        val p = pet.copy(careMistakes = pet.careMistakes + 1)
        return push(p, ActionType.miss_care, at, reason)
    }

    internal fun countDiscMiss(pet: Pet, at: Long): Pet {
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

    internal fun fallAsleep(pet: Pet, at: Long): Pet {
        val fmt = SimpleDateFormat("HH:mm", Locale.getDefault())
        val until = fmt.format(Date(at + Characters.CARE_WINDOW_MS))
        return push(
            pet.copy(sleeping = true, sleepWindowAt = at, lightsOn = true, lastTickAt = at),
            ActionType.sleep, at, "Sleeping — lights off before $until",
        )
    }

    internal fun wakeUp(pet: Pet, at: Long): Pet {
        val age = pet.age + 1
        return push(
            pet.copy(sleeping = false, age = age, lightsOn = true, sleepWindowAt = null, lastTickAt = at),
            ActionType.wake, at, "Woke up — age $age",
        )
    }

    internal fun applyTimePoint(pet: Pet, at: Long): Pet {
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
        if (sleepingNow && !p.sleeping) return fallAsleep(p, at)
        if (!sleepingNow && p.sleeping) return wakeUp(p, at)
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

    internal fun nextEventAt(pet: Pet, from: Long): Long? {
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
                val shouldSleep = Clock.isSleepingAt(now, s.wakeHour, s.sleepHour)
                if (shouldSleep && !p.sleeping) return fallAsleep(p, now)
                if (!shouldSleep && p.sleeping) return wakeUp(p, now)
                if (shouldSleep && p.sleeping && p.lightsOn && p.sleepWindowAt == null) {
                    return p.copy(sleepWindowAt = now, lastTickAt = now)
                }
                return p.copy(lastTickAt = now)
            }
            p = applyTimePoint(p, n)
        }
        return p.copy(lastTickAt = now)
    }

    fun applyAction(pet: Pet, type: ActionType, at: Long) = simApplyAction(pet, type, at)
    fun undoLastCare(pet: Pet) = simUndoLastCare(pet)
    fun dismissOffShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()) = simDismissOffShell(pet, kind, at)
    fun confirmOnShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()) = simConfirmOnShell(pet, kind, at)
    fun syncPet(pet: Pet, patch: SyncPatch, at: Long = System.currentTimeMillis(), restartStage: Boolean = false, attention: Boolean? = null) =
        simSyncPet(pet, patch, at, restartStage, attention)
    fun derive(pet: Pet, now: Long) = simDerive(pet, now)
    fun upcomingAlarms(pet: Pet, now: Long) = simUpcomingAlarms(pet, now)
    fun formatDuration(ms: Long) = simFormatDuration(ms)
}
