package com.hatchwatch.app

import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

object ChirpPlayer {
    fun play(context: Context, warn: Boolean, respectPhone: Boolean = false) {
        if (respectPhone) {
            if (!PhoneQuiet.allowsSound(context)) {
                if (PhoneQuiet.allowsVibrate(context)) PhoneQuiet.vibrate(context, warn)
                return
            }
        }
        val res = if (warn) R.raw.chirp_warn else R.raw.chirp
        try {
            val player = MediaPlayer.create(context, res) ?: return
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
            player.setOnCompletionListener { it.release() }
            player.start()
        } catch (_: Exception) {
            /* ignore */
        }
    }
}

/** Phone ringer + Do Not Disturb. Alarms used to ignore both. */
internal object PhoneQuiet {
    fun allowsSound(context: Context): Boolean {
        if (!allowsInterrupt(context)) return false
        val am = context.getSystemService(AudioManager::class.java) ?: return true
        return am.ringerMode == AudioManager.RINGER_MODE_NORMAL
    }

    fun allowsVibrate(context: Context): Boolean {
        if (!allowsInterrupt(context)) return false
        val am = context.getSystemService(AudioManager::class.java) ?: return true
        return am.ringerMode != AudioManager.RINGER_MODE_SILENT
    }

    fun allowsInterrupt(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < 23) return true
        val nm = context.getSystemService(NotificationManager::class.java) ?: return true
        return when (nm.currentInterruptionFilter) {
            NotificationManager.INTERRUPTION_FILTER_NONE,
            NotificationManager.INTERRUPTION_FILTER_ALARMS,
            -> false
            NotificationManager.INTERRUPTION_FILTER_PRIORITY -> {
                if (Build.VERSION.SDK_INT < 26) return false
                nm.getNotificationChannel(AlarmScheduler.CHANNEL_ID)?.canBypassDnd() == true
            }
            else -> true
        }
    }

    fun vibrate(context: Context, warn: Boolean) {
        val v = context.getSystemService(Vibrator::class.java) ?: return
        val pattern = if (warn) longArrayOf(0, 50, 40, 50, 40, 180) else longArrayOf(0, 90, 50, 160)
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .build()
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                v.vibrate(VibrationEffect.createWaveform(pattern, -1), attrs)
            } else {
                @Suppress("DEPRECATION")
                v.vibrate(pattern, -1)
            }
        } catch (_: Exception) {
            /* ignore */
        }
    }
}
