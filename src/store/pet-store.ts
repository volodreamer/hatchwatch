import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ActionType, AdultId, CharacterId, Firmware, Pet } from "@/lib/tama/types";
import {
  applyAction,
  catchUp,
  confirmOnShell,
  createDemoPet,
  createPet,
  dismissOffShell,
  normalizePet,
  syncPet,
  undoLastCare,
} from "@/lib/tama/simulate";

interface PetState {
  pet: Pet | null;
  hydrated: boolean;
  markHydrated: () => void;
  startRun: (opts: {
    hatchAt: number;
    clockSetAt?: number;
    targetId: AdultId;
    region: "en" | "jp";
    firmware?: Firmware;
    nickname?: string;
  }) => void;
  startDemo: () => void;
  log: (type: ActionType) => void;
  undo: () => void;
  tick: (now?: number) => void;
  sync: (patch: Parameters<typeof syncPet>[1], opts?: { restartStage?: boolean; attention?: boolean }) => void;
  dismissOffShell: (kind: "poop" | "sick" | "discipline") => void;
  confirmOnShell: (kind: "poop" | "sick" | "discipline") => void;
  setNotif: (on: boolean) => void;
  setSound: (on: boolean) => void;
  setFirmware: (firmware: Firmware) => void;
  setTarget: (id: AdultId) => void;
  setNickname: (name: string) => void;
  reset: () => void;
}

/** Block persist writes until rehydrate finishes so a null boot cannot wipe a live run. */
let petPersistReady = false;

function petStorage() {
  return {
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      if (!petPersistReady) return;
      try {
        localStorage.setItem(name, value);
      } catch {
        /* quota */
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

function petFromUnknown(raw: unknown): Pet | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as { pet?: unknown; hatchAt?: unknown };
  const candidate = rec.pet && typeof rec.pet === "object" ? rec.pet : rec.hatchAt != null ? rec : null;
  if (!candidate || typeof candidate !== "object") return null;
  const pet = candidate as Pet;
  if (typeof pet.hatchAt !== "number" || !pet.form) return null;
  try {
    return normalizePet(pet);
  } catch {
    return null;
  }
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pet: null,
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      startRun: (opts) => {
        petPersistReady = true;
        const pet = createPet({ ...opts, now: Date.now() });
        set({ pet, hydrated: true });
      },
      startDemo: () => {
        petPersistReady = true;
        set({ pet: createDemoPet(), hydrated: true });
      },
      log: (type) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: applyAction(pet, type, Date.now()) });
      },
      undo: () => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: undoLastCare(pet) });
      },
      tick: (now = Date.now()) => {
        const pet = get().pet;
        if (!pet) return;
        const next = catchUp(pet, now);
        const changed =
          next.form !== pet.form ||
          next.hunger !== pet.hunger ||
          next.happy !== pet.happy ||
          next.careMistakes !== pet.careMistakes ||
          next.discMistakes !== pet.discMistakes ||
          next.poop !== pet.poop ||
          next.sleeping !== pet.sleeping ||
          next.sick !== pet.sick ||
          next.age !== pet.age ||
          next.events.length !== pet.events.length ||
          next.hungerWindowAt !== pet.hungerWindowAt ||
          next.happyWindowAt !== pet.happyWindowAt ||
          next.misbehaveAt !== pet.misbehaveAt ||
          next.sleepWindowAt !== pet.sleepWindowAt ||
          next.checkPoopAt !== pet.checkPoopAt ||
          next.checkSickAt !== pet.checkSickAt ||
          next.checkDiscAt !== pet.checkDiscAt;
        if (changed) set({ pet: { ...next, lastTickAt: now } });
      },
      sync: (patch, opts) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: syncPet(pet, patch, Date.now(), opts) });
      },
      dismissOffShell: (kind) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: dismissOffShell(pet, kind) });
      },
      confirmOnShell: (kind) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: confirmOnShell(pet, kind) });
      },
      setNotif: (on) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: { ...pet, notifOn: on } });
      },
      setSound: (on) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: { ...pet, soundOn: on } });
      },
      setFirmware: (firmware) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: { ...pet, firmware } });
      },
      setTarget: (id) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: { ...pet, targetId: id } });
      },
      setNickname: (name) => {
        const pet = get().pet;
        if (!pet) return;
        set({ pet: { ...pet, nickname: name } });
      },
      reset: () => {
        petPersistReady = true;
        set({ pet: null });
      },
    }),
    {
      name: "hatchwatch-v1",
      skipHydration: true,
      storage: createJSONStorage(petStorage),
      partialize: (s) => ({ pet: s.pet }),
      merge: (persisted, current) => {
        const pet = petFromUnknown(persisted) ?? current.pet;
        return { ...current, pet };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (!error) petPersistReady = true;
        const pet = usePetStore.getState().pet;
        if (pet) {
          try {
            usePetStore.setState({ pet: normalizePet(pet) });
          } catch {
            /* keep as-is */
          }
          petPersistReady = true;
        }
        usePetStore.getState().markHydrated();
      },
    },
  ),
);

export function loadPet(pet: Pet) {
  petPersistReady = true;
  usePetStore.setState({ pet: normalizePet(pet), hydrated: true });
}

export function peekSavedPet(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem("hatchwatch-v1");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { pet?: { hatchAt?: number } } };
    return typeof parsed?.state?.pet?.hatchAt === "number";
  } catch {
    return false;
  }
}

/** Re-read hatchwatch-v1 from localStorage after a failed/racy hydrate. */
export function recoverPetFromStorage(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem("hatchwatch-v1");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    const pet = petFromUnknown(
      parsed && typeof parsed === "object" && "state" in parsed
        ? (parsed as { state: unknown }).state
        : parsed,
    );
    if (!pet) return false;
    petPersistReady = true;
    usePetStore.setState({ pet, hydrated: true });
    return true;
  } catch {
    return false;
  }
}

export function usePet(): Pet | null {
  return usePetStore((s) => s.pet);
}

export type SyncPatch = Partial<
  Pick<
    Pet,
    | "hunger"
    | "happy"
    | "discipline"
    | "weight"
    | "careMistakes"
    | "discMistakes"
    | "poop"
    | "sick"
    | "form"
    | "age"
    | "sleeping"
  >
>;

export type { CharacterId };

if (import.meta.hot) {
  import.meta.hot.accept();
}
