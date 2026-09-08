package com.hatchwatch.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.os.Build
import androidx.core.net.toUri
import com.hatchwatch.app.engine.NativeAlarm
import com.hatchwatch.app.engine.Pet
import com.hatchwatch.app.engine.Simulate

object AlarmScheduler {
    const val CHANNEL_ID = "hatchwatch-care"
    private const val MAX = 16
    private const val WATCHDOG = 16
    private const val WATCHDOG_MS = 3L * 60 * 60 * 1000

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val mgr = context.getSystemService(NotificationManager::class.java) ?: return
        val existing = mgr.getNotificationChannel(CHANNEL_ID)
        if (existing != null && existing.importance >= NotificationManager.IMPORTANCE_HIGH) return
        if (existing != null) mgr.deleteNotificationChannel(CHANNEL_ID)
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val ch = NotificationChannel(CHANNEL_ID, "Care chirps", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Hunger, sleep, poop, skull, and attention — even when Hatchwatch is closed."
            setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, attrs)
            enableVibration(true)
            enableLights(true)
            setBypassDnd(true)
        }
        mgr.createNotificationChannel(ch)
    }

    fun cancelAll(context: Context) {
        val am = context.getSystemService(AlarmManager::class.java) ?: return
        for (i in 0..WATCHDOG) {
            am.cancel(pending(context, i, NativeAlarm("x", 0, "hunger", "", "")))
        }
    }

    fun sync(context: Context, pet: Pet) {
        ensureChannel(context)
        cancelAll(context)
        if (!pet.notifOn && !pet.soundOn) return
        val now = System.currentTimeMillis()
        val alarms = Simulate.upcomingAlarms(pet, now)
        val am = context.getSystemService(AlarmManager::class.java) ?: return
        val show = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        alarms.take(MAX).forEachIndexed { i, alarm ->
            val whenAt = if (alarm.at <= now) now + 1_200L + i * 250L else alarm.at
            book(am, context, i, alarm, whenAt, show, clock = i == 0)
        }
        val nextAt = alarms.minOfOrNull { if (it.at <= now) now + 1_200L else it.at }
        if (nextAt == null || nextAt > now + WATCHDOG_MS) {
            book(
                am, context, WATCHDOG,
                NativeAlarm("watchdog", now + WATCHDOG_MS, "watchdog", "", ""),
                now + WATCHDOG_MS, show, clock = alarms.isEmpty(),
            )
        }
    }

    private fun book(
        am: AlarmManager,
        context: Context,
        index: Int,
        alarm: NativeAlarm,
        whenAt: Long,
        show: PendingIntent,
        clock: Boolean,
    ) {
        val pi = pending(context, index, alarm)
        try {
            if (clock) {
                am.setAlarmClock(AlarmManager.AlarmClockInfo(whenAt, show), pi)
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenAt, pi)
            }
        } catch (_: SecurityException) {
            try {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenAt, pi)
            } catch (_: SecurityException) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenAt, pi)
            }
        }
    }

    private fun pending(context: Context, index: Int, alarm: NativeAlarm): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = "com.hatchwatch.app.CARE"
            data = "hatchwatch://alarm/$index".toUri()
            putExtra("id", alarm.id)
            putExtra("kind", alarm.kind)
            putExtra("title", alarm.title)
            putExtra("body", alarm.body)
            putExtra("warn", alarm.warn)
        }
        return PendingIntent.getBroadcast(
            context,
            index,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
