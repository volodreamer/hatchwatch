package com.hatchwatch.app.engine

import org.json.JSONArray
import org.json.JSONObject

object PetJson {
    fun toBackup(pet: Pet, stripEvents: Boolean = false): String {
        val root = JSONObject()
        val state = JSONObject()
        state.put("pet", toObj(if (stripEvents) pet.copy(events = emptyList()) else pet))
        root.put("state", state)
        root.put("version", 0)
        return root.toString()
    }

    fun parse(text: String): Pet {
        val cleaned = extractObject(text)
        val parsed = JSONObject(cleaned)
        val petObj = when {
            parsed.optJSONObject("state")?.optJSONObject("pet") != null -> parsed.getJSONObject("state").getJSONObject("pet")
            parsed.has("pet") -> parsed.getJSONObject("pet")
            parsed.has("hatchAt") -> parsed
            else -> throw IllegalArgumentException("bad")
        }
        return fromObj(petObj)
    }

    fun looksCutOff(text: String): Boolean {
        val cleaned = extractObject(text)
        if (cleaned.isEmpty()) return false
        val opens = cleaned.count { it == '{' }
        val closes = cleaned.count { it == '}' }
        if (opens > closes) return true
        if (Regex("[,:]\\s*$").containsMatchIn(cleaned)) return true
        if (cleaned.startsWith("{") && !cleaned.endsWith("}")) return true
        return false
    }

    private fun extractObject(text: String): String {
        val cleaned = text.replace("\uFEFF", "").trim()
        val start = cleaned.indexOf('{')
        val end = cleaned.lastIndexOf('}')
        return if (start >= 0 && end > start) cleaned.substring(start, end + 1) else cleaned
    }

    private fun toObj(pet: Pet): JSONObject {
        val o = JSONObject()
        o.put("id", pet.id)
        o.put("nickname", pet.nickname)
        o.put("hatchAt", pet.hatchAt)
        o.put("clockSetAt", pet.clockSetAt)
        o.put("targetId", pet.targetId.id)
        o.put("region", pet.region)
        o.put("firmware", pet.firmware.name)
        o.put("createdAt", pet.createdAt)
        o.put("lastTickAt", pet.lastTickAt)
        o.put("form", pet.form.id)
        o.put("teenKind", pet.teenKind?.name?.replace('_', '-'))
        o.put("stageStartedAt", pet.stageStartedAt)
        o.put("secretEligible", pet.secretEligible)
        o.put("hunger", pet.hunger)
        o.put("hungerAt", pet.hungerAt)
        o.put("happy", pet.happy)
        o.put("happyAt", pet.happyAt)
        o.put("discipline", pet.discipline)
        o.put("weight", pet.weight)
        o.put("careMistakes", pet.careMistakes)
        o.put("discMistakes", pet.discMistakes)
        o.put("poop", pet.poop)
        o.put("poopAt", pet.poopAt)
        o.put("sick", pet.sick)
        o.put("medicineGiven", pet.medicineGiven)
        o.put("sleeping", pet.sleeping)
        o.put("lightsOn", pet.lightsOn)
        o.put("age", pet.age)
        putLongOrNull(o, "hungerWindowAt", pet.hungerWindowAt)
        putLongOrNull(o, "happyWindowAt", pet.happyWindowAt)
        putLongOrNull(o, "sleepWindowAt", pet.sleepWindowAt)
        putLongOrNull(o, "misbehaveAt", pet.misbehaveAt)
        o.put("heartDecrements", pet.heartDecrements)
        putLongOrNull(o, "checkPoopAt", pet.checkPoopAt)
        putLongOrNull(o, "checkSickAt", pet.checkSickAt)
        putLongOrNull(o, "checkDiscAt", pet.checkDiscAt)
        o.put("stageSickDone", pet.stageSickDone)
        o.put("snackCount", pet.snackCount)
        o.put("notifOn", pet.notifOn)
        o.put("soundOn", pet.soundOn)
        val events = JSONArray()
        for (e in pet.events) {
            val ev = JSONObject()
            ev.put("id", e.id)
            ev.put("at", e.at)
            ev.put("type", e.type.name.replace('_', '-'))
            if (e.note != null) ev.put("note", e.note)
            events.put(ev)
        }
        o.put("events", events)
        return o
    }

    private fun putLongOrNull(o: JSONObject, key: String, value: Long?) {
        if (value == null) o.put(key, JSONObject.NULL) else o.put(key, value)
    }

    private fun longOrNull(o: JSONObject, key: String): Long? {
        if (!o.has(key) || o.isNull(key)) return null
        return o.optLong(key)
    }

    private fun fromObj(o: JSONObject): Pet {
        val events = mutableListOf<CareEvent>()
        val arr = o.optJSONArray("events")
        if (arr != null) {
            for (i in 0 until arr.length()) {
                val e = arr.optJSONObject(i) ?: continue
                val typeName = e.optString("type").replace('-', '_')
                val type = runCatching { ActionType.valueOf(typeName) }.getOrNull() ?: continue
                events += CareEvent(e.optString("id"), e.optLong("at"), type, e.optString("note").ifBlank { null })
            }
        }
        val teenRaw = o.optString("teenKind").ifBlank { null }?.replace('-', '_')
        val teen = teenRaw?.let { runCatching { TeenKind.valueOf(it) }.getOrNull() }
        val firmware = if (o.optString("firmware") == "vintage") Firmware.vintage else Firmware.replica
        val target = CharacterId.from(o.optString("targetId", "mametchi"))
        return Simulate.normalize(
            Pet(
                id = o.optString("id", "p1"),
                nickname = o.optString("nickname", "My P1"),
                hatchAt = o.getLong("hatchAt"),
                clockSetAt = o.optLong("clockSetAt", o.getLong("hatchAt") - Characters.EGG_MS),
                targetId = if (target in Characters.ADULT_IDS) target else CharacterId.mametchi,
                region = if (o.optString("region") == "jp") "jp" else "en",
                firmware = firmware,
                createdAt = o.optLong("createdAt", o.getLong("hatchAt")),
                lastTickAt = o.optLong("lastTickAt", o.getLong("hatchAt")),
                form = CharacterId.from(o.optString("form")),
                teenKind = teen,
                stageStartedAt = o.optLong("stageStartedAt", o.getLong("hatchAt")),
                secretEligible = o.optBoolean("secretEligible", false),
                hunger = o.optInt("hunger", 0),
                hungerAt = o.optLong("hungerAt", o.getLong("hatchAt")),
                happy = o.optInt("happy", 0),
                happyAt = o.optLong("happyAt", o.getLong("hatchAt")),
                discipline = o.optInt("discipline", 0),
                weight = o.optInt("weight", 5),
                careMistakes = o.optInt("careMistakes", 0),
                discMistakes = o.optInt("discMistakes", 0),
                poop = o.optInt("poop", 0),
                poopAt = o.optLong("poopAt", o.getLong("hatchAt")),
                sick = o.optBoolean("sick", false),
                medicineGiven = o.optInt("medicineGiven", 0),
                sleeping = o.optBoolean("sleeping", false),
                lightsOn = o.optBoolean("lightsOn", true),
                age = o.optInt("age", 0),
                hungerWindowAt = longOrNull(o, "hungerWindowAt"),
                happyWindowAt = longOrNull(o, "happyWindowAt"),
                sleepWindowAt = longOrNull(o, "sleepWindowAt"),
                misbehaveAt = longOrNull(o, "misbehaveAt"),
                heartDecrements = o.optInt("heartDecrements", 0),
                checkPoopAt = longOrNull(o, "checkPoopAt"),
                checkSickAt = longOrNull(o, "checkSickAt"),
                checkDiscAt = longOrNull(o, "checkDiscAt"),
                stageSickDone = o.optBoolean("stageSickDone", false),
                snackCount = o.optInt("snackCount", 0),
                events = events,
                notifOn = o.optBoolean("notifOn", false),
                soundOn = o.optBoolean("soundOn", true),
            ),
        )
    }
}
