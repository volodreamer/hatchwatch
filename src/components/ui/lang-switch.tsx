import { useI18n } from "@/hooks/use-i18n";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t: tr } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      {compact ? null : (
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{tr("lang.label")}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(["en", "uk"] as Locale[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setLocale(id)}
            className={
              locale === id
                ? "flex min-h-11 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-fg shadow-border"
                : "flex min-h-11 items-center justify-center rounded-md bg-surface-2 px-3 text-sm font-medium text-fg shadow-border"
            }
          >
            {tr(id === "en" ? "lang.en" : "lang.uk")}
          </button>
        ))}
      </div>
      {compact ? null : <p className="text-xs text-muted">{tr("lang.hint")}</p>}
    </div>
  );
}
