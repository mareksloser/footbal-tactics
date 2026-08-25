import {
  BALL_FOOT_OFFSET,
  DEFAULT_BALL_SPEED,
  type Frame,
  type PlayerDef,
  type TeamSide,
  type Vec2,
  type Zone,
} from './types';
import { distance } from './geometry';

export interface ResolvedFrame extends Frame {
  /** Plne pozice vsech hracu po aplikaci delty na predchozi snimek. */
  resolved: Record<string, Vec2>;
}

/** Slozi z delta-snimku plne stavy. Cista funkce - jadro celeho enginu. */
export function resolveFrames(frames: readonly Frame[]): ResolvedFrame[] {
  let previous: Record<string, Vec2> = {};
  return frames.map((frame) => {
    previous = { ...previous, ...frame.positions };
    return { ...frame, resolved: { ...previous } };
  });
}

export interface Arrow {
  from: Vec2;
  to: Vec2;
  team: TeamSide;
  alpha: number;
}

export interface SceneState {
  positions: Record<string, Vec2>;
  ball: { pos: Vec2; scale: number; from: Vec2 | null };
  arrows: Arrow[];
  zone: Zone | null;
  zoneAlpha: number;
  focus: string[];
  flash: { text: string; alpha: number } | null;
}

export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
export const easeOut = (x: number) => 1 - (1 - x) ** 2.2;

export function ballPosition(target: Frame['ball'], positions: Record<string, Vec2>): Vec2 {
  if (Array.isArray(target)) return [target[0], target[1]] as Vec2;
  const holder = positions[target as string];
  return holder ? [holder[0], holder[1] - BALL_FOOT_OFFSET] : [50, 50];
}

/** Minimalni posun hrace (v jednotkach), aby se kreslila sipka pohybu. */
const ARROW_THRESHOLD = 3.5;

/**
 * Vypocte kompletni stav sceny mezi snimkem `index` a `index + 1`.
 * `progress` 0..1; pri poslednim snimku nebo progress = 1 vraci staticky stav.
 */
export function sceneAt(
  frames: readonly ResolvedFrame[],
  players: readonly PlayerDef[],
  index: number,
  progress: number,
): SceneState {
  if (frames.length === 0) {
    return {
      positions: {},
      ball: { pos: [50, 50], scale: 1, from: null },
      arrows: [],
      zone: null,
      zoneAlpha: 0,
      focus: [],
      flash: null,
    };
  }

  const safeIndex = Math.min(Math.max(index, 0), frames.length - 1);
  const from = frames[safeIndex]!;
  const hasNext = safeIndex + 1 < frames.length;
  const to = hasNext ? frames[safeIndex + 1]! : from;
  const moving = hasNext && progress > 0 && progress < 1;
  const p = Math.min(Math.max(progress, 0), 1);
  const target = hasNext && p > 0 ? to : from;

  const eased = easeInOut(p);
  const positions: Record<string, Vec2> = {};
  const ids = new Set([...Object.keys(from.resolved), ...Object.keys(to.resolved)]);
  for (const id of ids) {
    const a = from.resolved[id] ?? to.resolved[id]!;
    const b = to.resolved[id] ?? from.resolved[id]!;
    positions[id] = [a[0] + (b[0] - a[0]) * eased, a[1] + (b[1] - a[1]) * eased];
  }

  const arrows: Arrow[] = [];
  if (moving) {
    for (const id of ids) {
      const a = from.resolved[id];
      const b = to.resolved[id];
      if (!a || !b || distance(a, b) < ARROW_THRESHOLD) continue;
      const team = players.find((pl) => pl.id === id)?.team ?? 'away';
      arrows.push({ from: a, to: b, team, alpha: 1 - p * 0.65 });
    }
  }

  const ballFrom = ballPosition(from.ball, from.resolved);
  const ballTo = ballPosition(target.ball, positions);
  const speed = target.ballSpeed ?? DEFAULT_BALL_SPEED;
  const bp = hasNext && p > 0 ? Math.min(1, p / speed) : 1;
  const eb = easeOut(bp);
  let bx = ballFrom[0] + (ballTo[0] - ballFrom[0]) * eb;
  let by = ballFrom[1] + (ballTo[1] - ballFrom[1]) * eb;
  let scale = 1;

  const arc = moving ? (target.arc ?? 0) : 0;
  if (arc > 0) {
    const dx = ballTo[0] - ballFrom[0];
    const dy = ballTo[1] - ballFrom[1];
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.sin(Math.PI * bp) * arc * len;
    bx += (-dy / len) * off * 0.55;
    by += (dx / len) * off * 0.25;
    scale = 1 + Math.sin(Math.PI * bp) * arc * 2.4;
  }

  const flashText = target.flash;
  return {
    positions,
    ball: { pos: [bx, by], scale, from: moving && bp < 1 ? ballFrom : null },
    arrows,
    zone: target.zone ?? null,
    zoneAlpha: moving ? Math.min(1, p * 2) : 1,
    focus: target.focus ?? [],
    flash: flashText
      ? { text: flashText, alpha: moving ? Math.min(1, Math.max(0, (p - 0.35) / 0.35)) : 1 }
      : null,
  };
}
