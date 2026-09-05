import type { ChirpKind } from "@/lib/tama/chirps";
import { asset } from "@/lib/asset";

const listeners = new Set<(on: boolean) => void>();

let ctx: AudioContext | null = null;
let dropBuf: AudioBuffer | null = null;
let warnBuf: AudioBuffer | null = null;
let loopBuf: AudioBuffer | null = null;
let loopSrc: AudioBufferSourceNode | null = null;
let htmlLoop: HTMLAudioElement | null = null;
let htmlDrop: HTMLAudioElement | null = null;
let htmlWarn: HTMLAudioElement | null = null;
let unlocked = false;
let armed = false;
let wired = false;

const IDLE_GAIN = 0.0001;

type Note = { start: number; dur: number; freq: number };

const DROP_NOTES: Note[] = [
  { start: 0, dur: 0.1, freq: 1318.5 },
  { start: 0.17, dur: 0.1, freq: 1318.5 },
  { start: 0.34, dur: 0.16, freq: 1760 },
];

const WARN_NOTES: Note[] = [
  { start: 0, dur: 0.07, freq: 784 },
  { start: 0.13, dur: 0.07, freq: 784 },
  { start: 0.26, dur: 0.07, freq: 784 },
  { start: 0.39, dur: 0.07, freq: 988 },
  { start: 0.52, dur: 0.14, freq: 1174.7 },
];

function AC(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export function isAudioUnlocked() {
  return unlocked;
}

export function subscribeAudioUnlock(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit() {
  const on = isAudioUnlocked();
  for (const fn of listeners) fn(on);
}

function stampNotes(data: Float32Array, sr: number, notes: Note[], vol = 0.7) {
  for (const n of notes) {
    const s0 = Math.floor(n.start * sr);
    const count = Math.floor(n.dur * sr);
    const period = sr / n.freq;
    for (let i = 0; i < count; i++) {
      const idx = s0 + i;
      if (idx < 0 || idx >= data.length) break;
      const t = i / Math.max(count - 1, 1);
      const env = t < 0.08 ? t / 0.08 : t > 0.78 ? (1 - t) / 0.22 : 1;
      const square = i % period < period / 2 ? 1 : -1;
      data[idx] = square * vol * env;
    }
  }
}

function buildNotesBuffer(ac: AudioContext, notes: Note[]): AudioBuffer {
  const last = notes[notes.length - 1];
  const dur = (last?.start ?? 0) + (last?.dur ?? 0.1) + 0.05;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  stampNotes(buf.getChannelData(0), ac.sampleRate, notes);
  return buf;
}

function buildSilentBuffer(ac: AudioContext, seconds = 1): AudioBuffer {
  return ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
}

function makeAudio(src: string, loop: boolean) {
  const el = new Audio(src);
  el.preload = "auto";
  el.loop = loop;
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  el.volume = loop ? IDLE_GAIN : 1;
  try {
    el.load();
  } catch {
    /* ignore */
  }
  return el;
}

function ensureHtml() {
  if (typeof Audio === "undefined") return;
  htmlLoop ??= makeAudio(asset("keep-alive.wav"), true);
  htmlDrop ??= makeAudio(asset("chirp.wav"), false);
  htmlWarn ??= makeAudio(asset("chirp-warn.wav"), false);
}

function ensureCtx(): AudioContext | null {
  const Ctor = AC();
  if (!Ctor) return null;
  ctx ??= new Ctor({ latencyHint: "interactive" });
  if (!wired) {
    wired = true;
    ctx.addEventListener("statechange", () => {
      if (ctx?.state === "running") unlocked = true;
      emit();
    });
  }
  if (ctx.state === "suspended" || (ctx.state as string) === "interrupted") {
    void ctx.resume();
  }
  dropBuf ??= buildNotesBuffer(ctx, DROP_NOTES);
  warnBuf ??= buildNotesBuffer(ctx, WARN_NOTES);
  loopBuf ??= buildSilentBuffer(ctx, 1);
  return ctx;
}

function startWebLoop() {
  const ac = ctx;
  if (!ac || !loopBuf || loopSrc) return;
  try {
    const src = ac.createBufferSource();
    src.buffer = loopBuf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.value = IDLE_GAIN;
    src.connect(g);
    g.connect(ac.destination);
    src.start();
    loopSrc = src;
    src.onended = () => {
      if (loopSrc === src) loopSrc = null;
    };
  } catch {
    /* ignore */
  }
}

function playBurstBuffer(kind: ChirpKind): boolean {
  const ac = ctx;
  const buf = kind === "warn" ? warnBuf : dropBuf;
  if (!ac || !buf || ac.state === "closed") return false;
  try {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start();
    return true;
  } catch {
    return false;
  }
}

function playBurstHtml(kind: ChirpKind): boolean {
  const el = kind === "warn" ? htmlWarn : htmlDrop;
  if (!el) return false;
  try {
    const other = kind === "warn" ? htmlDrop : htmlWarn;
    other?.pause();
    el.pause();
    el.currentTime = 0;
    el.volume = 1;
    const p = el.play();
    if (p) void p.catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function setMediaSession(title?: string) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Hatchwatch",
      artist: armed ? "Listening" : "Standby",
      artwork: [{ src: asset("icon-192-v2.png"), sizes: "192x192", type: "image/png" }],
    });
    navigator.mediaSession.playbackState = armed ? "playing" : "paused";
  } catch {
    /* ignore */
  }
}

/** Resume the audio graph. Must run in the same turn as a user gesture — no await. */
export function unlockAudio(): boolean {
  const ac = ensureCtx();
  ensureHtml();
  if (ac) {
    try {
      const silent = ac.createBuffer(1, 1, ac.sampleRate);
      const src = ac.createBufferSource();
      src.buffer = silent;
      src.connect(ac.destination);
      src.start(0);
    } catch {
      /* ignore */
    }
    if (ac.state === "running") unlocked = true;
  }
  emit();
  return unlocked;
}

/**
 * Start a silent keep-alive inside a user gesture and leave it running.
 * Later chirps are one-shots on the already-running graph.
 */
export function armAudio(): boolean {
  unlockAudio();
  ensureHtml();
  startWebLoop();
  if (htmlLoop) {
    htmlLoop.volume = IDLE_GAIN;
    const p = htmlLoop.play();
    if (p) {
      void p
        .then(() => {
          armed = true;
          unlocked = true;
          emit();
        })
        .catch(() => {});
    }
  }
  armed = true;
  unlocked = true;
  setMediaSession();
  emit();
  return true;
}

export function playCall(kind: ChirpKind = "drop") {
  armAudio();
  const web = playBurstBuffer(kind);
  const html = playBurstHtml(kind);
  setMediaSession(kind === "warn" ? "2 minutes left" : "Care call");
  if (web || html) {
    unlocked = true;
    emit();
    return true;
  }
  return false;
}

/** @deprecated alias — drop chirp */
export function playTamaChirp() {
  return playCall("drop");
}

export function disarmAudio() {
  armed = false;
  try {
    htmlLoop?.pause();
  } catch {
    /* ignore */
  }
  try {
    loopSrc?.stop();
  } catch {
    /* ignore */
  }
  loopSrc = null;
  setMediaSession();
}

export function registerCareWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(asset("sw.js"), { scope: import.meta.env.BASE_URL || "/" }).catch(() => {});
}

export function installAudioUnlockListeners() {
  if (typeof window === "undefined") return () => {};
  const kick = () => {
    unlockAudio();
    if (armed && htmlLoop?.paused) {
      const p = htmlLoop.play();
      if (p) void p.catch(() => {});
    }
    if (armed && ctx && !loopSrc) startWebLoop();
  };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("touchend", kick);
  window.addEventListener("keydown", kick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") kick();
  });
  window.addEventListener("focus", kick);
  return () => {
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("touchend", kick);
    window.removeEventListener("keydown", kick);
  };
}
