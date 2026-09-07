import { useI18n } from "@/hooks/use-i18n";
import { CLASSIC_THEMES, MODERN_THEMES, TEST_THEMES, type ThemeId } from "@/lib/theme";
import { useThemeStore } from "@/store/theme-store";

export function ShellThemePicker() {
  const { t } = useI18n();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="shell-theme" className="text-xs font-medium uppercase tracking-widest text-muted">
        {t("theme.title")}
      </label>
      <select
        id="shell-theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        className="min-h-11 w-full appearance-auto rounded-md bg-surface-2 px-3 font-sans text-sm text-fg shadow-border"
      >
        <optgroup label={t("theme.classic")}>
          {CLASSIC_THEMES.map((id) => (
            <option key={id} value={id}>
              {t(`theme.${id}`)}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("theme.modern")}>
          {MODERN_THEMES.map((id) => (
            <option key={id} value={id}>
              {t(`theme.${id}`)}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("theme.test")}>
          {TEST_THEMES.map((id) => (
            <option key={id} value={id}>
              {t(`theme.${id}`)}
            </option>
          ))}
        </optgroup>
      </select>
      <p className="text-sm text-pretty text-muted">{t("theme.lead")}</p>
    </div>
  );
}