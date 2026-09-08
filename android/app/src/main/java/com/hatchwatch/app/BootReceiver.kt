package com.hatchwatch.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hatchwatch.app.store.PetStore

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action !in ACTIONS) return
        val pending = goAsync()
        try {
            PetStore.init(context)
            val pet = PetStore.pet.value ?: return
            AlarmScheduler.sync(context, pet)
        } finally {
            pending.finish()
        }
    }

    companion object {
        private val ACTIONS = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            "android.intent.action.QUICKBOOT_POWERON",
            "com.htc.intent.action.QUICKBOOT_POWERON",
        )
    }
}
