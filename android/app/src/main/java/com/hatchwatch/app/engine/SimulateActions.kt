package com.hatchwatch.app.engine

import kotlin.math.min

fun simApplyAction(pet: Pet, type: ActionType, at: Long): Pet {
    if (pet.dead && type != ActionType.die) return pet
    var p = if (type == ActionType.die) Simulate.normalize(pet) else Simulate.catchUp(pet, at)
    val s = Characters.stats(p.form)
    return when (type) {
        ActionType.meal -> {
            if (p.sleeping) return Simulate.push(p, type, at, "Sleeping — meal ignored on the device")
            if (p.hunger >= 4) return Simulate.push(p, type, at, "Full — it may refuse the meal")
            p = p.copy(hunger = min(4, p.hunger + 1), hungerWindowAt = null, weight = min(s.maxWeight, p.weight + 1))
            Simulate.push(p, type, at, "Meal · hunger ${p.hunger}/4 · ${p.weight}g")
        }
        ActionType.snack -> {
            if (p.sleeping) return Simulate.push(p, type, at, "Sleeping — snack ignored on the device")
            p = p.copy(
                happy = min(4, p.happy + 1), happyWindowAt = null,
                weight = min(s.maxWeight, p.weight + 2), snackCount = p.snackCount + 1,
            )
            val replicaSnack = p.firmware == Firmware.replica &&
                p.form in setOf(CharacterId.marutchi, CharacterId.tamatchi, CharacterId.kuchitamatchi) &&
                p.snackCount >= 4 && !p.sick && p.checkSickAt == null
            if (replicaSnack) p = p.copy(checkSickAt = at)
            Simulate.push(p, type, at, "Snack · happy ${p.happy}/4 · ${p.weight}g")
        }
        ActionType.game -> {
            if (p.sleeping) return Simulate.push(p, type, at, "Sleeping — game ignored")
            p = p.copy(happy = min(4, p.happy + 1), happyWindowAt = null, weight = maxOf(s.minWeight, p.weight - 1))
            Simulate.push(p, type, at, "Game won · happy ${p.happy}/4 · ${p.weight}g")
        }
        ActionType.clean -> {
            val had = p.poop
            p = p.copy(poop = 0, poopAt = at, checkPoopAt = null)
            Simulate.push(p, type, at, if (had > 0) "Cleaned $had poop" else "Cleaned — nothing there")
        }
        ActionType.scold -> {
            p = p.copy(discipline = min(100, p.discipline + 25), misbehaveAt = null, checkDiscAt = null, heartDecrements = 0)
            Simulate.push(p, type, at, "Scolded · discipline ${p.discipline}%")
        }
        ActionType.medicine -> {
            if (!p.sick) return Simulate.push(p, type, at, "Not sick")
            p = p.copy(medicineGiven = p.medicineGiven + 1)
            if (p.medicineGiven >= s.shots) {
                p = p.copy(sick = false, medicineGiven = 0, checkSickAt = null, stageSickDone = true)
                Simulate.push(p, ActionType.heal, at, "Recovered")
            } else Simulate.push(p, type, at, "Medicine ${p.medicineGiven}/${s.shots}")
        }
        ActionType.lights_off -> Simulate.push(p.copy(lightsOn = false, sleepWindowAt = null), type, at, "Lights off")
        ActionType.die -> {
            if (p.dead) p
            else Simulate.push(
                p.copy(
                    dead = true, deadAt = at, sleeping = false, lightsOn = false,
                    hungerWindowAt = null, happyWindowAt = null, sleepWindowAt = null,
                    misbehaveAt = null, checkPoopAt = null, checkSickAt = null, checkDiscAt = null,
                ),
                type, at, "Died · age ${p.age} · ${p.careMistakes} care mistakes",
            )
        }
        ActionType.miss_care -> Simulate.countCareMiss(p, at, "Logged a care mistake")
            .copy(hungerWindowAt = null, happyWindowAt = null, sleepWindowAt = null)
        ActionType.miss_disc -> Simulate.countDiscMiss(p, at)
        ActionType.sick -> Simulate.push(p.copy(sick = true, medicineGiven = 0), type, at, "Marked sick")
        else -> p
    }
}

fun simUndoLastCare(pet: Pet): Pet {
    val last = pet.events.find {
        it.type in setOf(
            ActionType.meal, ActionType.snack, ActionType.game, ActionType.clean,
            ActionType.scold, ActionType.medicine, ActionType.lights_off,
            ActionType.miss_care, ActionType.miss_disc, ActionType.sick, ActionType.die,
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
        ActionType.die -> p = p.copy(dead = false, deadAt = null)
        else -> {}
    }
    return Simulate.push(p, ActionType.undo_miss, System.currentTimeMillis(), "Undid ${last.type}")
}

fun simDismissOffShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()): Pet {
    if (pet.dead) return pet
    val p = Simulate.normalize(pet).copy(lastTickAt = at)
    return when (kind) {
        "poop" -> Simulate.push(p.copy(poop = 0, poopAt = at, checkPoopAt = null), ActionType.sync, at, "No poop on the shell — next check from now")
        "sick" -> Simulate.push(p.copy(sick = false, medicineGiven = 0, checkSickAt = null, stageSickDone = true), ActionType.sync, at, "No skull on the shell")
        else -> Simulate.push(p.copy(misbehaveAt = null, checkDiscAt = null, heartDecrements = 0), ActionType.sync, at, "No attention on the shell")
    }
}

fun simConfirmOnShell(pet: Pet, kind: String, at: Long = System.currentTimeMillis()): Pet {
    if (pet.dead) return pet
    var p = Simulate.normalize(pet).copy(lastTickAt = at)
    return when (kind) {
        "poop" -> {
            p = p.copy(poop = min(4, p.poop + 1), poopAt = at, checkPoopAt = null)
            p = Simulate.push(p, ActionType.confirm, at, "Poop on the shell ×${p.poop}")
            if (p.poop >= 4 && !p.sick) {
                p = p.copy(sick = true, medicineGiven = 0, stageSickDone = true, checkSickAt = null)
                p = Simulate.push(p, ActionType.sick, at, "Four poops — skull")
            }
            p
        }
        "sick" -> Simulate.push(p.copy(sick = true, medicineGiven = 0, checkSickAt = null, stageSickDone = true), ActionType.confirm, at, "Skull on the shell")
        else -> Simulate.push(p.copy(checkDiscAt = null, misbehaveAt = at, heartDecrements = 0), ActionType.confirm, at, "Attention on the shell — 15 min to scold")
    }
}

fun simSyncPet(pet: Pet, patch: SyncPatch, at: Long = System.currentTimeMillis(), restartStage: Boolean = false, attention: Boolean? = null): Pet {
    val caught = Simulate.catchUp(pet, at)
    val formChanged = patch.form != null && patch.form != caught.form
    var p = caught.copy(
        hunger = patch.hunger ?: caught.hunger,
        happy = patch.happy ?: caught.happy,
        discipline = patch.discipline ?: caught.discipline,
        weight = patch.weight ?: caught.weight,
        careMistakes = patch.careMistakes ?: caught.careMistakes,
        discMistakes = patch.discMistakes ?: caught.discMistakes,
        poop = patch.poop ?: caught.poop,
        sick = patch.sick ?: caught.sick,
        form = patch.form ?: caught.form,
        age = patch.age ?: caught.age,
        lastTickAt = at,
    )
    if (patch.hunger != null && patch.hunger != caught.hunger) {
        p = p.copy(hungerWindowAt = if (p.hunger == 0) p.hungerWindowAt ?: at else null)
    }
    if (patch.happy != null && patch.happy != caught.happy) {
        p = p.copy(happyWindowAt = if (p.happy == 0) p.happyWindowAt ?: at else null)
    }
    if (patch.poop != null && patch.poop != caught.poop) p = p.copy(poopAt = at)
    if (patch.sick == false) p = p.copy(medicineGiven = 0)
    p = when (attention) {
        false -> p.copy(misbehaveAt = null, heartDecrements = 0)
        true -> if (p.misbehaveAt == null) p.copy(misbehaveAt = at) else p
        null -> p
    }
    if (formChanged || restartStage) {
        p = p.copy(
            stageStartedAt = at, heartDecrements = 0, misbehaveAt = null,
            weight = maxOf(p.weight, Characters.stats(p.form).minWeight),
        )
    }
    if (p.form == CharacterId.tamatchi || p.form == CharacterId.kuchitamatchi) {
        p = p.copy(teenKind = Evolution.teenKindNow(p))
    }
    val note = when {
        formChanged -> "Matched ${Characters.name(p.form)} · mistakes carry over"
        restartStage -> "Matched · stage timer restarted"
        else -> "Matched to the device"
    }
    return Simulate.push(p, ActionType.sync, at, note)
}
