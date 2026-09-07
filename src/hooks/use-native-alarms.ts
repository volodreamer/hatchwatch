import { useEffect, useRef } from "react";
import { isNative, syncNativeAlarms } from "@/lib/native";
import type { Pet } from "@/lib/tama/types";

/** Push exact alarms into the Android wrapper when HatchwatchNative is present. */
export function useNativeAlarms(pet: Pet | null, now: number) {
  const keyRef = useRef("");
  const native = isNative();

  useEffect(() => {
    if (!native) return;
    if (!pet) {
      syncNativeAlarms(null, now);
      keyRef.current = "";
      return;
    }
    const key = [
      pet.id,
      pet.form,
      pet.hunger,
      pet.happy,
      pet.hungerAt,
      pet.happyAt,
      pet.hungerWindowAt,
      pet.happyWindowAt,
      pet.sleepWindowAt,
      pet.misbehaveAt,
      pet.checkPoopAt,
      pet.checkSickAt,
      pet.checkDiscAt,
      pet.poopAt,
      pet.stageStartedAt,
      pet.sleeping ? 1 : 0,
      Math.floor(now / 30_000),
    ].join(":");
    if (key === keyRef.current) return;
    keyRef.current = key;
    syncNativeAlarms(pet, now);
  }, [native, pet, now]);
}
