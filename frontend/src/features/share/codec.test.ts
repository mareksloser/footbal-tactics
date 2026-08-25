import { describe, expect, it } from 'vitest';
import { createTactic } from '@/engine/factory';
import { buildPayloadUrl, decodeTacticFromPayload, encodeTacticToPayload } from './codec';

describe('share codec', () => {
  const tactic = createTactic({ title: 'Přečíslení na křídle — žáci U15' });

  it('prezije round-trip vcetne diakritiky', () => {
    const decoded = decodeTacticFromPayload(encodeTacticToPayload(tactic));
    expect(decoded.title).toBe(tactic.title);
    expect(decoded.scenarios[0]!.frames[0]!.positions).toEqual(tactic.scenarios[0]!.frames[0]!.positions);
  });

  it('odmitne poskozeny payload', () => {
    expect(() => decodeTacticFromPayload('###')).toThrow(/poškozený/);
  });

  it('odmitne data, ktera nejsou taktika', () => {
    const payload = encodeTacticToPayload({ ...tactic, scenarios: [] } as never);
    expect(() => decodeTacticFromPayload(payload)).toThrow(/formátu/);
  });

  it('sestavi odkaz s hashem', () => {
    expect(buildPayloadUrl('https://taktika.cz', tactic)).toContain('https://taktika.cz/share#');
  });
});
