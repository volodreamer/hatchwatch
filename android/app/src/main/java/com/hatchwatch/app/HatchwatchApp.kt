package com.hatchwatch.app

import android.app.Application
import com.hatchwatch.app.store.PetStore

class HatchwatchApp : Application() {
    override fun onCreate() {
        super.onCreate()
        PetStore.init(this)
        AlarmScheduler.ensureChannel(this)
    }
}
