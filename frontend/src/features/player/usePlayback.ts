import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveFrames, sceneAt, type SceneState } from '@/engine/interpolate';
import {
  advance,
  displayIndex,
  initialCursor,
  progressOf,
  seek,
  stepBack,
  stepForward,
  type Cursor,
} from '@/engine/playback';
import type { Frame, PlayerDef } from '@/engine/types';

export interface PlaybackApi {
  /** Index snimku, jehoz text se ma zobrazit. */
  index: number;
  playing: boolean;
  speed: number;
  frameCount: number;
  getScene: () => SceneState;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * Rizeni prehravani mimo React state - rAF meni ref, takze se komponenta
 * prekresluje jen pri zmene faze, ne 60x za sekundu.
 */
export function usePlayback(
  frames: readonly Frame[],
  players: readonly PlayerDef[],
  options: { autoPlay?: boolean } = {},
): PlaybackApi {
  const resolved = useMemo(() => resolveFrames(frames), [frames]);
  const cursorRef = useRef<Cursor>(initialCursor(options.autoPlay ?? false));
  const speedRef = useRef(1);
  const [speed, setSpeedState] = useState(1);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(options.autoPlay ?? false);

  const sync = useCallback(() => {
    const cursor = cursorRef.current;
    setIndex((prev) => {
      const next = displayIndex(cursor, frames);
      return prev === next ? prev : next;
    });
    setPlaying((prev) => (prev === cursor.playing ? prev : cursor.playing));
  }, [frames]);

  useEffect(() => {
    cursorRef.current = initialCursor(options.autoPlay ?? false);
    sync();
  }, [frames, options.autoPlay, sync]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (timestamp: number) => {
      if (!last) last = timestamp;
      const dt = Math.min(64, timestamp - last);
      last = timestamp;
      if (cursorRef.current.playing) {
        cursorRef.current = advance(cursorRef.current, dt, frames, speedRef.current);
        sync();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [frames, sync]);

  const getScene = useCallback(
    () => sceneAt(resolved, players, cursorRef.current.index, progressOf(cursorRef.current, frames)),
    [resolved, players, frames],
  );

  const update = useCallback(
    (next: Cursor) => {
      cursorRef.current = next;
      sync();
    },
    [sync],
  );

  return {
    index,
    playing,
    speed,
    frameCount: frames.length,
    getScene,
    toggle: () => {
      const cursor = cursorRef.current;
      const atEnd = !cursor.playing && cursor.index === frames.length - 1 && cursor.mode === 'hold';
      update(atEnd ? { ...initialCursor(true) } : { ...cursor, playing: !cursor.playing });
    },
    play: () => update({ ...cursorRef.current, playing: true }),
    pause: () => update({ ...cursorRef.current, playing: false }),
    restart: () => update(initialCursor(true)),
    next: () => update(stepForward(cursorRef.current, frames)),
    prev: () => update(stepBack(cursorRef.current, frames)),
    goTo: (target: number) => update(seek(target)),
    setSpeed: (value: number) => {
      speedRef.current = value;
      setSpeedState(value);
    },
  };
}
