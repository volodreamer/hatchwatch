import { useEffect } from "react";
import { CareAlarmHost } from "@/components/CareAlarmHost";
import { installAudioUnlockListeners, registerCareWorker } from "@/lib/audio";
import { usePetStore } from "@/store/pet-store";

export function PersistGate() {
  useEffect(() => {
    void usePetStore.persist.rehydrate();
    registerCareWorker();
    return installAudioUnlockListeners();
  }, []);
  return <CareAlarmHost />;
}
