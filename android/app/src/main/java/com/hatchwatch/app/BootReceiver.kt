package com.hatchwatch.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hatchwatch.app.store.PetStore

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        PetStore.init(context)
        val pet = PetStore.pet.value ?: return
        AlarmScheduler.sync(context, pet)
    }
}
