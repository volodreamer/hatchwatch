import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { detectLocale, type Locale } from "@/lib/i18n";

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  markHydrated: () => void;
}

function applyDocLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

let localePersistReady = false;

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      hydrated: false,
      setLocale: (locale) => {
        localePersistReady = true;
        applyDocLang(locale);
        set({ locale });
      },
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "hatchwatch-locale",
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (!localePersistReady) return;
          try {
            localStorage.setItem(name, value);
          } catch {
            /* ignore */
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            /* ignore */
          }
        },
      })),
      partialize: (s) => ({ locale: s.locale }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) localePersistReady = true;
        if (state?.locale) applyDocLang(state.locale);
        useLocaleStore.getState().markHydrated();
      },
    },
  ),
);

/** After persist rehydrate: if the user never picked, use the phone language. */
export function applyDetectedLocaleIfUnset() {
  if (typeof localStorage === "undefined") return;
  try {
    if (!localStorage.getItem("hatchwatch-locale")) {
      useLocaleStore.getState().setLocale(detectLocale());
    } else {
      applyDocLang(useLocaleStore.getState().locale);
    }
  } catch {
    useLocaleStore.getState().setLocale(detectLocale());
  }
}
