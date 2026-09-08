package com.hatchwatch.app.ui

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.engine.CharacterId
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.roundToInt
import kotlinx.coroutines.delay

data class HwOption(val id: String, val label: String, val swatch: Color? = null)
data class HwOptionGroup(val title: String?, val items: List<HwOption>)

@Composable
fun HwButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    danger: Boolean = false,
    accent: Boolean = false,
    icon: ImageVector? = null,
) {
    val palette = LocalHwColors.current
    val bg = when {
        danger -> palette.danger.copy(alpha = 0.2f)
        primary -> palette.primary
        else -> palette.surface2
    }
    val fg = when {
        primary -> palette.primaryFg
        danger -> palette.danger
        accent -> palette.accent ?: palette.fg
        else -> palette.fg
    }
    val outline = if (palette.tri) palette.primary else Color.Transparent
    val shape = RoundedCornerShape(12.dp)
    Box(
        modifier
            .border(1.dp, outline, shape)
            .clip(shape)
            .background(bg)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            if (icon != null) {
                Icon(icon, contentDescription = label, tint = fg, modifier = Modifier.size(20.dp))
            }
            Text(label, color = fg, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HwSelect(
    label: String,
    value: String,
    groups: List<HwOptionGroup>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    val items = groups.flatMap { it.items }
    val selected = items.firstOrNull { it.id == value } ?: items.firstOrNull()
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label.uppercase(), color = HwMuted, fontSize = 11.sp, letterSpacing = 1.4.sp, fontWeight = FontWeight.Medium)
        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
            OutlinedTextField(
                value = selected?.label ?: "",
                onValueChange = {},
                readOnly = true,
                singleLine = true,
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth(),
                leadingIcon = selected?.swatch?.let { color ->
                    {
                        Box(
                            Modifier
                                .size(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(color)
                                .border(1.dp, HwBorder, RoundedCornerShape(4.dp)),
                        )
                    }
                },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = HwFg,
                    unfocusedTextColor = HwFg,
                    focusedBorderColor = HwPrimary,
                    unfocusedBorderColor = HwBorder,
                    focusedContainerColor = HwSurface2,
                    unfocusedContainerColor = HwSurface2,
                    focusedTrailingIconColor = HwFg,
                    unfocusedTrailingIconColor = HwMuted,
                    focusedLeadingIconColor = HwFg,
                    unfocusedLeadingIconColor = HwFg,
                    cursorColor = HwFg,
                ),
                shape = RoundedCornerShape(12.dp),
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.background(HwSurface),
            ) {
                groups.forEach { group ->
                    if (group.title != null) {
                        Text(
                            group.title,
                            color = HwMuted,
                            fontSize = 11.sp,
                            letterSpacing = 1.2.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        )
                    }
                    group.items.forEach { item ->
                        DropdownMenuItem(
                            text = { Text(item.label, color = HwFg, fontSize = 15.sp) },
                            onClick = {
                                onSelect(item.id)
                                expanded = false
                            },
                            leadingIcon = item.swatch?.let { color ->
                                {
                                    Box(
                                        Modifier
                                            .size(16.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(color)
                                            .border(1.dp, HwBorder, RoundedCornerShape(4.dp)),
                                    )
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun HwSliderTile(
    label: String,
    value: Int,
    min: Int,
    max: Int,
    modifier: Modifier = Modifier,
    step: Int = 1,
    onChange: (Int) -> Unit,
) {
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(HwSurface2)
            .border(1.dp, HwBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(label.uppercase(), color = HwMuted, fontSize = 10.sp, letterSpacing = 1.1.sp, fontWeight = FontWeight.Medium)
            Text("$value", color = HwFg, fontFamily = HwPixel, fontSize = 18.sp)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "−",
                color = HwFg,
                fontSize = 20.sp,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onChange((value - step).coerceAtLeast(min)) }
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            )
            Slider(
                value = value.toFloat(),
                onValueChange = { raw ->
                    val snapped = ((raw / step).roundToInt() * step).coerceIn(min, max)
                    onChange(snapped)
                },
                valueRange = min.toFloat()..max.toFloat(),
                steps = ((max - min) / step - 1).coerceAtLeast(0),
                modifier = Modifier.weight(1f),
                colors = SliderDefaults.colors(
                    thumbColor = HwFg,
                    activeTrackColor = HwFg,
                    inactiveTrackColor = HwBorder,
                    activeTickColor = HwFg,
                    inactiveTickColor = HwFaint,
                ),
            )
            Text(
                "+",
                color = HwFg,
                fontSize = 20.sp,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onChange((value + step).coerceAtMost(max)) }
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            )
        }
    }
}

@Composable
private fun TintedAsset(path: String, tint: Color, modifier: Modifier = Modifier, contentDescription: String? = null) {
    val ctx = LocalContext.current
    val bmp = remember(path) {
        runCatching {
            ctx.assets.open(path).use { BitmapFactory.decodeStream(it)?.asImageBitmap() }
        }.getOrNull()
    }
    if (bmp != null) {
        Image(
            bitmap = bmp,
            contentDescription = contentDescription,
            modifier = modifier,
            contentScale = ContentScale.Fit,
            filterQuality = FilterQuality.None,
            colorFilter = ColorFilter.tint(tint, BlendMode.SrcIn),
        )
    }
}

@Composable
fun PixelSprite(
    id: CharacterId,
    sleeping: Boolean,
    sick: Boolean,
    modifier: Modifier = Modifier,
    tint: Color = HwLcdPixel,
) {
    var frame by remember { mutableIntStateOf(0) }
    LaunchedEffect(id, sleeping) {
        while (true) {
            delay(500)
            frame = 1 - frame
        }
    }
    val n = if (sleeping) 1 else frame + 1
    Box(modifier) {
        TintedAsset("sprites/${id.id}-$n.png", tint, Modifier.matchParentSize(), id.id)
        if (sick) {
            TintedAsset("sprites/sick-icon.png", tint, Modifier.align(Alignment.TopStart).size(18.dp))
        }
        if (sleeping) {
            TintedAsset("sprites/sleep-icon-${frame + 1}.png", tint, Modifier.align(Alignment.TopEnd).size(20.dp))
        }
    }
}

@Composable
fun PoopPixels(count: Int, tint: Color = HwLcdPixel) {
    if (count <= 0) return
    var frame by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(500)
            frame = 1 - frame
        }
    }
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.Bottom) {
        repeat(count.coerceIn(0, 4)) { i ->
            val n = ((frame + i) % 2) + 1
            TintedAsset("sprites/poop-icon-$n.png", tint, Modifier.size(16.dp))
        }
    }
}

/** P1 hunger/happy heart, 7×6. Same LCD ink for full and empty — hollow vs solid. */
private val HEART_ON = arrayOf(
    ".##.##.",
    "#######",
    "#######",
    ".#####.",
    "..###..",
    "...#...",
)
private val HEART_OFF = arrayOf(
    ".##.##.",
    "#..#..#",
    "#.....#",
    ".#...#.",
    "..#.#..",
    "...#...",
)

/** P1 discipline cell, 8×5. Outline when empty, solid when filled. */
private val BAR_ON = arrayOf(
    "########",
    "########",
    "########",
    "########",
    "########",
)
private val BAR_OFF = arrayOf(
    "########",
    "#......#",
    "#......#",
    "#......#",
    "########",
)

@Composable
private fun PixelIcon(rows: Array<String>, color: Color, modifier: Modifier = Modifier) {
    val cols = rows.first().length
    val rh = rows.size
    Canvas(modifier) {
        val cell = floor(min(size.width / cols, size.height / rh))
        if (cell < 1f) return@Canvas
        val ox = (size.width - cell * cols) / 2f
        val oy = (size.height - cell * rh) / 2f
        rows.forEachIndexed { y, row ->
            row.forEachIndexed { x, ch ->
                if (ch == '#') {
                    drawRect(
                        color = color,
                        topLeft = Offset(ox + x * cell, oy + y * cell),
                        size = Size(cell, cell),
                    )
                }
            }
        }
    }
}

@Composable
fun HeartsRow(label: String, value: Int, color: Color = HwLcdPixel) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, color = color.copy(alpha = 0.7f), fontSize = 12.sp, fontFamily = HwPixel, modifier = Modifier.width(56.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
            repeat(4) { i ->
                PixelIcon(
                    if (i < value) HEART_ON else HEART_OFF,
                    color,
                    Modifier.size(width = 22.dp, height = 19.dp),
                )
            }
        }
    }
}

@Composable
fun DiscBar(value: Int, label: String, color: Color = HwLcdPixel) {
    val filled = (value / 25).coerceIn(0, 4)
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, color = color.copy(alpha = 0.7f), fontSize = 12.sp, fontFamily = HwPixel, modifier = Modifier.width(56.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
            repeat(4) { i ->
                PixelIcon(
                    if (i < filled) BAR_ON else BAR_OFF,
                    color,
                    Modifier.size(width = 20.dp, height = 13.dp),
                )
            }
        }
    }
}

@Composable
fun MiniTile(label: String, value: String, modifier: Modifier = Modifier, inset: Boolean = false) {
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(if (inset) HwSurface2 else HwSurface)
            .border(1.dp, HwBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Text(label.uppercase(), color = HwMuted, fontSize = 10.sp, letterSpacing = 1.4.sp, fontWeight = FontWeight.Medium)
        Spacer(Modifier.height(2.dp))
        Text(value, color = HwFg, fontSize = 18.sp, fontFamily = HwPixel, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SectionCard(content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(HwSurface)
            .border(1.dp, HwBorder, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        content = { content() },
    )
}
