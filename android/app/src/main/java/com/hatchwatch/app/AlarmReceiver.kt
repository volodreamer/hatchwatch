package com.hatchwatch.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hatchwatch.app.store.PetStore

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        PetStore.init(context)
        PetStore.tick()
        val pet = PetStore.pet.value
        val title = intent.getStringExtra("title") ?: "Hatchwatch"
        val body = intent.getStringExtra("body") ?: "Check the shell."
        val kind = intent.getStringExtra("kind") ?: "hunger"
        val warn = intent.getBooleanExtra("warn", false)

        if (pet?.soundOn != false) ChirpPlayer.play(context, warn)
        if (pet?.notifOn == false) return
        CareNotifier.show(context, title, body, kind, warn)
    }
}
