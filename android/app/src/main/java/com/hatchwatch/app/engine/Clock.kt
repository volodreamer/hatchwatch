package com.hatchwatch.app.engine

import java.util.Calendar

object Clock {
    fun minutesOfDay(ts: Long): Double {
        val c = Calendar.getInstance().apply { timeInMillis = ts }
        return c.get(Calendar.HOUR_OF_DAY) * 60 +
            c.get(Calendar.MINUTE) +
            c.get(Calendar.SECOND) / 60.0
    }

    fun isSleepingAt(ts: Long, wakeHour: Int?, sleepHour: Int?): Boolean {
        if (wakeHour == null || sleepHour == null) return false
        val m = minutesOfDay(ts)
        return m >= sleepHour * 60 || m < wakeHour * 60
    }

    private fun nextAtHour(from: Long, hour: Int): Long {
        val c = Calendar.getInstance().apply { timeInMillis = from }
        c.set(Calendar.HOUR_OF_DAY, hour)
        c.set(Calendar.MINUTE, 0)
        c.set(Calendar.SECOND, 0)
        c.set(Calendar.MILLISECOND, 0)
        val candidate = c.timeInMillis
        return if (candidate > from) candidate else candidate + 24L * 60 * 60 * 1000
    }

    fun nextSleepAt(from: Long, wakeHour: Int?, sleepHour: Int?): Long? {
        if (wakeHour == null || sleepHour == null) return null
        if (isSleepingAt(from, wakeHour, sleepHour)) return null
        return nextAtHour(from, sleepHour)
    }

    fun nextWakeAt(from: Long, wakeHour: Int?, sleepHour: Int?): Long? {
        if (wakeHour == null || sleepHour == null) return null
        if (!isSleepingAt(from, wakeHour, sleepHour)) return null
        return nextAtHour(from, wakeHour)
    }

    fun addAwakeMs(start: Long, awakeMs: Long, wakeHour: Int?, sleepHour: Int?): Long {
        if (wakeHour == null || sleepHour == null) return start + awakeMs
        var t = start
        var remaining = awakeMs
        var guard = 0
        while (remaining > 0 && guard++ < 40) {
            if (isSleepingAt(t, wakeHour, sleepHour)) {
                val wake = nextWakeAt(t, wakeHour, sleepHour) ?: return t + remaining
                t = wake
                continue
            }
            val sleep = nextSleepAt(t, wakeHour, sleepHour) ?: return t + remaining
            val msUntilSleep = sleep - t
            if (remaining <= msUntilSleep) return t + remaining
            remaining -= msUntilSleep
            t = sleep
        }
        return t + remaining
    }
}
