import { Toaster } from "sonner";
import { isLightTheme } from "@/lib/theme";
import { useThemeStore } from "@/store/theme-store";

export function AppToaster() {
  const theme = useThemeStore((s) => s.theme);
  const light = isLightTheme(theme);
  return (
    <Toaster
      theme={light ? "light" : "dark"}
      position="bottom-center"
      duration={4500}
      visibleToasts={2}
      offset={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      mobileOffset={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          color: "var(--color-fg)",
          border: "1px solid var(--color-border)",
          zIndex: 80,
        },
      }}
    />
  );
}
