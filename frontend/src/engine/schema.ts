import { z } from 'zod';
import type { Tactic } from './types';

const vec2 = z.tuple([z.number(), z.number()]);

export const zoneSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  label: z.string().optional(),
});

export const playerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(4),
  team: z.enum(['home', 'away']),
  role: z.string().optional(),
});

export const frameSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  positions: z.record(vec2),
  ball: z.union([z.string(), vec2]),
  arc: z.number().min(0).max(1).optional(),
  ballSpeed: z.number().min(0.1).max(1).optional(),
  focus: z.array(z.string()).optional(),
  zone: zoneSchema.nullable().optional(),
  flash: z.string().nullable().optional(),
  durMs: z.number().int().min(200).max(10000).optional(),
  holdMs: z.number().int().min(200).max(20000).optional(),
});

export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  badge: z.string().optional(),
  title: z.string().optional(),
  keyPoints: z.array(z.string()),
  frames: z.array(frameSchema).min(1),
});

export const tacticSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  folderId: z.string().nullable(),
  players: z.array(playerSchema).min(1),
  scenarios: z.array(scenarioSchema).min(1),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.literal(1),
});

export const folderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable(),
});

export type TacticInput = z.input<typeof tacticSchema>;

/** Overi data z API, importu nebo sdileneho odkazu. Vyhodi ZodError. */
export function parseTactic(value: unknown): Tactic {
  return tacticSchema.parse(value) as Tactic;
}

export function safeParseTactic(value: unknown) {
  return tacticSchema.safeParse(value);
}
