import { DEFAULT_DUR_MS, DEFAULT_HOLD_MS, type Frame } from './types';

export type PlaybackMode = 'hold' | 'move';

export interface Cursor {
  /** Index snimku, ze ktereho se vychazi. */
  index: number;
  mode: PlaybackMode;
  /** Uplynuly cas v aktualnim useku (ms). */
  t: number;
  playing: boolean;
}

export const initialCursor = (playing = false): Cursor => ({ index: 0, mode: 'hold', t: 0, playing });

export const durationOf = (frames: readonly Frame[], index: number) =>
  frames[index]?.durMs ?? DEFAULT_DUR_MS;

export const holdOf = (frames: readonly Frame[], index: number) =>
  frames[index]?.holdMs ?? DEFAULT_HOLD_MS;

/** Index snimku, jehoz text a body se maji zobrazit. */
export function displayIndex(cursor: Cursor, frames: readonly Frame[]): number {
  const last = Math.max(0, frames.length - 1);
  if (cursor.mode === 'move') return Math.min(cursor.index + 1, last);
  return Math.min(cursor.index, last);
}

/** Postup prechodu 0..1; behem drzeni snimku vraci 0. */
export function progressOf(cursor: Cursor, frames: readonly Frame[]): number {
  if (cursor.mode !== 'move') return 0;
  const dur = durationOf(frames, cursor.index + 1);
  return Math.min(1, Math.max(0, cursor.t / dur));
}

/**
 * Posune prehravani o `dtMs`. Cista funkce, takze se da otestovat bez rAF:
 * hold -> move -> dalsi snimek -> ... a na konci se prehravani zastavi.
 */
export function advance(
  cursor: Cursor,
  dtMs: number,
  frames: readonly Frame[],
  speed = 1,
): Cursor {
  if (!cursor.playing || frames.length === 0) return cursor;

  let { index, mode, t } = cursor;
  let remaining = dtMs * speed;
  let guard = 0;

  while (remaining > 0 && guard++ < 100) {
    if (mode === 'hold') {
      const hold = holdOf(frames, index);
      if (t + remaining < hold) {
        t += remaining;
        remaining = 0;
      } else if (index + 1 < frames.length) {
        remaining -= hold - t;
        mode = 'move';
        t = 0;
      } else {
        return { index, mode: 'hold', t: hold, playing: false };
      }
    } else {
      const dur = durationOf(frames, index + 1);
      if (t + remaining < dur) {
        t += remaining;
        remaining = 0;
      } else {
        remaining -= dur - t;
        index += 1;
        mode = 'hold';
        t = 0;
      }
    }
  }

  return { index, mode, t, playing: true };
}

/** Skok na konkretni snimek (klik na casovou osu). */
export const seek = (index: number, playing = false): Cursor => ({ index, mode: 'hold', t: 0, playing });

export function stepForward(cursor: Cursor, frames: readonly Frame[]): Cursor {
  return seek(Math.min(displayIndex(cursor, frames) + 1, frames.length - 1));
}

export function stepBack(cursor: Cursor, frames: readonly Frame[]): Cursor {
  if (cursor.mode === 'move') return seek(cursor.index);
  return seek(Math.max(0, Math.min(cursor.index, frames.length - 1) - 1));
}
