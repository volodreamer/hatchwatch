import { useEffect, type ReactNode } from "react";
import { CareAlarmHost } from "@/components/CareAlarmHost";
import { GoogleSyncHost } from "@/components/care/GoogleSyncHost";
import { installAudioUnlockListeners, registerCareWorker } from "@/lib/audio";
import { applyTheme, DEFAULT_THEME } from "@/lib/theme";
import { applyDetectedLocaleIfUnset, useLocaleStore } from "@/store/locale-store";
import { recoverPetFromStorage, usePetStore } from "@/store/pet-store";
import { useThemeStore } from "@/store/theme-store";

export function PersistGate() {
  const petHydrated = usePetStore((s) => s.hydrated);
  const localeHydrated = useLocaleStore((s) => s.hydrated);
  const themeHydrated = useThemeStore((s) => s.hydrated);

  useEffect(() => {
    if (localeHydrated) return;
    void Promise.resolve(useLocaleStore.persist.rehydrate()).then(() => {
      applyDetectedLocaleIfUnset();
    });
  }, [localeHydrated]);

  useEffect(() => {
    if (themeHydrated) return;
    void Promise.resolve(useThemeStore.persist.rehydrate()).then(() => {
      applyTheme(useThemeStore.getState().theme);
      if (!useThemeStore.getState().hydrated) useThemeStore.getState().markHydrated();
    });
  }, [themeHydrated]);

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
      if (!useThemeStore.getState().hydrated) {
        applyTheme(useThemeStore.getState().theme || DEFAULT_THEME);
        useThemeStore.getState().markHydrated();
      }
    }, 1800);
    return () => {
      window.clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => installAudioUnlockListeners(), []);

  return (
    <>
      <CareAlarmHost />
      <GoogleSyncHost />
    </>
  );
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
