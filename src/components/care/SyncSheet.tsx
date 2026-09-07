import { useState, type ReactNode } from "react";
import { BackupPanel } from "@/components/care/BackupPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/use-i18n";
import { CHARACTERS, STAGE_ORDER } from "@/lib/tama/characters";
import type { CharacterId, Pet } from "@/lib/tama/types";
import { usePetStore } from "@/store/pet-store";
import { toast } from "sonner";

export function SyncSheet({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const { t } = useI18n();
  const sync = usePetStore((s) => s.sync);
  const [hunger, setHunger] = useState(pet.hunger);
  const [happy, setHappy] = useState(pet.happy);
  const [discipline, setDiscipline] = useState(pet.discipline);
  const [weight, setWeight] = useState(pet.weight);
  const [care, setCare] = useState(pet.careMistakes);
  const [disc, setDisc] = useState(pet.discMistakes);
  const [poop, setPoop] = useState(pet.poop);
  const [age, setAge] = useState(pet.age);
  const [form, setForm] = useState<CharacterId>(pet.form);
  const [sick, setSick] = useState(pet.sick);
  const [attention, setAttention] = useState(pet.misbehaveAt != null);
  const [restartStage, setRestartStage] = useState(form !== pet.form);

  function save() {
    const formChanged = form !== pet.form;
    sync(
      {
        hunger,
        happy,
        discipline,
        weight,
        careMistakes: care,
        discMistakes: disc,
        poop,
        age,
        form,
        sick,
      },
      { restartStage: formChanged || restartStage, attention },
    );
    if (formChanged || restartStage) {
      toast(t("sync.restart", { name: CHARACTERS[form].name }));
    } else {
      toast(t("sync.ok"));
    }
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl">{t("sync.title")}</h2>
        <p className="mt-1 text-sm text-pretty text-muted">{t("sync.lead")}</p>
      </div>
      <Field label={t("sync.form")}>
        <select
          className="h-11 w-full rounded-md bg-surface-2 px-3 text-fg shadow-border"
          value={form}
          onChange={(e) => {
            const next = e.target.value as CharacterId;
            setForm(next);
            setRestartStage(next !== pet.form);
          }}
        >
          {STAGE_ORDER.filter((id) => id !== "egg").map((id) => (
            <option key={id} value={id}>
              {CHARACTERS[id].name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Num label={t("sync.hunger")} value={hunger} min={0} max={4} onChange={setHunger} />
        <Num label={t("sync.happy")} value={happy} min={0} max={4} onChange={setHappy} />
        <Num label={t("sync.disc")} value={discipline} min={0} max={100} step={25} onChange={setDiscipline} />
        <Num label={t("sync.weight")} value={weight} min={5} max={99} onChange={setWeight} />
        <Num label={t("sync.care")} value={care} min={0} max={20} onChange={setCare} />
        <Num label={t("sync.dmiss")} value={disc} min={0} max={20} onChange={setDisc} />
        <Num label={t("sync.poop")} value={poop} min={0} max={4} onChange={setPoop} />
        <Num label={t("sync.age")} value={age} min={0} max={20} onChange={setAge} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sick} onChange={(e) => setSick(e.target.checked)} className="size-4" />
        {t("sync.skull")}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={attention} onChange={(e) => setAttention(e.target.checked)} className="size-4" />
        {t("sync.attn")}
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={restartStage || form !== pet.form}
          onChange={(e) => setRestartStage(e.target.checked)}
          className="mt-0.5 size-4"
        />
        <span>
          {t("sync.evo")}
          <span className="mt-0.5 block text-muted">{t("sync.evo.d")}</span>
        </span>
      </label>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          {t("sync.cancel")}
        </Button>
        <Button className="flex-1" onClick={save}>
          {t("sync.save")}
        </Button>
      </div>
      <div className="border-t border-border pt-3">
        <BackupPanel onRestored={onClose} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Num({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  return (
    <Field label={label}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        enterKeyHint="done"
        value={draft}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
          setDraft(digits);
          if (digits === "") return;
          const n = Number(digits);
          if (n >= min && n <= max) onChange(n);
        }}
        onBlur={() => {
          if (draft === "") {
            setDraft(String(value));
            return;
          }
          const n = Math.min(max, Math.max(min, Number(draft)));
          setDraft(String(n));
          onChange(n);
        }}
      />
    </Field>
  );
}
