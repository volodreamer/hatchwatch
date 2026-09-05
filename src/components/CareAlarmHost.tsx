import { useClock } from "@/hooks/use-clock";
import { useReminders } from "@/hooks/use-reminders";
import { usePetStore } from "@/store/pet-store";

/** Lives at the document root so care chirps still fire on Plan, Log, Guide, and Watch. */
export function CareAlarmHost() {
  const pet = usePetStore((s) => s.pet);
  const now = useClock(1000);
  useReminders(pet, now, { notif: pet?.notifOn ?? false, sound: pet?.soundOn ?? true });
  return null;
}
