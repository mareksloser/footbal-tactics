import { useReducer, useState } from 'react';
import { Alert, Badge, Button, Dialog, Field, Input, Panel, Textarea } from '@/components/ui';
import { safeParseTactic } from '@/engine/schema';
import type { Folder, Tactic } from '@/engine/types';
import { cn } from '@/lib/cn';
import { ShareDialog } from '@/features/share/ShareDialog';
import { createDraft, currentFrame, currentScenario, draftReducer } from './draft';
import { EditablePitch, type EditMode } from './EditablePitch';
import { FrameInspector } from './FrameInspector';
import { RosterEditor } from './RosterEditor';

export interface TacticEditorProps {
  initial: Tactic;
  folders: readonly Folder[];
  saving: boolean;
  error?: string | null;
  onSave: (tactic: Tactic) => Promise<Tactic | void>;
  onDelete?: () => void;
}

const modes: Array<{ id: EditMode; label: string; hint: string }> = [
  { id: 'move', label: 'Posun', hint: 'Táhni hráčem po hřišti' },
  { id: 'ball', label: 'Míč', hint: 'Klikni na hráče nebo na volné místo' },
  { id: 'zone', label: 'Zóna', hint: 'Nakresli obdélník tažením' },
];

export function TacticEditor({ initial, folders, saving, error, onSave, onDelete }: TacticEditorProps) {
  const [state, dispatch] = useReducer(draftReducer, initial, createDraft);
  const [mode, setMode] = useState<EditMode>('move');
  const [selected, setSelected] = useState<string | null>(null);
  const [showRoster, setShowRoster] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const scenario = currentScenario(state);
  const frame = currentFrame(state);

  const save = async () => {
    const saved = await onSave(state.tactic);
    if (saved) dispatch({ type: 'markSaved', tactic: saved });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {scenario.frames.length > 0 ? <Badge>{`Fáze ${state.frameIndex + 1}/${scenario.frames.length}`}</Badge> : null}
          {modes.map((item) => (
            <Button
              key={item.id}
              variant={mode === item.id ? 'primary' : 'ghost'}
              onClick={() => setMode(item.id)}
              title={item.hint}
            >
              {item.label}
            </Button>
          ))}
          {frame.zone ? (
            <Button variant="danger" onClick={() => dispatch({ type: 'setZone', zone: null })}>
              Smazat zónu
            </Button>
          ) : null}
        </div>

        <EditablePitch
          scenario={scenario}
          players={state.tactic.players}
          frameIndex={state.frameIndex}
          mode={mode}
          selected={selected}
          onSelectPlayer={setSelected}
          onMovePlayer={(playerId, pos) => dispatch({ type: 'setPlayerPosition', playerId, pos })}
          onSetBall={(ball) => dispatch({ type: 'setBall', ball })}
          onSetZone={(zone) => dispatch({ type: 'setZone', zone })}
        />

        <p className="mt-2 text-xs text-muted">
          {modes.find((item) => item.id === mode)?.hint}. Snímek si pamatuje jen změny oproti předchozímu — vrátit
          hráče zpět můžeš tlačítkem níže.
        </p>

        {selected && state.frameIndex > 0 ? (
          <Button
            className="mt-2"
            onClick={() => dispatch({ type: 'resetPlayerPosition', playerId: selected })}
          >
            Vrátit {selected} na pozici z předchozí fáze
          </Button>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {scenario.frames.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => dispatch({ type: 'selectFrame', index })}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-bold transition',
                index === state.frameIndex
                  ? 'border-transparent bg-linear-[114deg,var(--color-amber),var(--color-deep)] text-[#1a1204]'
                  : 'border-edge bg-panel text-muted hover:text-chalk',
              )}
            >
              {index + 1}
            </button>
          ))}
          <Button onClick={() => dispatch({ type: 'addFrame' })}>+ fáze</Button>
          <Button onClick={() => dispatch({ type: 'duplicateFrame', index: state.frameIndex })}>Duplikovat</Button>
          <Button
            onClick={() => dispatch({ type: 'moveFrame', from: state.frameIndex, to: Math.max(0, state.frameIndex - 1) })}
            disabled={state.frameIndex === 0}
          >
            ↑
          </Button>
          <Button
            onClick={() =>
              dispatch({
                type: 'moveFrame',
                from: state.frameIndex,
                to: Math.min(scenario.frames.length - 1, state.frameIndex + 1),
              })
            }
            disabled={state.frameIndex === scenario.frames.length - 1}
          >
            ↓
          </Button>
          <Button
            variant="danger"
            onClick={() => dispatch({ type: 'removeFrame', index: state.frameIndex })}
            disabled={scenario.frames.length <= 1}
          >
            Smazat fázi
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Panel className="space-y-3">
          <Field label="Název taktiky">
            <Input
              value={state.tactic.title}
              onChange={(event) => dispatch({ type: 'setMeta', patch: { title: event.target.value } })}
            />
          </Field>
          <Field label="Složka">
            <select
              value={state.tactic.folderId ?? ''}
              onChange={(event) =>
                dispatch({ type: 'setMeta', patch: { folderId: event.target.value || null } })
              }
              className="w-full rounded-lg border border-edge bg-panel px-3 py-2 text-sm"
            >
              <option value="">Kořen knihovny</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Popis">
            <Textarea
              rows={2}
              value={state.tactic.description ?? ''}
              onChange={(event) => dispatch({ type: 'setMeta', patch: { description: event.target.value } })}
            />
          </Field>

          {error ? <Alert>{error}</Alert> : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Ukládám…' : state.dirty ? 'Uložit změny' : 'Uloženo'}
            </Button>
            <Button onClick={() => setShowShare(true)}>Sdílet</Button>
            <Button onClick={() => setShowRoster(true)}>Soupiska</Button>
            <Button onClick={() => setShowImport(true)}>Import / export</Button>
            {onDelete ? (
              <Button variant="danger" onClick={onDelete}>
                Smazat
              </Button>
            ) : null}
          </div>
          {state.dirty ? <p className="text-xs text-amber-soft">Máš neuložené změny.</p> : null}
        </Panel>

        <Panel className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {state.tactic.scenarios.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: 'selectScenario', index })}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-bold transition',
                  index === state.scenarioIndex
                    ? 'border-transparent bg-linear-[114deg,var(--color-amber),var(--color-deep)] text-[#1a1204]'
                    : 'border-edge bg-panel text-muted hover:text-chalk',
                )}
              >
                {item.name}
              </button>
            ))}
            <Button onClick={() => dispatch({ type: 'addScenario' })}>+ situace</Button>
          </div>

          <Field label="Název situace">
            <Input
              value={scenario.name}
              onChange={(event) => dispatch({ type: 'updateScenario', patch: { name: event.target.value } })}
            />
          </Field>
          <Field label="Popisek nad názvem">
            <Input
              value={scenario.badge ?? ''}
              placeholder="Situace 1"
              onChange={(event) => dispatch({ type: 'updateScenario', patch: { badge: event.target.value } })}
            />
          </Field>
          <Field label="Trenérské body" hint="Jeden bod na řádek.">
            <Textarea
              rows={5}
              value={scenario.keyPoints.join('\n')}
              onChange={(event) =>
                dispatch({
                  type: 'updateScenario',
                  patch: { keyPoints: event.target.value.split('\n').filter((line) => line.trim().length > 0) },
                })
              }
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => dispatch({ type: 'duplicateScenario', index: state.scenarioIndex })}>
              Duplikovat situaci
            </Button>
            <Button
              variant="danger"
              disabled={state.tactic.scenarios.length <= 1}
              onClick={() => dispatch({ type: 'removeScenario', index: state.scenarioIndex })}
            >
              Smazat situaci
            </Button>
          </div>
        </Panel>

        <Panel>
          <FrameInspector
            frame={frame}
            players={state.tactic.players}
            onChange={(patch) => dispatch({ type: 'updateFrame', patch })}
            onToggleFocus={(playerId) => dispatch({ type: 'toggleFocus', playerId })}
          />
        </Panel>
      </div>

      <Dialog open={showRoster} title="Soupiska" onClose={() => setShowRoster(false)}>
        <RosterEditor
          players={state.tactic.players}
          onAdd={(player) => dispatch({ type: 'addPlayer', player, pos: [50, 50] })}
          onUpdate={(playerId, patch) => dispatch({ type: 'updatePlayer', playerId, patch })}
          onRemove={(playerId) => dispatch({ type: 'removePlayer', playerId })}
        />
      </Dialog>

      <ShareDialog open={showShare} tactic={state.tactic} onClose={() => setShowShare(false)} />

      <Dialog open={showImport} title="Import / export JSON" onClose={() => setShowImport(false)}>
        <div className="space-y-3">
          <Textarea
            rows={10}
            value={importText || JSON.stringify(state.tactic, null, 2)}
            onChange={(event) => setImportText(event.target.value)}
            className="font-mono text-xs"
          />
          {importError ? <Alert>{importError}</Alert> : null}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                try {
                  const parsed = safeParseTactic(JSON.parse(importText));
                  if (!parsed.success) {
                    setImportError('JSON neodpovídá formátu taktiky.');
                    return;
                  }
                  dispatch({ type: 'replaceTactic', tactic: { ...parsed.data, id: state.tactic.id } as Tactic });
                  setImportError(null);
                  setShowImport(false);
                } catch {
                  setImportError('Nepodařilo se přečíst JSON.');
                }
              }}
            >
              Nahradit obsah
            </Button>
            <Button
              onClick={() => {
                void navigator.clipboard?.writeText(JSON.stringify(state.tactic, null, 2));
              }}
            >
              Kopírovat export
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
