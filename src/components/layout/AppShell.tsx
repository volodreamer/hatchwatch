import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Clock, Home, ListTree } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", key: "nav.home", icon: Home },
  { to: "/plan", key: "nav.plan", icon: ListTree },
  { to: "/log", key: "nav.log", icon: Clock },
  { to: "/guide", key: "nav.guide", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
      <div className="flex-1 pb-24">{children}</div>
      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg -translate-x-1/2 border-t border-border bg-bg/95 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs font-medium tracking-wide",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
