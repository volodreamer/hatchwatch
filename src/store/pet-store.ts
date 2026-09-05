import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActionType, AdultId, CharacterId, Pet } from "@/lib/tama/types";
import {
  applyAction,
  catchUp,
  createDemoPet,
  createPet,
  dismissOffShell,
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
    nickname?: string;
  }) => void;
  startDemo: () => void;
  log: (type: ActionType) => void;
  undo: () => void;
  tick: (now?: number) => void;
  sync: (patch: Parameters<typeof syncPet>[1], opts?: { restartStage?: boolean; attention?: boolean }) => void;
  dismissOffShell: (kind: "poop" | "sick" | "discipline") => void;
  setNotif: (on: boolean) => void;
  setSound: (on: boolean) => void;
  setTarget: (id: AdultId) => void;
  setNickname: (name: string) => void;
  reset: () => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pet: null,
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      startRun: (opts) => {
        const pet = createPet({ ...opts, now: Date.now() });
        set({ pet });
      },
      startDemo: () => set({ pet: createDemoPet() }),
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
          next.sleepWindowAt !== pet.sleepWindowAt;
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
      reset: () => set({ pet: null }),
    }),
    {
      name: "hatchwatch-v1",
      skipHydration: true,
      partialize: (s) => ({ pet: s.pet }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

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
