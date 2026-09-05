import { useEffect, useState } from "react";
import { POOP_FRAMES, SICK_FRAMES, SLEEP_FRAMES, SPRITE_FRAMES } from "@/lib/tama/sprites";
import type { CharacterId } from "@/lib/tama/types";
import { cn } from "@/lib/utils";

const FRAME_MS = 500;

export function MaskSprite({
  frames,
  className,
  animate = true,
  offset = 0,
  contain = false,
}: {
  frames: readonly string[];
  className?: string;
  animate?: boolean;
  offset?: number;
  contain?: boolean;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!animate || frames.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const t = window.setInterval(() => setFrame((n) => 1 - n), FRAME_MS);
    return () => window.clearInterval(t);
  }, [animate, frames]);
  const active = (frame + offset) % frames.length;
  const size = contain ? "contain" : "100% 100%";
  const pos = contain ? "bottom center" : "center";
  return (
    <span className={cn("relative block h-full w-full", className)} aria-hidden>
      {frames.map((src, i) => (
        <span
          key={`${src}-${i}`}
          className="absolute inset-0 bg-current"
          style={{
            opacity: i === active ? 1 : 0,
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: size,
            maskSize: size,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: pos,
            maskPosition: pos,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </span>
  );
}

export function PixelSprite({
  id,
  className,
  sleeping = false,
  sick = false,
}: {
  id: CharacterId;
  className?: string;
  sleeping?: boolean;
  sick?: boolean;
}) {
  return (
    <span className={cn("relative block h-full w-full", sleeping && "opacity-90", className)}>
      <MaskSprite frames={SPRITE_FRAMES[id] ?? SPRITE_FRAMES.babytchi} animate={!sleeping} />
      {sick ? (
        <span className="pointer-events-none absolute left-0 top-0 size-4">
          <MaskSprite frames={SICK_FRAMES} animate={false} contain />
        </span>
      ) : null}
      {sleeping ? (
        <span className="pointer-events-none absolute right-0 top-0 size-5">
          <MaskSprite frames={SLEEP_FRAMES} contain />
        </span>
      ) : null}
    </span>
  );
}

export function PoopPixels({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex items-end" aria-label={`${count} poop`}>
      {Array.from({ length: Math.min(4, count) }).map((_, i) => (
        <MaskSprite
          key={i}
          frames={POOP_FRAMES}
          offset={i % 2}
          contain
          className="h-4 w-4"
        />
      ))}
    </div>
  );
}
