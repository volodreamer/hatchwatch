package com.hatchwatch.app

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object CareNotifier {
    fun show(context: Context, title: String, body: String, kind: String, warn: Boolean) {
        AlarmScheduler.ensureChannel(context)
        val open = PendingIntent.getActivity(
            context,
            1,
            Intent(context, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, AlarmScheduler.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_hatch)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(open)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(if (warn) longArrayOf(0, 50, 40, 50, 40, 180) else longArrayOf(0, 90, 50, 160))
            .build()
        try {
            NotificationManagerCompat.from(context).notify((kind + title).hashCode(), notification)
        } catch (_: SecurityException) {
            /* notifications denied */
        }
    }
}
