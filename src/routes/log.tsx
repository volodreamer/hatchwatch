import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PetBoot } from "@/components/PersistGate";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { useI18n } from "@/hooks/use-i18n";
import { formatClock, formatDateTime } from "@/lib/utils";
import { usePetStore } from "@/store/pet-store";

export const Route = createFileRoute("/log")({ component: LogPage });

function LogPage() {
  const { t } = useI18n();
  const pet = usePetStore((s) => s.pet);

  return (
    <PetBoot
      empty={
        <main className="relative z-10 mx-auto min-h-dvh w-full max-w-lg bg-bg text-fg">
          <SetupWizard />
        </main>
      }
    >
      <AppShell>
        <div className="px-4 pb-6 pt-5">
          <header className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{t("log.kicker")}</p>
            <h1 className="font-display text-3xl">{t("log.title")}</h1>
            {pet ? (
              <p className="mt-1 text-sm text-muted">
                {t("log.meta", {
                  when: formatDateTime(pet.hatchAt),
                  care: pet.careMistakes,
                  disc: pet.discMistakes,
                })}
              </p>
            ) : null}
          </header>
          {!pet || pet.events.length === 0 ? (
            <p className="text-sm text-muted">{t("log.empty")}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {pet.events.map((e) => (
                <li key={e.id} className="rounded-lg bg-surface px-3 py-2.5 shadow-border">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{t(`log.${e.type}`)}</p>
                    <p className="font-pixel text-xs text-muted">{formatClock(e.at)}</p>
                  </div>
                  {e.note ? <p className="mt-0.5 text-sm text-pretty text-muted">{e.note}</p> : null}
                  <p className="mt-0.5 text-xs text-faint">{formatDateTime(e.at)}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </AppShell>
    </PetBoot>
  );
}
