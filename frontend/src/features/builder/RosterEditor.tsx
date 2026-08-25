import { useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import type { PlayerDef, TeamSide } from '@/engine/types';

export interface RosterEditorProps {
  players: readonly PlayerDef[];
  onAdd: (player: PlayerDef) => void;
  onUpdate: (playerId: string, patch: Partial<Omit<PlayerDef, 'id'>>) => void;
  onRemove: (playerId: string) => void;
}

export function RosterEditor({ players, onAdd, onUpdate, onRemove }: RosterEditorProps) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [team, setTeam] = useState<TeamSide>('home');

  const idTaken = players.some((player) => player.id === id.trim());
  const canAdd = id.trim().length > 0 && label.trim().length > 0 && !idTaken;

  return (
    <div className="space-y-4">
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-xs text-muted" title={player.id}>
              {player.id}
            </span>
            <Input
              value={player.label}
              maxLength={4}
              onChange={(event) => onUpdate(player.id, { label: event.target.value })}
              className="w-20"
              aria-label={`Zkratka hráče ${player.id}`}
            />
            <Input
              value={player.role ?? ''}
              placeholder="role"
              onChange={(event) => onUpdate(player.id, { role: event.target.value })}
            />
            <Button
              variant="danger"
              className="px-2 py-1"
              onClick={() => onRemove(player.id)}
              aria-label={`Odebrat hráče ${player.id}`}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-t border-edge pt-4">
        <Field label="ID">
          <Input value={id} onChange={(event) => setId(event.target.value)} placeholder="oST2" />
        </Field>
        <Field label="Zkratka">
          <Input value={label} maxLength={4} onChange={(event) => setLabel(event.target.value)} placeholder="Ú" />
        </Field>
        <div className="flex gap-2">
          <Button
            variant={team === 'home' ? 'primary' : 'ghost'}
            onClick={() => setTeam('home')}
            type="button"
          >
            My
          </Button>
          <Button
            variant={team === 'away' ? 'primary' : 'ghost'}
            onClick={() => setTeam('away')}
            type="button"
          >
            Soupeř
          </Button>
        </div>
      </div>

      <Button
        variant="primary"
        disabled={!canAdd}
        onClick={() => {
          onAdd({ id: id.trim(), label: label.trim(), team });
          setId('');
          setLabel('');
        }}
      >
        Přidat hráče do středu hřiště
      </Button>
      {idTaken ? <p className="text-xs text-[#ffb4b4]">Toto ID už je použité.</p> : null}
    </div>
  );
}
