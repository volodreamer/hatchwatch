package com.hatchwatch.app

import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.net.toUri
import androidx.core.view.WindowCompat
import com.hatchwatch.app.store.PetStore
import com.hatchwatch.app.ui.HatchwatchRoot

class MainActivity : ComponentActivity() {
    private val notifPerm = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= 33) notifPerm.launch(Manifest.permission.POST_NOTIFICATIONS)
        askExactAlarms()
        askUnrestrictedBattery()
        AlarmScheduler.ensureChannel(this)
        setContent { HatchwatchRoot() }
    }

    override fun onResume() {
        super.onResume()
        PetStore.init(this)
        PetStore.pet.value?.let { AlarmScheduler.sync(this, it) }
    }

    private fun askExactAlarms() {
        if (Build.VERSION.SDK_INT < 31) return
        val am = getSystemService(AlarmManager::class.java) ?: return
        if (!am.canScheduleExactAlarms()) {
            startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM))
        }
    }

    private fun askUnrestrictedBattery() {
        if (Build.VERSION.SDK_INT < 23) return
        val pm = getSystemService(PowerManager::class.java) ?: return
        if (pm.isIgnoringBatteryOptimizations(packageName)) return
        startActivity(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                .setData("package:$packageName".toUri()),
        )
    }
}
