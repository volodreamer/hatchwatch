import { useCallback } from "react";
import { t } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const translate = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale],
  );
  return { locale, setLocale, t: translate };
}
