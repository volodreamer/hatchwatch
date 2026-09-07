package com.hatchwatch.app.store

import android.content.Context
import com.hatchwatch.app.AlarmScheduler
import com.hatchwatch.app.CareNotifier
import com.hatchwatch.app.ChirpPlayer
import com.hatchwatch.app.engine.ActionType
import com.hatchwatch.app.engine.CharacterId
import com.hatchwatch.app.engine.Firmware
import com.hatchwatch.app.engine.Pet
import com.hatchwatch.app.engine.PetJson
import com.hatchwatch.app.engine.Simulate
import com.hatchwatch.app.engine.SyncPatch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object PetStore {
    private const val PREFS = "hatchwatch"
    private const val KEY_PET = "hatchwatch-v1"
    private const val KEY_LOCALE = "hatchwatch-locale"
    private const val KEY_ALERTED = "hatchwatch-alerted"

    private val _pet = MutableStateFlow<Pet?>(null)
    val pet: StateFlow<Pet?> = _pet.asStateFlow()

    private val _locale = MutableStateFlow("en")
    val locale: StateFlow<String> = _locale.asStateFlow()

    private var app: Context? = null

    fun init(context: Context) {
        if (app != null) return
        val ctx = context.applicationContext
        app = ctx
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_PET, null)
        if (raw != null) {
            runCatching { PetJson.parse(raw) }.onSuccess { _pet.value = Simulate.catchUp(it, System.currentTimeMillis()) }
        }
        val savedLocale = prefs.getString(KEY_LOCALE, null)
        _locale.value = savedLocale ?: if (java.util.Locale.getDefault().language == "uk") "uk" else "en"
        _pet.value?.let {
            AlarmScheduler.sync(ctx, it)
            maybeAlert(it.copy(sleeping = false, sleepWindowAt = null), it)
        }
    }

    private fun persist(next: Pet?) {
        val ctx = app ?: return
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (next == null) prefs.edit().remove(KEY_PET).apply()
        else prefs.edit().putString(KEY_PET, PetJson.toBackup(next)).apply()
        if (next != null) AlarmScheduler.sync(ctx, next) else AlarmScheduler.cancelAll(ctx)
    }

    private fun alreadyAlerted(key: String): Boolean {
        val ctx = app ?: return false
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_ALERTED, null) == key
    }

    private fun markAlerted(key: String) {
        val ctx = app ?: return
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_ALERTED, key).apply()
    }

    private fun maybeAlert(prev: Pet, next: Pet) {
        val ctx = app ?: return
        val sleepOpen = (!prev.sleeping && next.sleeping && next.lightsOn) ||
            (prev.sleepWindowAt == null && next.sleepWindowAt != null && next.lightsOn)
        val drop = next.hunger < prev.hunger ||
            next.happy < prev.happy ||
            (prev.hungerWindowAt == null && next.hungerWindowAt != null) ||
            (prev.happyWindowAt == null && next.happyWindowAt != null) ||
            sleepOpen ||
            (prev.misbehaveAt == null && next.misbehaveAt != null) ||
            (prev.checkPoopAt == null && next.checkPoopAt != null) ||
            (prev.checkSickAt == null && next.checkSickAt != null) ||
            (prev.checkDiscAt == null && next.checkDiscAt != null)
        if (!drop) return
        if (next.soundOn) ChirpPlayer.play(ctx, false)
        if (!next.notifOn) return
        val title: String
        val body: String
        val kind: String
        val stamp: Long?
        when {
            sleepOpen -> {
                title = "It fell asleep"
                body = "Turn the lights off within 15 minutes."
                kind = "lights"
                stamp = next.sleepWindowAt
            }
            next.hunger < prev.hunger || (prev.hungerWindowAt == null && next.hungerWindowAt != null) -> {
                title = "Hunger dropped"
                body = "Feed a meal before the 15-minute call runs out."
                kind = "hunger"
                stamp = next.hungerWindowAt
            }
            next.happy < prev.happy || (prev.happyWindowAt == null && next.happyWindowAt != null) -> {
                title = "Happy dropped"
                body = "Play a game before the call times out."
                kind = "happy"
                stamp = next.happyWindowAt
            }
            prev.checkPoopAt == null && next.checkPoopAt != null -> {
                title = "Look for poop"
                body = "The shell will not beep."
                kind = "poop"
                stamp = next.checkPoopAt
            }
            prev.checkSickAt == null && next.checkSickAt != null -> {
                title = "Look for a skull"
                body = "The shell will not beep."
                kind = "sick"
                stamp = next.checkSickAt
            }
            else -> {
                title = "Check attention"
                body = "Look at the shell."
                kind = "discipline"
                stamp = next.misbehaveAt ?: next.checkDiscAt
            }
        }
        val key = "$kind:${stamp ?: 0}"
        if (alreadyAlerted(key)) return
        markAlerted(key)
        CareNotifier.show(ctx, title, body, kind, false)
    }

    private fun setPet(next: Pet?, chirp: Boolean = true) {
        val prev = _pet.value
        _pet.value = next
        persist(next)
        if (chirp && prev != null && next != null) maybeAlert(prev, next)
    }

    fun startRun(hatchAt: Long, clockSetAt: Long, targetId: CharacterId, region: String, firmware: Firmware, nickname: String) {
        setPet(Simulate.createPet(hatchAt, clockSetAt, targetId, region, firmware, nickname), chirp = false)
    }

    fun startDemo() = setPet(Simulate.createDemoPet(), chirp = false)

    fun log(type: ActionType) {
        val p = _pet.value ?: return
        setPet(Simulate.applyAction(p, type, System.currentTimeMillis()))
    }

    fun undo() {
        val p = _pet.value ?: return
        setPet(Simulate.undoLastCare(p), chirp = false)
    }

    fun tick(now: Long = System.currentTimeMillis()) {
        val p = _pet.value ?: return
        val next = Simulate.catchUp(p, now)
        val same = p.copy(lastTickAt = 0L) == next.copy(lastTickAt = 0L)
        if (!same) setPet(next)
        else if (next.lastTickAt != p.lastTickAt) _pet.value = next
    }

    fun confirm(kind: String) {
        val p = _pet.value ?: return
        setPet(Simulate.confirmOnShell(p, kind), chirp = false)
    }

    fun dismiss(kind: String) {
        val p = _pet.value ?: return
        setPet(Simulate.dismissOffShell(p, kind), chirp = false)
    }

    fun sync(patch: SyncPatch, restartStage: Boolean = false, attention: Boolean? = null) {
        val p = _pet.value ?: return
        setPet(Simulate.syncPet(p, patch, System.currentTimeMillis(), restartStage, attention), chirp = false)
    }

    fun setSound(on: Boolean) {
        val p = _pet.value ?: return
        setPet(p.copy(soundOn = on), chirp = false)
    }

    fun setNotif(on: Boolean) {
        val p = _pet.value ?: return
        setPet(p.copy(notifOn = on), chirp = false)
    }

    fun setFirmware(fw: Firmware) {
        val p = _pet.value ?: return
        setPet(p.copy(firmware = fw), chirp = false)
    }

    fun setNickname(name: String) {
        val p = _pet.value ?: return
        setPet(p.copy(nickname = name), chirp = false)
    }

    fun setTarget(id: CharacterId) {
        val p = _pet.value ?: return
        setPet(p.copy(targetId = id), chirp = false)
    }

    fun restore(raw: String) {
        val next = Simulate.catchUp(PetJson.parse(raw), System.currentTimeMillis())
        setPet(next, chirp = false)
    }

    fun backupRaw(short: Boolean = false): String? {
        val p = _pet.value ?: return null
        return PetJson.toBackup(p, stripEvents = short)
    }

    fun reset() = setPet(null, chirp = false)

    fun setLocale(code: String) {
        _locale.value = code
        app?.getSharedPreferences(PREFS, Context.MODE_PRIVATE)?.edit()?.putString(KEY_LOCALE, code)?.apply()
    }
}
