import { describe, expect, it } from 'vitest';
import { createFrame, createScenario, createTactic, defaultPositions } from '@/engine/factory';
import { resolveFrames } from '@/engine/interpolate';
import type { Tactic } from '@/engine/types';
import { createDraft, currentFrame, currentPositions, draftReducer, type DraftState } from './draft';

function draftWithFrames(): DraftState {
  const tactic: Tactic = createTactic({
    scenarios: [
      createScenario({
        frames: [
          createFrame({ text: '1', positions: defaultPositions(), ball: 'GK' }),
          createFrame({ text: '2', positions: { GK: [50, 80] }, ball: 'LCB' }),
          createFrame({ text: '3', positions: { LCB: [30, 60] }, ball: 'LCB' }),
        ],
      }),
    ],
  });
  return createDraft(tactic);
}

describe('draftReducer', () => {
  it('ulozi pozici hrace jen jako deltu aktualniho snimku', () => {
    let state = draftWithFrames();
    state = draftReducer(state, { type: 'selectFrame', index: 1 });
    state = draftReducer(state, { type: 'setPlayerPosition', playerId: 'RB', pos: [70, 50] });

    expect(currentFrame(state).positions).toEqual({ GK: [50, 80], RB: [70, 50] });
    expect(currentPositions(state).RB).toEqual([70, 50]);
    expect(state.dirty).toBe(true);
  });

  it('reset pozice vrati hrace na hodnotu z predchoziho snimku', () => {
    let state = draftWithFrames();
    state = draftReducer(state, { type: 'selectFrame', index: 1 });
    state = draftReducer(state, { type: 'setPlayerPosition', playerId: 'RB', pos: [70, 50] });
    state = draftReducer(state, { type: 'resetPlayerPosition', playerId: 'RB' });

    expect(currentFrame(state).positions).toEqual({ GK: [50, 80] });
    expect(currentPositions(state).RB).toEqual(defaultPositions().RB);
  });

  it('mazani snimku zachova vysledne pozice nasledujiciho snimku', () => {
    const before = draftWithFrames();
    const beforeLast = resolveFrames(before.tactic.scenarios[0]!.frames).at(-1)!.resolved;

    const after = draftReducer(before, { type: 'removeFrame', index: 1 });
    const afterLast = resolveFrames(after.tactic.scenarios[0]!.frames).at(-1)!.resolved;

    expect(after.tactic.scenarios[0]!.frames).toHaveLength(2);
    expect(afterLast).toEqual(beforeLast);
  });

  it('nesmaze posledni snimek', () => {
    let state = draftWithFrames();
    state = draftReducer(state, { type: 'removeFrame', index: 2 });
    state = draftReducer(state, { type: 'removeFrame', index: 1 });
    const same = draftReducer(state, { type: 'removeFrame', index: 0 });
    expect(same.tactic.scenarios[0]!.frames).toHaveLength(1);
  });

  it('preskladani snimku nerozhodi vyslednou scenu', () => {
    const before = draftWithFrames();
    const after = draftReducer(before, { type: 'moveFrame', from: 2, to: 0 });
    const frames = resolveFrames(after.tactic.scenarios[0]!.frames);
    expect(frames[0]!.text).toBe('3');
    expect(frames[0]!.resolved.LCB).toEqual([30, 60]);
  });

  it('smazany hrac zmizi ze vsech snimku i z ohniska', () => {
    let state = draftWithFrames();
    state = draftReducer(state, { type: 'toggleFocus', playerId: 'GK' });
    state = draftReducer(state, { type: 'removePlayer', playerId: 'GK' });

    const frames = state.tactic.scenarios[0]!.frames;
    expect(state.tactic.players.some((p) => p.id === 'GK')).toBe(false);
    expect(frames.every((frame) => !('GK' in frame.positions))).toBe(true);
    expect(frames[0]!.ball).toEqual([50, 50]);
  });

  it('nesmaze posledni scenar', () => {
    const state = draftReducer(draftWithFrames(), { type: 'removeScenario', index: 0 });
    expect(state.tactic.scenarios).toHaveLength(1);
  });

  it('markSaved shodi priznak neulozenych zmen', () => {
    let state = draftReducer(draftWithFrames(), { type: 'setMeta', patch: { title: 'Nový název' } });
    expect(state.dirty).toBe(true);
    state = draftReducer(state, { type: 'markSaved', tactic: state.tactic });
    expect(state.dirty).toBe(false);
  });
});
