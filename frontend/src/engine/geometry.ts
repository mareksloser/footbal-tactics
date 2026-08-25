import type { Vec2 } from './types';

export interface PitchLayout {
  /** Sirka platna v CSS pixelech. */
  width: number;
  /** Vyska platna v CSS pixelech. */
  height: number;
  /** Okraj kolem hriste v pixelech. */
  margin: number;
}

/** Pomer skutecneho hriste 68 x 105 m - pouziva se pro vypocet vysky platna. */
export const PITCH_RATIO = 105 / 68;

export function layoutFor(width: number): PitchLayout {
  return {
    width,
    height: Math.round(width * 1.5),
    margin: Math.max(8, width * 0.022),
  };
}

export function playerRadius(layout: PitchLayout): number {
  return Math.max(9, Math.min(15, layout.width * 0.031));
}

export const toPx = (l: PitchLayout, x: number) => l.margin + (x / 100) * (l.width - 2 * l.margin);
export const toPy = (l: PitchLayout, y: number) => l.margin + (y / 100) * (l.height - 2 * l.margin);
export const scaleX = (l: PitchLayout, v: number) => (v / 100) * (l.width - 2 * l.margin);
export const scaleY = (l: PitchLayout, v: number) => (v / 100) * (l.height - 2 * l.margin);

/** Opacny prevod - z pozice na platne zpet na souradnice hriste (pro drag v editoru). */
export function toUnits(l: PitchLayout, px: number, py: number): Vec2 {
  const x = ((px - l.margin) / (l.width - 2 * l.margin)) * 100;
  const y = ((py - l.margin) / (l.height - 2 * l.margin)) * 100;
  return [clamp(round1(x), -4, 104), clamp(round1(y), -4, 104)];
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const round1 = (v: number) => Math.round(v * 10) / 10;

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}
