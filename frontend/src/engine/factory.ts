import { createId } from '@/lib/id';
import type { Frame, PlayerDef, Scenario, Tactic, Vec2 } from './types';

/** Vychozi rozestaveni 1-4-4-2 - branime dole, utocime nahoru. */
export const FORMATION_442: Array<PlayerDef & { pos: Vec2 }> = [
  { id: 'GK', label: 'B', team: 'home', role: 'brankář', pos: [50, 90] },
  { id: 'LB', label: 'LO', team: 'home', role: 'levý obránce', pos: [24, 74] },
  { id: 'LCB', label: 'SO', team: 'home', role: 'stoper', pos: [41, 77] },
  { id: 'RCB', label: 'SO', team: 'home', role: 'stoper', pos: [59, 77] },
  { id: 'RB', label: 'PO', team: 'home', role: 'pravý obránce', pos: [76, 74] },
  { id: 'LM', label: 'LZ', team: 'home', role: 'levý záložník', pos: [26, 60] },
  { id: 'CM1', label: 'SZ', team: 'home', role: 'střední záložník', pos: [42, 63] },
  { id: 'CM2', label: 'SZ', team: 'home', role: 'střední záložník', pos: [58, 62] },
  { id: 'RM', label: 'PZ', team: 'home', role: 'pravý záložník', pos: [74, 60] },
  { id: 'ST1', label: 'Ú', team: 'home', role: 'útočník', pos: [42, 44] },
  { id: 'ST2', label: 'Ú', team: 'home', role: 'útočník', pos: [58, 44] },
  { id: 'oGK', label: 'B', team: 'away', pos: [50, 8] },
  { id: 'oLB', label: 'O', team: 'away', pos: [18, 34] },
  { id: 'oLCB', label: 'O', team: 'away', pos: [40, 24] },
  { id: 'oRCB', label: 'O', team: 'away', pos: [60, 24] },
  { id: 'oRB', label: 'O', team: 'away', pos: [82, 34] },
  { id: 'oCM1', label: 'Z', team: 'away', pos: [42, 42] },
  { id: 'oCM2', label: 'Z', team: 'away', pos: [58, 42] },
  { id: 'oLM', label: 'Z', team: 'away', pos: [22, 54] },
  { id: 'oRM', label: 'Z', team: 'away', pos: [78, 54] },
  { id: 'oAM', label: 'Z', team: 'away', pos: [50, 52] },
  { id: 'oST', label: 'Ú', team: 'away', pos: [50, 66] },
];

export function defaultPlayers(): PlayerDef[] {
  return FORMATION_442.map(({ pos: _pos, ...def }) => ({ ...def }));
}

export function defaultPositions(): Record<string, Vec2> {
  return Object.fromEntries(FORMATION_442.map((p) => [p.id, p.pos]));
}

export function createFrame(partial: Partial<Frame> = {}): Frame {
  return {
    id: createId('f'),
    text: '',
    positions: {},
    ball: 'GK',
    ...partial,
  };
}

export function createScenario(partial: Partial<Scenario> = {}): Scenario {
  return {
    id: createId('s'),
    name: 'Nová situace',
    badge: '',
    keyPoints: [],
    frames: [
      createFrame({
        text: 'Výchozí postavení.',
        positions: defaultPositions(),
        ball: 'GK',
        holdMs: 2600,
      }),
    ],
    ...partial,
  };
}

export function createTactic(partial: Partial<Tactic> = {}): Tactic {
  const now = new Date().toISOString();
  return {
    id: createId('t'),
    title: 'Nová taktika',
    description: '',
    folderId: null,
    players: defaultPlayers(),
    scenarios: [createScenario()],
    tags: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...partial,
  };
}
