import { describe, expect, it } from 'vitest';
import { parseTactic } from '@/engine/schema';
import { resolveFrames } from '@/engine/interpolate';
import { seedLibrary } from './index';

describe('seed knihovny', () => {
  const { folders, tactics } = seedLibrary();

  it('obsahuje platne taktiky podle schematu', () => {
    for (const tactic of tactics) expect(() => parseTactic(tactic)).not.toThrow();
  });

  it('kazda taktika ma slozku, ktera existuje', () => {
    const ids = new Set(folders.map((folder) => folder.id));
    for (const tactic of tactics) {
      expect(tactic.folderId === null || ids.has(tactic.folderId)) .toBe(true);
    }
  });

  it('prvni snimek kazde situace definuje vsechny hrace', () => {
    for (const tactic of tactics) {
      for (const scenario of tactic.scenarios) {
        const first = resolveFrames(scenario.frames)[0]!;
        expect(Object.keys(first.resolved).length).toBeGreaterThan(10);
      }
    }
  });

  it('mic vzdy odkazuje na existujiciho hrace nebo na bod', () => {
    for (const tactic of tactics) {
      const ids = new Set(tactic.players.map((player) => player.id));
      for (const scenario of tactic.scenarios) {
        for (const frame of scenario.frames) {
          if (typeof frame.ball === 'string') expect(ids.has(frame.ball)).toBe(true);
          else expect(frame.ball).toHaveLength(2);
        }
      }
    }
  });
});
