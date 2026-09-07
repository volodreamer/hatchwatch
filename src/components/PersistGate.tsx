import { useEffect, type ReactNode } from "react";
import { CareAlarmHost } from "@/components/CareAlarmHost";
import { installAudioUnlockListeners, registerCareWorker } from "@/lib/audio";
import { applyDetectedLocaleIfUnset, useLocaleStore } from "@/store/locale-store";
import { recoverPetFromStorage, usePetStore } from "@/store/pet-store";

export function PersistGate() {
  const petHydrated = usePetStore((s) => s.hydrated);
  const localeHydrated = useLocaleStore((s) => s.hydrated);

  useEffect(() => {
    if (localeHydrated) return;
    void Promise.resolve(useLocaleStore.persist.rehydrate()).then(() => {
      applyDetectedLocaleIfUnset();
    });
  }, [localeHydrated]);

  useEffect(() => {
    if (petHydrated) return;
    void Promise.resolve(usePetStore.persist.rehydrate()).then(() => {
      if (!usePetStore.getState().pet) recoverPetFromStorage();
      if (!usePetStore.getState().hydrated) usePetStore.getState().markHydrated();
    });
  }, [petHydrated]);

  useEffect(() => {
    registerCareWorker();
    const failsafe = window.setTimeout(() => {
      if (!usePetStore.getState().pet) recoverPetFromStorage();
      if (!usePetStore.getState().hydrated) usePetStore.getState().markHydrated();
      if (!useLocaleStore.getState().hydrated) {
        applyDetectedLocaleIfUnset();
        useLocaleStore.getState().markHydrated();
      }
    }, 1800);
    return () => {
      window.clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => installAudioUnlockListeners(), []);

  return <CareAlarmHost />;
}

/** Wait for localStorage before showing setup, so a live run is not replaced by the picker. */
export function PetBoot({ children, empty }: { children: ReactNode; empty: ReactNode }) {
  const hydrated = usePetStore((s) => s.hydrated);
  const pet = usePetStore((s) => s.pet);
  if (!hydrated) {
    return <main className="min-h-dvh w-full bg-bg" aria-busy="true" />;
  }
  if (!pet) return <>{empty}</>;
  return <>{children}</>;
}
