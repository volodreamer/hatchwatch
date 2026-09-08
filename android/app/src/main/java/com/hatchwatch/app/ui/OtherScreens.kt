package com.hatchwatch.app.ui

import android.Manifest
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.ChirpPlayer
import com.hatchwatch.app.engine.CharacterId
import com.hatchwatch.app.engine.Characters
import com.hatchwatch.app.engine.DerivedState
import com.hatchwatch.app.engine.Evolution
import com.hatchwatch.app.engine.Firmware
import com.hatchwatch.app.engine.Pet
import com.hatchwatch.app.engine.PetJson
import com.hatchwatch.app.engine.SyncPatch
import com.hatchwatch.app.store.PetStore
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun PlanScreen(locale: String, derived: DerivedState) {
    val pet = derived.pet
    val plan = Evolution.plan(pet.targetId)
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(HwCopy.t(locale, "plan.kicker").uppercase(), color = HwPrimary, fontSize = 11.sp, letterSpacing = 2.sp)
        Text(Characters.name(pet.targetId), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text(plan.headline, color = HwMuted)
        if (Evolution.isGrownForm(pet) && pet.form !in plan.path) {
            Text(
                HwCopy.t(locale, "plan.grewOff", mapOf("name" to Characters.name(pet.form), "target" to plan.name)),
                color = HwFg, fontSize = 14.sp,
            )
        }
        PathCardInline(locale, derived)
        Text(HwCopy.t(locale, "plan.how"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
        plan.steps.forEachIndexed { i, step ->
            SectionCard {
                Text("${i + 1}. $step", color = HwFg, fontSize = 14.sp)
            }
        }
    }
}

@Composable
private fun PathCardInline(locale: String, derived: DerivedState) {
    val pet = derived.pet
    val grown = Evolution.isGrownForm(pet)
    val secretOpen = Evolution.stillHeadingSecret(pet)
    val summary = when {
        grown && !secretOpen && pet.form == pet.targetId ->
            HwCopy.t(locale, "budget.grown", mapOf(
                "name" to Characters.name(pet.form),
                "care" to derived.budget.careUsed.toString(),
                "disc" to derived.budget.discUsed.toString(),
            ))
        grown && !secretOpen ->
            HwCopy.t(locale, "budget.grownOff", mapOf(
                "name" to Characters.name(pet.form),
                "target" to Characters.name(pet.targetId),
                "care" to derived.budget.careUsed.toString(),
                "disc" to derived.budget.discUsed.toString(),
            ))
        else -> derived.budget.summary
    }
    SectionCard {
        Text(summary, color = HwMuted)
        Text("${HwCopy.t(locale, "path.care")}: ${derived.budget.careUsed}${derived.budget.careMax?.let { " / $it" } ?: ""}", color = HwFg)
        Text("${HwCopy.t(locale, "path.disc")}: ${derived.budget.discUsed}${derived.budget.discMax?.let { " / $it" } ?: ""}", color = HwFg)
    }
}

@Composable
fun LogScreen(locale: String, pet: Pet) {
    val fmt = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(HwCopy.t(locale, "log.title"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("${pet.careMistakes} care / ${pet.discMistakes} disc", color = HwMuted)
        if (pet.events.isEmpty()) {
            Text(HwCopy.t(locale, "log.empty"), color = HwMuted)
        } else {
            pet.events.forEach { e ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(fmt.format(Date(e.at)), color = HwMuted, fontFamily = FontFamily.Monospace, modifier = Modifier.padding(top = 2.dp))
                    Column {
                        Text(e.type.name.replace('_', ' '), color = HwFg, fontWeight = FontWeight.Medium)
                        if (e.note != null) Text(e.note, color = HwMuted, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun GuideScreen(locale: String) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(HwCopy.t(locale, "guide.title"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text(HwCopy.t(locale, "guide.lead"), color = HwMuted)
        SectionCard {
            Text(HwCopy.t(locale, "guide.rule"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
            listOf("guide.r1", "guide.r2", "guide.r3", "guide.r4", "guide.r5", "guide.r6").forEach {
                Text("• ${HwCopy.t(locale, it)}", color = HwMuted, fontSize = 14.sp)
            }
        }
        Characters.STAGE_ORDER.filter { it != CharacterId.egg }.forEach { id ->
            val c = Characters.stats(id)
            SectionCard {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    PixelSprite(id, sleeping = false, sick = false, modifier = Modifier.size(56.dp))
                    Column {
                        Text(c.name, color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 18.sp)
                        Text(c.stage.name, color = HwMuted, fontSize = 12.sp)
                    }
                }
                Text(c.blurb, color = HwMuted, fontSize = 13.sp)
                Text("Hunger ${c.hungryLossMin} min · Happy ${c.happyLossMin} min · Skull ${c.sicknessMin} min", color = HwFg, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                Text("Poop every ${Characters.POOP_INTERVAL_MIN[id]} min · shots ${c.shots} · ${c.lifespan}", color = HwMuted, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
            }
        }
    }
}

@Composable
fun BackupRestoreSection(locale: String, showSave: Boolean = true, onRestored: () -> Unit = {}) {
    val ctx = LocalContext.current
    val save = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        PetStore.backupRaw()?.let { raw ->
            ctx.contentResolver.openOutputStream(uri)?.use { it.write(raw.toByteArray()) }
            Toast.makeText(ctx, HwCopy.t(locale, "set.saveFile"), Toast.LENGTH_SHORT).show()
        }
    }
    val open = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        runCatching {
            val text = ctx.contentResolver.openInputStream(uri)?.use { it.readBytes().toString(Charsets.UTF_8) } ?: return@runCatching
            applyBackup(ctx, locale, text, onRestored)
        }.onFailure {
            Toast.makeText(ctx, HwCopy.t(locale, "set.bad"), Toast.LENGTH_SHORT).show()
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (showSave) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                HwButton(HwCopy.t(locale, "set.saveFile"), onClick = { save.launch("hatchwatch.json") }, modifier = Modifier.weight(1f))
                HwButton(HwCopy.t(locale, "set.openFile"), onClick = { open.launch(arrayOf("application/json", "*/*")) }, modifier = Modifier.weight(1f))
            }
            HwButton(HwCopy.t(locale, "set.copy"), onClick = {
                val short = PetStore.backupRaw(short = true) ?: return@HwButton
                val clip = android.content.ClipData.newPlainText("Hatchwatch", short)
                (ctx.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager).setPrimaryClip(clip)
                Toast.makeText(ctx, HwCopy.t(locale, "set.copied", mapOf("n" to short.length.toString())), Toast.LENGTH_SHORT).show()
            }, modifier = Modifier.fillMaxWidth())
        } else {
            HwButton(HwCopy.t(locale, "set.openFile"), onClick = { open.launch(arrayOf("application/json", "*/*")) }, modifier = Modifier.fillMaxWidth())
        }
        HwButton(HwCopy.t(locale, "set.paste"), onClick = {
            val text = (ctx.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager)
                .primaryClip?.getItemAt(0)?.coerceToText(ctx)?.toString()
            if (text.isNullOrBlank()) {
                Toast.makeText(ctx, HwCopy.t(locale, "set.bad"), Toast.LENGTH_SHORT).show()
            } else {
                applyBackup(ctx, locale, text, onRestored)
            }
        }, modifier = Modifier.fillMaxWidth())
    }
}

private fun applyBackup(ctx: android.content.Context, locale: String, text: String, onRestored: () -> Unit) {
    if (PetJson.looksCutOff(text)) {
        Toast.makeText(ctx, HwCopy.t(locale, "set.cutoff"), Toast.LENGTH_LONG).show()
        return
    }
    runCatching { PetStore.restore(text) }
        .onSuccess {
            Toast.makeText(ctx, HwCopy.t(locale, "set.restored"), Toast.LENGTH_SHORT).show()
            onRestored()
        }
        .onFailure {
            Toast.makeText(ctx, HwCopy.t(locale, "set.bad"), Toast.LENGTH_SHORT).show()
        }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSheet(locale: String, pet: Pet, onClose: () -> Unit) {
    val ctx = LocalContext.current
    var confirmEnd by remember { mutableStateOf(false) }
    val notifPerm = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }
    ModalBottomSheet(onDismissRequest = onClose, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = HwSurface) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(HwCopy.t(locale, "set.title"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 24.sp)
            LangRow(locale)
            Text(HwCopy.t(locale, "set.fw"), color = HwMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                HwButton(HwCopy.t(locale, "setup.fw.replica"), onClick = { PetStore.setFirmware(Firmware.replica) }, primary = pet.firmware == Firmware.replica, modifier = Modifier.weight(1f))
                HwButton(HwCopy.t(locale, "setup.fw.vintage"), onClick = { PetStore.setFirmware(Firmware.vintage) }, primary = pet.firmware == Firmware.vintage, modifier = Modifier.weight(1f))
            }
            Text(HwCopy.t(locale, "set.sound"), color = HwMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                HwButton(if (pet.soundOn) "On" else "Off", onClick = {
                    val next = !pet.soundOn
                    PetStore.setSound(next)
                    if (next) ChirpPlayer.play(ctx, false)
                }, primary = pet.soundOn, modifier = Modifier.weight(1f))
                HwButton(HwCopy.t(locale, "set.alerts"), onClick = {
                    val next = !pet.notifOn
                    if (next && Build.VERSION.SDK_INT >= 33) notifPerm.launch(Manifest.permission.POST_NOTIFICATIONS)
                    PetStore.setNotif(next)
                }, primary = pet.notifOn, modifier = Modifier.weight(1f))
            }
            Text(HwCopy.t(locale, "set.backup"), color = HwFg, fontFamily = FontFamily.Monospace)
            Text(HwCopy.t(locale, "set.backup.d"), color = HwMuted, fontSize = 13.sp)
            BackupRestoreSection(locale, showSave = true, onRestored = onClose)
            HwButton(HwCopy.t(locale, "set.end"), onClick = { confirmEnd = true }, danger = true, modifier = Modifier.fillMaxWidth())
            HwButton(HwCopy.t(locale, "set.close"), onClick = onClose, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(24.dp))
        }
    }
    if (confirmEnd) {
        AlertDialog(
            onDismissRequest = { confirmEnd = false },
            title = { Text(HwCopy.t(locale, "set.end")) },
            text = { Text(HwCopy.t(locale, "set.end.q")) },
            confirmButton = { HwButton(HwCopy.t(locale, "set.end"), onClick = { PetStore.reset(); confirmEnd = false; onClose() }, danger = true) },
            dismissButton = { HwButton(HwCopy.t(locale, "sync.cancel"), onClick = { confirmEnd = false }) },
            containerColor = HwSurface,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SyncSheet(locale: String, pet: Pet, onClose: () -> Unit) {
    var hunger by remember { mutableIntStateOf(pet.hunger) }
    var happy by remember { mutableIntStateOf(pet.happy) }
    var discipline by remember { mutableIntStateOf(pet.discipline) }
    var weight by remember { mutableIntStateOf(pet.weight) }
    var care by remember { mutableIntStateOf(pet.careMistakes) }
    var disc by remember { mutableIntStateOf(pet.discMistakes) }
    var poop by remember { mutableIntStateOf(pet.poop) }
    var age by remember { mutableIntStateOf(pet.age) }
    var form by remember { mutableStateOf(pet.form) }
    var sick by remember { mutableStateOf(pet.sick) }
    var attention by remember { mutableStateOf(pet.misbehaveAt != null) }
    var restart by remember { mutableStateOf(false) }
    val forms = Characters.STAGE_ORDER.filter { it != CharacterId.egg }

    ModalBottomSheet(onDismissRequest = onClose, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = HwSurface) {
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(HwCopy.t(locale, "sync.title"), color = HwFg, fontFamily = FontFamily.Monospace, fontSize = 24.sp)
            Text(HwCopy.t(locale, "sync.lead"), color = HwMuted, fontSize = 13.sp)
            Text(HwCopy.t(locale, "sync.form"), color = HwMuted)
            forms.chunked(3).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    row.forEach { id ->
                        HwButton(Characters.name(id), onClick = { form = id; restart = id != pet.form }, primary = form == id, modifier = Modifier.weight(1f))
                    }
                    repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
                }
            }
            NumRow(HwCopy.t(locale, "sync.hunger"), hunger, 0, 4) { hunger = it }
            NumRow(HwCopy.t(locale, "sync.happy"), happy, 0, 4) { happy = it }
            NumRow(HwCopy.t(locale, "sync.disc"), discipline, 0, 100, 25) { discipline = it }
            NumRow(HwCopy.t(locale, "sync.weight"), weight, 5, 99) { weight = it }
            NumRow(HwCopy.t(locale, "sync.care"), care, 0, 20) { care = it }
            NumRow(HwCopy.t(locale, "sync.dmiss"), disc, 0, 20) { disc = it }
            NumRow(HwCopy.t(locale, "sync.poop"), poop, 0, 4) { poop = it }
            NumRow(HwCopy.t(locale, "sync.age"), age, 0, 20) { age = it }
            CheckRow(HwCopy.t(locale, "sync.skull"), sick) { sick = it }
            CheckRow(HwCopy.t(locale, "sync.attn"), attention) { attention = it }
            CheckRow(HwCopy.t(locale, "sync.evo"), restart || form != pet.form) { restart = it }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                HwButton(HwCopy.t(locale, "sync.cancel"), onClick = onClose, modifier = Modifier.weight(1f))
                HwButton(HwCopy.t(locale, "sync.save"), onClick = {
                    PetStore.sync(
                        SyncPatch(hunger, happy, discipline, weight, care, disc, poop, sick, form, age),
                        restartStage = restart || form != pet.form,
                        attention = attention,
                    )
                    onClose()
                }, primary = true, modifier = Modifier.weight(1f))
            }
            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun NumRow(label: String, value: Int, min: Int, max: Int, step: Int = 1, onChange: (Int) -> Unit) {
    Column {
        Text("$label  $value", color = HwFg, fontSize = 14.sp)
        Slider(
            value = value.toFloat(),
            onValueChange = { onChange((it / step).toInt() * step) },
            valueRange = min.toFloat()..max.toFloat(),
            steps = ((max - min) / step - 1).coerceAtLeast(0),
        )
    }
}

@Composable
private fun CheckRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Checkbox(checked = checked, onCheckedChange = onChange)
        Text(label, color = HwFg, fontSize = 14.sp)
    }
}
