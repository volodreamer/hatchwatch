package com.hatchwatch.app.engine

enum class Stage { egg, baby, child, teen, adult, secret }

enum class CharacterId(val id: String) {
    egg("egg"),
    babytchi("babytchi"),
    marutchi("marutchi"),
    tamatchi("tamatchi"),
    kuchitamatchi("kuchitamatchi"),
    mametchi("mametchi"),
    ginjirotchi("ginjirotchi"),
    maskutchi("maskutchi"),
    kuchipatchi("kuchipatchi"),
    nyorotchi("nyorotchi"),
    tarakotchi("tarakotchi"),
    oyajitchi("oyajitchi"),
    bill("bill");

    companion object {
        fun from(raw: String?) = entries.find { it.id == raw } ?: babytchi
    }
}

enum class Firmware { vintage, replica }

enum class TeenKind { tamatchi_t1, tamatchi_t2, kuchitamatchi_t1, kuchitamatchi_t2 }

enum class ActionType {
    meal, snack, game, clean, scold, medicine, lights_off,
    miss_care, miss_disc, undo_miss, sick, heal, evolve, poop,
    sleep, wake, hatch, sync, nap, confirm
}

enum class Urgency { idle, soon, now, late }

enum class PathStatus { hit, path, off }

enum class AlertKind { hunger, happy, lights, discipline, poop, sick, evolve, hatch }

data class CareEvent(
    val id: String,
    val at: Long,
    val type: ActionType,
    val note: String? = null,
)

data class CharacterStats(
    val id: CharacterId,
    val name: String,
    val short: String,
    val stage: Stage,
    val wakeHour: Int?,
    val sleepHour: Int?,
    val hungryLossMin: Int,
    val happyLossMin: Int,
    val sicknessMin: Int,
    val shots: Int,
    val minWeight: Int,
    val maxWeight: Int,
    val evoMin: Int,
    val disciplineCountdown: Int?,
    val initialDiscipline: Int,
    val bites: Int,
    val gameWinPct: Int,
    val lifespan: String,
    val blurb: String,
)

data class Pet(
    val id: String,
    val nickname: String,
    val hatchAt: Long,
    val clockSetAt: Long,
    val targetId: CharacterId,
    val region: String,
    val firmware: Firmware,
    val createdAt: Long,
    val lastTickAt: Long,
    val form: CharacterId,
    val teenKind: TeenKind?,
    val stageStartedAt: Long,
    val secretEligible: Boolean,
    val hunger: Int,
    val hungerAt: Long,
    val happy: Int,
    val happyAt: Long,
    val discipline: Int,
    val weight: Int,
    val careMistakes: Int,
    val discMistakes: Int,
    val poop: Int,
    val poopAt: Long,
    val sick: Boolean,
    val medicineGiven: Int,
    val sleeping: Boolean,
    val lightsOn: Boolean,
    val age: Int,
    val hungerWindowAt: Long?,
    val happyWindowAt: Long?,
    val sleepWindowAt: Long?,
    val misbehaveAt: Long?,
    val heartDecrements: Int,
    val checkPoopAt: Long?,
    val checkSickAt: Long?,
    val checkDiscAt: Long?,
    val stageSickDone: Boolean,
    val snackCount: Int,
    val events: List<CareEvent>,
    val notifOn: Boolean,
    val soundOn: Boolean,
)

data class CareAlert(
    val id: String,
    val kind: AlertKind,
    val title: String,
    val detail: String,
    val dueAt: Long,
    val urgency: Urgency,
    val deviceHint: String,
)

data class MistakeBudget(
    val careUsed: Int,
    val discUsed: Int,
    val careMax: Int?,
    val discMin: Int?,
    val discMax: Int?,
    val careRemaining: Int?,
    val discRemaining: Int?,
    val summary: String,
    val stageTip: String,
)

data class TargetPlan(
    val id: CharacterId,
    val name: String,
    val difficulty: String,
    val path: List<CharacterId>,
    val headline: String,
    val steps: List<String>,
    val careMax: Int?,
    val discMin: Int?,
    val discMax: Int?,
    val scold: String,
)

data class DerivedState(
    val pet: Pet,
    val stats: CharacterStats,
    val now: Long,
    val nextHungerDrainAt: Long?,
    val nextHappyDrainAt: Long?,
    val nextPoopAt: Long?,
    val nextSicknessAt: Long?,
    val remainingDiscDrops: Int?,
    val nextEvolveAt: Long?,
    val nextSleepAt: Long?,
    val nextWakeAt: Long?,
    val alerts: List<CareAlert>,
    val primary: CareAlert?,
    val predictedTeen: TeenKind?,
    val predictedAdult: CharacterId,
    val onTarget: Boolean,
    val pathStatus: PathStatus,
    val budget: MistakeBudget,
)

data class SyncPatch(
    val hunger: Int? = null,
    val happy: Int? = null,
    val discipline: Int? = null,
    val weight: Int? = null,
    val careMistakes: Int? = null,
    val discMistakes: Int? = null,
    val poop: Int? = null,
    val sick: Boolean? = null,
    val form: CharacterId? = null,
    val age: Int? = null,
)

data class NativeAlarm(
    val id: String,
    val at: Long,
    val kind: String,
    val title: String,
    val body: String,
    val warn: Boolean = false,
)
