import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { layoutFor, playerRadius, toUnits, type PitchLayout } from '@/engine/geometry';
import type { SceneState } from '@/engine/interpolate';
import { drawScene } from '@/engine/renderer';
import { themeCoach, type BoardTheme } from '@/engine/theme';
import type { PlayerDef, Vec2 } from '@/engine/types';
import { cn } from '@/lib/cn';

export interface PitchPointer {
  units: Vec2;
  layout: PitchLayout;
  radius: number;
}

export interface PitchCanvasProps {
  players: readonly PlayerDef[];
  /** Cte se v kazdem snimku rAF - umoznuje animovat bez re-renderu Reactu. */
  getScene: () => SceneState;
  theme?: BoardTheme;
  editing?: boolean;
  selected?: string | null;
  className?: string;
  onPointerDownPitch?: (pointer: PitchPointer, event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMovePitch?: (pointer: PitchPointer, event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUpPitch?: (pointer: PitchPointer, event: ReactPointerEvent<HTMLCanvasElement>) => void;
}

export function PitchCanvas({
  players,
  getScene,
  theme = themeCoach,
  editing = false,
  selected = null,
  className,
  onPointerDownPitch,
  onPointerMovePitch,
  onPointerUpPitch,
}: PitchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layoutRef = useRef<PitchLayout>(layoutFor(600));
  const sceneRef = useRef(getScene);
  sceneRef.current = getScene;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    const resize = () => {
      const layout = layoutFor(parent.clientWidth || 600);
      layoutRef.current = layout;
      canvas.width = Math.round(layout.width * dpr);
      canvas.height = Math.round(layout.height * dpr);
      canvas.style.height = `${layout.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    let raf = 0;
    const loop = () => {
      drawScene(ctx, layoutRef.current, sceneRef.current(), players, { theme, editing, selected });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [players, theme, editing, selected]);

  const pointerFrom = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): PitchPointer => {
    const rect = event.currentTarget.getBoundingClientRect();
    const layout = layoutRef.current;
    return {
      units: toUnits(layout, event.clientX - rect.left, event.clientY - rect.top),
      layout,
      radius: playerRadius(layout),
    };
  }, []);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-edge bg-[#0b1a13] leading-none', className)}>
      <canvas
        ref={canvasRef}
        className="block w-full touch-none"
        onPointerDown={onPointerDownPitch ? (event) => onPointerDownPitch(pointerFrom(event), event) : undefined}
        onPointerMove={onPointerMovePitch ? (event) => onPointerMovePitch(pointerFrom(event), event) : undefined}
        onPointerUp={onPointerUpPitch ? (event) => onPointerUpPitch(pointerFrom(event), event) : undefined}
      />
    </div>
  );
}
