import { describe, expect, it } from 'vitest';
import { ballPosition, resolveFrames, sceneAt } from '../interpolate';
import type { Frame, PlayerDef } from '../types';
import { BALL_FOOT_OFFSET } from '../types';

const players: PlayerDef[] = [
  { id: 'A', label: 'A', team: 'home' },
  { id: 'B', label: 'B', team: 'away' },
];

const frames: Frame[] = [
  { id: 'f1', text: 'start', positions: { A: [10, 10], B: [50, 50] }, ball: 'A' },
  { id: 'f2', text: 'posun', positions: { A: [30, 10] }, ball: 'B' },
  { id: 'f3', text: 'centr', positions: { B: [60, 50] }, ball: [80, 20], arc: 0.3 },
];

describe('resolveFrames', () => {
  it('doplni pozice z predchoziho snimku', () => {
    const resolved = resolveFrames(frames);
    expect(resolved[1]!.resolved).toEqual({ A: [30, 10], B: [50, 50] });
    expect(resolved[2]!.resolved).toEqual({ A: [30, 10], B: [60, 50] });
  });

  it('nemeni vstupni snimky', () => {
    resolveFrames(frames);
    expect(frames[1]!.positions).toEqual({ A: [30, 10] });
  });
});

describe('ballPosition', () => {
  it('polozi mic k noze hrace', () => {
    expect(ballPosition('A', { A: [10, 20] })).toEqual([10, 20 - BALL_FOOT_OFFSET]);
  });

  it('respektuje pevny bod', () => {
    expect(ballPosition([5, 6], {})).toEqual([5, 6]);
  });
});

describe('sceneAt', () => {
  const resolved = resolveFrames(frames);

  it('vraci staticky stav na zacatku', () => {
    const scene = sceneAt(resolved, players, 0, 0);
    expect(scene.positions.A).toEqual([10, 10]);
    expect(scene.arrows).toHaveLength(0);
  });

  it('interpoluje pozice uprostred prechodu', () => {
    const scene = sceneAt(resolved, players, 0, 0.5);
    expect(scene.positions.A![0]).toBeGreaterThan(10);
    expect(scene.positions.A![0]).toBeLessThan(30);
  });

  it('kresli sipku jen u hrace, ktery se opravdu hnul', () => {
    const scene = sceneAt(resolved, players, 0, 0.4);
    expect(scene.arrows).toHaveLength(1);
    expect(scene.arrows[0]!.team).toBe('home');
  });

  it('na konci prechodu sedi cilove pozice', () => {
    const scene = sceneAt(resolved, players, 0, 1);
    expect(scene.positions.A).toEqual([30, 10]);
  });

  it('u obloucku zvetsi mic v polovine letu', () => {
    const scene = sceneAt(resolved, players, 1, 0.35);
    expect(scene.ball.scale).toBeGreaterThan(1);
  });

  it('nespadne na prazdnem seznamu snimku', () => {
    expect(sceneAt([], players, 0, 0).positions).toEqual({});
  });
});
