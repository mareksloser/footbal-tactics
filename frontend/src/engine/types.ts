/**
 * Datovy model taktickych animaci.
 *
 * Souradnice hrace jsou vzdy v "pitch units": x 0..100 (sirka), y 0..100 (delka).
 * y = 0 je horni branka (utocime nahoru), y = 100 je dolni branka (branime dole).
 * Model je zamerne nezavisly na Reactu i na canvasu, aby sel testovat izolovane.
 */

export type Vec2 = readonly [number, number];

export type TeamSide = 'home' | 'away';

export interface PlayerDef {
  id: string;
  /** Zkratka vykreslena v kolecku, napr. "LWB", "SO", "9". */
  label: string;
  team: TeamSide;
  /** Volitelny popis role do legendy. */
  role?: string;
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

/** Kam patri mic: k hraci (id) nebo na pevny bod hriste. */
export type BallTarget = string | Vec2;

export interface Frame {
  id: string;
  /** Komentar k fazi - popisuje, co se deje pri prechodu do tohoto snimku. */
  text: string;
  /**
   * Pouze zmeny oproti predchozimu snimku. Prvni snimek musi obsahovat vsechny hrace.
   * Diky tomu se snimky pisou i edituji po malych krocich.
   */
  positions: Record<string, Vec2>;
  ball: BallTarget;
  /** Vyska obloucku prihravky 0..1 (centr, dlouhy mic, aut). */
  arc?: number;
  /** Jakou cast prechodu mic letí, 0.3 = rychla prihravka. Vychozi 0.72. */
  ballSpeed?: number;
  /** Hraci se zvyraznenym prstencem. */
  focus?: string[];
  zone?: Zone | null;
  /** Text prekryvu na konci faze, napr. "GÓL" nebo "ZISK MÍČE". */
  flash?: string | null;
  /** Delka prechodu do tohoto snimku (ms). */
  durMs?: number;
  /** Jak dlouho snimek stoji, nez se pokracuje (ms). */
  holdMs?: number;
}

export interface Scenario {
  id: string;
  /** Nazev zalozky, napr. "Rozehra". */
  name: string;
  /** Popisek nad nazvem, napr. "Situace 1". */
  badge?: string;
  /** Plny nazev do hlavicky prehravace. */
  title?: string;
  keyPoints: string[];
  frames: Frame[];
}

export interface Tactic {
  id: string;
  title: string;
  description?: string;
  folderId: string | null;
  players: PlayerDef[];
  scenarios: Scenario[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version: 1;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export const DEFAULT_DUR_MS = 1500;
export const DEFAULT_HOLD_MS = 2000;
export const DEFAULT_BALL_SPEED = 0.72;
/** O kolik jednotek nad hracem lezi mic, kdyz ho ma u nohy. */
export const BALL_FOOT_OFFSET = 2.4;
