import { DEFAULT_BALL_SPEED, DEFAULT_DUR_MS, DEFAULT_HOLD_MS, type Frame, type PlayerDef } from '@/engine/types';
import { Field, Input, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface FrameInspectorProps {
  frame: Frame;
  players: readonly PlayerDef[];
  onChange: (patch: Partial<Omit<Frame, 'id' | 'positions'>>) => void;
  onToggleFocus: (playerId: string) => void;
}

export function FrameInspector({ frame, players, onChange, onToggleFocus }: FrameInspectorProps) {
  const focus = frame.focus ?? [];

  return (
    <div className="space-y-4">
      <Field label="Komentář k fázi" hint="Co se v tomto přechodu děje a proč.">
        <Textarea
          rows={4}
          value={frame.text}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Krajní obránce vystupuje, stoper zastupuje prostor za ním…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Přechod (ms)">
          <Input
            type="number"
            min={200}
            max={10000}
            step={100}
            value={frame.durMs ?? DEFAULT_DUR_MS}
            onChange={(event) => onChange({ durMs: Number(event.target.value) })}
          />
        </Field>
        <Field label="Pauza (ms)">
          <Input
            type="number"
            min={200}
            max={20000}
            step={100}
            value={frame.holdMs ?? DEFAULT_HOLD_MS}
            onChange={(event) => onChange({ holdMs: Number(event.target.value) })}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Oblouk míče" hint="0 = po zemi, 0.3 = centr">
          <Input
            type="number"
            min={0}
            max={1}
            step={0.02}
            value={frame.arc ?? 0}
            onChange={(event) => onChange({ arc: Number(event.target.value) || undefined })}
          />
        </Field>
        <Field label="Rychlost míče" hint="0.4 = ostrá přihrávka">
          <Input
            type="number"
            min={0.1}
            max={1}
            step={0.05}
            value={frame.ballSpeed ?? DEFAULT_BALL_SPEED}
            onChange={(event) => onChange({ ballSpeed: Number(event.target.value) })}
          />
        </Field>
      </div>

      <Field label="Text překryvu" hint="Např. GÓL nebo ZISK MÍČE. Prázdné = nic.">
        <Input
          value={frame.flash ?? ''}
          onChange={(event) => onChange({ flash: event.target.value || null })}
        />
      </Field>

      <Field label="Popisek zóny" hint="Zónu nakreslíš tažením v režimu Zóna.">
        <Input
          value={frame.zone?.label ?? ''}
          disabled={!frame.zone}
          onChange={(event) =>
            onChange({ zone: frame.zone ? { ...frame.zone, label: event.target.value } : null })
          }
          placeholder={frame.zone ? 'přečíslení 3 na 2' : 'nejdřív nakresli zónu'}
        />
      </Field>

      <div>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-muted uppercase">
          Zvýraznění hráči
        </p>
        <div className="flex flex-wrap gap-1.5">
          {players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onToggleFocus(player.id)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-bold transition',
                focus.includes(player.id)
                  ? 'border-amber bg-amber/20 text-amber-soft'
                  : 'border-edge bg-panel text-muted hover:text-chalk',
              )}
              title={player.role ?? player.id}
            >
              {player.label}
              <span className="ml-1 opacity-50">{player.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
