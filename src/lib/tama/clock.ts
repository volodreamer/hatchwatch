/** Sleep/wake helpers. Overnight schedule: sleep at sleepHour:00, wake at wakeHour:00. */

export function minutesOfDay(ts: number): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function isSleepingAt(
  ts: number,
  wakeHour: number | null,
  sleepHour: number | null,
): boolean {
  if (wakeHour == null || sleepHour == null) return false;
  const m = minutesOfDay(ts);
  const sleepM = sleepHour * 60;
  const wakeM = wakeHour * 60;
  return m >= sleepM || m < wakeM;
}

function nextAtHour(from: number, hour: number): number {
  const d = new Date(from);
  const candidate = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    hour,
    0,
    0,
    0,
  ).getTime();
  if (candidate > from) return candidate;
  return candidate + 24 * 60 * 60 * 1000;
}

export function nextSleepAt(
  from: number,
  wakeHour: number | null,
  sleepHour: number | null,
): number | null {
  if (wakeHour == null || sleepHour == null) return null;
  if (isSleepingAt(from, wakeHour, sleepHour)) return null;
  return nextAtHour(from, sleepHour);
}

export function nextWakeAt(
  from: number,
  wakeHour: number | null,
  sleepHour: number | null,
): number | null {
  if (wakeHour == null || sleepHour == null) return null;
  if (!isSleepingAt(from, wakeHour, sleepHour)) return null;
  return nextAtHour(from, wakeHour);
}

export function addAwakeMs(
  start: number,
  awakeMs: number,
  wakeHour: number | null,
  sleepHour: number | null,
): number {
  if (wakeHour == null || sleepHour == null) return start + awakeMs;
  let t = start;
  let remaining = awakeMs;
  let guard = 0;
  while (remaining > 0 && guard++ < 40) {
    if (isSleepingAt(t, wakeHour, sleepHour)) {
      const wake = nextWakeAt(t, wakeHour, sleepHour);
      if (wake == null) return t + remaining;
      t = wake;
      continue;
    }
    const sleep = nextSleepAt(t, wakeHour, sleepHour);
    if (sleep == null) return t + remaining;
    const msUntilSleep = sleep - t;
    if (remaining <= msUntilSleep) return t + remaining;
    remaining -= msUntilSleep;
    t = sleep;
  }
  return t + remaining;
}

export function awakeMsBetween(
  from: number,
  to: number,
  wakeHour: number | null,
  sleepHour: number | null,
): number {
  if (to <= from) return 0;
  if (wakeHour == null || sleepHour == null) return to - from;
  let t = from;
  let awake = 0;
  let guard = 0;
  while (t < to && guard++ < 40) {
    if (isSleepingAt(t, wakeHour, sleepHour)) {
      const wake = nextWakeAt(t, wakeHour, sleepHour);
      if (wake == null || wake >= to) return awake;
      t = wake;
      continue;
    }
    const sleep = nextSleepAt(t, wakeHour, sleepHour);
    const end = sleep == null ? to : Math.min(sleep, to);
    awake += end - t;
    if (sleep == null || sleep >= to) return awake;
    t = sleep;
  }
  return awake;
}
