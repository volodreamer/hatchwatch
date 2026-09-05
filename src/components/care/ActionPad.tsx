import { Button } from "@/components/ui/button";
import type { ActionType } from "@/lib/tama/types";
import { cn } from "@/lib/utils";
import {
  Bell,
  Cookie,
  Droplets,
  Gamepad2,
  Moon,
  Syringe,
  Utensils,
  X,
} from "lucide-react";

const ACTIONS: {
  type: ActionType;
  label: string;
  hint: string;
  icon: typeof Utensils;
}[] = [
  { type: "meal", label: "Meal", hint: "Food", icon: Utensils },
  { type: "snack", label: "Snack", hint: "Food", icon: Cookie },
  { type: "game", label: "Game", hint: "3 of 5", icon: Gamepad2 },
  { type: "clean", label: "Clean", hint: "Duck", icon: Droplets },
  { type: "scold", label: "Scold", hint: "Disc", icon: Bell },
  { type: "medicine", label: "Heal", hint: "Shot", icon: Syringe },
  { type: "lights-off", label: "Lights off", hint: "Off", icon: Moon },
  { type: "miss-care", label: "Missed", hint: "Log", icon: X },
];

export function ActionPad({
  onLog,
  disabled,
  attention,
  lightsHot,
}: {
  onLog: (type: ActionType) => void;
  disabled?: boolean;
  attention?: boolean;
  lightsHot?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const hot = (a.type === "scold" && attention) || (a.type === "lights-off" && lightsHot);
        return (
          <Button
            key={a.type}
            type="button"
            variant={hot ? "default" : "secondary"}
            disabled={disabled}
            onClick={() => onLog(a.type)}
            className={cn(
              "h-auto min-h-16 flex-col gap-1 rounded-lg py-2.5",
              !hot && "text-fg",
              a.type === "miss-care" && "text-danger",
            )}
          >
            <Icon className="size-5" strokeWidth={1.7} />
            <span className="text-xs font-medium">{a.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
