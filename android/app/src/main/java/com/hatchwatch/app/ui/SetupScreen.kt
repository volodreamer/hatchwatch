package com.hatchwatch.app.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.engine.CharacterId
import com.hatchwatch.app.engine.Characters
import com.hatchwatch.app.engine.Evolution
import com.hatchwatch.app.engine.Firmware
import com.hatchwatch.app.store.PetStore
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

@Composable
fun SetupScreen(locale: String) {
    var step by remember { mutableIntStateOf(1) }
    var target by remember { mutableStateOf(CharacterId.mametchi) }
    var whenStart by remember { mutableStateOf("hatched") }
    var customAt by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var nickname by remember { mutableStateOf("") }
    var region by remember { mutableStateOf("en") }
    var firmware by remember { mutableStateOf(Firmware.replica) }
    val ctx = LocalContext.current
    val stamp = remember { SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .navigationBarsPadding()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(HwCopy.t(locale, "setup.kicker").uppercase(), color = HwPrimary, fontSize = 11.sp, letterSpacing = 2.sp, fontWeight = FontWeight.Medium)
        Text("Hatchwatch", color = HwFg, fontSize = 36.sp, fontFamily = HwPixel, fontWeight = FontWeight.Bold)
        Text(HwCopy.t(locale, "setup.blurb"), color = HwMuted, fontSize = 15.sp)
        LangRow(locale)
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            listOf(1 to "setup.step1", 2 to "setup.step2", 3 to "setup.step3").forEach { (n, key) ->
                Text(HwCopy.t(locale, key).uppercase(), color = if (step == n) HwPrimary else HwFaint, fontSize = 11.sp, letterSpacing = 1.2.sp)
            }
        }
        when (step) {
            1 -> {
                Text(HwCopy.t(locale, "setup.who"), color = HwMuted)
                Characters.ADULT_IDS.chunked(2).forEach { row ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { id ->
                            val plan = Evolution.plan(id)
                            val active = target == id
                            Column(
                                Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (active) HwPrimary.copy(alpha = 0.2f) else HwSurface)
                                    .border(1.dp, if (active) HwPrimary else HwBorder, RoundedCornerShape(12.dp))
                                    .clickable { target = id }
                                    .padding(12.dp),
                            ) {
                                Text(plan.difficulty.uppercase(), color = HwPrimary, fontSize = 10.sp, letterSpacing = 1.2.sp)
                                Spacer(Modifier.height(4.dp))
                                PixelSprite(id, sleeping = false, sick = false, modifier = Modifier.size(48.dp))
                                Text(Characters.name(id), color = HwFg, fontFamily = HwPixel, fontWeight = FontWeight.Bold)
                                Text(plan.headline, color = HwMuted, fontSize = 12.sp)
                            }
                        }
                    }
                }
                HwButton(HwCopy.t(locale, "setup.continue"), onClick = { step = 2 }, primary = true, modifier = Modifier.fillMaxWidth())
            }
            2 -> {
                Text(HwCopy.t(locale, "setup.when"), color = HwMuted)
                listOf(
                    Triple("hatched", "setup.hatched", "setup.hatched.d"),
                    Triple("clock", "setup.clock", "setup.clock.d"),
                    Triple("custom", "setup.custom", "setup.custom.d"),
                ).forEach { (id, title, detail) ->
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (whenStart == id) HwPrimary.copy(alpha = 0.2f) else HwSurface)
                            .border(1.dp, if (whenStart == id) HwPrimary else HwBorder, RoundedCornerShape(12.dp))
                            .clickable { whenStart = id }
                            .padding(12.dp),
                    ) {
                        Text(HwCopy.t(locale, title), color = HwFg, fontWeight = FontWeight.Medium)
                        Text(HwCopy.t(locale, detail), color = HwMuted, fontSize = 13.sp)
                    }
                }
                if (whenStart == "custom") {
                    Text(stamp.format(Date(customAt)), color = HwFg, fontFamily = HwPixel, fontSize = 18.sp)
                    HwButton(HwCopy.t(locale, "setup.pick"), onClick = {
                        val cal = Calendar.getInstance().apply { timeInMillis = customAt }
                        DatePickerDialog(
                            ctx,
                            { _, y, m, d ->
                                TimePickerDialog(
                                    ctx,
                                    { _, h, min ->
                                        customAt = Calendar.getInstance().apply {
                                            set(y, m, d, h, min, 0)
                                            set(Calendar.MILLISECOND, 0)
                                        }.timeInMillis
                                    },
                                    cal.get(Calendar.HOUR_OF_DAY),
                                    cal.get(Calendar.MINUTE),
                                    true,
                                ).show()
                            },
                            cal.get(Calendar.YEAR),
                            cal.get(Calendar.MONTH),
                            cal.get(Calendar.DAY_OF_MONTH),
                        ).show()
                    }, modifier = Modifier.fillMaxWidth())
                }
                OutlinedTextField(
                    value = nickname,
                    onValueChange = { nickname = it },
                    label = { Text(HwCopy.t(locale, "setup.nick")) },
                    placeholder = { Text(HwCopy.t(locale, "setup.nick.ph")) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = HwFg,
                        unfocusedTextColor = HwFg,
                        focusedBorderColor = HwPrimary,
                        unfocusedBorderColor = HwBorder,
                        focusedLabelColor = HwMuted,
                        unfocusedLabelColor = HwMuted,
                    ),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    HwButton(HwCopy.t(locale, "setup.back"), onClick = { step = 1 }, modifier = Modifier.weight(1f))
                    HwButton(HwCopy.t(locale, "setup.continue"), onClick = { step = 3 }, primary = true, modifier = Modifier.weight(1f))
                }
            }
            else -> {
                Text(HwCopy.t(locale, "setup.shellLang"), color = HwMuted)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    HwButton(HwCopy.t(locale, "setup.shell.en"), onClick = { region = "en" }, primary = region == "en", modifier = Modifier.weight(1f))
                    HwButton(HwCopy.t(locale, "setup.shell.jp"), onClick = { region = "jp" }, primary = region == "jp", modifier = Modifier.weight(1f))
                }
                Text(HwCopy.t(locale, "setup.fw"), color = HwMuted)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    HwButton(HwCopy.t(locale, "setup.fw.replica"), onClick = { firmware = Firmware.replica }, primary = firmware == Firmware.replica, modifier = Modifier.weight(1f))
                    HwButton(HwCopy.t(locale, "setup.fw.vintage"), onClick = { firmware = Firmware.vintage }, primary = firmware == Firmware.vintage, modifier = Modifier.weight(1f))
                }
                Text(HwCopy.t(locale, "setup.fw.d"), color = HwMuted, fontSize = 13.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    HwButton(HwCopy.t(locale, "setup.back"), onClick = { step = 2 }, modifier = Modifier.weight(1f))
                    HwButton(HwCopy.t(locale, "setup.start"), onClick = {
                        val now = System.currentTimeMillis()
                        val hatchAt = when (whenStart) {
                            "clock" -> now + 5 * 60 * 1000
                            "custom" -> customAt
                            else -> now
                        }
                        val clock = if (whenStart == "clock") now else hatchAt - 5 * 60 * 1000
                        PetStore.startRun(hatchAt, clock, target, region, firmware, nickname.ifBlank { HwCopy.t(locale, "setup.nick.ph") })
                    }, primary = true, modifier = Modifier.weight(1f))
                }
            }
        }
        HwButton(HwCopy.t(locale, "setup.demo"), onClick = { PetStore.startDemo() }, modifier = Modifier.fillMaxWidth())
        Text(HwCopy.t(locale, "set.backup"), color = HwFg, fontFamily = HwPixel, fontSize = 16.sp)
        Text(HwCopy.t(locale, "set.backup.d"), color = HwMuted, fontSize = 13.sp)
        BackupRestoreSection(locale, showSave = false)
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
fun LangRow(locale: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        HwButton(HwCopy.t(locale, "lang.en"), onClick = { PetStore.setLocale("en") }, primary = locale == "en")
        HwButton(HwCopy.t(locale, "lang.uk"), onClick = { PetStore.setLocale("uk") }, primary = locale == "uk")
    }
}
