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
    val group: String,
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

private fun shell(
    id: String,
    group: String,
    light: Boolean,
    bg: Long,
    surface: Long,
    surface2: Long,
    fg: Long,
    muted: Long,
    faint: Long,
    primary: Long,
    primaryFg: Long,
    border: Long,
    danger: Long,
    warn: Long,
    ok: Long,
) = HwColors(
    id, group, light,
    hex(bg), hex(surface), hex(surface2),
    hex(fg), hex(muted), hex(faint),
    hex(primary), hex(primaryFg), hex(border),
    hex(danger), hex(warn), hex(ok),
)

/** Same ids and hex as the website `src/lib/shells.ts`. */
val HwShells = listOf(
    shell("pink-yellow", "classic", true, 0xFFFF66B2, 0xFFFF7CBC, 0xFFFF92C8, 0xFF2A1020, 0xFF6E2848, 0xFF8A4060, 0xFFFFE600, 0xFF1A1400, 0xFFE05098, 0xFF8E1028, 0xFF6A4800, 0xFF1C5C38),
    shell("white-blue", "classic", true, 0xFFFFFFFF, 0xFFF4F7FB, 0xFFE8EEF6, 0xFF142033, 0xFF5A6A80, 0xFF8A98AC, 0xFF0099FF, 0xFFF4FAFF, 0xFFD0D8E4, 0xFFC42020, 0xFFA07010, 0xFF2A7A40),
    shell("purple-pink", "classic", false, 0xFF8A4FFF, 0xFF975EFF, 0xFFA572FF, 0xFFF6F0FF, 0xFFD4C4F8, 0xFFB8A0E8, 0xFFFF52A0, 0xFFFFF5FA, 0xFF7A40E8, 0xFFFF8A8A, 0xFFFFD36A, 0xFF8EECB0),
    shell("white-red", "classic", true, 0xFFFFFFFF, 0xFFFAF6F5, 0xFFF4E8E6, 0xFF1C1010, 0xFF6A4848, 0xFF987070, 0xFFEE0700, 0xFFFFF6F5, 0xFFE0D0CE, 0xFFB01010, 0xFFA07010, 0xFF2A7A40),
    shell("yellow-black", "classic", true, 0xFFFFD700, 0xFFFFE44D, 0xFFFFEE80, 0xFF1A1A1A, 0xFF4A4208, 0xFF6E6418, 0xFF1A1A1A, 0xFFFFD700, 0xFFD4B400, 0xFF8E1010, 0xFF5A3C00, 0xFF1C5C28),
    shell("black-carbon", "classic", false, 0xFF000000, 0xFF1C1C1C, 0xFF2A2A2A, 0xFFF0F0F0, 0xFF9A9A9A, 0xFF6A6A6A, 0xFFE8E8E8, 0xFF111111, 0xFF3A3A3A, 0xFFE07070, 0xFFE0C060, 0xFF80D090),
    shell("tama-garden", "modern", false, 0xFF006269, 0xFF0D7A82, 0xFF1A8A91, 0xFFE6F6F6, 0xFF9EC9CB, 0xFF6A9EA0, 0xFFA362CE, 0xFFF8F0FF, 0xFF004A50, 0xFFE87880, 0xFFE0C06A, 0xFF7CD9A1),
    shell("neon-pop", "modern", false, 0xFF7B00AE, 0xFF8E12C4, 0xFF5A0088, 0xFFF8F0FF, 0xFFD8B4F0, 0xFFB080D0, 0xFF39FF14, 0xFF081428, 0xFF9A20CC, 0xFFFF6A8A, 0xFFFFE14A, 0xFF39FF14),
    shell("candy-swirl", "modern", true, 0xFFFFF7FB, 0xFFFFFFFF, 0xFFFFE8F4, 0xFF4A2040, 0xFF8A6080, 0xFFB090A8, 0xFFFF7EB3, 0xFF3A1028, 0xFFF0D0E4, 0xFFC43050, 0xFFC09020, 0xFF3A9A68),
    shell("argyle-heart", "modern", true, 0xFFF4E8EE, 0xFFFFF8FB, 0xFFEAD4DC, 0xFF3A2030, 0xFF7A5868, 0xFFA08090, 0xFFC45A7A, 0xFFFFF6F8, 0xFFE0C8D0, 0xFFB03040, 0xFFA07820, 0xFF3A7A50),
    shell("flower-perfume", "modern", true, 0xFFF6E8F4, 0xFFFFF6FC, 0xFFEDD4EA, 0xFF402040, 0xFF806080, 0xFFA888A8, 0xFFD080C0, 0xFF301028, 0xFFE4CCE0, 0xFFC04060, 0xFFB08820, 0xFF4A8A68),
    shell("gingham-avocado", "modern", true, 0xFFC8E8A8, 0xFFD8F0BC, 0xFFE8F8D0, 0xFF243818, 0xFF4A6840, 0xFF6A8860, 0xFF5A8A30, 0xFFF4FFE8, 0xFFA8D080, 0xFFB04030, 0xFF8A6810, 0xFF2A6A38),
    shell("pastel-checkers", "modern", true, 0xFFD8C0F0, 0xFFE8D8F8, 0xFFF4ECFC, 0xFF302048, 0xFF685888, 0xFF9080A8, 0xFFB070D8, 0xFFFFF8FF, 0xFFC4A8E0, 0xFFC04060, 0xFFB08820, 0xFF3A8A68),
    shell("diner", "modern", true, 0xFFF08A40, 0xFFF4A060, 0xFFF8B480, 0xFF2A1408, 0xFF6E3C1C, 0xFF8A5830, 0xFFC43018, 0xFFFFF4E8, 0xFFD07030, 0xFF8E1808, 0xFF6A4008, 0xFF2A5C28),
    shell("paper-collage", "modern", true, 0xFFF6F1E6, 0xFFFFFDF8, 0xFFEBE4D4, 0xFF2A2418, 0xFF6A6458, 0xFF948C7C, 0xFF4A6AA0, 0xFFF4F8FF, 0xFFDDD4C4, 0xFFB04030, 0xFFA07820, 0xFF3A7A50),
    shell("space-astronaut", "modern", false, 0xFF0A1A48, 0xFF12245C, 0xFF1A3070, 0xFFE8EEFC, 0xFF9AACD0, 0xFF6A80B0, 0xFF7EC8FF, 0xFF081428, 0xFF243868, 0xFFFF7A8A, 0xFFFFD36A, 0xFF80E0A8),
)

val HwClassicShells = HwShells.filter { it.group == "classic" }
val HwModernShells = HwShells.filter { it.group == "modern" }

private val LEGACY_SHELLS = mapOf(
    "garden" to "tama-garden",
    "green" to "tama-garden",
    "garden-test" to "tama-garden",
    "white" to "white-blue",
    "blue" to "white-blue",
    "yellow" to "yellow-black",
    "pink" to "pink-yellow",
    "orange" to "diner",
    "purple" to "purple-pink",
    "smoke" to "black-carbon",
)

fun hwNormalizeShell(id: String?): String {
    val mapped = LEGACY_SHELLS[id] ?: id ?: return "black-carbon"
    return if (HwShells.any { it.id == mapped }) mapped else "black-carbon"
}

fun hwShell(id: String?): HwColors =
    HwShells.first { it.id == hwNormalizeShell(id) }

val LocalHwColors = compositionLocalOf { hwShell("black-carbon") }

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
