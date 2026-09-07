import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
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
  key: string;
  icon: typeof Utensils;
}[] = [
  { type: "meal", key: "act.meal", icon: Utensils },
  { type: "snack", key: "act.snack", icon: Cookie },
  { type: "game", key: "act.game", icon: Gamepad2 },
  { type: "clean", key: "act.clean", icon: Droplets },
  { type: "scold", key: "act.scold", icon: Bell },
  { type: "medicine", key: "act.medicine", icon: Syringe },
  { type: "lights-off", key: "act.lights", icon: Moon },
  { type: "miss-care", key: "act.miss", icon: X },
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
  const { t } = useI18n();
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
              a.type === "miss-care" ? "text-danger" : "action-key",
            )}
          >
            <Icon className="size-5" strokeWidth={1.7} />
            <span className="text-xs font-medium">{t(a.key)}</span>
          </Button>
        );
      })}
    </div>
  );
}
