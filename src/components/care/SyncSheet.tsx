import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHARACTERS, STAGE_ORDER } from "@/lib/tama/characters";
import type { CharacterId, Pet } from "@/lib/tama/types";
import { usePetStore } from "@/store/pet-store";
import { toast } from "sonner";

const BACKUP_KEY = "hatchwatch-v1";

export function SyncSheet({ pet, onClose }: { pet: Pet; onClose: () => void }) {
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
      toast(`${CHARACTERS[form].name} timer starts now. Care and discipline mistakes carry over.`);
    } else {
      toast("Matched to the shell");
    }
    onClose();
  }

  async function copyBackup() {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) {
      toast("Nothing saved yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(raw);
      toast("Run copied. Paste it into a note.");
    } catch {
      window.prompt("Copy this backup", raw);
    }
  }

  function restoreBackup() {
    const text = window.prompt("Paste a Hatchwatch backup");
    if (!text) return;
    try {
      const parsed = JSON.parse(text) as { state?: { pet?: Pet }; pet?: Pet };
      const next = parsed.state?.pet ?? parsed.pet ?? (parsed as unknown as Pet);
      if (!next || typeof next.hatchAt !== "number" || !next.form) {
        throw new Error("bad backup");
      }
      usePetStore.setState({ pet: next });
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ state: { pet: next }, version: 0 }));
      toast("Run restored");
      onClose();
    } catch {
      toast("That backup could not be read");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl">Match the device</h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          Copy the status screens from the shell. Changing a heart count restarts that meter from now
          (tap Meal/Game right after the shell). Leaving the numbers alone keeps the countdown.
        </p>
      </div>
      <Field label="Form">
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
        <Num label="Hunger hearts" value={hunger} min={0} max={4} onChange={setHunger} />
        <Num label="Happy hearts" value={happy} min={0} max={4} onChange={setHappy} />
        <Num label="Discipline %" value={discipline} min={0} max={100} step={25} onChange={setDiscipline} />
        <Num label="Weight" value={weight} min={5} max={99} onChange={setWeight} />
        <Num label="Care mistakes" value={care} min={0} max={20} onChange={setCare} />
        <Num label="Disc. mistakes" value={disc} min={0} max={20} onChange={setDisc} />
        <Num label="Poop on screen" value={poop} min={0} max={4} onChange={setPoop} />
        <Num label="Age" value={age} min={0} max={20} onChange={setAge} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sick} onChange={(e) => setSick(e.target.checked)} className="size-4" />
        Skull icon is showing
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={attention} onChange={(e) => setAttention(e.target.checked)} className="size-4" />
        Attention light is on (not empty hearts)
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={restartStage || form !== pet.form}
          onChange={(e) => setRestartStage(e.target.checked)}
          className="mt-0.5 size-4"
        />
        <span>
          Shell just evolved — restart this stage's timer from now
          <span className="mt-0.5 block text-muted">
            Tick this if you matched Tamatchi by hand. Leaves mistake counts as they are.
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save}>
          Save match
        </Button>
      </div>
      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Backup</p>
        <p className="mt-1 text-sm text-pretty text-muted">
          The run lives on this phone. Copy a backup before clearing browser data.
        </p>
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => void copyBackup()}>
            Copy backup
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={restoreBackup}>
            Restore
          </Button>
        </div>
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
