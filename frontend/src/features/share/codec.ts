import { safeParseTactic } from '@/engine/schema';
import type { Tactic } from '@/engine/types';
import { decodeBase64Url, encodeBase64Url } from '@/lib/base64url';

export const SHARE_VERSION = 1;

/**
 * Zabali taktiku primo do odkazu (bez backendu).
 * Vyhoda: odkaz funguje i bez uctu. Nevyhoda: delka - u velkych taktik
 * je lepsi sdileni pres API token (viz createShare).
 */
export function encodeTacticToPayload(tactic: Tactic): string {
  return encodeBase64Url(JSON.stringify({ v: SHARE_VERSION, t: tactic }));
}

export function decodeTacticFromPayload(payload: string): Tactic {
  let raw: unknown;
  try {
    raw = JSON.parse(decodeBase64Url(payload));
  } catch {
    throw new Error('Odkaz je poškozený.');
  }
  const envelope = raw as { v?: number; t?: unknown };
  if (envelope?.v !== SHARE_VERSION) throw new Error('Odkaz je z nepodporované verze aplikace.');
  const result = safeParseTactic(envelope.t);
  if (!result.success) throw new Error('Data v odkazu neodpovídají formátu taktiky.');
  return result.data as Tactic;
}

export function buildPayloadUrl(origin: string, tactic: Tactic): string {
  return `${origin}/share#${encodeTacticToPayload(tactic)}`;
}

/** Odkaz je delsi nez limit, ktery bezne prezije v chatu nebo mailu. */
export const PAYLOAD_URL_LIMIT = 8000;
