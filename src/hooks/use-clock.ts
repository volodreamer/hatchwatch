import { useEffect, useState } from "react";
import { usePetStore } from "@/store/pet-store";

export function useClock(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());
  const tick = usePetStore((s) => s.tick);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      tick(t);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval, tick]);

  return now;
}
