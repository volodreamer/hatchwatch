package com.hatchwatch.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hatchwatch.app.store.PetStore

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pending = goAsync()
        try {
            PetStore.init(context)
            PetStore.tick()
            val pet = PetStore.pet.value
            val kind = intent.getStringExtra("kind") ?: "hunger"
            val title = intent.getStringExtra("title") ?: "Hatchwatch"
            val body = intent.getStringExtra("body") ?: "Check the shell."
            val warn = intent.getBooleanExtra("warn", false)
            if (kind != "watchdog") {
                if (pet?.soundOn != false) ChirpPlayer.play(context, warn)
                if (pet?.notifOn != false) CareNotifier.show(context, title, body, kind, warn)
            }
            if (pet != null) AlarmScheduler.sync(context, pet)
        } finally {
            pending.finish()
        }
    }
}
