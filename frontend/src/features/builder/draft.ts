import { createFrame, createScenario } from '@/engine/factory';
import { resolveFrames } from '@/engine/interpolate';
import type { Frame, PlayerDef, Scenario, Tactic, Vec2, Zone } from '@/engine/types';
import { createId } from '@/lib/id';

export interface DraftState {
  tactic: Tactic;
  scenarioIndex: number;
  frameIndex: number;
  dirty: boolean;
}

export type DraftAction =
  | { type: 'setMeta'; patch: Partial<Pick<Tactic, 'title' | 'description' | 'folderId' | 'tags'>> }
  | { type: 'selectScenario'; index: number }
  | { type: 'addScenario' }
  | { type: 'duplicateScenario'; index: number }
  | { type: 'removeScenario'; index: number }
  | { type: 'updateScenario'; patch: Partial<Omit<Scenario, 'id' | 'frames'>> }
  | { type: 'selectFrame'; index: number }
  | { type: 'addFrame' }
  | { type: 'duplicateFrame'; index: number }
  | { type: 'removeFrame'; index: number }
  | { type: 'moveFrame'; from: number; to: number }
  | { type: 'updateFrame'; patch: Partial<Omit<Frame, 'id' | 'positions'>> }
  | { type: 'setPlayerPosition'; playerId: string; pos: Vec2 }
  | { type: 'resetPlayerPosition'; playerId: string }
  | { type: 'setBall'; ball: Frame['ball'] }
  | { type: 'toggleFocus'; playerId: string }
  | { type: 'setZone'; zone: Zone | null }
  | { type: 'addPlayer'; player: PlayerDef; pos: Vec2 }
  | { type: 'removePlayer'; playerId: string }
  | { type: 'updatePlayer'; playerId: string; patch: Partial<Omit<PlayerDef, 'id'>> }
  | { type: 'replaceTactic'; tactic: Tactic }
  | { type: 'markSaved'; tactic: Tactic };

export const createDraft = (tactic: Tactic): DraftState => ({
  tactic,
  scenarioIndex: 0,
  frameIndex: 0,
  dirty: false,
});

const clampIndex = (index: number, length: number) => Math.max(0, Math.min(index, length - 1));

export function currentScenario(state: DraftState): Scenario {
  return state.tactic.scenarios[clampIndex(state.scenarioIndex, state.tactic.scenarios.length)]!;
}

export function currentFrame(state: DraftState): Frame {
  const scenario = currentScenario(state);
  return scenario.frames[clampIndex(state.frameIndex, scenario.frames.length)]!;
}

/** Plne pozice aktualniho snimku (po slozeni delt) - to, co vidi editor. */
export function currentPositions(state: DraftState): Record<string, Vec2> {
  const scenario = currentScenario(state);
  const resolved = resolveFrames(scenario.frames);
  return resolved[clampIndex(state.frameIndex, resolved.length)]!.resolved;
}

function mapScenario(state: DraftState, fn: (scenario: Scenario) => Scenario): DraftState {
  const index = clampIndex(state.scenarioIndex, state.tactic.scenarios.length);
  const scenarios = state.tactic.scenarios.map((scenario, i) => (i === index ? fn(scenario) : scenario));
  return { ...state, tactic: { ...state.tactic, scenarios }, dirty: true };
}

function mapFrame(state: DraftState, fn: (frame: Frame) => Frame): DraftState {
  return mapScenario(state, (scenario) => {
    const index = clampIndex(state.frameIndex, scenario.frames.length);
    return { ...scenario, frames: scenario.frames.map((frame, i) => (i === index ? fn(frame) : frame)) };
  });
}

/** Cisty reducer editoru - veskera logika uprav je tady, aby sla testovat bez UI. */
export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'setMeta':
      return { ...state, tactic: { ...state.tactic, ...action.patch }, dirty: true };

    case 'selectScenario':
      return { ...state, scenarioIndex: clampIndex(action.index, state.tactic.scenarios.length), frameIndex: 0 };

    case 'addScenario': {
      const scenarios = [...state.tactic.scenarios, createScenario({ badge: `Situace ${state.tactic.scenarios.length + 1}` })];
      return { ...state, tactic: { ...state.tactic, scenarios }, scenarioIndex: scenarios.length - 1, frameIndex: 0, dirty: true };
    }

    case 'duplicateScenario': {
      const source = state.tactic.scenarios[action.index];
      if (!source) return state;
      const copy: Scenario = {
        ...source,
        id: createId('s'),
        name: `${source.name} (kopie)`,
        frames: source.frames.map((frame) => ({ ...frame, id: createId('f') })),
      };
      const scenarios = [...state.tactic.scenarios];
      scenarios.splice(action.index + 1, 0, copy);
      return { ...state, tactic: { ...state.tactic, scenarios }, scenarioIndex: action.index + 1, frameIndex: 0, dirty: true };
    }

    case 'removeScenario': {
      if (state.tactic.scenarios.length <= 1) return state;
      const scenarios = state.tactic.scenarios.filter((_, i) => i !== action.index);
      return {
        ...state,
        tactic: { ...state.tactic, scenarios },
        scenarioIndex: clampIndex(state.scenarioIndex, scenarios.length),
        frameIndex: 0,
        dirty: true,
      };
    }

    case 'updateScenario':
      return mapScenario(state, (scenario) => ({ ...scenario, ...action.patch }));

    case 'selectFrame':
      return { ...state, frameIndex: clampIndex(action.index, currentScenario(state).frames.length) };

    case 'addFrame': {
      const next = mapScenario(state, (scenario) => ({
        ...scenario,
        frames: [...scenario.frames, createFrame({ ball: currentFrame(state).ball })],
      }));
      return { ...next, frameIndex: currentScenario(next).frames.length - 1 };
    }

    case 'duplicateFrame': {
      const scenario = currentScenario(state);
      const source = scenario.frames[action.index];
      if (!source) return state;
      const next = mapScenario(state, (s) => {
        const frames = [...s.frames];
        frames.splice(action.index + 1, 0, { ...source, id: createId('f') });
        return { ...s, frames };
      });
      return { ...next, frameIndex: action.index + 1 };
    }

    case 'removeFrame': {
      const scenario = currentScenario(state);
      if (scenario.frames.length <= 1) return state;
      // Snimky drzi jen zmeny, takze pri mazani musime deltu slozit do naslednika.
      const resolved = resolveFrames(scenario.frames);
      const removed = scenario.frames[action.index];
      const successor = scenario.frames[action.index + 1];
      const next = mapScenario(state, (s) => {
        const frames = s.frames
          .map((frame, i) => {
            if (i !== action.index + 1 || !removed || !successor) return frame;
            return { ...frame, positions: { ...removed.positions, ...frame.positions } };
          })
          .filter((_, i) => i !== action.index);
        if (action.index === 0 && frames[0] && resolved[1]) {
          frames[0] = { ...frames[0], positions: resolved[1].resolved };
        }
        return { ...s, frames };
      });
      return { ...next, frameIndex: clampIndex(state.frameIndex, currentScenario(next).frames.length) };
    }

    case 'moveFrame': {
      const next = mapScenario(state, (scenario) => {
        const resolved = resolveFrames(scenario.frames);
        // Pri preskladani prevedeme snimky na plne pozice, jinak by se delty rozsypaly.
        const frames = resolved.map((frame) => ({ ...stripResolved(frame), positions: frame.resolved }));
        const [moved] = frames.splice(action.from, 1);
        if (moved) frames.splice(action.to, 0, moved);
        return { ...scenario, frames };
      });
      return { ...next, frameIndex: clampIndex(action.to, currentScenario(next).frames.length) };
    }

    case 'updateFrame':
      return mapFrame(state, (frame) => ({ ...frame, ...action.patch }));

    case 'setPlayerPosition':
      return mapFrame(state, (frame) => ({
        ...frame,
        positions: { ...frame.positions, [action.playerId]: action.pos },
      }));

    case 'resetPlayerPosition':
      return mapFrame(state, (frame) => {
        if (state.frameIndex === 0) return frame;
        const positions = { ...frame.positions };
        delete positions[action.playerId];
        return { ...frame, positions };
      });

    case 'setBall':
      return mapFrame(state, (frame) => ({ ...frame, ball: action.ball }));

    case 'toggleFocus':
      return mapFrame(state, (frame) => {
        const focus = frame.focus ?? [];
        return {
          ...frame,
          focus: focus.includes(action.playerId)
            ? focus.filter((id) => id !== action.playerId)
            : [...focus, action.playerId],
        };
      });

    case 'setZone':
      return mapFrame(state, (frame) => ({ ...frame, zone: action.zone }));

    case 'addPlayer': {
      const withPlayer = {
        ...state,
        tactic: { ...state.tactic, players: [...state.tactic.players, action.player] },
        dirty: true,
      };
      return mapScenario(withPlayer, (scenario) => ({
        ...scenario,
        frames: scenario.frames.map((frame, i) =>
          i === 0 ? { ...frame, positions: { ...frame.positions, [action.player.id]: action.pos } } : frame,
        ),
      }));
    }

    case 'removePlayer': {
      const players = state.tactic.players.filter((player) => player.id !== action.playerId);
      const scenarios = state.tactic.scenarios.map((scenario) => ({
        ...scenario,
        frames: scenario.frames.map((frame) => {
          const positions = { ...frame.positions };
          delete positions[action.playerId];
          return {
            ...frame,
            positions,
            focus: frame.focus?.filter((id) => id !== action.playerId),
            ball: frame.ball === action.playerId ? ([50, 50] as Vec2) : frame.ball,
          };
        }),
      }));
      return { ...state, tactic: { ...state.tactic, players, scenarios }, dirty: true };
    }

    case 'updatePlayer':
      return {
        ...state,
        tactic: {
          ...state.tactic,
          players: state.tactic.players.map((player) =>
            player.id === action.playerId ? { ...player, ...action.patch } : player,
          ),
        },
        dirty: true,
      };

    case 'replaceTactic':
      return { tactic: action.tactic, scenarioIndex: 0, frameIndex: 0, dirty: true };

    case 'markSaved':
      return { ...state, tactic: action.tactic, dirty: false };

    default:
      return state;
  }
}

function stripResolved(frame: Frame & { resolved?: unknown }): Frame {
  const { resolved: _resolved, ...rest } = frame;
  return rest;
}
