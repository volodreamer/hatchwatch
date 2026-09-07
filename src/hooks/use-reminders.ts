import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { disarmAudio, isAudioUnlocked, playCall, subscribeAudioUnlock } from "@/lib/audio";
import { chirpCopy } from "@/lib/care-copy";
import {
  chirpEvents,
  snapshotFromPet,
  type ChirpEvent,
  type ChirpSnapshot,
} from "@/lib/tama/chirps";
import type { Pet } from "@/lib/tama/types";
import { useLocaleStore } from "@/store/locale-store";

function buzz(kind: ChirpEvent["kind"]) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(kind === "warn" ? [50, 40, 50, 40, 50, 40, 50, 40, 180] : [90, 50, 90, 50, 160]);
  } catch {
    /* ignore */
  }
}

function notify(event: ChirpEvent, enabled: boolean) {
  if (!enabled) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const locale = useLocaleStore.getState().locale;
  const copy = chirpCopy(locale, event.kind, event.alertKind);
  const opts: NotificationOptions = {
    body: copy.body,
    tag: `hatchwatch-${event.kind}-${event.alertKind}`,
    silent: false,
    icon: asset("icon-192-v2.png"),
    requireInteraction: event.kind === "warn",
  };
  if (typeof navigator !== "undefined" && navigator.serviceWorker) {
    void navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(copy.title, opts))
      .catch(() => {
        try {
          new Notification(copy.title, opts);
        } catch {
          /* ignore */
        }
      });
    return;
  }
  try {
    new Notification(copy.title, opts);
  } catch {
    /* ignore */
  }
}

function windowOpen(pet: Pet) {
  return Boolean(
    pet.hungerWindowAt ||
      pet.happyWindowAt ||
      pet.sleepWindowAt ||
      pet.misbehaveAt ||
      pet.checkPoopAt ||
      pet.checkSickAt ||
      pet.checkDiscAt,
  );
}

export function useReminders(pet: Pet | null, now: number, enabled: { notif: boolean; sound: boolean }) {
  const prevRef = useRef<ChirpSnapshot | null>(null);
  const firedRef = useRef(new Set<string>());
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  const petId = pet?.id ?? "";

  useEffect(() => {
    prevRef.current = null;
    firedRef.current = new Set();
  }, [petId]);

  useEffect(() => {
    if (!enabled.sound) disarmAudio();
  }, [enabled.sound]);

  useEffect(() => {
    if (!pet) {
      prevRef.current = null;
      void wakeRef.current?.release();
      wakeRef.current = null;
      return;
    }

    const snap = snapshotFromPet(pet, now);
    const events = chirpEvents(prevRef.current, snap, firedRef.current);
    prevRef.current = snap;

    if (enabledRef.current.sound) {
      for (const event of events) {
        playCall(event.kind);
        buzz(event.kind);
        notify(event, enabledRef.current.notif);
      }
    } else {
      for (const event of events) notify(event, enabledRef.current.notif);
    }

    const hold = windowOpen(pet) && document.visibilityState === "visible" && "wakeLock" in navigator;
    if (hold && !wakeRef.current) {
      const wl = navigator as Navigator & {
        wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
      };
      void wl.wakeLock
        .request("screen")
        .then((lock) => {
          wakeRef.current = lock;
        })
        .catch(() => {});
    }
    if (!windowOpen(pet) && wakeRef.current) {
      void wakeRef.current.release();
      wakeRef.current = null;
    }
  }, [pet, now]);
}

export function useAudioUnlocked() {
  const [on, setOn] = useState(isAudioUnlocked);
  useEffect(() => subscribeAudioUnlock(setOn), []);
  return on;
}

export async function requestNotifPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}
