package com.hatchwatch.app.ui

import android.graphics.BitmapFactory
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
import androidx.compose.material3.Icon
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.engine.CharacterId
import kotlinx.coroutines.delay

@Composable
fun HwButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    danger: Boolean = false,
    icon: ImageVector? = null,
) {
    val bg = when {
        danger -> HwDanger.copy(alpha = 0.2f)
        primary -> HwPrimary
        else -> HwSurface2
    }
    val fg = when {
        primary -> HwPrimaryFg
        danger -> HwDanger
        else -> HwFg
    }
    Box(
        modifier
            .clip(RoundedCornerShape(12.dp))
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

@Composable
fun HeartsRow(label: String, value: Int, color: Color = HwLcdPixel) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, color = color.copy(alpha = 0.7f), fontSize = 12.sp, fontFamily = HwPixel, modifier = Modifier.width(56.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            repeat(4) { i ->
                Text(if (i < value) "♥" else "♡", color = color, fontSize = 16.sp)
            }
        }
    }
}

@Composable
fun DiscBar(value: Int, label: String, color: Color = HwLcdPixel) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(label, color = color.copy(alpha = 0.7f), fontSize = 12.sp, fontFamily = HwPixel, modifier = Modifier.width(56.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            repeat(4) { i ->
                val filled = value >= (i + 1) * 25
                Box(
                    Modifier
                        .size(width = 18.dp, height = 10.dp)
                        .background(if (filled) color else color.copy(alpha = 0.2f), RoundedCornerShape(2.dp)),
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
