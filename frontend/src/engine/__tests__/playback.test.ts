import { describe, expect, it } from 'vitest';
import {
  advance,
  displayIndex,
  initialCursor,
  progressOf,
  seek,
  stepBack,
  stepForward,
} from '../playback';
import type { Frame } from '../types';

const frames: Frame[] = [
  { id: 'f1', text: '1', positions: {}, ball: 'A', holdMs: 1000, durMs: 1000 },
  { id: 'f2', text: '2', positions: {}, ball: 'A', holdMs: 1000, durMs: 1000 },
  { id: 'f3', text: '3', positions: {}, ball: 'A', holdMs: 1000, durMs: 1000 },
];

describe('advance', () => {
  it('nic nedela, kdyz je pauza', () => {
    const cursor = initialCursor(false);
    expect(advance(cursor, 500, frames)).toBe(cursor);
  });

  it('po vyprseni hold prejde do pohybu', () => {
    const cursor = advance(initialCursor(true), 1200, frames);
    expect(cursor.mode).toBe('move');
    expect(cursor.index).toBe(0);
    expect(cursor.t).toBeCloseTo(200);
  });

  it('po prechodu je na dalsim snimku', () => {
    const cursor = advance(initialCursor(true), 2100, frames);
    expect(cursor.index).toBe(1);
    expect(cursor.mode).toBe('hold');
  });

  it('respektuje rychlost prehravani', () => {
    const normal = advance(initialCursor(true), 600, frames);
    const fast = advance(initialCursor(true), 600, frames, 2);
    expect(normal.mode).toBe('hold');
    expect(fast.mode).toBe('move');
    expect(fast.t).toBeCloseTo(200);
  });

  it('na konci se zastavi', () => {
    const cursor = advance(initialCursor(true), 60_000, frames);
    expect(cursor.playing).toBe(false);
    expect(cursor.index).toBe(frames.length - 1);
  });

  it('zvlada velky krok pres vice snimku', () => {
    const cursor = advance(initialCursor(true), 4000, frames);
    expect(cursor.index).toBe(2);
  });
});

describe('displayIndex a progressOf', () => {
  it('behem prechodu ukazuje cilovy snimek', () => {
    const cursor = { index: 0, mode: 'move' as const, t: 500, playing: true };
    expect(displayIndex(cursor, frames)).toBe(1);
    expect(progressOf(cursor, frames)).toBeCloseTo(0.5);
  });

  it('pri drzeni je progress nula', () => {
    expect(progressOf(seek(1), frames)).toBe(0);
  });
});

describe('krokovani', () => {
  it('dopredu skoci na dalsi snimek', () => {
    expect(stepForward(seek(0), frames).index).toBe(1);
  });

  it('dopredu nepreteče za posledni snimek', () => {
    expect(stepForward(seek(2), frames).index).toBe(2);
  });

  it('zpet behem prechodu vrati na vychozi snimek', () => {
    const cursor = { index: 1, mode: 'move' as const, t: 400, playing: true };
    expect(stepBack(cursor, frames)).toEqual(seek(1));
  });

  it('zpet z drzeni jde o snimek zpatky a nepodtece', () => {
    expect(stepBack(seek(1), frames).index).toBe(0);
    expect(stepBack(seek(0), frames).index).toBe(0);
  });
});
