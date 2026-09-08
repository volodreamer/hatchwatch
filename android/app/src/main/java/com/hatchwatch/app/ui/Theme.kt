package com.hatchwatch.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontSynthesis
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.R
import com.hatchwatch.app.store.PetStore

data class HwColors(
    val id: String,
    val label: String,
    val light: Boolean,
    val bg: Color,
    val surface: Color,
    val surface2: Color,
    val fg: Color,
    val muted: Color,
    val faint: Color,
    val primary: Color,
    val primaryFg: Color,
    val border: Color,
    val danger: Color,
    val warn: Color,
    val ok: Color,
)

private fun hex(v: Long) = Color(v)

val HwShells = listOf(
    HwColors(
        id = "black-carbon",
        label = "Carbon",
        light = false,
        bg = hex(0xFF000000),
        surface = hex(0xFF1C1C1C),
        surface2 = hex(0xFF2A2A2A),
        fg = hex(0xFFF0F0F0),
        muted = hex(0xFF9A9A9A),
        faint = hex(0xFF6A6A6A),
        primary = hex(0xFFE8E8E8),
        primaryFg = hex(0xFF111111),
        border = hex(0xFF3A3A3A),
        danger = hex(0xFFE07070),
        warn = hex(0xFFE0C060),
        ok = hex(0xFF80D090),
    ),
    HwColors(
        id = "garden",
        label = "Garden",
        light = false,
        bg = hex(0xFF0E120C),
        surface = hex(0xFF171C14),
        surface2 = hex(0xFF1E2519),
        fg = hex(0xFFE8EDD8),
        muted = hex(0xFF8B9278),
        faint = hex(0xFF5C6350),
        primary = hex(0xFFB7D46A),
        primaryFg = hex(0xFF12160F),
        border = hex(0xFF2A3224),
        danger = hex(0xFFC45C4A),
        warn = hex(0xFFC4A35A),
        ok = hex(0xFF8FBF6A),
    ),
    HwColors(
        id = "yellow-black",
        label = "Classic",
        light = true,
        bg = hex(0xFFFFD700),
        surface = hex(0xFFFFE44D),
        surface2 = hex(0xFFFFEE80),
        fg = hex(0xFF1A1A1A),
        muted = hex(0xFF4A4208),
        faint = hex(0xFF6E6418),
        primary = hex(0xFF1A1A1A),
        primaryFg = hex(0xFFFFD700),
        border = hex(0xFFD4B400),
        danger = hex(0xFF8E1010),
        warn = hex(0xFF5A3C00),
        ok = hex(0xFF1C5C28),
    ),
    HwColors(
        id = "white-blue",
        label = "Ice",
        light = true,
        bg = hex(0xFFF4F7FB),
        surface = hex(0xFFFFFFFF),
        surface2 = hex(0xFFE6EEF6),
        fg = hex(0xFF1A2430),
        muted = hex(0xFF5A6A7A),
        faint = hex(0xFF8A98A6),
        primary = hex(0xFF2A6FDB),
        primaryFg = hex(0xFFFFFFFF),
        border = hex(0xFFD0D8E0),
        danger = hex(0xFFC04040),
        warn = hex(0xFFB08020),
        ok = hex(0xFF2A8A58),
    ),
)

fun hwShell(id: String?): HwColors =
    HwShells.firstOrNull { it.id == id } ?: HwShells.first()

val LocalHwColors = compositionLocalOf { HwShells.first() }

val HwLcd = Color(0xFFC5D39A)
val HwLcdPixel = Color(0xFF2A331F)
val HwLcdDim = Color(0xFF8FA074)

val HwBg: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.bg
val HwSurface: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.surface
val HwSurface2: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.surface2
val HwFg: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.fg
val HwMuted: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.muted
val HwFaint: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.faint
val HwPrimary: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.primary
val HwPrimaryFg: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.primaryFg
val HwDanger: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.danger
val HwWarn: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.warn
val HwOk: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.ok
val HwBorder: Color
    @Composable @ReadOnlyComposable get() = LocalHwColors.current.border

/** Same iFlash 502 face as the website — Latin + Ukrainian Cyrillic. */
val HwPixel: FontFamily = FontFamily(Font(R.font.iflash_502))

@Composable
fun HatchwatchTheme(content: @Composable () -> Unit) {
    val shellId by PetStore.shell.collectAsState()
    val palette = hwShell(shellId)
    val scheme = if (palette.light) {
        lightColorScheme(
            primary = palette.primary,
            onPrimary = palette.primaryFg,
            background = palette.bg,
            onBackground = palette.fg,
            surface = palette.surface,
            onSurface = palette.fg,
            surfaceVariant = palette.surface2,
            onSurfaceVariant = palette.muted,
            error = palette.danger,
            outline = palette.border,
        )
    } else {
        darkColorScheme(
            primary = palette.primary,
            onPrimary = palette.primaryFg,
            background = palette.bg,
            onBackground = palette.fg,
            surface = palette.surface,
            onSurface = palette.fg,
            surfaceVariant = palette.surface2,
            onSurfaceVariant = palette.muted,
            error = palette.danger,
            outline = palette.border,
        )
    }
    val type = Typography(
        displayLarge = TextStyle(fontFamily = HwPixel, fontWeight = FontWeight.Normal, fontSize = 32.sp, color = palette.fg, fontSynthesis = FontSynthesis.None),
        headlineMedium = TextStyle(fontFamily = HwPixel, fontWeight = FontWeight.Normal, fontSize = 24.sp, color = palette.fg, fontSynthesis = FontSynthesis.None),
        titleLarge = TextStyle(fontFamily = HwPixel, fontWeight = FontWeight.Normal, fontSize = 20.sp, color = palette.fg, fontSynthesis = FontSynthesis.None),
        bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, color = palette.fg),
        bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, color = palette.muted),
        labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Medium, fontSize = 11.sp, letterSpacing = 1.6.sp, color = palette.muted),
    )
    CompositionLocalProvider(LocalHwColors provides palette) {
        MaterialTheme(colorScheme = scheme, typography = type) {
            ProvideTextStyle(
                value = TextStyle(fontSynthesis = FontSynthesis.None),
                content = content,
            )
        }
    }
}
