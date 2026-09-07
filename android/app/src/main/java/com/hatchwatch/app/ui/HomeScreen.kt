package com.hatchwatch.app.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material.icons.outlined.Undo
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.ChirpPlayer
import com.hatchwatch.app.engine.ActionType
import com.hatchwatch.app.engine.AlertKind
import com.hatchwatch.app.engine.Characters
import com.hatchwatch.app.engine.DerivedState
import com.hatchwatch.app.engine.Evolution
import com.hatchwatch.app.engine.Simulate
import com.hatchwatch.app.engine.Urgency
import com.hatchwatch.app.store.PetStore
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(locale: String, derived: DerivedState) {
    val pet = derived.pet
    val ctx = LocalContext.current
    var showSettings by remember { mutableStateOf(false) }
    var showSync by remember { mutableStateOf(false) }
    var missOpen by remember { mutableStateOf(false) }
    val clock = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(derived.now))

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column {
                Text("HATCHWATCH", color = HwPrimary, fontSize = 11.sp, letterSpacing = 2.sp, fontWeight = FontWeight.Medium)
                Text(pet.nickname, color = HwFg, fontSize = 24.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
            }
            Row {
                IconButton(onClick = { PetStore.undo(); Toast.makeText(ctx, HwCopy.t(locale, "home.undo"), Toast.LENGTH_SHORT).show() }) {
                    Icon(Icons.Outlined.Undo, contentDescription = HwCopy.t(locale, "home.undo"), tint = HwFg)
                }
                IconButton(onClick = { showSync = true }) {
                    Icon(Icons.Outlined.Tune, contentDescription = HwCopy.t(locale, "home.match"), tint = HwFg)
                }
                IconButton(onClick = { showSettings = true }) {
                    Icon(Icons.Outlined.Settings, contentDescription = HwCopy.t(locale, "home.settings"), tint = HwFg)
                }
            }
        }

        LcdPanel(locale, derived, clock)
        NextCare(locale, derived)
        ActionGrid(locale, derived, onMiss = { missOpen = true })
        if (missOpen) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                HwButton(HwCopy.t(locale, "home.missCare"), onClick = { PetStore.log(ActionType.miss_care); missOpen = false }, modifier = Modifier.weight(1f), danger = true)
                HwButton(HwCopy.t(locale, "home.missDisc"), onClick = { PetStore.log(ActionType.miss_disc); missOpen = false }, modifier = Modifier.weight(1f), danger = true)
            }
        }
        PathCard(locale, derived)
        TimerGrid(locale, derived)
        Spacer(Modifier.height(12.dp))
    }

    if (showSettings) SettingsSheet(locale, pet) { showSettings = false }
    if (showSync) SyncSheet(locale, pet) { showSync = false }
}

@Composable
private fun LcdPanel(locale: String, derived: DerivedState, clock: String) {
    val pet = derived.pet
    val s = derived.stats
    val night = pet.sleeping && !pet.lightsOn
    val ink = if (night) HwLcd else HwLcdPixel
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (night) HwLcdPixel else HwLcd)
            .padding(14.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text("${s.stage.name.uppercase()} · AGE ${pet.age}", color = ink.copy(alpha = 0.7f), fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                Text(s.name, color = ink, fontFamily = FontFamily.Monospace, fontSize = 26.sp, fontWeight = FontWeight.Bold)
            }
            Text(clock, color = ink, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
        }
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            PixelSprite(
                pet.form,
                pet.sleeping,
                pet.sick || pet.checkSickAt != null,
                Modifier.size(112.dp),
                tint = ink,
            )
            Spacer(Modifier.size(12.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                HeartsRow(HwCopy.t(locale, "lcd.hungry"), pet.hunger, ink)
                HeartsRow(HwCopy.t(locale, "lcd.happy"), pet.happy, ink)
                DiscBar(pet.discipline, HwCopy.t(locale, "lcd.disc"), ink)
                Text("${pet.weight}g", color = ink.copy(alpha = 0.8f), fontFamily = FontFamily.Monospace)
            }
        }
        Row(
            Modifier.fillMaxWidth().padding(top = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PoopPixels(pet.poop, ink)
            val status = when {
                pet.misbehaveAt != null || pet.checkDiscAt != null -> HwCopy.t(locale, "lcd.attn")
                pet.sleeping && pet.lightsOn -> HwCopy.t(locale, "lcd.on")
                pet.sleeping -> HwCopy.t(locale, "lcd.off")
                pet.sick -> HwCopy.t(locale, "lcd.sick")
                else -> HwCopy.t(locale, "lcd.awake")
            }
            Text(status.uppercase(), color = ink, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
        }
    }
}

@Composable
private fun NextCare(locale: String, derived: DerivedState) {
    val alert = derived.primary
    if (alert == null) {
        SectionCard {
            Text(HwCopy.t(locale, "care.next").uppercase(), color = HwMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Text(HwCopy.t(locale, "care.clear"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 22.sp)
            Text(HwCopy.t(locale, "care.clear.d"), color = HwMuted, fontSize = 14.sp)
        }
        return
    }
    val urgent = alert.urgency == Urgency.now || alert.urgency == Urgency.late
    val checkIds = setOf("poop-due", "sick-due", "disc-due")
    val kind = when (alert.kind) {
        AlertKind.poop -> "poop"
        AlertKind.sick -> "sick"
        AlertKind.discipline -> "discipline"
        else -> null
    }
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(if (urgent) HwDanger.copy(alpha = 0.18f) else HwSurface)
            .border(1.dp, if (urgent) HwDanger.copy(alpha = 0.4f) else HwBorder, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            when (alert.urgency) {
                Urgency.late -> HwCopy.t(locale, "care.overdue")
                Urgency.now -> HwCopy.t(locale, "care.now")
                else -> HwCopy.t(locale, "care.soon")
            }.uppercase(),
            color = HwMuted, fontSize = 11.sp, letterSpacing = 1.6.sp,
        )
        Text(alert.title, color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Text(
            if (alert.kind == AlertKind.poop || alert.kind == AlertKind.sick) HwCopy.t(locale, "care.check")
            else Simulate.formatDuration(alert.dueAt - derived.now),
            color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 28.sp,
        )
        Text(alert.detail, color = HwMuted, fontSize = 14.sp)
        Text(alert.deviceHint.uppercase(), color = HwFaint, fontSize = 11.sp, letterSpacing = 1.4.sp)
        if (kind != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                if (alert.id in checkIds) {
                    HwButton(HwCopy.t(locale, "care.onShell"), onClick = { PetStore.confirm(kind) }, primary = true, modifier = Modifier.weight(1f))
                }
                HwButton(HwCopy.t(locale, "care.notOnShell"), onClick = { PetStore.dismiss(kind) }, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun ActionGrid(locale: String, derived: DerivedState, onMiss: () -> Unit) {
    val ctx = LocalContext.current
    val actions = listOf(
        ActionType.meal to "act.meal",
        ActionType.snack to "act.snack",
        ActionType.game to "act.game",
        ActionType.clean to "act.clean",
        ActionType.scold to "act.scold",
        ActionType.medicine to "act.medicine",
        ActionType.lights_off to "act.lights",
        ActionType.miss_care to "act.miss",
    )
    val attention = derived.pet.misbehaveAt != null || derived.pet.checkDiscAt != null
    val lightsHot = derived.pet.sleeping && derived.pet.lightsOn
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        actions.chunked(4).forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (type, key) ->
                    val hot = (type == ActionType.scold && attention) || (type == ActionType.lights_off && lightsHot)
                    Box(Modifier.weight(1f)) {
                        HwButton(
                            HwCopy.t(locale, key),
                            onClick = {
                                if (type == ActionType.miss_care) onMiss()
                                else {
                                    if (derived.pet.soundOn) ChirpPlayer.play(ctx, false)
                                    PetStore.log(type)
                                }
                            },
                            primary = hot,
                            danger = type == ActionType.miss_care,
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PathCard(locale: String, derived: DerivedState) {
    val pet = derived.pet
    val grown = Evolution.isGrownForm(pet)
    val secretOpen = Evolution.stillHeadingSecret(pet)
    val formName = Characters.name(pet.form)
    val targetName = Characters.name(pet.targetId)
    val predictedName = Characters.name(derived.predictedAdult)
    val showHeading = secretOpen || (!grown && derived.predictedAdult != pet.targetId)
    val badge = when (derived.pathStatus.name) {
        "hit" -> HwCopy.t(locale, "path.hit")
        "path" -> HwCopy.t(locale, "path.path")
        else -> HwCopy.t(locale, "path.off")
    }
    val summary = when {
        grown && !secretOpen && pet.form == pet.targetId ->
            HwCopy.t(locale, "budget.grown", mapOf("name" to formName, "care" to derived.budget.careUsed.toString(), "disc" to derived.budget.discUsed.toString()))
        grown && !secretOpen ->
            HwCopy.t(locale, "budget.grownOff", mapOf("name" to formName, "target" to targetName, "care" to derived.budget.careUsed.toString(), "disc" to derived.budget.discUsed.toString()))
        else -> derived.budget.summary
    }
    val scold = Evolution.scoldAdvice(pet)
    SectionCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(HwCopy.t(locale, "path.title").uppercase(), color = HwMuted, fontSize = 11.sp, letterSpacing = 1.6.sp)
            Text(badge, color = HwPrimary, fontSize = 12.sp)
        }
        Text(
            (if (grown) HwCopy.t(locale, "path.grew", mapOf("name" to formName))
            else HwCopy.t(locale, "path.aim", mapOf("name" to targetName))) +
                if (showHeading) HwCopy.t(locale, "path.heading", mapOf("name" to predictedName)) else "",
            color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 18.sp,
        )
        if (grown && !secretOpen && pet.form != pet.targetId) {
            Text(HwCopy.t(locale, "path.wanted", mapOf("name" to targetName)), color = HwMuted, fontSize = 14.sp)
        }
        Text(summary, color = HwMuted, fontSize = 14.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            MiniTile(HwCopy.t(locale, "path.care"), "${derived.budget.careUsed}${derived.budget.careMax?.let { " / $it" } ?: ""}")
            MiniTile(HwCopy.t(locale, "path.disc"), "${derived.budget.discUsed}${derived.budget.discMax?.let { " / $it" } ?: ""}")
        }
        Text(derived.budget.stageTip, color = HwFg, fontSize = 14.sp)
        Text(
            HwCopy.t(
                locale,
                when {
                    grown && !secretOpen -> "path.grown"
                    scold == "scold" -> "path.scold"
                    scold == "ignore" -> "path.ignore"
                    else -> "path.either"
                },
            ),
            color = HwMuted, fontSize = 12.sp, letterSpacing = 1.sp,
        )
    }
}

@Composable
private fun TimerGrid(locale: String, derived: DerivedState) {
    val pet = derived.pet
    val now = derived.now
    fun dur(at: Long?) = if (at == null) "—" else Simulate.formatDuration(at - now)
    val poopVal = when {
        pet.checkPoopAt != null -> HwCopy.t(locale, "care.check")
        derived.nextPoopAt != null -> dur(derived.nextPoopAt)
        else -> "—"
    }
    val sickVal = when {
        pet.checkSickAt != null -> HwCopy.t(locale, "care.check")
        derived.nextSicknessAt != null -> dur(derived.nextSicknessAt)
        else -> "—"
    }
    val discVal = when {
        derived.remainingDiscDrops == null -> HwCopy.t(locale, "home.discNone")
        derived.remainingDiscDrops == 0 -> HwCopy.t(locale, "home.discNow")
        else -> HwCopy.t(locale, "home.discDrops", mapOf("n" to derived.remainingDiscDrops.toString()))
    }
    val sleepVal = when {
        pet.sleeping -> if (derived.nextWakeAt != null) HwCopy.t(locale, "home.wakes", mapOf("d" to dur(derived.nextWakeAt))) else HwCopy.t(locale, "home.asleep")
        derived.nextSleepAt != null -> dur(derived.nextSleepAt)
        else -> HwCopy.t(locale, "home.naps")
    }
    val hungerVal = derived.nextHungerDrainAt?.let { dur(it) } ?: if (pet.hunger == 0) HwCopy.t(locale, "home.empty") else "—"
    val happyVal = derived.nextHappyDrainAt?.let { dur(it) } ?: if (pet.happy == 0) HwCopy.t(locale, "home.empty") else "—"
    val evoVal = derived.nextEvolveAt?.let { if (it - now > 0) dur(it) else "—" } ?: "—"
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(
            listOf(HwCopy.t(locale, "home.nextHunger") to hungerVal, HwCopy.t(locale, "home.nextHappy") to happyVal),
            listOf(HwCopy.t(locale, "home.nextPoop") to poopVal, HwCopy.t(locale, "home.nextSick") to sickVal),
            listOf(HwCopy.t(locale, "home.sleep") to sleepVal, HwCopy.t(locale, "home.evo") to evoVal),
        ).forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (l, v) -> Box(Modifier.weight(1f)) { MiniTile(l, v) } }
            }
        }
        MiniTile(HwCopy.t(locale, "home.nextDisc"), discVal)
    }
}
