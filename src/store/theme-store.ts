import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applyTheme, DEFAULT_THEME, normalizeTheme, type ThemeId } from "@/lib/theme";

interface ThemeState {
  theme: ThemeId;
  hydrated: boolean;
  setTheme: (theme: ThemeId) => void;
  markHydrated: () => void;
}

let themePersistReady = false;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      hydrated: false,
      setTheme: (theme) => {
        themePersistReady = true;
        const next = normalizeTheme(theme);
        applyTheme(next);
        set({ theme: next });
      },
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "hatchwatch-theme",
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
          if (!themePersistReady) return;
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
      partialize: (s) => ({ theme: s.theme }),
      merge: (persisted, current) => {
        const rec = persisted as { theme?: unknown } | undefined;
        return { ...current, theme: normalizeTheme(rec?.theme ?? current.theme) };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) themePersistReady = true;
        applyTheme(state?.theme ?? DEFAULT_THEME);
        useThemeStore.getState().markHydrated();
      },
    },
  ),
);
