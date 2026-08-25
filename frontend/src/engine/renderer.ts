import {
  type PitchLayout,
  playerRadius,
  scaleX,
  scaleY,
  toPx,
  toPy,
} from './geometry';
import type { SceneState } from './interpolate';
import type { BoardTheme } from './theme';
import { themeCoach } from './theme';
import type { PlayerDef, Vec2, Zone } from './types';

export interface RenderOptions {
  theme?: BoardTheme;
  /** Zvyrazneny hrac v editoru (drag / vyber). */
  selected?: string | null;
  /** V editoru se sipky a flash nekresli. */
  editing?: boolean;
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  layout: PitchLayout,
  scene: SceneState,
  players: readonly PlayerDef[],
  options: RenderOptions = {},
): void {
  const theme = options.theme ?? themeCoach;
  const r = playerRadius(layout);
  drawPitch(ctx, layout, theme);

  if (scene.zone) drawZone(ctx, layout, scene.zone, scene.zoneAlpha, theme, r);

  if (!options.editing) {
    for (const arrow of scene.arrows) {
      drawArrow(
        ctx,
        layout,
        arrow.from,
        arrow.to,
        arrow.team === 'home' ? theme.homeArrow : theme.awayArrow,
        arrow.alpha,
        r,
      );
    }
    if (scene.ball.from) drawBallTrail(ctx, layout, scene.ball.from, scene.ball.pos);
  }

  const byId = new Map(players.map((p) => [p.id, p]));
  const order = Object.keys(scene.positions).sort((a, b) => {
    const at = byId.get(a)?.team === 'home' ? 1 : 0;
    const bt = byId.get(b)?.team === 'home' ? 1 : 0;
    return at - bt;
  });

  for (const id of order) {
    const def = byId.get(id);
    if (!def) continue;
    drawPlayer(ctx, layout, def, scene.positions[id]!, {
      focus: scene.focus.includes(id),
      selected: options.selected === id,
      theme,
      radius: r,
    });
  }

  drawBall(ctx, layout, scene.ball.pos, scene.ball.scale, r);

  if (!options.editing && scene.flash) {
    drawFlash(ctx, layout, scene.flash.text, scene.flash.alpha, theme);
  }
}

export function drawPitch(ctx: CanvasRenderingContext2D, l: PitchLayout, theme: BoardTheme): void {
  const { width: w, height: h } = l;
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, theme.grassTop);
  g.addColorStop(0.5, theme.grassMid);
  g.addColorStop(1, theme.grassBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,.028)';
  for (let i = 0; i < 10; i += 2) ctx.fillRect(0, toPy(l, i * 10), w, scaleY(l, 10));

  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.fillRect(0, 0, w, toPy(l, 0));
  ctx.fillRect(0, toPy(l, 100), w, h - toPy(l, 100));

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.strokeRect(toPx(l, 0), toPy(l, 0), scaleX(l, 100), scaleY(l, 100));

  ctx.beginPath();
  ctx.moveTo(toPx(l, 0), toPy(l, 50));
  ctx.lineTo(toPx(l, 100), toPy(l, 50));
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(toPx(l, 50), toPy(l, 50), scaleX(l, 13.5), scaleY(l, 8.7), 0, 0, Math.PI * 2);
  ctx.stroke();

  const box = (x: number, y: number, bw: number, bh: number) =>
    ctx.strokeRect(toPx(l, x), toPy(l, y), scaleX(l, bw), scaleY(l, bh));
  const spot = (x: number, y: number, r: number) => {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath();
    ctx.arc(toPx(l, x), toPy(l, y), r, 0, Math.PI * 2);
    ctx.fill();
  };

  box(20.5, 0, 59, 15.7);
  box(36.5, 0, 27, 5.2);
  box(20.5, 84.3, 59, 15.7);
  box(36.5, 94.8, 27, 5.2);
  spot(50, 10.5, 2.2);
  spot(50, 89.5, 2.2);
  spot(50, 50, 2.4);

  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillRect(toPx(l, 44.6), toPy(l, 0) - 5, scaleX(l, 10.8), 5);
  ctx.fillRect(toPx(l, 44.6), toPy(l, 100), scaleX(l, 10.8), 5);
}

interface PlayerStyle {
  focus: boolean;
  selected: boolean;
  theme: BoardTheme;
  radius: number;
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  l: PitchLayout,
  def: PlayerDef,
  pos: Vec2,
  { focus, selected, theme, radius: r }: PlayerStyle,
): void {
  const home = def.team === 'home';
  const x = toPx(l, pos[0]);
  const y = toPy(l, pos[1]);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  if (focus || selected) {
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = selected ? 'rgba(255,255,255,.32)' : home ? theme.homeGlow : 'rgba(255,255,255,.12)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = home ? theme.homeFill : theme.awayFill;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = home ? 2.4 : 1.6;
  ctx.strokeStyle = home ? theme.homeRing : theme.awayRing;
  ctx.stroke();

  ctx.fillStyle = home ? theme.homeText : theme.awayText;
  ctx.font = `800 ${Math.round(r * 0.72)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.label, x, y + 0.5);
  ctx.restore();
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  l: PitchLayout,
  pos: Vec2,
  scale: number,
  radius: number,
): void {
  const x = toPx(l, pos[0]);
  const y = toPy(l, pos[1]);
  const r = radius * 0.42 * scale;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#2b3244';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = '#2b3244';
  ctx.fill();
  ctx.restore();
}

function drawBallTrail(ctx: CanvasRenderingContext2D, l: PitchLayout, from: Vec2, to: Vec2): void {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(toPx(l, from[0]), toPy(l, from[1]));
  ctx.lineTo(toPx(l, to[0]), toPy(l, to[1]));
  ctx.stroke();
  ctx.restore();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  l: PitchLayout,
  from: Vec2,
  to: Vec2,
  color: string,
  alpha: number,
  radius: number,
): void {
  const x1 = toPx(l, from[0]);
  const y1 = toPy(l, from[1]);
  let x2 = toPx(l, to[0]);
  let y2 = toPy(l, to[1]);
  const a = Math.atan2(y2 - y1, x2 - x1);
  if (Math.hypot(x2 - x1, y2 - y1) < 6) return;
  x2 -= Math.cos(a) * radius * 0.9;
  y2 -= Math.sin(a) * radius * 0.9;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.42) * 9, y2 - Math.sin(a - 0.42) * 9);
  ctx.lineTo(x2 - Math.cos(a + 0.42) * 9, y2 - Math.sin(a + 0.42) * 9);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawZone(
  ctx: CanvasRenderingContext2D,
  l: PitchLayout,
  zone: Zone,
  alpha: number,
  theme: BoardTheme,
  radius: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = theme.zoneFill;
  ctx.strokeStyle = theme.zoneLine;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 6]);
  const x = toPx(l, zone.x);
  const y = toPy(l, zone.y);
  const w = scaleX(l, zone.w);
  const h = scaleY(l, zone.h);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, 8);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  if (zone.label) {
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.font = `800 ${Math.round(Math.max(10, radius * 0.66))}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(zone.label, x + 8, y + 7);
  }
  ctx.restore();
}

function drawFlash(
  ctx: CanvasRenderingContext2D,
  l: PitchLayout,
  text: string,
  alpha: number,
  theme: BoardTheme,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = theme.flashTint;
  ctx.fillRect(0, 0, l.width, l.height);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${Math.round(l.width * (text.length > 5 ? 0.085 : 0.13))}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.65)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, l.width / 2, l.height * 0.43);
  ctx.restore();
}
