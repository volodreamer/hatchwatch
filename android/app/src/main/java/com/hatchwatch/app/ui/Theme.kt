package com.hatchwatch.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle

val HwBg = Color(0xFF0E120C)
val HwSurface = Color(0xFF171C14)
val HwSurface2 = Color(0xFF1E2519)
val HwFg = Color(0xFFE8EDD8)
val HwMuted = Color(0xFF8B9278)
val HwFaint = Color(0xFF5C6350)
val HwPrimary = Color(0xFFB7D46A)
val HwPrimaryFg = Color(0xFF12160F)
val HwLcd = Color(0xFFC5D39A)
val HwLcdPixel = Color(0xFF2A331F)
val HwDanger = Color(0xFFC45C4A)
val HwWarn = Color(0xFFC4A35A)
val HwOk = Color(0xFF8FBF6A)
val HwBorder = Color(0xFF2A3224)

private val colors = darkColorScheme(
    primary = HwPrimary,
    onPrimary = HwPrimaryFg,
    background = HwBg,
    onBackground = HwFg,
    surface = HwSurface,
    onSurface = HwFg,
    surfaceVariant = HwSurface2,
    onSurfaceVariant = HwMuted,
    error = HwDanger,
    outline = HwBorder,
)

private val type = Typography(
    displayLarge = TextStyle(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 32.sp, color = HwFg),
    headlineMedium = TextStyle(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = HwFg),
    titleLarge = TextStyle(fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = HwFg),
    bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, color = HwFg),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, color = HwMuted),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 11.sp, letterSpacing = 1.6.sp, color = HwMuted),
)

@Composable
fun HatchwatchTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = colors, typography = type, content = content)
}
