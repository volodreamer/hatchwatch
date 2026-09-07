package com.hatchwatch.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.List
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.sp
import com.hatchwatch.app.engine.Simulate
import com.hatchwatch.app.store.PetStore
import kotlinx.coroutines.delay

enum class Tab { Home, Plan, Log, Guide }

@Composable
fun HatchwatchRoot() {
    HatchwatchTheme {
        val pet by PetStore.pet.collectAsState()
        val locale by PetStore.locale.collectAsState()
        var now by remember { mutableStateOf(System.currentTimeMillis()) }
        LaunchedEffect(pet?.id) {
            while (true) {
                delay(1000)
                now = System.currentTimeMillis()
                PetStore.tick(now)
            }
        }
        Box(
            Modifier
                .fillMaxSize()
                .background(HwBg)
                .statusBarsPadding(),
        ) {
            if (pet == null) {
                SetupScreen(locale)
            } else {
                var tab by remember { mutableStateOf(Tab.Home) }
                val derived = remember(pet, now) { Simulate.derive(pet!!, now) }
                Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) {
                        when (tab) {
                            Tab.Home -> HomeScreen(locale, derived)
                            Tab.Plan -> PlanScreen(locale, derived)
                            Tab.Log -> LogScreen(locale, derived.pet)
                            Tab.Guide -> GuideScreen(locale)
                        }
                    }
                    NavigationBar(
                        containerColor = HwSurface,
                        contentColor = HwFg,
                        modifier = Modifier.navigationBarsPadding(),
                    ) {
                        data class Item(val tab: Tab, val icon: ImageVector, val key: String)
                        val items = listOf(
                            Item(Tab.Home, Icons.Outlined.Home, "nav.home"),
                            Item(Tab.Plan, Icons.Outlined.Map, "nav.plan"),
                            Item(Tab.Log, Icons.Outlined.List, "nav.log"),
                            Item(Tab.Guide, Icons.Outlined.MenuBook, "nav.guide"),
                        )
                        items.forEach { item ->
                            NavigationBarItem(
                                selected = tab == item.tab,
                                onClick = { tab = item.tab },
                                icon = { Icon(item.icon, contentDescription = HwCopy.t(locale, item.key)) },
                                label = { Text(HwCopy.t(locale, item.key), fontSize = 11.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = HwPrimaryFg,
                                    selectedTextColor = HwPrimary,
                                    indicatorColor = HwPrimary,
                                    unselectedIconColor = HwMuted,
                                    unselectedTextColor = HwMuted,
                                ),
                            )
                        }
                    }
                }
            }
        }
    }
}
