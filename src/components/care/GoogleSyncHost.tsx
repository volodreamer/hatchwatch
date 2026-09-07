import { useEffect } from "react";
import { bootGoogleSync } from "@/lib/google-sync";
import { usePetStore } from "@/store/pet-store";

/** Keeps Drive in step after Google sign-in. Mounted at the document root. */
export function GoogleSyncHost() {
  const hydrated = usePetStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    return bootGoogleSync();
  }, [hydrated]);
  return null;
}
