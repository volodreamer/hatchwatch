import { useI18n } from "@/hooks/use-i18n";
import { TAMA_VERSIONS } from "@/lib/tama/versions";
import type { Firmware } from "@/lib/tama/types";

export function VersionSelect({
  value,
  onChange,
}: {
  value: Firmware;
  onChange: (firmware: Firmware) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="tama-version" className="text-xs font-medium uppercase tracking-widest text-muted">
        {t("ver.title")}
      </label>
      <select
        id="tama-version"
        value={value}
        onChange={(e) => onChange(e.target.value as Firmware)}
        className="min-h-11 w-full appearance-auto rounded-md bg-surface-2 px-3 font-sans text-sm text-fg shadow-border"
      >
        {TAMA_VERSIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {t(opt.label)}
          </option>
        ))}
      </select>
      <p className="text-sm text-pretty text-muted">{t("ver.d")}</p>
    </div>
  );
}
