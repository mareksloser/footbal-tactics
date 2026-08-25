import { useMemo, useRef, useState } from 'react';
import { resolveFrames, sceneAt } from '@/engine/interpolate';
import { themes, type ThemeName } from '@/engine/theme';
import type { Frame, PlayerDef, Scenario, Vec2, Zone } from '@/engine/types';
import { PitchCanvas, type PitchPointer } from '@/features/player/PitchCanvas';

export type EditMode = 'move' | 'ball' | 'zone';

export interface EditablePitchProps {
  scenario: Scenario;
  players: readonly PlayerDef[];
  frameIndex: number;
  mode: EditMode;
  theme?: ThemeName;
  onMovePlayer: (playerId: string, pos: Vec2) => void;
  onSetBall: (ball: Frame['ball']) => void;
  onSetZone: (zone: Zone | null) => void;
  onSelectPlayer: (playerId: string | null) => void;
  selected: string | null;
}

/** Kolikanasobek polomeru kolecka jeste pocitame jako zasah prstem. */
const HIT_FACTOR = 1.7;

export function EditablePitch({
  scenario,
  players,
  frameIndex,
  mode,
  theme = 'coach',
  onMovePlayer,
  onSetBall,
  onSetZone,
  onSelectPlayer,
  selected,
}: EditablePitchProps) {
  const resolved = useMemo(() => resolveFrames(scenario.frames), [scenario.frames]);
  const [dragging, setDragging] = useState<string | null>(null);
  const zoneStart = useRef<Vec2 | null>(null);

  const scene = sceneAt(resolved, players, frameIndex, 0);
  const getScene = () => sceneAt(resolveFrames(scenario.frames), players, frameIndex, 0);

  const hitTest = (pointer: PitchPointer): string | null => {
    const radiusUnits = (pointer.radius / (pointer.layout.width - 2 * pointer.layout.margin)) * 100 * HIT_FACTOR;
    let best: { id: string; distance: number } | null = null;
    for (const [id, pos] of Object.entries(scene.positions)) {
      const distance = Math.hypot(pos[0] - pointer.units[0], pos[1] - pointer.units[1]);
      if (distance <= radiusUnits && (!best || distance < best.distance)) best = { id, distance };
    }
    return best?.id ?? null;
  };

  return (
    <PitchCanvas
      players={players}
      getScene={getScene}
      theme={themes[theme]}
      editing
      selected={dragging ?? selected}
      onPointerDownPitch={(pointer, event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const hit = hitTest(pointer);

        if (mode === 'ball') {
          onSetBall(hit ?? pointer.units);
          return;
        }
        if (mode === 'zone') {
          zoneStart.current = pointer.units;
          return;
        }
        onSelectPlayer(hit);
        if (hit) setDragging(hit);
      }}
      onPointerMovePitch={(pointer) => {
        if (mode === 'move' && dragging) onMovePlayer(dragging, pointer.units);
        if (mode === 'zone' && zoneStart.current) {
          onSetZone(zoneFromDrag(zoneStart.current, pointer.units, scene.zone?.label));
        }
      }}
      onPointerUpPitch={(pointer) => {
        if (mode === 'zone' && zoneStart.current) {
          const zone = zoneFromDrag(zoneStart.current, pointer.units, scene.zone?.label);
          onSetZone(zone.w < 3 || zone.h < 3 ? null : zone);
          zoneStart.current = null;
        }
        setDragging(null);
      }}
    />
  );
}

function zoneFromDrag(start: Vec2, end: Vec2, label?: string): Zone {
  return {
    x: Math.round(Math.min(start[0], end[0])),
    y: Math.round(Math.min(start[1], end[1])),
    w: Math.round(Math.abs(end[0] - start[0])),
    h: Math.round(Math.abs(end[1] - start[1])),
    ...(label ? { label } : {}),
  };
}
