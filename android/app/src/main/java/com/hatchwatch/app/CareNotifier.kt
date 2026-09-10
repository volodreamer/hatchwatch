package com.hatchwatch.app

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object CareNotifier {
    fun show(
        context: Context,
        title: String,
        body: String,
        kind: String,
        warn: Boolean,
        suppressAlert: Boolean = false,
    ) {
        AlarmScheduler.ensureChannel(context)
        val mgr = NotificationManagerCompat.from(context)
        if (Build.VERSION.SDK_INT >= 24 && !mgr.areNotificationsEnabled()) return
        val open = PendingIntent.getActivity(
            context,
            1,
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val sound = !suppressAlert && PhoneQuiet.allowsSound(context)
        val vibe = !suppressAlert && PhoneQuiet.allowsVibrate(context)
        val notification = NotificationCompat.Builder(context, AlarmScheduler.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_hatch)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(open)
            .setSilent(!sound)
            .setOnlyAlertOnce(false)
            .setVibrate(if (vibe) {
                if (warn) longArrayOf(0, 50, 40, 50, 40, 180) else longArrayOf(0, 90, 50, 160)
            } else {
                longArrayOf(0)
            })
            .build()
        try {
            mgr.notify((kind + title).hashCode() and 0x7fffffff, notification)
        } catch (_: SecurityException) {
            /* notifications denied */
        }
    }
}
