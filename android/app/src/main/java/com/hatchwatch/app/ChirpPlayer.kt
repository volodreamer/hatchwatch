package com.hatchwatch.app

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer

object ChirpPlayer {
    fun play(context: Context, warn: Boolean) {
        val res = if (warn) R.raw.chirp_warn else R.raw.chirp
        try {
            val player = MediaPlayer.create(context, res) ?: return
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
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
