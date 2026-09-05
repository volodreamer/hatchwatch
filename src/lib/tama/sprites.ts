import type { CharacterId } from "./types";
import { asset } from "@/lib/asset";

/** Two-frame LCD sprites (32×32, transparent). */
export const SPRITE_FRAMES: Record<CharacterId, [string, string]> = {
  egg: [asset("sprites/egg-1.png"), asset("sprites/egg-2.png")],
  babytchi: [asset("sprites/babytchi-1.png"), asset("sprites/babytchi-2.png")],
  marutchi: [asset("sprites/marutchi-1.png"), asset("sprites/marutchi-2.png")],
  tamatchi: [asset("sprites/tamatchi-1.png"), asset("sprites/tamatchi-2.png")],
  kuchitamatchi: [asset("sprites/kuchitamatchi-1.png"), asset("sprites/kuchitamatchi-2.png")],
  mametchi: [asset("sprites/mametchi-1.png"), asset("sprites/mametchi-2.png")],
  ginjirotchi: [asset("sprites/ginjirotchi-1.png"), asset("sprites/ginjirotchi-2.png")],
  maskutchi: [asset("sprites/maskutchi-1.png"), asset("sprites/maskutchi-2.png")],
  kuchipatchi: [asset("sprites/kuchipatchi-1.png"), asset("sprites/kuchipatchi-2.png")],
  nyorotchi: [asset("sprites/nyorotchi-1.png"), asset("sprites/nyorotchi-2.png")],
  tarakotchi: [asset("sprites/tarakotchi-1.png"), asset("sprites/tarakotchi-2.png")],
  oyajitchi: [asset("sprites/oyajitchi-1.png"), asset("sprites/oyajitchi-2.png")],
  bill: [asset("sprites/bill-1.png"), asset("sprites/bill-2.png")],
};

export const POOP_FRAMES = [asset("sprites/poop-icon-1.png"), asset("sprites/poop-icon-2.png")] as const;
export const SICK_FRAMES = [asset("sprites/sick-icon.png")] as const;
export const SLEEP_FRAMES = [asset("sprites/sleep-icon-1.png"), asset("sprites/sleep-icon-2.png")] as const;
